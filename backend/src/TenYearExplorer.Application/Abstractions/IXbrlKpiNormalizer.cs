using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Application.Abstractions;

public sealed record NormalizationResult(
    IReadOnlyList<NormalizedAnnualPoint> Points,
    IReadOnlyList<StructuredWarning> Warnings);

public interface IXbrlKpiNormalizer
{
    NormalizationResult NormalizeAnnualRevenue(
        IReadOnlyList<RawSecFact> facts,
        int years,
        DateOnly asOfDate);
}
