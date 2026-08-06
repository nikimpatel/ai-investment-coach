namespace TenYearExplorer.Domain.Models;

public sealed record DerivedInputTrace(
    string Metric,
    string Label,
    decimal Value,
    string Concept,
    DateOnly? PeriodStart,
    DateOnly PeriodEnd,
    DateOnly FilingDate,
    string Form,
    string Accession);

public sealed record DerivedRelationshipPoint(
    string FiscalYear,
    int FiscalYearEnd,
    DateOnly PeriodEnd,
    decimal? Value,
    bool IsAvailable,
    string? UnavailableReason,
    bool IsNetCash,
    IReadOnlyList<DerivedInputTrace> Inputs);

public sealed record DerivedRelationshipSeries(
    string Code,
    string Label,
    string Description,
    string Formula,
    string ReportingUnit,
    string DisplayFormat,
    bool IsNonGaap,
    IReadOnlyList<DerivedRelationshipPoint> Points);

public sealed record DerivedRelationshipsResult(
    DerivedRelationshipSeries? FreeCashFlow,
    DerivedRelationshipSeries? CashConversion,
    DerivedRelationshipSeries? FreeCashFlowMargin,
    DerivedRelationshipSeries? NetDebt);
