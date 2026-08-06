using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TenYearExplorer.Application.Abstractions;
using TenYearExplorer.Application.Configuration;
using TenYearExplorer.Application.Metrics;
using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Infrastructure.Sec;

public sealed class SecFinancialFactsProvider : IFinancialFactsProvider
{
    private readonly ISecEdgarClient _client;
    private readonly ICompanyFactsCache _companyFactsCache;
    private readonly SecOptions _options;
    private readonly ILogger<SecFinancialFactsProvider> _logger;
    private int _submissionsMetadataChecked;

    public SecFinancialFactsProvider(
        ISecEdgarClient client,
        ICompanyFactsCache companyFactsCache,
        IOptions<SecOptions> options,
        ILogger<SecFinancialFactsProvider> logger)
    {
        _client = client;
        _companyFactsCache = companyFactsCache;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<IReadOnlyList<RawSecFact>> GetFactsAsync(
        string cik,
        MetricDefinition metric,
        CancellationToken cancellationToken)
    {
        var factsDoc = await GetCompanyFactsCachedAsync(cik, cancellationToken);

        // Submissions are only a metadata cross-check; Company Facts drive values.
        // Check once per provider instance so a multi-metric derived request does not repeat SEC calls.
        if (Interlocked.Exchange(ref _submissionsMetadataChecked, 1) == 0)
        {
            try
            {
                var submissions = await _client.GetSubmissionsAsync(cik, cancellationToken);
                _logger.LogInformation(
                    "Loaded submissions for {Name} with {Count} recent filings",
                    submissions.Name,
                    submissions.Filings?.Recent?.AccessionNumber.Count ?? 0);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Submissions metadata unavailable; continuing with company facts only");
            }
        }

        if (!factsDoc.Facts.TryGetValue("us-gaap", out var usGaap))
        {
            return [];
        }

        var results = new List<RawSecFact>();
        foreach (var concept in metric.OrderedConcepts)
        {
            if (!usGaap.TryGetValue(concept, out var node))
            {
                continue;
            }

            foreach (var (unitKey, unitFacts) in node.Units)
            {
                if (!UnitMatchesMetric(unitKey, metric) || unitFacts.Count == 0)
                {
                    continue;
                }

                foreach (var unitFact in unitFacts)
                {
                    if (!DateOnly.TryParse(unitFact.End, out var periodEnd))
                    {
                        continue;
                    }

                    DateOnly? periodStart = null;
                    if (!string.IsNullOrWhiteSpace(unitFact.Start)
                        && DateOnly.TryParse(unitFact.Start, out var parsedStart))
                    {
                        periodStart = parsedStart;
                    }

                    if (!DateOnly.TryParse(unitFact.Filed, out var filed))
                    {
                        continue;
                    }

                    results.Add(new RawSecFact(
                        Concept: concept,
                        Value: unitFact.Val,
                        Unit: NormalizeUnitKey(unitKey, metric),
                        PeriodStart: periodStart,
                        PeriodEnd: periodEnd,
                        Filed: filed,
                        Form: unitFact.Form,
                        Accession: unitFact.Accn,
                        ReportedFiscalYear: unitFact.Fy,
                        FiscalPeriod: unitFact.Fp,
                        Frame: unitFact.Frame));
                }
            }
        }

        _logger.LogInformation(
            "Extracted {Count} raw fact candidates for CIK {Cik} metric {Metric}",
            results.Count,
            cik,
            metric.Code);
        return results;
    }

    private async Task<SecCompanyFactsDocument> GetCompanyFactsCachedAsync(
        string cik,
        CancellationToken cancellationToken)
    {
        if (_companyFactsCache.TryGet(cik, out var cached) && cached is not null)
        {
            _logger.LogInformation("Company Facts cache hit for CIK {Cik}", cik);
            return cached;
        }

        var factsDoc = await _client.GetCompanyFactsAsync(cik, cancellationToken);
        _companyFactsCache.Set(
            cik,
            factsDoc,
            TimeSpan.FromMinutes(Math.Max(1, _options.CacheDurationMinutes)));
        return factsDoc;
    }

    private static bool UnitMatchesMetric(string unitKey, MetricDefinition metric)
    {
        if (metric.ValueType == MetricValueType.PerShare)
        {
            var normalized = unitKey.Replace(" ", string.Empty, StringComparison.Ordinal);
            return normalized.Equals("USD/shares", StringComparison.OrdinalIgnoreCase);
        }

        return unitKey.Equals(metric.ReportingUnit, StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeUnitKey(string unitKey, MetricDefinition metric) =>
        metric.ValueType == MetricValueType.PerShare ? metric.ReportingUnit : unitKey;
}
