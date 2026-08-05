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
    string Accession,
    /// <summary>
    /// True when the selected fact came only from a later comparative filing
    /// (reported FY did not match the period-end year).
    /// </summary>
    bool IsComparative = false);
