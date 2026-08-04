namespace TenYearExplorer.Domain.Models;

/// <summary>
/// Internal SEC fact candidate — never exposed through the public API.
/// </summary>
public sealed record RawSecFact(
    string Concept,
    decimal Value,
    string Unit,
    DateOnly? PeriodStart,
    DateOnly PeriodEnd,
    DateOnly Filed,
    string Form,
    string Accession,
    int? ReportedFiscalYear,
    string? FiscalPeriod,
    string? Frame);
