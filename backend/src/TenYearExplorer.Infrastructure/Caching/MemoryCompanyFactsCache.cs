using System.Collections.Concurrent;
using TenYearExplorer.Application.Abstractions;
using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Infrastructure.Caching;

public sealed class MemoryCompanyFactsCache : ICompanyFactsCache
{
    private readonly ConcurrentDictionary<string, CacheEntry> _entries = new();

    public bool TryGet(string cik, out SecCompanyFactsDocument? document)
    {
        document = null;
        var key = ICompanyFactsCache.BuildKey(cik);
        if (!_entries.TryGetValue(key, out var entry))
        {
            return false;
        }

        if (entry.ExpiresAtUtc <= DateTimeOffset.UtcNow)
        {
            _entries.TryRemove(key, out _);
            return false;
        }

        document = entry.Value;
        return true;
    }

    public void Set(string cik, SecCompanyFactsDocument document, TimeSpan duration)
    {
        var key = ICompanyFactsCache.BuildKey(cik);
        _entries[key] = new CacheEntry(document, DateTimeOffset.UtcNow.Add(duration));
    }

    private sealed record CacheEntry(SecCompanyFactsDocument Value, DateTimeOffset ExpiresAtUtc);
}
