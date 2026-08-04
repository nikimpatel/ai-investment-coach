using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Application.Abstractions;

public interface ISecEdgarClient
{
    Task<SecCompanyFactsDocument> GetCompanyFactsAsync(string cik, CancellationToken cancellationToken);

    Task<SecSubmissionsDocument> GetSubmissionsAsync(string cik, CancellationToken cancellationToken);
}
