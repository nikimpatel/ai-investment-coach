using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Application.Abstractions;

public interface IFinancialMetricsCalculator
{
    IReadOnlyList<decimal?> ComputeYearOverYear(IReadOnlyList<decimal> values);

    (decimal? Cagr, string? UnavailableReason) ComputeCagr(
        decimal startValue,
        decimal endValue,
        int intervals);

    FinancialHistorySummary BuildSummary(IReadOnlyList<NormalizedAnnualPoint> points);
}
