using TenYearExplorer.Application.Abstractions;
using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Application.Services;

public sealed class FinancialMetricsCalculator : IFinancialMetricsCalculator
{
    public IReadOnlyList<decimal?> ComputeYearOverYear(IReadOnlyList<decimal> values)
    {
        if (values.Count == 0)
        {
            return [];
        }

        var result = new List<decimal?>(values.Count) { null };
        for (var i = 1; i < values.Count; i++)
        {
            var prior = values[i - 1];
            var current = values[i];
            if (prior == 0)
            {
                result.Add(null);
                continue;
            }

            result.Add((current - prior) / prior);
        }

        return result;
    }

    public (decimal? Cagr, string? UnavailableReason) ComputeCagr(
        decimal startValue,
        decimal endValue,
        int intervals)
    {
        if (intervals <= 0)
        {
            return (null, "Intervals must be positive.");
        }

        // EPS-safe and monetary-safe: zero or negative start/end must not produce misleading CAGR.
        if (startValue <= 0 || endValue <= 0)
        {
            return (null, "CAGR requires positive start and end values.");
        }

        var ratio = (double)(endValue / startValue);
        var cagr = (decimal)(Math.Pow(ratio, 1.0 / intervals) - 1.0);
        return (cagr, null);
    }

    public FinancialHistorySummary BuildSummary(IReadOnlyList<NormalizedAnnualPoint> points)
    {
        if (points.Count == 0)
        {
            return new FinancialHistorySummary(
                0, 0, string.Empty, string.Empty, 0, 0, null, null, "No points.",
                0, 0, 0, null, null, null, null);
        }

        var start = points[0];
        var end = points[^1];
        var intervals = Math.Max(points.Count - 1, 0);
        var absoluteChange = end.Value - start.Value;
        decimal? totalPercentageChange = start.Value == 0
            ? null
            : absoluteChange / start.Value;

        var values = points.Select(p => p.Value).ToList();
        var yoy = ComputeYearOverYear(values);
        var (cagr, cagrReason) = intervals == 0
            ? ((decimal?)null, "Insufficient intervals for CAGR.")
            : ComputeCagr(start.Value, end.Value, intervals);

        var positive = 0;
        var negative = 0;
        var flat = 0;
        LargestMove? largestIncrease = null;
        LargestMove? largestDecline = null;

        for (var i = 1; i < points.Count; i++)
        {
            var change = yoy[i];
            if (change is null)
            {
                continue;
            }

            var absolute = points[i].Value - points[i - 1].Value;
            if (change > 0)
            {
                positive++;
                if (largestIncrease is null || change > largestIncrease.RelativeChange)
                {
                    largestIncrease = new LargestMove(points[i].FiscalYearLabel, absolute, change.Value);
                }
            }
            else if (change < 0)
            {
                negative++;
                if (largestDecline is null || change < largestDecline.RelativeChange)
                {
                    largestDecline = new LargestMove(points[i].FiscalYearLabel, absolute, change.Value);
                }
            }
            else
            {
                flat++;
            }
        }

        var highest = points.MaxBy(p => p.Value)!;
        var lowest = points.MinBy(p => p.Value)!;

        return new FinancialHistorySummary(
            StartValue: start.Value,
            EndValue: end.Value,
            StartFiscalYear: start.FiscalYearLabel,
            EndFiscalYear: end.FiscalYearLabel,
            Intervals: intervals,
            AbsoluteChange: absoluteChange,
            TotalPercentageChange: totalPercentageChange,
            Cagr: cagr,
            CagrUnavailableReason: cagrReason,
            PositiveGrowthYears: positive,
            NegativeGrowthYears: negative,
            FlatGrowthYears: flat,
            Highest: new ExtremeYear(highest.FiscalYearLabel, highest.Value),
            Lowest: new ExtremeYear(lowest.FiscalYearLabel, lowest.Value),
            LargestIncrease: largestIncrease,
            LargestDecline: largestDecline);
    }
}
