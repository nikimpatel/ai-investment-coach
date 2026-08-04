namespace TenYearExplorer.Application.Revenue;

/// <summary>
/// Ordered US-GAAP revenue concept candidates for Sprint 1 (Apple annual revenue).
/// </summary>
public static class RevenueConceptMapping
{
    public const string InternalMetric = "revenue";

    /// <summary>
    /// Priority order (highest first).
    /// 1. RevenueFromContractWithCustomerExcludingAssessedTax — ASC 606 primary tag Apple uses in recent 10-Ks.
    /// 2. Revenues — broad US-GAAP total revenue tag used as fallback when ASC 606 tag is absent for a period.
    /// 3. SalesRevenueNet — older/net sales style tag retained as last resort for historical continuity.
    /// Units: USD only. Forms: 10-K / 10-K/A annual duration only.
    /// </summary>
    public static readonly IReadOnlyList<string> OrderedConcepts =
    [
        "RevenueFromContractWithCustomerExcludingAssessedTax",
        "Revenues",
        "SalesRevenueNet",
    ];
}
