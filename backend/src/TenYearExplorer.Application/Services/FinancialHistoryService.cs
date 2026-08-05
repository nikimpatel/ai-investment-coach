using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TenYearExplorer.Application.Abstractions;
using TenYearExplorer.Application.Configuration;
using TenYearExplorer.Application.Metrics;
using TenYearExplorer.Domain.Enums;
using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Application.Services;

public sealed class FinancialHistoryService : IFinancialHistoryService
{
    public const string AppleSymbol = "AAPL";
    public const string AppleName = "Apple Inc.";
    public const string AppleCik = "0000320193";
    public const string SourceProviderLive = "SEC EDGAR";
    public const string SourceProviderFixture = "SEC EDGAR fixture";

    private readonly IFinancialFactsProvider _factsProvider;
    private readonly IXbrlKpiNormalizer _normalizer;
    private readonly IFinancialMetricsCalculator _calculator;
    private readonly IFinancialDataCache _cache;
    private readonly SecOptions _options;
    private readonly ILogger<FinancialHistoryService> _logger;

    public FinancialHistoryService(
        IFinancialFactsProvider factsProvider,
        IXbrlKpiNormalizer normalizer,
        IFinancialMetricsCalculator calculator,
        IFinancialDataCache cache,
        IOptions<SecOptions> options,
        ILogger<FinancialHistoryService> logger)
    {
        _factsProvider = factsProvider;
        _normalizer = normalizer;
        _calculator = calculator;
        _cache = cache;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<FinancialHistoryResult> GetHistoryAsync(
        string symbol,
        string metric,
        string period,
        int years,
        CancellationToken cancellationToken)
    {
        var company = new CompanyIdentity(AppleSymbol, AppleName, AppleCik);
        var retrievedAt = DateTimeOffset.UtcNow;
        var normalizedSymbol = (symbol ?? string.Empty).Trim().ToUpperInvariant();
        var normalizedMetric = SupportedMetrics.NormalizeCode(metric);
        var normalizedPeriod = (period ?? string.Empty).Trim().ToLowerInvariant();

        if (!string.Equals(normalizedSymbol, AppleSymbol, StringComparison.OrdinalIgnoreCase))
        {
            return Fail(
                FinancialHistoryStatus.UnsupportedMetric,
                company,
                normalizedMetric,
                "Unsupported",
                "Unsupported company for this sprint.",
                "USD",
                "currency",
                normalizedPeriod,
                years,
                retrievedAt,
                CacheStatus.Bypassed,
                $"Sprint 2 supports only {AppleSymbol}.",
                []);
        }

        if (!SupportedMetrics.TryGet(normalizedMetric, out var metricDefinition))
        {
            return Fail(
                FinancialHistoryStatus.UnsupportedMetric,
                company,
                normalizedMetric,
                "Unsupported",
                "Unsupported metric for this sprint.",
                "USD",
                "currency",
                normalizedPeriod,
                years,
                retrievedAt,
                CacheStatus.Bypassed,
                "Supported metrics: revenue, gross-profit, operating-income, net-income, diluted-eps.",
                []);
        }

        if (!string.Equals(normalizedPeriod, "annual", StringComparison.OrdinalIgnoreCase))
        {
            return Fail(
                FinancialHistoryStatus.UnsupportedMetric,
                company,
                metricDefinition.Code,
                metricDefinition.Label,
                metricDefinition.Description,
                metricDefinition.ReportingUnit,
                metricDefinition.DisplayFormat,
                normalizedPeriod,
                years,
                retrievedAt,
                CacheStatus.Bypassed,
                "Sprint 2 supports only period=annual.",
                []);
        }

        if (years != 10)
        {
            return Fail(
                FinancialHistoryStatus.UnsupportedMetric,
                company,
                metricDefinition.Code,
                metricDefinition.Label,
                metricDefinition.Description,
                metricDefinition.ReportingUnit,
                metricDefinition.DisplayFormat,
                normalizedPeriod,
                years,
                retrievedAt,
                CacheStatus.Bypassed,
                "Sprint 2 supports only years=10.",
                []);
        }

        if (!_options.UseFixtureData && !_options.IsIdentificationConfigured)
        {
            _logger.LogWarning("SEC identification is missing or placeholder; refusing live SEC requests.");
            return Fail(
                FinancialHistoryStatus.InvalidConfiguration,
                company,
                metricDefinition.Code,
                metricDefinition.Label,
                metricDefinition.Description,
                metricDefinition.ReportingUnit,
                metricDefinition.DisplayFormat,
                normalizedPeriod,
                years,
                retrievedAt,
                CacheStatus.Bypassed,
                "SEC ApplicationName and ContactEmail must be configured for live requests. Set SEC__UseFixtureData=true for offline fixture mode.",
                [new StructuredWarning(
                    "INVALID_CONFIGURATION",
                    "Missing SEC User-Agent identification (ApplicationName + ContactEmail).")]);
        }

        var cacheKey = IFinancialDataCache.BuildKey(normalizedSymbol, metricDefinition.Code, normalizedPeriod, years);
        if (_cache.TryGet(cacheKey, out var cached) && cached is not null)
        {
            _logger.LogInformation("Cache hit for {CacheKey}", cacheKey);
            return cached with
            {
                CacheStatus = CacheStatus.Hit,
                RetrievedAtUtc = cached.RetrievedAtUtc,
            };
        }

        try
        {
            cancellationToken.ThrowIfCancellationRequested();
            var asOf = DateOnly.FromDateTime(DateTime.UtcNow);

            var metricFacts = await _factsProvider.GetFactsAsync(AppleCik, metricDefinition, cancellationToken);
            var normalization = _normalizer.NormalizeAnnual(metricFacts, metricDefinition, years, asOf);
            var warnings = normalization.Warnings.ToList();

            if (normalization.Points.Count == 0)
            {
                return Fail(
                    FinancialHistoryStatus.InsufficientHistory,
                    company,
                    metricDefinition.Code,
                    metricDefinition.Label,
                    metricDefinition.Description,
                    metricDefinition.ReportingUnit,
                    metricDefinition.DisplayFormat,
                    normalizedPeriod,
                    years,
                    retrievedAt,
                    CacheStatus.Miss,
                    $"No reliable annual {metricDefinition.Label} points could be normalized.",
                    warnings);
            }

            // Split-limited Diluted EPS may return fewer than requested years on one comparable basis.
            // Prefer PartiallySupported with those points over mixing pre-/post-split reporting bases.
            var splitLimitedComparable = normalization.Points.Count > 0
                && normalization.Points.Count < years
                && warnings.Any(w => w.Code is "SPLIT_INCOMPARABLE_YEAR_EXCLUDED"
                    or "SPLIT_BASIS_NORMALIZED"
                    or "SPLIT_ADJUSTED_COMPARATIVE_PREFERRED"
                    or "SPLIT_DISCONTINUITY_DETECTED");

            if (normalization.Points.Count < years && !splitLimitedComparable)
            {
                return Fail(
                    FinancialHistoryStatus.InsufficientHistory,
                    company,
                    metricDefinition.Code,
                    metricDefinition.Label,
                    metricDefinition.Description,
                    metricDefinition.ReportingUnit,
                    metricDefinition.DisplayFormat,
                    normalizedPeriod,
                    years,
                    retrievedAt,
                    CacheStatus.Miss,
                    $"Only {normalization.Points.Count} reliable annual points available; {years} requested.",
                    warnings);
            }

            var summary = _calculator.BuildSummary(normalization.Points);
            var yoy = _calculator.ComputeYearOverYear(normalization.Points.Select(p => p.Value).ToList());
            var points = normalization.Points.Select((p, index) => new FinancialHistoryPoint(
                FiscalYear: p.FiscalYearLabel,
                FiscalYearEnd: p.FiscalYearEndYear,
                PeriodStart: p.PeriodStart,
                PeriodEnd: p.PeriodEnd,
                Value: p.Value,
                YearOverYearChange: yoy[index],
                FilingDate: p.FilingDate,
                Form: p.Form,
                Accession: p.Accession,
                Concept: p.Concept,
                Unit: p.Unit)).ToList();

            var margins = await BuildMarginsAsync(years, asOf, cancellationToken, warnings);

            var status = warnings.Any(w => w.Code is "AMENDMENT_PREFERRED"
                    or "OWN_PERIOD_PREFERRED"
                    or "COMPARATIVE_ONLY"
                    or "SPLIT_ADJUSTED_COMPARATIVE_PREFERRED"
                    or "SPLIT_INCOMPARABLE_YEAR_EXCLUDED"
                    or "SPLIT_BASIS_NORMALIZED"
                    or "SPLIT_DISCONTINUITY_DETECTED"
                    or "INSUFFICIENT_HISTORY")
                ? FinancialHistoryStatus.PartiallySupported
                : FinancialHistoryStatus.Success;

            var currency = metricDefinition.ValueType == MetricValueType.PerShare ? "USD" : "USD";

            var result = new FinancialHistoryResult(
                Status: status,
                Company: company,
                Metric: metricDefinition.Code,
                MetricLabel: metricDefinition.Label,
                MetricDescription: metricDefinition.Description,
                Period: "annual",
                RequestedYears: years,
                Currency: currency,
                ReportingUnit: metricDefinition.ReportingUnit,
                DisplayFormat: metricDefinition.DisplayFormat,
                Points: points,
                Summary: summary,
                Margins: margins,
                SourceProvider: _options.UseFixtureData ? SourceProviderFixture : SourceProviderLive,
                RetrievedAtUtc: retrievedAt,
                CacheStatus: CacheStatus.Miss,
                Warnings: warnings);

            _cache.Set(cacheKey, result, TimeSpan.FromMinutes(Math.Max(1, _options.CacheDurationMinutes)));
            return result;
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Financial history request cancelled for {Symbol}", normalizedSymbol);
            throw;
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("configuration", StringComparison.OrdinalIgnoreCase))
        {
            return Fail(
                FinancialHistoryStatus.InvalidConfiguration,
                company,
                metricDefinition.Code,
                metricDefinition.Label,
                metricDefinition.Description,
                metricDefinition.ReportingUnit,
                metricDefinition.DisplayFormat,
                normalizedPeriod,
                years,
                retrievedAt,
                CacheStatus.Miss,
                ex.Message,
                [new StructuredWarning("INVALID_CONFIGURATION", ex.Message)]);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "SEC provider unavailable");
            return Fail(
                FinancialHistoryStatus.ProviderUnavailable,
                company,
                metricDefinition.Code,
                metricDefinition.Label,
                metricDefinition.Description,
                metricDefinition.ReportingUnit,
                metricDefinition.DisplayFormat,
                normalizedPeriod,
                years,
                retrievedAt,
                CacheStatus.Miss,
                "SEC data provider is unavailable.",
                [new StructuredWarning("PROVIDER_UNAVAILABLE", ex.Message)]);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected provider failure");
            return Fail(
                FinancialHistoryStatus.ProviderUnavailable,
                company,
                metricDefinition.Code,
                metricDefinition.Label,
                metricDefinition.Description,
                metricDefinition.ReportingUnit,
                metricDefinition.DisplayFormat,
                normalizedPeriod,
                years,
                retrievedAt,
                CacheStatus.Miss,
                "Unexpected failure retrieving financial history.",
                [new StructuredWarning("PROVIDER_UNAVAILABLE", ex.Message)]);
        }
    }

