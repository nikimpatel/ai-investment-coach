using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TenYearExplorer.Application.Configuration;
using TenYearExplorer.Application.Services;
using TenYearExplorer.Domain.Enums;
using TenYearExplorer.Infrastructure.Caching;
using TenYearExplorer.Infrastructure.Sec;

namespace TenYearExplorer.Tests;

public sealed class FixtureGoldenPathTests
{
    public static readonly (int Fy, decimal Value, string End, string Accn)[] Expected =
    [
        (2016, 215_639_000_000m, "2016-09-24", "0001628280-16-020309"),
        (2017, 229_234_000_000m, "2017-09-30", "0000320193-17-000070"),
        (2018, 265_595_000_000m, "2018-09-29", "0000320193-18-000145"),
        (2019, 260_174_000_000m, "2019-09-28", "0000320193-19-000119"),
        (2020, 274_515_000_000m, "2020-09-26", "0000320193-20-000096"),
        (2021, 365_817_000_000m, "2021-09-25", "0000320193-21-000105"),
        (2022, 394_328_000_000m, "2022-09-24", "0000320193-22-000108"),
        (2023, 383_285_000_000m, "2023-09-30", "0000320193-23-000106"),
        (2024, 391_035_000_000m, "2024-09-28", "0000320193-24-000123"),
        (2025, 416_161_000_000m, "2025-09-27", "0000320193-25-000079"),
    ];

    [Fact]
    public async Task Fixture_Produces_Exact_TenYear_Apple_Revenue_Series()
    {
        var options = Options.Create(new SecOptions
        {
            UseFixtureData = true,
            FixtureCompanyFactsPath = "fixtures/apple-company-facts-reduced.json",
            FixtureSubmissionsPath = "fixtures/apple-submissions-reduced.json",
            CacheDurationMinutes = 60,
            RequestTimeoutSeconds = 30,
        });

        var client = new FixtureSecEdgarClient(options, NullLogger<FixtureSecEdgarClient>.Instance);
        var provider = new SecFinancialFactsProvider(client, NullLogger<SecFinancialFactsProvider>.Instance);
        var sut = new FinancialHistoryService(
            provider,
            new XbrlKpiNormalizer(),
            new FinancialMetricsCalculator(),
            new MemoryFinancialDataCache(),
            options,
            NullLogger<FinancialHistoryService>.Instance);

        var result = await sut.GetHistoryAsync("AAPL", "revenue", "annual", 10, CancellationToken.None);

        Assert.Equal(FinancialHistoryStatus.Success, result.Status);
        Assert.Equal(10, result.Points.Count);
        Assert.Equal("Apple Inc.", result.Company.Name);
        Assert.Equal("0000320193", result.Company.Cik);

        for (var i = 0; i < Expected.Length; i++)
        {
            var point = result.Points[i];
            var expected = Expected[i];
            Assert.Equal($"FY{expected.Fy}", point.FiscalYear);
            Assert.Equal(expected.Value, point.Value);
            Assert.Equal(expected.End, point.PeriodEnd.ToString("yyyy-MM-dd"));
            Assert.Equal(expected.Accn, point.Accession);
            Assert.Equal("10-K", point.Form);
            Assert.Equal("USD", point.Unit);
            Assert.Equal("RevenueFromContractWithCustomerExcludingAssessedTax", point.Concept);
            Assert.DoesNotContain("10-Q", point.Form, StringComparison.OrdinalIgnoreCase);
        }

        Assert.Null(result.Points[0].YearOverYearChange);
        Assert.NotNull(result.Summary);
        Assert.Equal(9, result.Summary!.Intervals);
        Assert.Equal(Expected[0].Value, result.Summary.StartValue);
        Assert.Equal(Expected[^1].Value, result.Summary.EndValue);

        var expectedCagr = (decimal)(Math.Pow((double)(Expected[^1].Value / Expected[0].Value), 1.0 / 9) - 1.0);
        Assert.Equal(expectedCagr, result.Summary.Cagr);
    }
}
