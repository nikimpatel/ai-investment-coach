using TenYearExplorer.Application.Metrics;

namespace TenYearExplorer.Tests;

public sealed class SupportedMetricsTests
{
    [Theory]
    [InlineData("revenue")]
    [InlineData("Revenue")]
    [InlineData("gross-profit")]
    [InlineData("operating-income")]
    [InlineData("net-income")]
    [InlineData("diluted-eps")]
    public void Allowlist_Parses_Supported_Codes(string code)
    {
        Assert.True(SupportedMetrics.TryGet(code, out var definition));
        Assert.False(string.IsNullOrWhiteSpace(definition.Label));
        Assert.NotEmpty(definition.OrderedConcepts);
        Assert.True(definition.YearOverYearApplicable);
        Assert.True(definition.CagrApplicable);
    }

    [Theory]
    [InlineData("ebitda")]
    [InlineData("gross-margin")]
    [InlineData("")]
    [InlineData(null)]
    public void Allowlist_Rejects_Unsupported_Codes(string? code)
    {
        Assert.False(SupportedMetrics.TryGet(code, out _));
    }

    [Fact]
    public void DilutedEps_Is_PerShare_Not_Monetary()
    {
        Assert.True(SupportedMetrics.TryGet(SupportedMetrics.DilutedEps, out var eps));
        Assert.Equal(MetricValueType.PerShare, eps.ValueType);
        Assert.Equal("USD/shares", eps.ReportingUnit);
        Assert.Equal("EarningsPerShareDiluted", eps.OrderedConcepts[0]);
        Assert.DoesNotContain("EarningsPerShareBasic", eps.OrderedConcepts);
    }

    [Fact]
    public void GrossProfit_Prefers_Reported_GrossProfit_Concept()
    {
        Assert.True(SupportedMetrics.TryGet(SupportedMetrics.GrossProfit, out var gp));
        Assert.Equal(["GrossProfit"], gp.OrderedConcepts);
        Assert.Equal(DerivedMarginKind.GrossMargin, gp.DerivedMargin);
    }
}
