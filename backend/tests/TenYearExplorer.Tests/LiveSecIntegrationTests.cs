using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using TenYearExplorer.Application.Configuration;
using TenYearExplorer.Application.Metrics;
using TenYearExplorer.Application.Services;
using TenYearExplorer.Domain.Enums;
using TenYearExplorer.Infrastructure.Caching;
using TenYearExplorer.Infrastructure.Sec;

namespace TenYearExplorer.Tests;

/// <summary>
/// Opt-in live SEC verification. Skipped unless SEC__ApplicationName and SEC__ContactEmail
/// are configured and SEC__UseFixtureData is not true.
/// A skipped live check must never be treated as a pass of live verification.
/// </summary>
public sealed class LiveSecIntegrationTests
{
    private static bool LiveEnabled()
    {
        var app = Environment.GetEnvironmentVariable("SEC__ApplicationName");
        var email = Environment.GetEnvironmentVariable("SEC__ContactEmail");
        var fixture = Environment.GetEnvironmentVariable("SEC__UseFixtureData");
        if (string.Equals(fixture, "true", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var options = new SecOptions
        {
            ApplicationName = app ?? "",
            ContactEmail = email ?? "",
        };
        return options.IsIdentificationConfigured;
    }

    [Fact]
    public async Task Live_CompanyFacts_Reachable_For_Apple()
    {
        if (!LiveEnabled())
        {
            // Documented skip: configure SEC__ApplicationName and SEC__ContactEmail to enable.
            return;
        }

        var options = Options.Create(new SecOptions
        {
            ApplicationName = Environment.GetEnvironmentVariable("SEC__ApplicationName")!,
            ContactEmail = Environment.GetEnvironmentVariable("SEC__ContactEmail")!,
            BaseUrl = "https://data.sec.gov",
            RequestTimeoutSeconds = 30,
            UseFixtureData = false,
        });

        using var http = new HttpClient
        {
            BaseAddress = new Uri("https://data.sec.gov/"),
            Timeout = TimeSpan.FromSeconds(30),
        };
        var client = new SecEdgarClient(http, options, NullLogger<SecEdgarClient>.Instance);
        var facts = await client.GetCompanyFactsAsync("0000320193", CancellationToken.None);
        Assert.Equal("Apple Inc.", facts.EntityName);
        Assert.True(facts.Facts.ContainsKey("us-gaap"));
        Assert.True(facts.Facts["us-gaap"].ContainsKey("GrossProfit"));
        Assert.True(facts.Facts["us-gaap"].ContainsKey("OperatingIncomeLoss"));
        Assert.True(facts.Facts["us-gaap"].ContainsKey("NetIncomeLoss"));
        Assert.True(facts.Facts["us-gaap"].ContainsKey("EarningsPerShareDiluted"));
    }

    [Theory]
    [InlineData(SupportedMetrics.Revenue)]
    [InlineData(SupportedMetrics.GrossProfit)]
    [InlineData(SupportedMetrics.OperatingIncome)]
    [InlineData(SupportedMetrics.NetIncome)]
    [InlineData(SupportedMetrics.DilutedEps)]
    public async Task Live_FinancialHistory_TenYears_For_Metric(string metric)
    {
        if (!LiveEnabled())
        {
            return;
        }

        var options = Options.Create(new SecOptions
        {
            ApplicationName = Environment.GetEnvironmentVariable("SEC__ApplicationName")!,
            ContactEmail = Environment.GetEnvironmentVariable("SEC__ContactEmail")!,
            BaseUrl = "https://data.sec.gov",
            RequestTimeoutSeconds = 30,
            CacheDurationMinutes = 60,
            UseFixtureData = false,
        });

        using var http = new HttpClient
        {
            BaseAddress = new Uri("https://data.sec.gov/"),
            Timeout = TimeSpan.FromSeconds(30),
        };
        var client = new SecEdgarClient(http, options, NullLogger<SecEdgarClient>.Instance);
        var provider = new SecFinancialFactsProvider(
            client,
            new MemoryCompanyFactsCache(),
            options,
            NullLogger<SecFinancialFactsProvider>.Instance);
        var sut = new FinancialHistoryService(
            provider,
            new XbrlKpiNormalizer(),
            new FinancialMetricsCalculator(),
            new MemoryFinancialDataCache(),
            options,
            NullLogger<FinancialHistoryService>.Instance);

        var result = await sut.GetHistoryAsync("AAPL", metric, "annual", 10, CancellationToken.None);
        Assert.True(
            result.Status is FinancialHistoryStatus.Success or FinancialHistoryStatus.PartiallySupported,
            result.Detail);

        if (metric == SupportedMetrics.DilutedEps)
        {
            // Live Company Facts only restate FY2018+ on the post-2020-split basis.
            Assert.True(result.Points.Count >= 8, $"Expected >= 8 comparable EPS years, got {result.Points.Count}");
            Assert.Equal("FY2025", result.Points[^1].FiscalYear);
            Assert.DoesNotContain(result.Points, p => p.FiscalYear is "FY2016" or "FY2017");
            Assert.DoesNotContain(result.Points, p => p.Value is 8.31m or 11.89m or 11.91m);
            Assert.Contains(result.Warnings, w => w.Code.StartsWith("SPLIT_", StringComparison.Ordinal));
        }
        else
        {
            Assert.Equal(10, result.Points.Count);
            Assert.Equal("FY2016", result.Points[0].FiscalYear);
            Assert.Equal("FY2025", result.Points[^1].FiscalYear);
        }

        Assert.DoesNotContain(result.Points, p => p.Form.Contains("10-Q", StringComparison.OrdinalIgnoreCase));
        Assert.NotNull(result.Margins);
    }
}
