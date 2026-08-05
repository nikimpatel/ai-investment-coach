using TenYearExplorer.Application.Abstractions;
using TenYearExplorer.Application.Metrics;
using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Application.Services;

/// <summary>
/// Deterministic annual KPI normalization from SEC company-facts candidates.
/// Shared pipeline for all Sprint 2 allowlisted metrics.
/// </summary>
public sealed class XbrlKpiNormalizer : IXbrlKpiNormalizer
{
    // Apple FY duration is typically 364 or 371 days; reject quarters (~90) and YTD partials.
    private const int MinAnnualDays = 350;
    private const int MaxAnnualDays = 380;

    /// <summary>Common forward stock-split factors used for deterministic EPS basis detection.</summary>
    private static readonly int[] CommonSplitFactors = [2, 3, 4, 5, 7, 10];

    /// <summary>Tight tolerance when matching own-period vs later comparative restatement.</summary>
    private const decimal SplitComparativeTolerance = 0.03m;

    /// <summary>Looser tolerance for consecutive-year discontinuity (earnings also move in the split year).</summary>
    private const decimal SplitDiscontinuityTolerance = 0.15m;

    /// <summary>Sprint 1 compatibility wrapper.</summary>
    public NormalizationResult NormalizeAnnualRevenue(
        IReadOnlyList<RawSecFact> facts,
        int years,
        DateOnly asOfDate) =>
        NormalizeAnnual(facts, SupportedMetrics.RevenueDefinition, years, asOfDate);

