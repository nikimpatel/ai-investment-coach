namespace TenYearExplorer.Domain.Models;

public sealed record StructuredWarning(
    string Code,
    string Message,
    string? FiscalYear = null,
    string? Concept = null);
