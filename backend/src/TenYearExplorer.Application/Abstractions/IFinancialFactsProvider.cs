using TenYearExplorer.Application.Metrics;
using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Application.Abstractions;

public interface IFinancialFactsProvider
{
    /// <summary>
    /// Extracts raw SEC fact candidates for the given allowlisted metric.
    /// </summary>
    Task<IReadOnlyList<RawSecFact>> GetFactsAsync(
        string cik,
        MetricDefinition metric,
        CancellationToken cancellationToken);
}
