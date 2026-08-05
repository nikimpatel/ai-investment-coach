using TenYearExplorer.Application.Metrics;
using TenYearExplorer.Application.Services;
using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Tests;

public sealed class XbrlMultiMetricNormalizerTests
{
    private readonly XbrlKpiNormalizer _sut = new();
    private static readonly DateOnly AsOf = new(2026, 8, 4);

    [Fact]
    public void DilutedEps_Rejects_Usd_Monetary_And_Basic_Eps()
    {
        var facts = new List<RawSecFact>
        {
            new("EarningsPerShareDiluted", 2.5m, "USD",
                new DateOnly(2015, 9, 27), new DateOnly(2016, 9, 24), new DateOnly(2016, 10, 26),
                "10-K", "bad-unit", 2016, "FY", null),
            new("EarningsPerShareBasic", 2.6m, "USD/shares",
                new DateOnly(2015, 9, 27), new DateOnly(2016, 9, 24), new DateOnly(2016, 10, 26),
                "10-K", "basic", 2016, "FY", null),
            new("EarningsPerShareDiluted", 2.4m, "USD/shares",
                new DateOnly(2015, 9, 27), new DateOnly(2016, 9, 24), new DateOnly(2016, 10, 26),
                "10-K", "ok", 2016, "FY", null),
        };

        var result = _sut.NormalizeAnnual(facts, SupportedMetrics.DilutedEpsDefinition, 1, AsOf);
        Assert.Single(result.Points);
        Assert.Equal(2.4m, result.Points[0].Value);
        Assert.Equal("USD/shares", result.Points[0].Unit);
        Assert.Equal("EarningsPerShareDiluted", result.Points[0].Concept);
        Assert.Contains(result.Warnings, w => w.Code == "INVALID_UNIT");
    }

    [Fact]
    public void GrossProfit_Rejects_Quarterly_And_10Q()
    {
        var facts = new List<RawSecFact>
        {
            new("GrossProfit", 80m, "USD",
                new DateOnly(2015, 9, 27), new DateOnly(2016, 9, 24), new DateOnly(2016, 10, 26),
                "10-K", "annual", 2016, "FY", null),
            new("GrossProfit", 20m, "USD",
                new DateOnly(2016, 6, 26), new DateOnly(2016, 9, 24), new DateOnly(2016, 10, 26),
                "10-Q", "q", 2016, "Q4", null),
        };

        var result = _sut.NormalizeAnnual(facts, SupportedMetrics.GrossProfitDefinition, 1, AsOf);
        Assert.Single(result.Points);
        Assert.Equal(80m, result.Points[0].Value);
    }

    [Fact]
    public void OperatingIncome_Marks_Comparative_Only()
    {
        var facts = new List<RawSecFact>
        {
            new("OperatingIncomeLoss", 50m, "USD",
                new DateOnly(2015, 9, 27), new DateOnly(2016, 9, 24), new DateOnly(2025, 10, 31),
                "10-K", "comparative", 2025, "FY", "CY2016"),
        };

        var result = _sut.NormalizeAnnual(facts, SupportedMetrics.OperatingIncomeDefinition, 1, AsOf);
        Assert.Single(result.Points);
        Assert.True(result.Points[0].IsComparative);
        Assert.Contains(result.Warnings, w => w.Code == "COMPARATIVE_ONLY");
    }

    [Fact]
    public void DilutedEps_Prefers_SplitAdjusted_Comparative_Over_PreSplit_OwnPeriod()
    {
        var facts = new List<RawSecFact>
        {
            // Pre-split own-period FY2019
            new("EarningsPerShareDiluted", 11.89m, "USD/shares",
                new DateOnly(2018, 9, 30), new DateOnly(2019, 9, 28), new DateOnly(2019, 10, 31),
                "10-K", "own-2019", 2019, "FY", null),
            // Post-split comparative restatement in 2020 10-K (~11.89 / 4)
            new("EarningsPerShareDiluted", 2.97m, "USD/shares",
                new DateOnly(2018, 9, 30), new DateOnly(2019, 9, 28), new DateOnly(2020, 10, 30),
                "10-K", "comp-2020", 2020, "FY", null),
            // Post-split own-period FY2020
            new("EarningsPerShareDiluted", 3.28m, "USD/shares",
                new DateOnly(2019, 9, 29), new DateOnly(2020, 9, 26), new DateOnly(2020, 10, 30),
                "10-K", "own-2020", 2020, "FY", null),
        };

        var result = _sut.NormalizeAnnual(facts, SupportedMetrics.DilutedEpsDefinition, 2, AsOf);

        Assert.Equal(2, result.Points.Count);
        Assert.Equal(2.97m, result.Points[0].Value);
        Assert.Equal("FY2019", result.Points[0].FiscalYearLabel);
        Assert.True(result.Points[0].IsComparative);
        Assert.Equal(3.28m, result.Points[1].Value);
        Assert.Contains(result.Warnings, w => w.Code == "SPLIT_ADJUSTED_COMPARATIVE_PREFERRED");
        Assert.DoesNotContain(result.Points, p => p.Value == 11.89m);
    }

