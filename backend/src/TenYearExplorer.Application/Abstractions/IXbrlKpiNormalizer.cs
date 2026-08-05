using TenYearExplorer.Application.Metrics;
using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Application.Abstractions;

public sealed record NormalizationResult(
    IReadOnlyList<NormalizedAnnualPoint> Points,
    IReadOnlyList<StructuredWarning> Warnings);

public interface IXbrlKpiNormalizer
{
    /// <summary>
    /// Deterministic annual normalization for any allowlisted metric.
    /// </summary>
    NormalizationResult NormalizeAnnual(
        IReadOnlyList<RawSecFact> facts,
        MetricDefinition metric,
        int years,
        DateOnly asOfDate);
}
