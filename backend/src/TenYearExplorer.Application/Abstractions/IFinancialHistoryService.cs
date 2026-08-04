using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Application.Abstractions;

public interface IFinancialHistoryService
{
    Task<FinancialHistoryResult> GetHistoryAsync(
        string symbol,
        string metric,
        string period,
        int years,
        CancellationToken cancellationToken);
}
