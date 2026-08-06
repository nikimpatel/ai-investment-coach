using TenYearExplorer.Domain.Enums;

namespace TenYearExplorer.Domain.Models;

public sealed record FinancialHistoryResult(
    FinancialHistoryStatus Status,
    CompanyIdentity Company,
    string Metric,
    string MetricLabel,
    string MetricDescription,
    string Period,
    int RequestedYears,
    string Currency,
    string ReportingUnit,
    string DisplayFormat,
    IReadOnlyList<FinancialHistoryPoint> Points,
    FinancialHistorySummary? Summary,
    DerivedMarginsResult? Margins,
    string SourceProvider,
    DateTimeOffset RetrievedAtUtc,
    CacheStatus CacheStatus,
    IReadOnlyList<StructuredWarning> Warnings,
    string? Detail = null,
    DerivedRelationshipsResult? Relationships = null,
    bool IsDerived = false,
    bool IsNonGaap = false,
    string? Formula = null);
