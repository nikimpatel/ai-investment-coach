namespace TenYearExplorer.Domain.Models;

/// <summary>
/// One fiscal-year margin observation (percent of revenue).
/// </summary>
public sealed record MarginPoint(
    string FiscalYear,
    decimal? MarginPercent,
    decimal? ChangePercentagePoints,
    bool IsAvailable);

/// <summary>
/// Derived profitability margin series aligned to fiscal years.
/// </summary>
public sealed record DerivedMarginSeries(
    string Code,
    string Label,
    string Description,
    IReadOnlyList<MarginPoint> Points,
    decimal? StartMarginPercent,
    decimal? EndMarginPercent,
    decimal? ChangePercentagePoints);

/// <summary>
/// Bundle of Sprint 2 derived margins computed after FY alignment.
/// </summary>
public sealed record DerivedMarginsResult(
    DerivedMarginSeries? GrossMargin,
    DerivedMarginSeries? OperatingMargin,
    DerivedMarginSeries? NetMargin,
    IReadOnlyList<StructuredWarning> Warnings);
