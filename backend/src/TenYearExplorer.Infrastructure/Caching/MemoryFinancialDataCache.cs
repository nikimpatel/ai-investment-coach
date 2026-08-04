using System.Collections.Concurrent;
using TenYearExplorer.Application.Abstractions;
using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Infrastructure.Caching;

public sealed class MemoryFinancialDataCache : IFinancialDataCache
{
    private readonly ConcurrentDictionary<string, CacheEntry> _entries = new();

    public bool TryGet(string key, out FinancialHistoryResult? value)
    {
        value = null;
        if (!_entries.TryGetValue(key, out var entry))
        {
            return false;
        }

        if (entry.ExpiresAtUtc <= DateTimeOffset.UtcNow)
        {
            _entries.TryRemove(key, out _);
            return false;
        }

        value = entry.Value;
        return true;
    }

    public void Set(string key, FinancialHistoryResult value, TimeSpan duration)
    {
        _entries[key] = new CacheEntry(value, DateTimeOffset.UtcNow.Add(duration));
    }

    private sealed record CacheEntry(FinancialHistoryResult Value, DateTimeOffset ExpiresAtUtc);
}
