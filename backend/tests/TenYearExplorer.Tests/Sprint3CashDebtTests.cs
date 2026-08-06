using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TenYearExplorer.Application.Configuration;
using TenYearExplorer.Application.Metrics;
using TenYearExplorer.Application.Services;
using TenYearExplorer.Domain.Enums;
using TenYearExplorer.Domain.Models;
using TenYearExplorer.Infrastructure.Caching;
using TenYearExplorer.Infrastructure.Sec;

namespace TenYearExplorer.Tests;

public sealed class Sprint3CashDebtTests
{
    // Own-period preferred (Sprint 1/2 rule). FY2016 uses ContinuingOperations fallback
    // because primary OCF tag has no own-period fact for that year in Company Facts.
    private static readonly decimal[] ExpectedOperatingCashFlow =
    [
        65_824_000_000m,
        63_598_000_000m,
        77_434_000_000m,
        69_391_000_000m,
        80_674_000_000m,
        104_038_000_000m,
        122_151_000_000m,
        110_543_000_000m,
        118_254_000_000m,
        111_482_000_000m,
    ];

    private static readonly decimal[] ExpectedCapex =
    [
        12_734_000_000m,
        12_451_000_000m,
        13_313_000_000m,
        10_495_000_000m,
        7_309_000_000m,
        11_085_000_000m,
        10_708_000_000m,
        10_959_000_000m,
        9_447_000_000m,
        12_715_000_000m,
    ];

    private static readonly decimal[] ExpectedCash =
    [
        20_484_000_000m,
        20_289_000_000m,
        25_913_000_000m,
        48_844_000_000m,
        38_016_000_000m,
        34_940_000_000m,
        23_646_000_000m,
        29_965_000_000m,
        29_943_000_000m,
        35_934_000_000m,
    ];

    private static readonly decimal[] ExpectedDebt =
    [
        87_032_000_000m,
        115_680_000_000m,
        114_483_000_000m,
        108_047_000_000m,
        112_436_000_000m,
        124_719_000_000m,
        120_069_000_000m,
        111_088_000_000m,
        106_629_000_000m,
        98_657_000_000m,
    ];

    [Theory]
    [InlineData(SupportedMetrics.OperatingCashFlow)]
    [InlineData(SupportedMetrics.CapitalExpenditure)]
    [InlineData(SupportedMetrics.FreeCashFlow)]
    [InlineData(SupportedMetrics.CashAndEquivalents)]
    [InlineData(SupportedMetrics.TotalDebt)]
    public async Task Fixture_Returns_Ten_Annual_Points_For_Sprint3_Metrics(string metric)
    {
        var result = await CreateFixtureService().GetHistoryAsync(
            "AAPL", metric, "annual", 10, CancellationToken.None);

        Assert.True(
            result.Status is FinancialHistoryStatus.Success or FinancialHistoryStatus.PartiallySupported,
            result.Detail);
        Assert.Equal(10, result.Points.Count);
        Assert.Equal("FY2016", result.Points[0].FiscalYear);
        Assert.Equal("FY2025", result.Points[^1].FiscalYear);
        Assert.DoesNotContain(result.Points, p => p.Form.Contains("10-Q", StringComparison.OrdinalIgnoreCase));
        Assert.NotNull(result.Relationships);
    }

