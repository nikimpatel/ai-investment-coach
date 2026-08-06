namespace TenYearExplorer.Api.Contracts;

public sealed record FinancialHistoryResponse(
    string Status,
    CompanyDto Company,
    string Symbol,
    string Cik,
    string Currency,
    string Metric,
    string MetricLabel,
    string MetricDescription,
    string ReportingUnit,
    string DisplayFormat,
    string Period,
    int Years,
    IReadOnlyList<FinancialHistoryPointDto> Points,
    FinancialHistorySummaryDto? Summary,
    DerivedMarginsDto? Margins,
    DerivedRelationshipsDto? Relationships,
    bool IsDerived,
    bool IsNonGaap,
    string? Formula,
    string SourceProvider,
    DateTimeOffset RetrievedAtUtc,
    string CacheStatus,
    IReadOnlyList<WarningDto> Warnings,
    string? Detail);

public sealed record CompanyDto(string Name, string Symbol, string Cik);

public sealed record FinancialHistoryPointDto(
    string FiscalYear,
    int FiscalYearEnd,
    string? PeriodStart,
    string PeriodEnd,
    decimal Value,
    decimal? YearOverYearChange,
    string FilingDate,
    string Form,
    string Accession,
    string Concept,
    string Unit,
    bool IsDerived,
    string? Formula,
    IReadOnlyList<DerivedInputTraceDto>? Inputs);

public sealed record DerivedInputTraceDto(
    string Metric,
    string Label,
    decimal Value,
    string Concept,
    string? PeriodStart,
    string PeriodEnd,
    string FilingDate,
    string Form,
    string Accession);

public sealed record ExtremeYearDto(string FiscalYear, decimal Value);

public sealed record LargestMoveDto(string FiscalYear, decimal AbsoluteChange, decimal RelativeChange);

public sealed record FinancialHistorySummaryDto(
    decimal StartValue,
    decimal EndValue,
    string StartFiscalYear,
    string EndFiscalYear,
    int Intervals,
    decimal AbsoluteChange,
    decimal? TotalPercentageChange,
    decimal? Cagr,
    string? CagrUnavailableReason,
    int PositiveGrowthYears,
    int NegativeGrowthYears,
    int FlatGrowthYears,
    ExtremeYearDto? Highest,
    ExtremeYearDto? Lowest,
    LargestMoveDto? LargestIncrease,
    LargestMoveDto? LargestDecline);

public sealed record MarginPointDto(
    string FiscalYear,
    decimal? MarginPercent,
    decimal? ChangePercentagePoints,
    bool IsAvailable);

public sealed record DerivedMarginSeriesDto(
    string Code,
    string Label,
    string Description,
    IReadOnlyList<MarginPointDto> Points,
    decimal? StartMarginPercent,
    decimal? EndMarginPercent,
    decimal? ChangePercentagePoints);

public sealed record DerivedMarginsDto(
    DerivedMarginSeriesDto? GrossMargin,
    DerivedMarginSeriesDto? OperatingMargin,
    DerivedMarginSeriesDto? NetMargin);

public sealed record DerivedRelationshipPointDto(
    string FiscalYear,
    int FiscalYearEnd,
    string PeriodEnd,
    decimal? Value,
    bool IsAvailable,
    string? UnavailableReason,
    bool IsNetCash,
    IReadOnlyList<DerivedInputTraceDto> Inputs);

public sealed record DerivedRelationshipSeriesDto(
    string Code,
    string Label,
    string Description,
    string Formula,
    string ReportingUnit,
    string DisplayFormat,
    bool IsNonGaap,
    IReadOnlyList<DerivedRelationshipPointDto> Points);

public sealed record DerivedRelationshipsDto(
    DerivedRelationshipSeriesDto? FreeCashFlow,
    DerivedRelationshipSeriesDto? CashConversion,
    DerivedRelationshipSeriesDto? FreeCashFlowMargin,
    DerivedRelationshipSeriesDto? NetDebt);

public sealed record WarningDto(string Code, string Message, string? FiscalYear, string? Concept);