    [Fact]
    public void DilutedEps_Excludes_PreSplit_Years_Without_Restated_Comparative()
    {
        var facts = new List<RawSecFact>
        {
            // FY2017 pre-split only (no post-split restatement in Company Facts)
            new("EarningsPerShareDiluted", 9.21m, "USD/shares",
                new DateOnly(2016, 9, 25), new DateOnly(2017, 9, 30), new DateOnly(2017, 11, 3),
                "10-K", "own-2017", 2017, "FY", null),
            // FY2018 own pre-split + later split-adjusted comparative
            new("EarningsPerShareDiluted", 11.91m, "USD/shares",
                new DateOnly(2017, 10, 1), new DateOnly(2018, 9, 29), new DateOnly(2018, 11, 5),
                "10-K", "own-2018", 2018, "FY", null),
            new("EarningsPerShareDiluted", 2.98m, "USD/shares",
                new DateOnly(2017, 10, 1), new DateOnly(2018, 9, 29), new DateOnly(2020, 10, 30),
                "10-K", "comp-2018", 2020, "FY", "CY2018"),
            new("EarningsPerShareDiluted", 3.28m, "USD/shares",
                new DateOnly(2019, 9, 29), new DateOnly(2020, 9, 26), new DateOnly(2020, 10, 30),
                "10-K", "own-2020", 2020, "FY", null),
        };

        var result = _sut.NormalizeAnnual(facts, SupportedMetrics.DilutedEpsDefinition, 10, AsOf);

        Assert.Equal(2, result.Points.Count);
        Assert.Equal("FY2018", result.Points[0].FiscalYearLabel);
        Assert.Equal(2.98m, result.Points[0].Value);
        Assert.Equal("FY2020", result.Points[1].FiscalYearLabel);
        Assert.Contains(result.Warnings, w => w.Code == "SPLIT_INCOMPARABLE_YEAR_EXCLUDED" && w.FiscalYear == "FY2017");
        Assert.Contains(result.Warnings, w => w.Code == "SPLIT_BASIS_NORMALIZED");
        Assert.DoesNotContain(result.Points, p => p.Value == 9.21m || p.Value == 11.91m);
    }

    [Fact]
    public void DilutedEps_Cuts_At_Last_Split_Discontinuity_Across_Multiple_Historical_Splits()
    {
        // Older 7-for-1 restatement evidence must not keep later pre-4-for-1 years in the series.
        var facts = new List<RawSecFact>
        {
            new("EarningsPerShareDiluted", 44.15m, "USD/shares",
                new DateOnly(2011, 9, 25), new DateOnly(2012, 9, 29), new DateOnly(2012, 10, 31),
                "10-K", "own-2012", 2012, "FY", null),
            new("EarningsPerShareDiluted", 6.31m, "USD/shares",
                new DateOnly(2011, 9, 25), new DateOnly(2012, 9, 29), new DateOnly(2014, 10, 27),
                "10-K", "comp-2012-7for1", 2014, "FY", null),
            new("EarningsPerShareDiluted", 9.21m, "USD/shares",
                new DateOnly(2016, 9, 25), new DateOnly(2017, 9, 30), new DateOnly(2017, 11, 3),
                "10-K", "own-2017", 2017, "FY", null),
            new("EarningsPerShareDiluted", 11.91m, "USD/shares",
                new DateOnly(2017, 10, 1), new DateOnly(2018, 9, 29), new DateOnly(2018, 11, 5),
                "10-K", "own-2018", 2018, "FY", null),
            new("EarningsPerShareDiluted", 2.98m, "USD/shares",
                new DateOnly(2017, 10, 1), new DateOnly(2018, 9, 29), new DateOnly(2020, 10, 30),
                "10-K", "comp-2018-4for1", 2020, "FY", "CY2018"),
            new("EarningsPerShareDiluted", 3.28m, "USD/shares",
                new DateOnly(2019, 9, 29), new DateOnly(2020, 9, 26), new DateOnly(2020, 10, 30),
                "10-K", "own-2020", 2020, "FY", null),
        };

        var result = _sut.NormalizeAnnual(facts, SupportedMetrics.DilutedEpsDefinition, 10, AsOf);

        Assert.Equal(2, result.Points.Count);
        Assert.Equal("FY2018", result.Points[0].FiscalYearLabel);
        Assert.Equal(2.98m, result.Points[0].Value);
        Assert.Equal(3.28m, result.Points[1].Value);
        Assert.Contains(result.Warnings, w => w.Code == "SPLIT_DISCONTINUITY_DETECTED");
        Assert.DoesNotContain(result.Points, p => p.FiscalYearLabel is "FY2012" or "FY2017");
        Assert.DoesNotContain(result.Points, p => p.Value is 9.21m or 11.91m or 44.15m);
    }

    [Fact]
    public void Revenue_Still_Prefers_OwnPeriod_When_Comparative_Differs()
    {
        var facts = new List<RawSecFact>
        {
            new("RevenueFromContractWithCustomerExcludingAssessedTax", 215_639_000_000m, "USD",
                new DateOnly(2015, 9, 27), new DateOnly(2016, 9, 24), new DateOnly(2016, 10, 26),
                "10-K", "own", 2016, "FY", null),
            new("RevenueFromContractWithCustomerExcludingAssessedTax", 999_999_999_999m, "USD",
                new DateOnly(2015, 9, 27), new DateOnly(2016, 9, 24), new DateOnly(2025, 10, 31),
                "10-K", "comparative", 2025, "FY", "CY2016"),
        };

        var result = _sut.NormalizeAnnual(facts, SupportedMetrics.RevenueDefinition, 1, AsOf);
        Assert.Equal(215_639_000_000m, result.Points[0].Value);
        Assert.Contains(result.Warnings, w => w.Code == "OWN_PERIOD_PREFERRED");
        Assert.DoesNotContain(result.Warnings, w => w.Code.StartsWith("SPLIT_", StringComparison.Ordinal));
    }
}
