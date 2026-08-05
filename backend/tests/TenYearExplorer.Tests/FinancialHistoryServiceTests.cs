using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using TenYearExplorer.Application.Abstractions;
using TenYearExplorer.Application.Configuration;
using TenYearExplorer.Application.Metrics;
using TenYearExplorer.Application.Services;
using TenYearExplorer.Domain.Enums;
using TenYearExplorer.Domain.Models;
using TenYearExplorer.Infrastructure.Caching;

namespace TenYearExplorer.Tests;

public sealed class FinancialHistoryServiceTests
{
    [Fact]
    public async Task UnsupportedMetric_ReturnsStructuredStatus()
    {
        var sut = CreateSut(useFixture: true, facts: []);
        var result = await sut.GetHistoryAsync("AAPL", "ebitda", "annual", 10, CancellationToken.None);
        Assert.Equal(FinancialHistoryStatus.UnsupportedMetric, result.Status);
    }

    [Fact]
    public async Task InvalidConfiguration_WhenLiveAndMissingIdentity()
    {
        var sut = CreateSut(useFixture: false, facts: [], configureIdentity: false);
        var result = await sut.GetHistoryAsync("AAPL", "revenue", "annual", 10, CancellationToken.None);
        Assert.Equal(FinancialHistoryStatus.InvalidConfiguration, result.Status);
    }

    [Fact]
    public async Task CacheHit_OnSecondCall()
    {
        var facts = Enumerable.Range(2016, 10).Select(y => Annual(y, y * 1_000_000m)).ToList();
        var provider = new Mock<IFinancialFactsProvider>();
        provider.Setup(p => p.GetFactsAsync(
                It.IsAny<string>(),
                It.IsAny<MetricDefinition>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(facts);

        var cache = new MemoryFinancialDataCache();
        var sut = CreateSut(useFixture: true, factsProvider: provider.Object, cache: cache);

        var first = await sut.GetHistoryAsync("AAPL", "revenue", "annual", 10, CancellationToken.None);
        var second = await sut.GetHistoryAsync("AAPL", "revenue", "annual", 10, CancellationToken.None);

        Assert.Equal(FinancialHistoryStatus.Success, first.Status);
        Assert.Equal(CacheStatus.Miss, first.CacheStatus);
        Assert.Equal(CacheStatus.Hit, second.CacheStatus);
        // Metric fetch + four margin supporting fetches on first call only.
        provider.Verify(
            p => p.GetFactsAsync(It.IsAny<string>(), It.IsAny<MetricDefinition>(), It.IsAny<CancellationToken>()),
            Times.Exactly(5));
    }

    [Fact]
    public async Task Cache_Separates_Metrics()
    {
        var facts = Enumerable.Range(2016, 10).Select(y => Annual(y, y * 1_000_000m)).ToList();
        var provider = new Mock<IFinancialFactsProvider>();
        provider.Setup(p => p.GetFactsAsync(
                It.IsAny<string>(),
                It.IsAny<MetricDefinition>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((string _, MetricDefinition metric, CancellationToken _) =>
                metric.Code == SupportedMetrics.GrossProfit
                    ? facts.Select(f => f with { Concept = "GrossProfit" }).ToList()
                    : facts);

        var cache = new MemoryFinancialDataCache();
        var sut = CreateSut(useFixture: true, factsProvider: provider.Object, cache: cache);

        var revenue = await sut.GetHistoryAsync("AAPL", "revenue", "annual", 10, CancellationToken.None);
        var gross = await sut.GetHistoryAsync("AAPL", "gross-profit", "annual", 10, CancellationToken.None);

        Assert.Equal(CacheStatus.Miss, revenue.CacheStatus);
        Assert.Equal(CacheStatus.Miss, gross.CacheStatus);
        Assert.True(cache.TryGet("AAPL|revenue|annual|10", out _));
        Assert.True(cache.TryGet("AAPL|gross-profit|annual|10", out _));
    }

    [Fact]
    public async Task Cancellation_DoesNotCache()
    {
        var provider = new Mock<IFinancialFactsProvider>();
        provider.Setup(p => p.GetFactsAsync(
                It.IsAny<string>(),
                It.IsAny<MetricDefinition>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        var cache = new MemoryFinancialDataCache();
        var sut = CreateSut(useFixture: true, factsProvider: provider.Object, cache: cache);
        await Assert.ThrowsAsync<OperationCanceledException>(() =>
            sut.GetHistoryAsync("AAPL", "revenue", "annual", 10, CancellationToken.None));
        Assert.False(cache.TryGet("AAPL|revenue|annual|10", out _));
    }

    [Fact]
    public async Task ProviderUnavailable_OnHttpFailure()
    {
        var provider = new Mock<IFinancialFactsProvider>();
        provider.Setup(p => p.GetFactsAsync(
                It.IsAny<string>(),
                It.IsAny<MetricDefinition>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("down"));

        var sut = CreateSut(useFixture: true, factsProvider: provider.Object);
        var result = await sut.GetHistoryAsync("AAPL", "revenue", "annual", 10, CancellationToken.None);
        Assert.Equal(FinancialHistoryStatus.ProviderUnavailable, result.Status);
    }

    private static FinancialHistoryService CreateSut(
        bool useFixture,
        IReadOnlyList<RawSecFact>? facts = null,
        IFinancialFactsProvider? factsProvider = null,
        IFinancialDataCache? cache = null,
        bool configureIdentity = true)
    {
        var provider = factsProvider;
        if (provider is null)
        {
            var mock = new Mock<IFinancialFactsProvider>();
            mock.Setup(p => p.GetFactsAsync(
                    It.IsAny<string>(),
                    It.IsAny<MetricDefinition>(),
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(facts ?? []);
            provider = mock.Object;
        }

        var options = Options.Create(new SecOptions
        {
            UseFixtureData = useFixture,
            ApplicationName = configureIdentity ? "Test TenYearExplorer" : "",
            ContactEmail = configureIdentity ? "tester@company.org" : "",
            CacheDurationMinutes = 30,
            RequestTimeoutSeconds = 10,
        });

        return new FinancialHistoryService(
            provider,
            new XbrlKpiNormalizer(),
            new FinancialMetricsCalculator(),
            cache ?? new MemoryFinancialDataCache(),
            options,
            NullLogger<FinancialHistoryService>.Instance);
    }

    private static RawSecFact Annual(int fy, decimal value) =>
        new("RevenueFromContractWithCustomerExcludingAssessedTax", value, "USD",
            new DateOnly(fy - 1, 9, 27), new DateOnly(fy, 9, 26), new DateOnly(fy, 10, 30),
            "10-K", $"accn-{fy}", fy, "FY", $"CY{fy}");
}
