using TenYearExplorer.Application.Services;
using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Tests;

public sealed class FinancialMetricsCalculatorTests
{
    private readonly FinancialMetricsCalculator _sut = new();

    [Fact]
    public void YearOverYear_FirstYearIsNull_AndComputesRelativeChanges()
    {
        var yoy = _sut.ComputeYearOverYear([100m, 110m, 99m]);
        Assert.Equal(3, yoy.Count);
        Assert.Null(yoy[0]);
        Assert.Equal(0.10m, yoy[1]);
        Assert.Equal(-0.1m, yoy[2]);
    }

    [Fact]
    public void YearOverYear_PriorZero_YieldsNullRelative()
    {
        var yoy = _sut.ComputeYearOverYear([0m, 50m]);
        Assert.Null(yoy[1]);
    }

    [Fact]
    public void Cagr_TenValues_UsesNineIntervals()
    {
        var start = 215_639_000_000m;
        var end = 416_161_000_000m;
        var (cagr, reason) = _sut.ComputeCagr(start, end, 9);
        Assert.Null(reason);
        Assert.NotNull(cagr);
        var expected = (decimal)(Math.Pow((double)(end / start), 1.0 / 9) - 1.0);
        Assert.Equal(expected, cagr.Value);
    }

    [Fact]
    public void Cagr_NonPositive_ReturnsNullWithReason()
    {
        var (cagr, reason) = _sut.ComputeCagr(-1m, 10m, 9);
        Assert.Null(cagr);
        Assert.Contains("positive", reason, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Summary_CountsGrowthYears_AndExtremes()
    {
        var points = new List<NormalizedAnnualPoint>
        {
            Point("FY1", 2016, 100),
            Point("FY2", 2017, 120),
            Point("FY3", 2018, 90),
            Point("FY4", 2019, 90),
        };

        var summary = _sut.BuildSummary(points);
        Assert.Equal(3, summary.Intervals);
        Assert.Equal(1, summary.PositiveGrowthYears);
        Assert.Equal(1, summary.NegativeGrowthYears);
        Assert.Equal(1, summary.FlatGrowthYears);
        Assert.Equal("FY2", summary.Highest!.FiscalYear);
        Assert.Equal("FY3", summary.Lowest!.FiscalYear);
        Assert.Equal("FY2", summary.LargestIncrease!.FiscalYear);
        Assert.Equal("FY3", summary.LargestDecline!.FiscalYear);
    }

    private static NormalizedAnnualPoint Point(string fy, int year, decimal value) =>
        new(fy, year, new DateOnly(year - 1, 10, 1), new DateOnly(year, 9, 30), value, "USD",
            "RevenueFromContractWithCustomerExcludingAssessedTax", new DateOnly(year, 11, 1), "10-K", "accn");
}
