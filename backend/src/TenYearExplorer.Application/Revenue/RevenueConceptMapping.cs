using TenYearExplorer.Application.Metrics;

namespace TenYearExplorer.Application.Revenue;

/// <summary>
/// Backward-compatible aliases for Sprint 1 revenue concept mapping.
/// Prefer <see cref="SupportedMetrics"/> for new code.
/// </summary>
public static class RevenueConceptMapping
{
    public const string InternalMetric = SupportedMetrics.Revenue;

    public static readonly IReadOnlyList<string> OrderedConcepts =
        SupportedMetrics.RevenueDefinition.OrderedConcepts;
}
