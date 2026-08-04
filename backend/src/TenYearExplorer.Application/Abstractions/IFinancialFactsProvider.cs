using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Application.Abstractions;

public interface IFinancialFactsProvider
{
    Task<IReadOnlyList<RawSecFact>> GetRevenueFactsAsync(
        string cik,
        CancellationToken cancellationToken);
}
