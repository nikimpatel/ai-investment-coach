using TenYearExplorer.Domain.Enums;

namespace TenYearExplorer.Domain.Models;

public sealed record FinancialHistoryResult(
    FinancialHistoryStatus Status,
    CompanyIdentity Company,
    string Metric,
    string Period,
    int RequestedYears,
    string Currency,
    IReadOnlyList<FinancialHistoryPoint> Points,
    FinancialHistorySummary? Summary,
    string SourceProvider,
    DateTimeOffset RetrievedAtUtc,
    CacheStatus CacheStatus,
    IReadOnlyList<StructuredWarning> Warnings,
    string? Detail = null);
