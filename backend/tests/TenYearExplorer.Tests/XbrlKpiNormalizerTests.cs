using TenYearExplorer.Application.Services;
using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Tests;

public sealed class XbrlKpiNormalizerTests
{
    private readonly XbrlKpiNormalizer _sut = new();
    private static readonly DateOnly AsOf = new(2026, 8, 4);

    [Fact]
    public void Rejects_QuarterlyDuration_And_10Q()
    {
        var facts = new List<RawSecFact>
        {
            Annual(2016, 100),
            new("RevenueFromContractWithCustomerExcludingAssessedTax", 50, "USD",
                new DateOnly(2016, 6, 26), new DateOnly(2016, 9, 24), new DateOnly(2016, 10, 26),
                "10-K", "a", 2016, "Q4", null),
            new("RevenueFromContractWithCustomerExcludingAssessedTax", 40, "USD",
                new DateOnly(2016, 12, 26), new DateOnly(2017, 3, 25), new DateOnly(2017, 5, 2),
                "10-Q", "b", 2017, "Q2", null),
        };

        var result = _sut.NormalizeAnnualRevenue(facts, 10, AsOf);
        Assert.Single(result.Points);
        Assert.Equal(100m, result.Points[0].Value);
    }

    [Fact]
    public void Prefers_OwnPeriod_Over_LaterComparative()
    {
        var facts = new List<RawSecFact>
        {
            new("RevenueFromContractWithCustomerExcludingAssessedTax", 215_639_000_000m, "USD",
                new DateOnly(2015, 9, 27), new DateOnly(2016, 9, 24), new DateOnly(2016, 10, 26),
                "10-K", "own", 2016, "FY", "CY2016"),
            new("RevenueFromContractWithCustomerExcludingAssessedTax", 999_999_999_999m, "USD",
                new DateOnly(2015, 9, 27), new DateOnly(2016, 9, 24), new DateOnly(2025, 10, 31),
                "10-K", "comparative", 2025, "FY", "CY2016"),
        };

        var result = _sut.NormalizeAnnualRevenue(facts, 1, AsOf);
        Assert.Single(result.Points);
        Assert.Equal(215_639_000_000m, result.Points[0].Value);
        Assert.Contains(result.Warnings, w => w.Code == "OWN_PERIOD_PREFERRED");
    }

    [Fact]
    public void DoesNotTrust_FyAlone_WithoutAnnualDuration()
    {
        var facts = new List<RawSecFact>
        {
            new("RevenueFromContractWithCustomerExcludingAssessedTax", 1m, "USD",
                null, new DateOnly(2020, 9, 26), new DateOnly(2020, 10, 30),
                "10-K", "x", 2020, "FY", null),
        };

        var result = _sut.NormalizeAnnualRevenue(facts, 10, AsOf);
        Assert.Empty(result.Points);
        Assert.Contains(result.Warnings, w => w.Code == "MISSING_PERIOD_START");
    }

    [Fact]
    public void Selects_LatestTen_Chronological()
    {
        var facts = Enumerable.Range(2010, 16)
            .Select(y => Annual(y, y * 1_000_000m))
            .ToList();

        var result = _sut.NormalizeAnnualRevenue(facts, 10, AsOf);
        Assert.Equal(10, result.Points.Count);
        Assert.Equal("FY2016", result.Points[0].FiscalYearLabel);
        Assert.Equal("FY2025", result.Points[^1].FiscalYearLabel);
        for (var i = 1; i < result.Points.Count; i++)
        {
            Assert.True(result.Points[i].PeriodEnd > result.Points[i - 1].PeriodEnd);
        }
    }

    [Fact]
    public void Prefers_HigherPriority_Concept()
    {
        var facts = new List<RawSecFact>
        {
            new("Revenues", 1m, "USD",
                new DateOnly(2015, 9, 27), new DateOnly(2016, 9, 24), new DateOnly(2016, 10, 26),
                "10-K", "rev", 2016, "FY", null),
            new("RevenueFromContractWithCustomerExcludingAssessedTax", 215_639_000_000m, "USD",
                new DateOnly(2015, 9, 27), new DateOnly(2016, 9, 24), new DateOnly(2016, 10, 26),
                "10-K", "asc", 2016, "FY", null),
        };

        var result = _sut.NormalizeAnnualRevenue(facts, 1, AsOf);
        Assert.Equal("RevenueFromContractWithCustomerExcludingAssessedTax", result.Points[0].Concept);
        Assert.Equal(215_639_000_000m, result.Points[0].Value);
    }

    [Fact]
    public void Excludes_Ambiguous_ConflictingValues()
    {
        var facts = new List<RawSecFact>
        {
            new("RevenueFromContractWithCustomerExcludingAssessedTax", 100m, "USD",
                new DateOnly(2015, 9, 27), new DateOnly(2016, 9, 24), new DateOnly(2016, 10, 26),
                "10-K", "a1", 2016, "FY", null),
            new("RevenueFromContractWithCustomerExcludingAssessedTax", 200m, "USD",
                new DateOnly(2015, 9, 27), new DateOnly(2016, 9, 24), new DateOnly(2016, 10, 27),
                "10-K", "a2", 2016, "FY", null),
        };

        var result = _sut.NormalizeAnnualRevenue(facts, 1, AsOf);
        Assert.Empty(result.Points);
        Assert.Contains(result.Warnings, w => w.Code == "VALUE_CONFLICT");
    }

    private static RawSecFact Annual(int fy, decimal value) =>
        new("RevenueFromContractWithCustomerExcludingAssessedTax", value, "USD",
            new DateOnly(fy - 1, 9, 27), new DateOnly(fy, 9, 26), new DateOnly(fy, 10, 30),
            "10-K", $"accn-{fy}", fy, "FY", $"CY{fy}");
}
