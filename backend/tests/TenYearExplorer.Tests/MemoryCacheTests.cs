using TenYearExplorer.Domain.Enums;
using TenYearExplorer.Domain.Models;
using TenYearExplorer.Infrastructure.Caching;

namespace TenYearExplorer.Tests;

public sealed class MemoryCacheTests
{
    [Fact]
    public void Miss_Then_Hit_After_Set()
    {
        var cache = new MemoryFinancialDataCache();
        Assert.False(cache.TryGet("k", out _));

        var result = SampleResult(CacheStatus.Miss);
        cache.Set("k", result, TimeSpan.FromMinutes(5));

        Assert.True(cache.TryGet("k", out var cached));
        Assert.NotNull(cached);
        Assert.Equal(result.Company.Symbol, cached!.Company.Symbol);
    }

    [Fact]
    public void Expired_Entry_Is_Miss()
    {
        var cache = new MemoryFinancialDataCache();
        cache.Set("k", SampleResult(CacheStatus.Miss), TimeSpan.FromMilliseconds(1));
        Thread.Sleep(20);
        Assert.False(cache.TryGet("k", out _));
    }

    private static FinancialHistoryResult SampleResult(CacheStatus cacheStatus) =>
        new(
            FinancialHistoryStatus.Success,
            new CompanyIdentity("AAPL", "Apple Inc.", "0000320193"),
            "revenue",
            "Revenue",
            "Total net sales for the fiscal year.",
            "annual",
            10,
            "USD",
            "USD",
            "currency",
            [],
            null,
            null,
            "SEC EDGAR fixture",
            DateTimeOffset.UtcNow,
            cacheStatus,
            []);
}
