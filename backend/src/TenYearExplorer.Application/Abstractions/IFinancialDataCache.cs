using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Application.Abstractions;

public interface IFinancialDataCache
{
    bool TryGet(string key, out FinancialHistoryResult? value);

    void Set(string key, FinancialHistoryResult value, TimeSpan duration);

    static string BuildKey(string symbol, string metric, string period, int years) =>
        $"{symbol.ToUpperInvariant()}|{metric.ToLowerInvariant()}|{period.ToLowerInvariant()}|{years}";
}
