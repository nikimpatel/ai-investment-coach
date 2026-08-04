using TenYearExplorer.Application.Abstractions;
using TenYearExplorer.Application.Revenue;
using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Application.Services;

/// <summary>
/// Deterministic annual revenue normalization from SEC company-facts candidates.
/// </summary>
public sealed class XbrlKpiNormalizer : IXbrlKpiNormalizer
{
    // Apple FY duration is typically 364 or 371 days; reject quarters (~90) and YTD partials.
    private const int MinAnnualDays = 350;
    private const int MaxAnnualDays = 380;

    public NormalizationResult NormalizeAnnualRevenue(
        IReadOnlyList<RawSecFact> facts,
        int years,
        DateOnly asOfDate)
    {
        var warnings = new List<StructuredWarning>();
        if (years <= 0)
        {
            warnings.Add(new StructuredWarning("INVALID_YEARS", "Requested years must be positive."));
            return new NormalizationResult([], warnings);
        }

        var acceptedForms = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "10-K", "10-K/A" };
        var conceptPriority = RevenueConceptMapping.OrderedConcepts
            .Select((c, i) => (Concept: c, Priority: i))
            .ToDictionary(x => x.Concept, x => x.Priority, StringComparer.OrdinalIgnoreCase);

        var eligible = new List<RawSecFact>();
        foreach (var fact in facts)
        {
            if (!conceptPriority.ContainsKey(fact.Concept))
            {
                continue;
            }

            if (!string.Equals(fact.Unit, "USD", StringComparison.OrdinalIgnoreCase))
            {
                warnings.Add(new StructuredWarning(
                    "INVALID_UNIT",
                    $"Excluded fact with unit '{fact.Unit}'.",
                    Concept: fact.Concept));
                continue;
            }

            if (!acceptedForms.Contains(fact.Form))
            {
                continue;
            }

            if (!string.IsNullOrWhiteSpace(fact.FiscalPeriod)
                && !string.Equals(fact.FiscalPeriod, "FY", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (fact.PeriodStart is null)
            {
                warnings.Add(new StructuredWarning(
                    "MISSING_PERIOD_START",
                    "Excluded fact missing period start; cannot verify annual duration.",
                    Concept: fact.Concept));
                continue;
            }

            var days = fact.PeriodEnd.DayNumber - fact.PeriodStart.Value.DayNumber;
            if (days < MinAnnualDays || days > MaxAnnualDays)
            {
                continue;
            }

            if (fact.PeriodEnd > asOfDate)
            {
                warnings.Add(new StructuredWarning(
                    "INCOMPLETE_PERIOD",
                    $"Excluded period ending {fact.PeriodEnd:yyyy-MM-dd} after as-of date.",
                    Concept: fact.Concept));
                continue;
            }

            eligible.Add(fact);
        }

        // Group by period-end (fiscal period identity). Do not trust SEC fy alone.
        var groups = eligible
            .GroupBy(f => f.PeriodEnd)
            .OrderBy(g => g.Key)
            .ToList();

        var selected = new List<NormalizedAnnualPoint>();
        foreach (var group in groups)
        {
            var periodEnd = group.Key;
            var fiscalYearEndYear = periodEnd.Year;
            var fiscalLabel = $"FY{fiscalYearEndYear}";

            var candidates = group.ToList();
            var chosen = SelectReliableCandidate(candidates, fiscalYearEndYear, warnings);
            if (chosen is null)
            {
                warnings.Add(new StructuredWarning(
                    "AMBIGUOUS_PERIOD",
                    $"Excluded fiscal period ending {periodEnd:yyyy-MM-dd} due to unresolved ambiguity.",
                    FiscalYear: fiscalLabel));
                continue;
            }

            // Prefer highest-priority concept among equally reliable candidates already handled in Select.
            selected.Add(new NormalizedAnnualPoint(
                FiscalYearLabel: fiscalLabel,
                FiscalYearEndYear: fiscalYearEndYear,
                PeriodStart: chosen.PeriodStart,
                PeriodEnd: chosen.PeriodEnd,
                Value: chosen.Value,
                Unit: chosen.Unit,
                Concept: chosen.Concept,
                FilingDate: chosen.Filed,
                Form: chosen.Form,
                Accession: chosen.Accession));
        }

        // Latest N completed fiscal years, chronological ascending.
        var latest = selected
            .OrderByDescending(p => p.PeriodEnd)
            .Take(years)
            .OrderBy(p => p.PeriodEnd)
            .ToList();

        if (latest.Count < years)
        {
            warnings.Add(new StructuredWarning(
                "INSUFFICIENT_HISTORY",
                $"Normalized {latest.Count} completed annual periods; requested {years}."));
        }

        return new NormalizationResult(latest, warnings);
    }

    /// <summary>
    /// Prefer the company's own-period 10-K (or amending 10-K/A) over later comparative restatements.
    /// Do not automatically pick the most recently filed value.
    /// </summary>
    private static RawSecFact? SelectReliableCandidate(
        IReadOnlyList<RawSecFact> candidates,
        int fiscalYearEndYear,
        List<StructuredWarning> warnings)
    {
        if (candidates.Count == 1)
        {
            return candidates[0];
        }

        var conceptPriority = RevenueConceptMapping.OrderedConcepts
            .Select((c, i) => (Concept: c, Priority: i))
            .ToDictionary(x => x.Concept, x => x.Priority, StringComparer.OrdinalIgnoreCase);

        static int FormRank(string form) =>
            form.Equals("10-K/A", StringComparison.OrdinalIgnoreCase) ? 0
            : form.Equals("10-K", StringComparison.OrdinalIgnoreCase) ? 1
            : 9;

        // Own-period filings: reported FY matches period-end year (Apple FY ends in calendar year of FY label).
        var ownPeriod = candidates
            .Where(c => c.ReportedFiscalYear == fiscalYearEndYear)
            .ToList();
        var comparative = candidates
            .Where(c => c.ReportedFiscalYear != fiscalYearEndYear)
            .ToList();

        IReadOnlyList<RawSecFact> pool = ownPeriod.Count > 0 ? ownPeriod : candidates;
        if (ownPeriod.Count == 0)
        {
            warnings.Add(new StructuredWarning(
                "COMPARATIVE_ONLY",
                $"No own-period 10-K candidate for FY{fiscalYearEndYear}; evaluating comparative facts cautiously.",
                FiscalYear: $"FY{fiscalYearEndYear}"));
        }
        else if (comparative.Count > 0
                 && comparative.Any(c => ownPeriod.All(o => o.Value != c.Value)))
        {
            warnings.Add(new StructuredWarning(
                "OWN_PERIOD_PREFERRED",
                $"Used own-period 10-K value for FY{fiscalYearEndYear}; ignored conflicting later comparative values.",
                FiscalYear: $"FY{fiscalYearEndYear}"));
        }

        // Within pool: prefer higher-priority concept, then 10-K/A over 10-K when both own-period,
        // then earlier filing date (closer to period) rather than newest comparative.
        var ordered = pool
            .OrderBy(c => conceptPriority.GetValueOrDefault(c.Concept, 99))
            .ThenBy(c => FormRank(c.Form))
            .ThenBy(c => c.Filed)
            .ThenBy(c => c.Accession, StringComparer.Ordinal)
            .ToList();

        var best = ordered[0];
        var bestConceptPeers = ordered
            .Where(c => string.Equals(c.Concept, best.Concept, StringComparison.OrdinalIgnoreCase))
            .ToList();

        var distinctValues = bestConceptPeers.Select(c => c.Value).Distinct().ToList();
        if (distinctValues.Count > 1)
        {
            // Same concept, conflicting values: prefer own-period 10-K/A then 10-K; if still conflict, warn + exclude.
            var amendments = bestConceptPeers
                .Where(c => c.Form.Equals("10-K/A", StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(c => c.Filed)
                .ToList();
            if (amendments.Count > 0)
            {
                var amendmentValues = amendments.Select(a => a.Value).Distinct().ToList();
                if (amendmentValues.Count == 1)
                {
                    warnings.Add(new StructuredWarning(
                        "AMENDMENT_PREFERRED",
                        $"Used 10-K/A value for FY{fiscalYearEndYear} where candidates disagreed.",
                        FiscalYear: $"FY{fiscalYearEndYear}",
                        Concept: best.Concept));
                    return amendments[0];
                }
            }

            var originalTenK = bestConceptPeers
                .Where(c => c.Form.Equals("10-K", StringComparison.OrdinalIgnoreCase)
                            && c.ReportedFiscalYear == fiscalYearEndYear)
                .OrderBy(c => c.Filed)
                .ToList();
            if (originalTenK.Count > 0)
            {
                var originalValues = originalTenK.Select(c => c.Value).Distinct().ToList();
                if (originalValues.Count == 1)
                {
                    warnings.Add(new StructuredWarning(
                        "OWN_PERIOD_PREFERRED",
                        $"Used own-period 10-K value for FY{fiscalYearEndYear}; ignored conflicting later comparative values.",
                        FiscalYear: $"FY{fiscalYearEndYear}",
                        Concept: best.Concept));
                    return originalTenK[0];
                }
            }

            warnings.Add(new StructuredWarning(
                "VALUE_CONFLICT",
                $"Conflicting values for FY{fiscalYearEndYear} concept {best.Concept}; period excluded.",
                FiscalYear: $"FY{fiscalYearEndYear}",
                Concept: best.Concept));
            return null;
        }

        return best;
    }
}
