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
                $"Sprint 3 supports only {AppleSymbol}.",
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
                "Supported metrics: revenue, gross-profit, operating-income, net-income, diluted-eps, operating-cash-flow, capital-expenditure, free-cash-flow, cash-and-equivalents, total-debt.",
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
                "Sprint 3 supports only period=annual.",
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
                "Sprint 3 supports only years=10.",
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

            NormalizationResult normalization;
            DerivedRelationshipsResult? relationships = null;
            DerivedRelationshipSeries? selectedDerivedSeries = null;
            List<StructuredWarning> warnings;

            if (IsSprint3Metric(metricDefinition.Code))
            {
                var context = await BuildSprint3ContextAsync(years, asOf, cancellationToken);
                relationships = context.Relationships;
                warnings = context.Warnings.ToList();

                normalization = metricDefinition.Code switch
                {
                    SupportedMetrics.OperatingCashFlow => context.OperatingCashFlow,
                    SupportedMetrics.CapitalExpenditure => context.CapitalExpenditure,
                    SupportedMetrics.CashAndEquivalents => context.CashAndEquivalents,
                    SupportedMetrics.FreeCashFlow => ToNormalization(
                        context.Relationships.FreeCashFlow!,
                        warnings),
                    SupportedMetrics.TotalDebt => ToNormalization(
                        context.TotalDebt,
                        warnings),
                    _ => throw new InvalidOperationException(
                        $"Unsupported Sprint 3 metric definition '{metricDefinition.Code}'."),
                };

                selectedDerivedSeries = metricDefinition.Code switch
                {
                    SupportedMetrics.FreeCashFlow => context.Relationships.FreeCashFlow,
                    SupportedMetrics.TotalDebt => context.TotalDebt,
                    _ => null,
                };
            }
            else
            {
                var metricFacts = await _factsProvider.GetFactsAsync(
                    AppleCik, metricDefinition, cancellationToken);
                normalization = _normalizer.NormalizeAnnual(
                    metricFacts, metricDefinition, years, asOf);
                warnings = normalization.Warnings.ToList();
            }

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

            var sprint3PartialHistory = IsSprint3Metric(metricDefinition.Code)
                && normalization.Points.Count >= 2
                && normalization.Points.Count < years;

            if (normalization.Points.Count < years
                && !splitLimitedComparable
                && !sprint3PartialHistory)
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
            var points = normalization.Points.Select((p, index) =>
            {
                var derivedPoint = selectedDerivedSeries?.Points.FirstOrDefault(
                    d => d.PeriodEnd == p.PeriodEnd && d.IsAvailable);
                return new FinancialHistoryPoint(
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
                    Unit: p.Unit,
                    IsDerived: metricDefinition.ComputationKind != MetricComputationKind.DirectConcept,
                    Formula: metricDefinition.Formula,
                    Inputs: derivedPoint?.Inputs);
            }).ToList();

            var margins = await BuildMarginsAsync(years, asOf, cancellationToken, warnings);

            // Attach Sprint 3 derived relationships on every successful response so the UI can
            // show cash conversion / FCF margin / net debt alongside any selected metric.
            // Do not merge component-normalization warnings into Sprint 1/2 primary status.
            if (relationships is null)
            {
                try
                {
                    var context = await BuildSprint3ContextAsync(years, asOf, cancellationToken);
                    relationships = context.Relationships;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Derived cash/debt relationships unavailable for this response");
                    warnings.Add(new StructuredWarning(
                        "RELATIONSHIPS_UNAVAILABLE",
                        "Derived cash and debt relationships could not be computed for this response."));
                }
            }

            var status = warnings.Any(w => w.Code is "AMENDMENT_PREFERRED"
                    or "OWN_PERIOD_PREFERRED"
                    or "COMPARATIVE_ONLY"
                    or "COMPARATIVE_RESTATEMENT_PREFERRED"
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
                Warnings: warnings,
                Relationships: relationships,
                IsDerived: metricDefinition.ComputationKind != MetricComputationKind.DirectConcept,
                IsNonGaap: metricDefinition.IsNonGaap,
                Formula: metricDefinition.Formula);

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

    private static bool IsSprint3Metric(string metricCode) =>
        metricCode is SupportedMetrics.OperatingCashFlow
            or SupportedMetrics.CapitalExpenditure
            or SupportedMetrics.FreeCashFlow
            or SupportedMetrics.CashAndEquivalents
            or SupportedMetrics.TotalDebt;

    private async Task<Sprint3Context> BuildSprint3ContextAsync(
        int years,
        DateOnly asOf,
        CancellationToken cancellationToken)
    {
        var operatingCashFlow = await NormalizeAsync(
            SupportedMetrics.OperatingCashFlowDefinition, years, asOf, cancellationToken);
        var capitalExpenditure = await NormalizeAsync(
            SupportedMetrics.CapitalExpenditureDefinition, years, asOf, cancellationToken);
        var cashAndEquivalents = await NormalizeAsync(
            SupportedMetrics.CashAndEquivalentsDefinition, years, asOf, cancellationToken);
        var revenue = await NormalizeAsync(
            SupportedMetrics.RevenueDefinition, years, asOf, cancellationToken);
        var netIncome = await NormalizeAsync(
            SupportedMetrics.NetIncomeDefinition, years, asOf, cancellationToken);

        var commercialPaper = await NormalizeAsync(
            DebtComponentDefinition("commercial-paper", "Commercial Paper", "CommercialPaper"),
            years,
            asOf,
            cancellationToken);
        var currentTermDebt = await NormalizeAsync(
            DebtComponentDefinition("current-term-debt", "Current Term Debt", "LongTermDebtCurrent"),
            years,
            asOf,
            cancellationToken);
        var noncurrentTermDebt = await NormalizeAsync(
            DebtComponentDefinition(
                "noncurrent-term-debt",
                "Noncurrent Term Debt",
                "LongTermDebtNoncurrent"),
            years,
            asOf,
            cancellationToken);

        var freeCashFlow = CashFlowDebtCalculator.BuildFreeCashFlow(
            operatingCashFlow.Points,
            capitalExpenditure.Points);
        var totalDebt = CashFlowDebtCalculator.BuildTotalDebt(
            commercialPaper.Points,
            currentTermDebt.Points,
            noncurrentTermDebt.Points);
        var relationships = CashFlowDebtCalculator.BuildRelationships(
            freeCashFlow,
            operatingCashFlow.Points,
            netIncome.Points,
            revenue.Points,
            cashAndEquivalents.Points,
            totalDebt);

        var warnings = new[]
            {
                operatingCashFlow,
                capitalExpenditure,
                cashAndEquivalents,
                revenue,
                netIncome,
                commercialPaper,
                currentTermDebt,
                noncurrentTermDebt,
            }
            .SelectMany(r => r.Warnings)
            .Distinct()
            .ToList();
        warnings.Add(new StructuredWarning(
            "CAPEX_POSITIVE_SPEND_CONVENTION",
            "Capital expenditure is normalized to a positive amount spent; Free Cash Flow subtracts that amount from Operating Cash Flow.",
            Concept: "PaymentsToAcquirePropertyPlantAndEquipment"));
        warnings.Add(new StructuredWarning(
            "TOTAL_DEBT_COMPONENTS",
            "Total Debt is derived without total liabilities: Commercial Paper + Current Term Debt + Noncurrent Term Debt."));

        return new Sprint3Context(
            operatingCashFlow,
            capitalExpenditure,
            cashAndEquivalents,
            totalDebt,
            relationships,
            warnings);
    }

    private async Task<NormalizationResult> NormalizeAsync(
        MetricDefinition definition,
        int years,
        DateOnly asOf,
        CancellationToken cancellationToken)
    {
        var facts = await _factsProvider.GetFactsAsync(
            AppleCik, definition, cancellationToken);
        return _normalizer.NormalizeAnnual(facts, definition, years, asOf);
    }

    private static MetricDefinition DebtComponentDefinition(
        string code,
        string label,
        string concept) =>
        SupportedMetrics.TotalDebtDefinition with
        {
            Code = code,
            Label = label,
            Description = $"{label} used as one non-overlapping Total Debt component.",
            OrderedConcepts = [concept],
            ComputationKind = MetricComputationKind.DirectConcept,
            Formula = null,
        };

    private static NormalizationResult ToNormalization(
        DerivedRelationshipSeries series,
        IReadOnlyList<StructuredWarning> existingWarnings)
    {
        var points = series.Points
            .Where(p => p.IsAvailable && p.Value is not null && p.Inputs.Count > 0)
            .Select(p =>
            {
                var first = p.Inputs[0];
                var accessions = string.Join(
                    " + ",
                    p.Inputs.Select(i => i.Accession).Distinct(StringComparer.Ordinal));
                return new NormalizedAnnualPoint(
                    FiscalYearLabel: p.FiscalYear,
                    FiscalYearEndYear: p.FiscalYearEnd,
                    PeriodStart: first.PeriodStart,
                    PeriodEnd: p.PeriodEnd,
                    Value: p.Value!.Value,
                    Unit: series.ReportingUnit,
                    Concept: $"Derived: {series.Formula}",
                    FilingDate: p.Inputs.Max(i => i.FilingDate),
                    Form: "Derived",
                    Accession: accessions);
            })
            .OrderBy(p => p.PeriodEnd)
            .ToList();

        var warnings = existingWarnings.ToList();
        if (points.Count < 10)
        {
            warnings.Add(new StructuredWarning(
                "INSUFFICIENT_HISTORY",
                $"Derived {points.Count} completed annual periods for '{series.Code}'; requested 10."));
        }

        return new NormalizationResult(points, warnings);
    }

    private sealed record Sprint3Context(
        NormalizationResult OperatingCashFlow,
        NormalizationResult CapitalExpenditure,
        NormalizationResult CashAndEquivalents,
        DerivedRelationshipSeries TotalDebt,
        DerivedRelationshipsResult Relationships,
        IReadOnlyList<StructuredWarning> Warnings);

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
