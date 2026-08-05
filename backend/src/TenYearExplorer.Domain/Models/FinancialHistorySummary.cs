namespace TenYearExplorer.Domain.Models;

public sealed record ExtremeYear(
    string FiscalYear,
    decimal Value);

public sealed record LargestMove(
    string FiscalYear,
    decimal AbsoluteChange,
    decimal RelativeChange);

public sealed record FinancialHistorySummary(
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
    ExtremeYear? Highest,
    ExtremeYear? Lowest,
    LargestMove? LargestIncrease,
    LargestMove? LargestDecline);