    [Fact]
    public async Task Fixture_Uses_Positive_Capex_And_Exact_Fcf_Formula_With_Trace()
    {
        var service = CreateFixtureService();
        var capex = await service.GetHistoryAsync(
            "AAPL", SupportedMetrics.CapitalExpenditure, "annual", 10, CancellationToken.None);
        var fcf = await service.GetHistoryAsync(
            "AAPL", SupportedMetrics.FreeCashFlow, "annual", 10, CancellationToken.None);

        Assert.Equal(ExpectedCapex, capex.Points.Select(p => p.Value));
        Assert.All(capex.Points, p => Assert.True(p.Value >= 0));
        Assert.Contains(capex.Warnings, w => w.Code == "CAPEX_POSITIVE_SPEND_CONVENTION");

        var expectedFcf = ExpectedOperatingCashFlow.Zip(ExpectedCapex, (ocf, spend) => ocf - spend);
        Assert.Equal(expectedFcf, fcf.Points.Select(p => p.Value));
        Assert.Equal(98_767_000_000m, fcf.Points[^1].Value);
        Assert.True(fcf.IsDerived);
        Assert.True(fcf.IsNonGaap);
        Assert.Equal(SupportedMetrics.FreeCashFlowDefinition.Formula, fcf.Formula);
        Assert.All(fcf.Points, point =>
        {
            Assert.True(point.IsDerived);
            Assert.Equal(2, point.Inputs!.Count);
            Assert.Contains(point.Inputs, i => i.Metric == SupportedMetrics.OperatingCashFlow);
            Assert.Contains(point.Inputs, i => i.Metric == SupportedMetrics.CapitalExpenditure);
        });
    }

    [Fact]
    public async Task Fixture_TotalDebt_Uses_Three_NonOverlapping_Components()
    {
        var result = await CreateFixtureService().GetHistoryAsync(
            "AAPL", SupportedMetrics.TotalDebt, "annual", 10, CancellationToken.None);

        Assert.Equal(ExpectedDebt, result.Points.Select(p => p.Value));
        Assert.Equal(98_657_000_000m, result.Points[^1].Value);
        Assert.Equal(SupportedMetrics.TotalDebtDefinition.Formula, result.Formula);
        Assert.All(result.Points, point =>
        {
            Assert.Equal(3, point.Inputs!.Count);
            Assert.Contains(point.Inputs, i => i.Concept == "CommercialPaper");
            Assert.Contains(point.Inputs, i => i.Concept == "LongTermDebtCurrent");
            Assert.Contains(point.Inputs, i => i.Concept == "LongTermDebtNoncurrent");
            Assert.DoesNotContain(point.Inputs, i => i.Concept.Contains("Liabilities", StringComparison.Ordinal));
        });
    }

    [Fact]
    public async Task Fixture_Relationships_Are_Aligned_And_NetDebt_Is_Clear()
    {
        var result = await CreateFixtureService().GetHistoryAsync(
            "AAPL", SupportedMetrics.OperatingCashFlow, "annual", 10, CancellationToken.None);
        var relationships = result.Relationships!;

        Assert.Equal(10, relationships.FreeCashFlow!.Points.Count);
        Assert.Equal(10, relationships.CashConversion!.Points.Count);
        Assert.Equal(10, relationships.FreeCashFlowMargin!.Points.Count);
        Assert.Equal(10, relationships.NetDebt!.Points.Count);
        Assert.Equal(
            62_723_000_000m,
            relationships.NetDebt.Points.Single(p => p.FiscalYear == "FY2025").Value);
        Assert.All(relationships.NetDebt.Points, p => Assert.False(p.IsNetCash));
        Assert.All(
            relationships.CashConversion.Points,
            p => Assert.True(p.IsAvailable && p.Value is > 0));
    }

    [Fact]
    public void CashConversion_Is_Unavailable_For_Zero_Or_Negative_NetIncome()
    {
        var ocf = new[] { Point(2024, 10m, "OCF"), Point(2025, 12m, "OCF") };
        var capex = new[] { Point(2024, 2m, "CapEx"), Point(2025, 3m, "CapEx") };
        var netIncome = new[] { Point(2024, 0m, "NI"), Point(2025, -1m, "NI") };
        var revenue = new[] { Point(2024, 100m, "Revenue"), Point(2025, 110m, "Revenue") };
        var cash = new[] { Point(2024, 20m, "Cash"), Point(2025, 30m, "Cash") };
        var commercial = new[] { Point(2024, 1m, "CommercialPaper"), Point(2025, 1m, "CommercialPaper") };
        var current = new[] { Point(2024, 2m, "LongTermDebtCurrent"), Point(2025, 2m, "LongTermDebtCurrent") };
        var noncurrent = new[] { Point(2024, 3m, "LongTermDebtNoncurrent"), Point(2025, 3m, "LongTermDebtNoncurrent") };

        var fcf = CashFlowDebtCalculator.BuildFreeCashFlow(ocf, capex);
        var debt = CashFlowDebtCalculator.BuildTotalDebt(commercial, current, noncurrent);
        var result = CashFlowDebtCalculator.BuildRelationships(
            fcf, ocf, netIncome, revenue, cash, debt);

        Assert.All(result.CashConversion!.Points, p =>
        {
            Assert.False(p.IsAvailable);
            Assert.Null(p.Value);
            Assert.Contains("zero or negative", p.UnavailableReason);
        });
        Assert.All(result.NetDebt!.Points, p =>
        {
            Assert.True(p.IsNetCash);
            Assert.True(p.Value < 0);
        });
    }

