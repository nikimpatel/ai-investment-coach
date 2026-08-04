namespace TenYearExplorer.Api.Contracts;

public sealed record FinancialHistoryResponse(
    string Status,
    CompanyDto Company,
    string Symbol,
    string Cik,
    string Currency,
    string Metric,
    string Period,
    int Years,
    IReadOnlyList<FinancialHistoryPointDto> Points,
    FinancialHistorySummaryDto? Summary,
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
    string Unit);

public sealed record ExtremeYearDto(string FiscalYear, decimal Value);

public sealed record LargestMoveDto(string FiscalYear, decimal AbsoluteChange, decimal RelativeChange);

public sealed record FinancialHistorySummaryDto(
    decimal StartValue,
    decimal EndValue,
    string StartFiscalYear,
    string EndFiscalYear,
    int Intervals,
    decimal? Cagr,
    string? CagrUnavailableReason,
    int PositiveGrowthYears,
    int NegativeGrowthYears,
    int FlatGrowthYears,
    ExtremeYearDto? Highest,
    ExtremeYearDto? Lowest,
    LargestMoveDto? LargestIncrease,
    LargestMoveDto? LargestDecline);

public sealed record WarningDto(string Code, string Message, string? FiscalYear, string? Concept);
