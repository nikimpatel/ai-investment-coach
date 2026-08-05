namespace TenYearExplorer.Application.Metrics;

public enum MetricValueType
{
    Monetary,
    PerShare,
}

public enum DerivedMarginKind
{
    None,
    GrossMargin,
    OperatingMargin,
    NetMargin,
}

/// <summary>
/// Strongly typed allowlist entry for Sprint 2 Apple annual metrics.
/// </summary>
public sealed record MetricDefinition(
    string Code,
    string Label,
    string Description,
    MetricValueType ValueType,
    string ReportingUnit,
    string DisplayFormat,
    IReadOnlyList<string> OrderedConcepts,
    bool YearOverYearApplicable,
    bool CagrApplicable,
    DerivedMarginKind DerivedMargin);

/// <summary>
/// Explicit allowlist of supported financial-history metrics.
/// </summary>
public static class SupportedMetrics
{
    public const string Revenue = "revenue";
    public const string GrossProfit = "gross-profit";
    public const string OperatingIncome = "operating-income";
    public const string NetIncome = "net-income";
    public const string DilutedEps = "diluted-eps";

    public static readonly MetricDefinition RevenueDefinition = new(
        Code: Revenue,
        Label: "Revenue",
        Description: "Total net sales for the fiscal year — what customers paid Apple for products and services.",
        ValueType: MetricValueType.Monetary,
        ReportingUnit: "USD",
        DisplayFormat: "currency",
        OrderedConcepts:
        [
            "RevenueFromContractWithCustomerExcludingAssessedTax",
            "Revenues",
            "SalesRevenueNet",
        ],
        YearOverYearApplicable: true,
        CagrApplicable: true,
        DerivedMargin: DerivedMarginKind.None);

    public static readonly MetricDefinition GrossProfitDefinition = new(
        Code: GrossProfit,
        Label: "Gross Profit",
        Description: "Revenue minus the direct cost of products and services sold. Shows how much is left before operating expenses.",
        ValueType: MetricValueType.Monetary,
        ReportingUnit: "USD",
        DisplayFormat: "currency",
        OrderedConcepts: ["GrossProfit"],
        YearOverYearApplicable: true,
        CagrApplicable: true,
        DerivedMargin: DerivedMarginKind.GrossMargin);

    public static readonly MetricDefinition OperatingIncomeDefinition = new(
        Code: OperatingIncome,
        Label: "Operating Income",
        Description: "Profit from Apple’s core operations after operating expenses, before interest and taxes.",
        ValueType: MetricValueType.Monetary,
        ReportingUnit: "USD",
        DisplayFormat: "currency",
        OrderedConcepts: ["OperatingIncomeLoss"],
        YearOverYearApplicable: true,
        CagrApplicable: true,
        DerivedMargin: DerivedMarginKind.OperatingMargin);

    public static readonly MetricDefinition NetIncomeDefinition = new(
        Code: NetIncome,
        Label: "Net Income",
        Description: "Bottom-line profit after all expenses, interest, and taxes for the fiscal year.",
        ValueType: MetricValueType.Monetary,
        ReportingUnit: "USD",
        DisplayFormat: "currency",
        OrderedConcepts: ["NetIncomeLoss"],
        YearOverYearApplicable: true,
        CagrApplicable: true,
        DerivedMargin: DerivedMarginKind.NetMargin);

    public static readonly MetricDefinition DilutedEpsDefinition = new(
        Code: DilutedEps,
        Label: "Diluted EPS",
        Description: "Net income divided by a share count that includes potentially dilutive securities. Reported per share, not as a company total.",
        ValueType: MetricValueType.PerShare,
        ReportingUnit: "USD/shares",
        DisplayFormat: "per-share",
        OrderedConcepts: ["EarningsPerShareDiluted"],
        YearOverYearApplicable: true,
        CagrApplicable: true,
        DerivedMargin: DerivedMarginKind.None);

    private static readonly IReadOnlyDictionary<string, MetricDefinition> ByCode =
        new Dictionary<string, MetricDefinition>(StringComparer.OrdinalIgnoreCase)
        {
            [Revenue] = RevenueDefinition,
            [GrossProfit] = GrossProfitDefinition,
            [OperatingIncome] = OperatingIncomeDefinition,
            [NetIncome] = NetIncomeDefinition,
            [DilutedEps] = DilutedEpsDefinition,
        };

    public static IReadOnlyCollection<MetricDefinition> All => ByCode.Values.ToList();

    public static bool TryGet(string? metricCode, out MetricDefinition definition)
    {
        definition = null!;
        if (string.IsNullOrWhiteSpace(metricCode))
        {
            return false;
        }

        return ByCode.TryGetValue(metricCode.Trim(), out definition!);
    }

    public static IReadOnlyList<string> AllOrderedConcepts() =>
        All.SelectMany(m => m.OrderedConcepts)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

    public static string NormalizeCode(string? metricCode) =>
        (metricCode ?? string.Empty).Trim().ToLowerInvariant();
}
