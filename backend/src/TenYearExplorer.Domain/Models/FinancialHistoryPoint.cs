namespace TenYearExplorer.Domain.Models;

public sealed record FinancialHistoryPoint(
    string FiscalYear,
    int FiscalYearEnd,
    DateOnly? PeriodStart,
    DateOnly PeriodEnd,
    decimal Value,
    decimal? YearOverYearChange,
    DateOnly FilingDate,
    string Form,
    string Accession,
    string Concept,
    string Unit);