    private async Task<DerivedMarginsResult?> BuildMarginsAsync(
        int years,
        DateOnly asOf,
        CancellationToken cancellationToken,
        List<StructuredWarning> warnings)
    {
        try
        {
            var revenueFacts = await _factsProvider.GetFactsAsync(
                AppleCik, SupportedMetrics.RevenueDefinition, cancellationToken);
            var grossFacts = await _factsProvider.GetFactsAsync(
                AppleCik, SupportedMetrics.GrossProfitDefinition, cancellationToken);
            var operatingFacts = await _factsProvider.GetFactsAsync(
                AppleCik, SupportedMetrics.OperatingIncomeDefinition, cancellationToken);
            var netFacts = await _factsProvider.GetFactsAsync(
                AppleCik, SupportedMetrics.NetIncomeDefinition, cancellationToken);

            var revenue = _normalizer.NormalizeAnnual(
                revenueFacts, SupportedMetrics.RevenueDefinition, years, asOf).Points;
            var gross = _normalizer.NormalizeAnnual(
                grossFacts, SupportedMetrics.GrossProfitDefinition, years, asOf).Points;
            var operating = _normalizer.NormalizeAnnual(
                operatingFacts, SupportedMetrics.OperatingIncomeDefinition, years, asOf).Points;
            var net = _normalizer.NormalizeAnnual(
                netFacts, SupportedMetrics.NetIncomeDefinition, years, asOf).Points;

            var margins = MarginCalculator.Compute(revenue, gross, operating, net);
            warnings.AddRange(margins.Warnings);
            return margins;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Derived margins unavailable for this response");
            warnings.Add(new StructuredWarning(
                "MARGINS_UNAVAILABLE",
                "Derived margins could not be computed for this response."));
            return null;
        }
    }

    private static FinancialHistoryResult Fail(
        FinancialHistoryStatus status,
        CompanyIdentity company,
        string metric,
        string metricLabel,
        string metricDescription,
        string reportingUnit,
        string displayFormat,
        string period,
        int years,
        DateTimeOffset retrievedAt,
        CacheStatus cacheStatus,
        string detail,
        IReadOnlyList<StructuredWarning> warnings) =>
        new(
            Status: status,
            Company: company,
            Metric: metric,
            MetricLabel: metricLabel,
            MetricDescription: metricDescription,
            Period: period,
            RequestedYears: years,
            Currency: "USD",
            ReportingUnit: reportingUnit,
            DisplayFormat: displayFormat,
            Points: [],
            Summary: null,
            Margins: null,
            SourceProvider: "SEC EDGAR",
            RetrievedAtUtc: retrievedAt,
            CacheStatus: cacheStatus,
            Warnings: warnings,
            Detail: detail);
}
