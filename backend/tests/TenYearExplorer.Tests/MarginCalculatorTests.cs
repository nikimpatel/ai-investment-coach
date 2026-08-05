using TenYearExplorer.Application.Metrics;
using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Tests;

public sealed class MarginCalculatorTests
{
    [Fact]
    public void Computes_Margins_Aligned_By_Fiscal_Year()
    {
        var revenue = new[]
        {
            Point("FY2016", 2016, 100m),
            Point("FY2017", 2017, 200m),
        };
        var gross = new[]
        {
            Point("FY2016", 2016, 40m),
            Point("FY2017", 2017, 100m),
        };

        var result = MarginCalculator.Compute(revenue, gross, [], []);

        Assert.NotNull(result.GrossMargin);
        Assert.Equal(40m, result.GrossMargin!.Points[0].MarginPercent);
        Assert.Equal(50m, result.GrossMargin.Points[1].MarginPercent);
        Assert.Equal(10m, result.GrossMargin.Points[1].ChangePercentagePoints);
        Assert.Equal(10m, result.GrossMargin.ChangePercentagePoints);
    }

    [Fact]
    public void Missing_Revenue_Or_Numerator_Yields_Unavailable_With_Warning()
    {
        var revenue = new[] { Point("FY2016", 2016, 100m) };
        var gross = new[] { Point("FY2017", 2017, 40m) };

        var result = MarginCalculator.Compute(revenue, gross, [], []);

        Assert.Contains(result.Warnings, w => w.Code == "MARGIN_MISSING_NUMERATOR");
        Assert.Contains(result.Warnings, w => w.Code == "MARGIN_MISSING_REVENUE");
        Assert.False(result.GrossMargin!.Points.Single(p => p.FiscalYear == "FY2016").IsAvailable);
        Assert.False(result.GrossMargin.Points.Single(p => p.FiscalYear == "FY2017").IsAvailable);
    }

    [Fact]
    public void Zero_Revenue_Does_Not_Divide()
    {
        var revenue = new[] { Point("FY2016", 2016, 0m) };
        var gross = new[] { Point("FY2016", 2016, 10m) };

        var result = MarginCalculator.Compute(revenue, gross, [], []);
        Assert.Contains(result.Warnings, w => w.Code == "MARGIN_ZERO_REVENUE");
        Assert.Null(result.GrossMargin!.Points[0].MarginPercent);
    }

    private static NormalizedAnnualPoint Point(string fy, int year, decimal value) =>
        new(fy, year, new DateOnly(year - 1, 10, 1), new DateOnly(year, 9, 30), value, "USD",
            "Concept", new DateOnly(year, 11, 1), "10-K", "accn");
}