    [Fact]
    public void Instant_Normalizer_Rejects_10Q_QuarterEnd()
    {
        var facts = new[]
        {
            new RawSecFact(
                "CashAndCashEquivalentsAtCarryingValue", 30m, "USD", null,
                new DateOnly(2024, 9, 28), new DateOnly(2024, 11, 1),
                "10-K", "annual", 2024, "FY", "CY2024Q3I"),
            new RawSecFact(
                "CashAndCashEquivalentsAtCarryingValue", 99m, "USD", null,
                new DateOnly(2025, 6, 28), new DateOnly(2025, 8, 1),
                "10-Q", "quarter", 2025, "Q3", "CY2025Q2I"),
        };

        var result = new XbrlKpiNormalizer().NormalizeAnnual(
            facts,
            SupportedMetrics.CashAndEquivalentsDefinition,
            1,
            new DateOnly(2026, 8, 6));

        Assert.Single(result.Points);
        Assert.Equal(30m, result.Points[0].Value);
        Assert.Equal(new DateOnly(2024, 9, 28), result.Points[0].PeriodEnd);
    }

    [Fact]
    public void Capex_Normalizer_Converts_Negative_Outflow_To_Positive_Spent()
    {
        var fact = new RawSecFact(
            "PaymentsToAcquirePropertyPlantAndEquipment",
            -12m,
            "USD",
            new DateOnly(2023, 10, 1),
            new DateOnly(2024, 9, 28),
            new DateOnly(2024, 11, 1),
            "10-K",
            "capex",
            2024,
            "FY",
            "CY2024");

        var result = new XbrlKpiNormalizer().NormalizeAnnual(
            [fact],
            SupportedMetrics.CapitalExpenditureDefinition,
            1,
            new DateOnly(2026, 8, 6));

        Assert.Equal(12m, result.Points.Single().Value);
        Assert.Contains(result.Warnings, w => w.Code == "CASH_OUTFLOW_SIGN_NORMALIZED");
    }

    private static NormalizedAnnualPoint Point(int year, decimal value, string concept) =>
        new(
            $"FY{year}",
            year,
            new DateOnly(year - 1, 9, 30),
            new DateOnly(year, 9, 28),
            value,
            "USD",
            concept,
            new DateOnly(year, 10, 31),
            "10-K",
            $"accn-{year}");

    private static FinancialHistoryService CreateFixtureService()
    {
        var options = Options.Create(new SecOptions
        {
            UseFixtureData = true,
            FixtureCompanyFactsPath = "fixtures/apple-company-facts-reduced.json",
            FixtureSubmissionsPath = "fixtures/apple-submissions-reduced.json",
            CacheDurationMinutes = 60,
            RequestTimeoutSeconds = 30,
        });
        var client = new FixtureSecEdgarClient(
            options, NullLogger<FixtureSecEdgarClient>.Instance);
        var provider = new SecFinancialFactsProvider(
            client,
            new MemoryCompanyFactsCache(),
            options,
            NullLogger<SecFinancialFactsProvider>.Instance);
        return new FinancialHistoryService(
            provider,
            new XbrlKpiNormalizer(),
            new FinancialMetricsCalculator(),
            new MemoryFinancialDataCache(),
            options,
            NullLogger<FinancialHistoryService>.Instance);
    }
}
