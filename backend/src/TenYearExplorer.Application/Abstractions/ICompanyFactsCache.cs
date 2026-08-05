using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Application.Abstractions;

/// <summary>
/// Optional in-memory cache for underlying SEC Company Facts documents (by CIK).
/// Keeps multi-metric requests from re-downloading the same payload.
/// </summary>
public interface ICompanyFactsCache
{
    bool TryGet(string cik, out SecCompanyFactsDocument? document);

    void Set(string cik, SecCompanyFactsDocument document, TimeSpan duration);

    static string BuildKey(string cik) =>
        $"companyfacts|{cik.PadLeft(10, '0')}";
}
