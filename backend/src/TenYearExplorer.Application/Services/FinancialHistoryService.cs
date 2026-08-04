using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TenYearExplorer.Application.Abstractions;
using TenYearExplorer.Application.Configuration;
using TenYearExplorer.Application.Revenue;
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
        var normalizedMetric = (metric ?? string.Empty).Trim().ToLowerInvariant();
        var normalizedPeriod = (period ?? string.Empty).Trim().ToLowerInvariant();

        if (!string.Equals(normalizedSymbol, AppleSymbol, StringComparison.OrdinalIgnoreCase))
        {
            return Fail(
                FinancialHistoryStatus.UnsupportedMetric,
                company,
                normalizedMetric,
                normalizedPeriod,
                years,
                retrievedAt,
                CacheStatus.Bypassed,
                $"Sprint 1 supports only {AppleSymbol}.",
                []);
        }

        if (!string.Equals(normalizedMetric, RevenueConceptMapping.InternalMetric, StringComparison.OrdinalIgnoreCase))
        {
            return Fail(
                FinancialHistoryStatus.UnsupportedMetric,
                company,
                normalizedMetric,
                normalizedPeriod,
                years,
                retrievedAt,
                CacheStatus.Bypassed,
                "Sprint 1 supports only metric=revenue.",
                []);
        }

        if (!string.Equals(normalizedPeriod, "annual", StringComparison.OrdinalIgnoreCase))
        {
            return Fail(
                FinancialHistoryStatus.UnsupportedMetric,
                company,
                normalizedMetric,
                normalizedPeriod,
                years,
                retrievedAt,
                CacheStatus.Bypassed,
                "Sprint 1 supports only period=annual.",
                []);
        }

        if (years != 10)
        {
            return Fail(
                FinancialHistoryStatus.UnsupportedMetric,
                company,
                normalizedMetric,
                normalizedPeriod,
                years,
                retrievedAt,
                CacheStatus.Bypassed,
                "Sprint 1 supports only years=10.",
                []);
        }

        if (!_options.UseFixtureData && !_options.IsIdentificationConfigured)
        {
            _logger.LogWarning("SEC identification is missing or placeholder; refusing live SEC requests.");
            return Fail(
                FinancialHistoryStatus.InvalidConfiguration,
                company,
                normalizedMetric,
                normalizedPeriod,
                years,
                retrievedAt,
                CacheStatus.Bypassed,
                "SEC ApplicationName and ContactEmail must be configured for live requests. Set SEC__UseFixtureData=true for offline fixture mode.",
                [new StructuredWarning(
                    "INVALID_CONFIGURATION",
                    "Missing SEC User-Agent identification (ApplicationName + ContactEmail).")]);
        }

        var cacheKey = IFinancialDataCache.BuildKey(normalizedSymbol, normalizedMetric, normalizedPeriod, years);
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
            var facts = await _factsProvider.GetRevenueFactsAsync(AppleCik, cancellationToken);
            var normalization = _normalizer.NormalizeAnnualRevenue(facts, years, DateOnly.FromDateTime(DateTime.UtcNow));
            var warnings = normalization.Warnings.ToList();

            if (normalization.Points.Count == 0)
            {
                return Fail(
                    FinancialHistoryStatus.InsufficientHistory,
                    company,
                    normalizedMetric,
                    normalizedPeriod,
                    years,
                    retrievedAt,
                    CacheStatus.Miss,
                    "No reliable annual revenue points could be normalized.",
                    warnings);
            }

            if (normalization.Points.Count < years)
            {
                var insufficient = Fail(
                    FinancialHistoryStatus.InsufficientHistory,
                    company,
                    normalizedMetric,
                    normalizedPeriod,
                    years,
                    retrievedAt,
                    CacheStatus.Miss,
                    $"Only {normalization.Points.Count} reliable annual points available; {years} requested.",
                    warnings);
                // Do not cache insufficient/error outcomes as success.
                return insufficient;
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

            var status = warnings.Any(w => w.Code is "AMENDMENT_PREFERRED" or "OWN_PERIOD_PREFERRED" or "COMPARATIVE_ONLY")
                ? FinancialHistoryStatus.PartiallySupported
                : FinancialHistoryStatus.Success;

            var result = new FinancialHistoryResult(
                Status: status,
                Company: company,
                Metric: RevenueConceptMapping.InternalMetric,
                Period: "annual",
                RequestedYears: years,
                Currency: "USD",
                Points: points,
                Summary: summary,
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
                normalizedMetric,
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
                normalizedMetric,
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
                normalizedMetric,
                normalizedPeriod,
                years,
                retrievedAt,
                CacheStatus.Miss,
                "Unexpected failure retrieving financial history.",
                [new StructuredWarning("PROVIDER_UNAVAILABLE", ex.Message)]);
        }
    }

    private static FinancialHistoryResult Fail(
        FinancialHistoryStatus status,
        CompanyIdentity company,
        string metric,
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
            Period: period,
            RequestedYears: years,
            Currency: "USD",
            Points: [],
            Summary: null,
            SourceProvider: "SEC EDGAR",
            RetrievedAtUtc: retrievedAt,
            CacheStatus: cacheStatus,
            Warnings: warnings,
            Detail: detail);
}
