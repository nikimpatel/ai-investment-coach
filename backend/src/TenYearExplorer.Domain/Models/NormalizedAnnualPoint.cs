namespace TenYearExplorer.Domain.Models;

public sealed record NormalizedAnnualPoint(
    string FiscalYearLabel,
    int FiscalYearEndYear,
    DateOnly? PeriodStart,
    DateOnly PeriodEnd,
    decimal Value,
    string Unit,
    string Concept,
    DateOnly FilingDate,
    string Form,
    string Accession);
