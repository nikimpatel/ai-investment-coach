using Microsoft.Extensions.Logging;
using TenYearExplorer.Application.Abstractions;
using TenYearExplorer.Application.Revenue;
using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Infrastructure.Sec;

public sealed class SecFinancialFactsProvider : IFinancialFactsProvider
{
    private readonly ISecEdgarClient _client;
    private readonly ILogger<SecFinancialFactsProvider> _logger;

    public SecFinancialFactsProvider(ISecEdgarClient client, ILogger<SecFinancialFactsProvider> logger)
    {
        _client = client;
        _logger = logger;
    }

    public async Task<IReadOnlyList<RawSecFact>> GetRevenueFactsAsync(
        string cik,
        CancellationToken cancellationToken)
    {
        var factsDoc = await _client.GetCompanyFactsAsync(cik, cancellationToken);

        // Submissions used for filing metadata cross-check when needed (presence logged; facts drive values).
        try
        {
            var submissions = await _client.GetSubmissionsAsync(cik, cancellationToken);
            _logger.LogInformation(
                "Loaded submissions for {Name} with {Count} recent filings",
                submissions.Name,
                submissions.Filings?.Recent?.AccessionNumber.Count ?? 0);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Submissions metadata unavailable; continuing with company facts only");
        }

        if (!factsDoc.Facts.TryGetValue("us-gaap", out var usGaap))
        {
            return [];
        }

        var results = new List<RawSecFact>();
        foreach (var concept in RevenueConceptMapping.OrderedConcepts)
        {
            if (!usGaap.TryGetValue(concept, out var node))
            {
                continue;
            }

            if (!node.Units.TryGetValue("USD", out var usdFacts) || usdFacts.Count == 0)
            {
                continue;
            }

            foreach (var unitFact in usdFacts)
            {
                if (!DateOnly.TryParse(unitFact.End, out var periodEnd))
                {
                    continue;
                }

                DateOnly? periodStart = null;
                if (!string.IsNullOrWhiteSpace(unitFact.Start)
                    && DateOnly.TryParse(unitFact.Start, out var parsedStart))
                {
                    periodStart = parsedStart;
                }

                if (!DateOnly.TryParse(unitFact.Filed, out var filed))
                {
                    continue;
                }

                results.Add(new RawSecFact(
                    Concept: concept,
                    Value: unitFact.Val,
                    Unit: "USD",
                    PeriodStart: periodStart,
                    PeriodEnd: periodEnd,
                    Filed: filed,
                    Form: unitFact.Form,
                    Accession: unitFact.Accn,
                    ReportedFiscalYear: unitFact.Fy,
                    FiscalPeriod: unitFact.Fp,
                    Frame: unitFact.Frame));
            }
        }

        _logger.LogInformation("Extracted {Count} raw revenue fact candidates for CIK {Cik}", results.Count, cik);
        return results;
    }
}