    public NormalizationResult NormalizeAnnual(
        IReadOnlyList<RawSecFact> facts,
        MetricDefinition metric,
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
        var conceptPriority = metric.OrderedConcepts
            .Select((c, i) => (Concept: c, Priority: i))
            .ToDictionary(x => x.Concept, x => x.Priority, StringComparer.OrdinalIgnoreCase);
        var acceptedUnits = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { metric.ReportingUnit };

        // Diluted EPS: accept only USD/shares; never basic EPS or monetary USD totals.
        if (metric.ValueType == MetricValueType.PerShare)
        {
            acceptedUnits.Add("USD/shares");
            acceptedUnits.Add("USD / shares");
        }

        var eligible = new List<RawSecFact>();
        foreach (var fact in facts)
        {
            if (!conceptPriority.ContainsKey(fact.Concept))
            {
                continue;
            }

            if (!acceptedUnits.Contains(fact.Unit))
            {
                warnings.Add(new StructuredWarning(
                    "INVALID_UNIT",
                    $"Excluded fact with unit '{fact.Unit}' for metric '{metric.Code}'.",
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
            var chosen = SelectReliableCandidate(candidates, fiscalYearEndYear, metric, warnings);
            if (chosen is null)
            {
                warnings.Add(new StructuredWarning(
                    "AMBIGUOUS_PERIOD",
                    $"Excluded fiscal period ending {periodEnd:yyyy-MM-dd} due to unresolved ambiguity.",
                    FiscalYear: fiscalLabel));
                continue;
            }

            var isComparative = chosen.ReportedFiscalYear != fiscalYearEndYear;
            selected.Add(new NormalizedAnnualPoint(
                FiscalYearLabel: fiscalLabel,
                FiscalYearEndYear: fiscalYearEndYear,
                PeriodStart: chosen.PeriodStart,
                PeriodEnd: chosen.PeriodEnd,
                Value: chosen.Value,
                Unit: NormalizeUnit(chosen.Unit, metric),
                Concept: chosen.Concept,
                FilingDate: chosen.Filed,
                Form: chosen.Form,
                Accession: chosen.Accession,
                IsComparative: isComparative));
        }

        if (metric.ValueType == MetricValueType.PerShare)
        {
            selected = EnforcePerShareSplitComparability(selected, eligible, warnings);
        }

        var latest = selected
            .OrderByDescending(p => p.PeriodEnd)
            .Take(years)
            .OrderBy(p => p.PeriodEnd)
            .ToList();

        if (latest.Count < years)
        {
            warnings.Add(new StructuredWarning(
                "INSUFFICIENT_HISTORY",
                $"Normalized {latest.Count} completed annual periods for '{metric.Code}'; requested {years}."));
        }

        return new NormalizationResult(latest, warnings);
    }

    private static string NormalizeUnit(string unit, MetricDefinition metric) =>
        metric.ValueType == MetricValueType.PerShare ? metric.ReportingUnit : unit;

    private static RawSecFact? SelectReliableCandidate(
        IReadOnlyList<RawSecFact> candidates,
        int fiscalYearEndYear,
        MetricDefinition metric,
        List<StructuredWarning> warnings)
    {
        var conceptPriority = metric.OrderedConcepts
            .Select((c, i) => (Concept: c, Priority: i))
            .ToDictionary(x => x.Concept, x => x.Priority, StringComparer.OrdinalIgnoreCase);

        static int FormRank(string form) =>
            form.Equals("10-K/A", StringComparison.OrdinalIgnoreCase) ? 0
            : form.Equals("10-K", StringComparison.OrdinalIgnoreCase) ? 1
            : 9;

        var ownPeriod = candidates
            .Where(c => c.ReportedFiscalYear == fiscalYearEndYear)
            .ToList();
        var comparative = candidates
            .Where(c => c.ReportedFiscalYear != fiscalYearEndYear)
            .ToList();

        // Diluted EPS: when later comparative facts restate prior years on a post-split basis
        // (~integer factor vs own-period), prefer those SEC restatements over pre-split own-period.
        if (metric.ValueType == MetricValueType.PerShare
            && ownPeriod.Count > 0
            && comparative.Count > 0)
        {
            var splitAdjusted = FindSplitAdjustedComparatives(ownPeriod, comparative, SplitComparativeTolerance);
            if (splitAdjusted.Count > 0)
            {
                var preferred = splitAdjusted
                    .OrderByDescending(c => c.Filed)
                    .ThenByDescending(c => c.Accession, StringComparer.Ordinal)
                    .ThenBy(c => FormRank(c.Form))
                    .First();

                warnings.Add(new StructuredWarning(
                    "SPLIT_ADJUSTED_COMPARATIVE_PREFERRED",
                    $"Used later split-adjusted comparative Diluted EPS for FY{fiscalYearEndYear} from a post-split 10-K restatement instead of the pre-split own-period reporting basis.",
                    FiscalYear: $"FY{fiscalYearEndYear}",
                    Concept: preferred.Concept));
                return preferred;
            }
        }

        if (candidates.Count == 1)
        {
            if (ownPeriod.Count == 0)
            {
                warnings.Add(new StructuredWarning(
                    "COMPARATIVE_ONLY",
                    $"No own-period 10-K candidate for FY{fiscalYearEndYear}; evaluating comparative facts cautiously.",
                    FiscalYear: $"FY{fiscalYearEndYear}"));
            }

            return candidates[0];
        }

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

    /// <summary>
    /// Keep only a contiguous Diluted EPS series on one reporting basis.
    /// After per-year split-adjusted comparative preference, cut at the <b>last</b>
    /// split-scale YoY discontinuity in the selected series (companies may have multiple
    /// historical splits; using the earliest restatement year would re-introduce later mixes).
    /// </summary>
    private static List<NormalizedAnnualPoint> EnforcePerShareSplitComparability(
        List<NormalizedAnnualPoint> selected,
        IReadOnlyList<RawSecFact> eligible,
        List<StructuredWarning> warnings)
    {
        if (selected.Count < 2)
        {
            return selected;
        }

        var yearsWithSplitRestatementEvidence = eligible
            .GroupBy(f => f.PeriodEnd.Year)
            .Where(g =>
            {
                var own = g.Where(c => c.ReportedFiscalYear == g.Key).ToList();
                var comparative = g.Where(c => c.ReportedFiscalYear != g.Key).ToList();
                return own.Count > 0
                       && comparative.Count > 0
                       && FindSplitAdjustedComparatives(own, comparative, SplitComparativeTolerance).Count > 0;
            })
            .Select(g => g.Key)
            .ToHashSet();

        int? lastDiscontinuityExcludeThroughFy = null;
        string? discontinuityMessage = null;
        string? discontinuityConcept = null;
        string? discontinuityFiscalLabel = null;

        for (var i = 1; i < selected.Count; i++)
        {
            var prev = selected[i - 1];
            var curr = selected[i];
            if (prev.Value <= 0 || curr.Value <= 0 || prev.Value <= curr.Value)
            {
                continue;
            }

            if (!IsSplitRatio(prev.Value, curr.Value, SplitDiscontinuityTolerance, out var factor))
            {
                continue;
            }

            // Require nearby SEC restatement evidence so ordinary large earnings drops are not cut.
            var evidenceNearby =
                yearsWithSplitRestatementEvidence.Contains(prev.FiscalYearEndYear)
                || yearsWithSplitRestatementEvidence.Contains(curr.FiscalYearEndYear)
                || yearsWithSplitRestatementEvidence.Contains(prev.FiscalYearEndYear - 1)
                || yearsWithSplitRestatementEvidence.Contains(prev.FiscalYearEndYear + 1)
                || yearsWithSplitRestatementEvidence.Contains(curr.FiscalYearEndYear - 1)
                || yearsWithSplitRestatementEvidence.Contains(curr.FiscalYearEndYear + 1);
            if (!evidenceNearby)
            {
                continue;
            }

            lastDiscontinuityExcludeThroughFy = prev.FiscalYearEndYear;
            discontinuityFiscalLabel = curr.FiscalYearLabel;
            discontinuityConcept = curr.Concept;
            discontinuityMessage =
                $"Detected a stock-split-scale Diluted EPS step (~{factor}-for-1) from {prev.FiscalYearLabel} ({prev.Value}) to {curr.FiscalYearLabel} ({curr.Value}); this is not treated as ordinary negative growth.";
        }

        if (lastDiscontinuityExcludeThroughFy is null)
        {
            return selected;
        }

        var keepFromFy = lastDiscontinuityExcludeThroughFy.Value + 1;
        warnings.Add(new StructuredWarning(
            "SPLIT_DISCONTINUITY_DETECTED",
            discontinuityMessage!,
            FiscalYear: discontinuityFiscalLabel,
            Concept: discontinuityConcept));

        var kept = selected.Where(p => p.FiscalYearEndYear >= keepFromFy).ToList();
        var dropped = selected.Where(p => p.FiscalYearEndYear < keepFromFy).ToList();

        foreach (var d in dropped)
        {
            warnings.Add(new StructuredWarning(
                "SPLIT_INCOMPARABLE_YEAR_EXCLUDED",
                $"Excluded {d.FiscalYearLabel} Diluted EPS because Company Facts do not provide a reliable post-split comparative value for that year; mixing pre- and post-split bases is not allowed.",
                FiscalYear: d.FiscalYearLabel,
                Concept: d.Concept));
        }

        if (dropped.Count > 0 && kept.Count > 0)
        {
            warnings.Add(new StructuredWarning(
                "SPLIT_BASIS_NORMALIZED",
                $"Diluted EPS series limited to {kept[0].FiscalYearLabel}–{kept[^1].FiscalYearLabel} on a split-adjusted comparable basis using authoritative SEC facts (later comparative restatements preferred when available)."));
        }

        return kept;
    }

    private static List<RawSecFact> FindSplitAdjustedComparatives(
        IReadOnlyList<RawSecFact> ownPeriod,
        IReadOnlyList<RawSecFact> comparative,
        decimal tolerance)
    {
        var result = new List<RawSecFact>();
        foreach (var own in ownPeriod)
        {
            if (own.Value <= 0)
            {
                continue;
            }

            foreach (var comp in comparative)
            {
                if (comp.Value <= 0 || comp.Filed <= own.Filed)
                {
                    continue;
                }

                // Forward split: later restatement is smaller (~ own / N).
                if (own.Value > comp.Value
                    && IsSplitRatio(own.Value, comp.Value, tolerance, out _))
                {
                    result.Add(comp);
                }
            }
        }

        return result
            .GroupBy(c => (c.Filed, c.Accession, c.Value))
            .Select(g => g.First())
            .ToList();
    }

    private static bool IsSplitRatio(decimal larger, decimal smaller, decimal tolerance, out int factor)
    {
        factor = 0;
        if (smaller <= 0 || larger <= 0 || larger <= smaller)
        {
            return false;
        }

        var ratio = larger / smaller;
        foreach (var candidate in CommonSplitFactors)
        {
            var relativeError = Math.Abs(ratio - candidate) / candidate;
            if (relativeError <= tolerance)
            {
                factor = candidate;
                return true;
            }
        }

        return false;
    }
}
