namespace TenYearExplorer.Application.Metrics;

public enum MetricValueType
{
    Monetary,
    PerShare,
}

/// <summary>XBRL period style for annual normalization.</summary>
public enum MetricPeriodType
{
    /// <summary>Flow over a fiscal year (income / cash-flow duration facts).</summary>
    Duration,
    /// <summary>Point-in-time FY-end balance (balance-sheet instant facts).</summary>
    Instant,
}

/// <summary>Legacy alias used by some Sprint 3 call sites.</summary>
public enum FactPeriodType
{
    Duration = MetricPeriodType.Duration,
    Instant = MetricPeriodType.Instant,
}

public enum MetricComputationKind
{
    DirectConcept,
    DerivedDifference,
    AggregatedSum,
}

public enum DerivedMetricKind
{
    None,
    FreeCashFlow,
    TotalDebt,
}

public enum DerivedMarginKind
{
    None,
    GrossMargin,
    OperatingMargin,
    NetMargin,
}

/// <summary>
/// Strongly typed allowlist entry for Apple annual metrics (Sprint 1–3).
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
    DerivedMarginKind DerivedMargin,
    MetricPeriodType PeriodType = MetricPeriodType.Duration,
    MetricComputationKind ComputationKind = MetricComputationKind.DirectConcept,
    bool NormalizeToPositiveMagnitude = false,
    bool IsNonGaap = false,
    string? Formula = null,
    DerivedMetricKind Derivation = DerivedMetricKind.None);

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
    public const string OperatingCashFlow = "operating-cash-flow";
    public const string CapitalExpenditure = "capital-expenditure";
    public const string FreeCashFlow = "free-cash-flow";
    public const string CashAndEquivalents = "cash-and-equivalents";
    public const string TotalDebt = "total-debt";

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

    public static readonly MetricDefinition OperatingCashFlowDefinition = new(
        Code: OperatingCashFlow,
        Label: "Operating Cash Flow",
        Description: "Cash generated (or used) by Apple’s core operations during the fiscal year, from the cash flow statement.",
        ValueType: MetricValueType.Monetary,
        ReportingUnit: "USD",
        DisplayFormat: "currency",
        OrderedConcepts:
        [
            "NetCashProvidedByUsedInOperatingActivities",
            "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations",
        ],
        YearOverYearApplicable: true,
        CagrApplicable: true,
        DerivedMargin: DerivedMarginKind.None,
        PeriodType: MetricPeriodType.Duration);

    public static readonly MetricDefinition CapitalExpenditureDefinition = new(
        Code: CapitalExpenditure,
        Label: "Capital Expenditure",
        Description: "Cash spent on property, plant, and equipment during the fiscal year. Shown as a positive cash outflow (amount spent).",
        ValueType: MetricValueType.Monetary,
        ReportingUnit: "USD",
        DisplayFormat: "currency",
        OrderedConcepts: ["PaymentsToAcquirePropertyPlantAndEquipment"],
        YearOverYearApplicable: true,
        CagrApplicable: true,
        DerivedMargin: DerivedMarginKind.None,
        PeriodType: MetricPeriodType.Duration,
        NormalizeToPositiveMagnitude: true);

    public static readonly MetricDefinition FreeCashFlowDefinition = new(
        Code: FreeCashFlow,
        Label: "Free Cash Flow",
        Description: "Non-GAAP / derived: Operating Cash Flow − Capital Expenditure (CapEx as positive cash spent). Not a single SEC line item.",
        ValueType: MetricValueType.Monetary,
        ReportingUnit: "USD",
        DisplayFormat: "currency",
        OrderedConcepts: [],
        YearOverYearApplicable: true,
        CagrApplicable: true,
        DerivedMargin: DerivedMarginKind.None,
        PeriodType: MetricPeriodType.Duration,
        ComputationKind: MetricComputationKind.DerivedDifference,
        IsNonGaap: true,
        Formula: "Free Cash Flow = Operating Cash Flow − Capital Expenditure",
        Derivation: DerivedMetricKind.FreeCashFlow);

    public static readonly MetricDefinition CashAndEquivalentsDefinition = new(
        Code: CashAndEquivalents,
        Label: "Cash & Equivalents",
        Description: "Cash and cash equivalents at fiscal year-end (balance-sheet instant). Does not include marketable securities beyond cash equivalents.",
        ValueType: MetricValueType.Monetary,
        ReportingUnit: "USD",
        DisplayFormat: "currency",
        OrderedConcepts: ["CashAndCashEquivalentsAtCarryingValue"],
        YearOverYearApplicable: true,
        CagrApplicable: true,
        DerivedMargin: DerivedMarginKind.None,
        PeriodType: MetricPeriodType.Instant);

    public static readonly MetricDefinition TotalDebtDefinition = new(
        Code: TotalDebt,
        Label: "Total Debt",
        Description: "Derived interest-bearing debt: Commercial Paper + Current Term Debt + Noncurrent Term Debt. Not total liabilities.",
        ValueType: MetricValueType.Monetary,
        ReportingUnit: "USD",
        DisplayFormat: "currency",
        OrderedConcepts:
        [
            "CommercialPaper",
            "LongTermDebtCurrent",
            "LongTermDebtNoncurrent",
        ],
        YearOverYearApplicable: true,
        CagrApplicable: true,
        DerivedMargin: DerivedMarginKind.None,
        PeriodType: MetricPeriodType.Instant,
        ComputationKind: MetricComputationKind.AggregatedSum,
        Formula: "Total Debt = Commercial Paper + Current Term Debt + Noncurrent Term Debt",
        Derivation: DerivedMetricKind.TotalDebt);

    private static readonly IReadOnlyDictionary<string, MetricDefinition> ByCode =
        new Dictionary<string, MetricDefinition>(StringComparer.OrdinalIgnoreCase)
        {
            [Revenue] = RevenueDefinition,
            [GrossProfit] = GrossProfitDefinition,
            [OperatingIncome] = OperatingIncomeDefinition,
            [NetIncome] = NetIncomeDefinition,
            [DilutedEps] = DilutedEpsDefinition,
            [OperatingCashFlow] = OperatingCashFlowDefinition,
            [CapitalExpenditure] = CapitalExpenditureDefinition,
            [FreeCashFlow] = FreeCashFlowDefinition,
            [CashAndEquivalents] = CashAndEquivalentsDefinition,
            [TotalDebt] = TotalDebtDefinition,
        };

    public static IReadOnlyCollection<MetricDefinition> All => ByCode.Values.ToList();

    public static string SupportedCodesMessage =>
        "Supported metrics: revenue, gross-profit, operating-income, net-income, diluted-eps, " +
        "operating-cash-flow, capital-expenditure, free-cash-flow, cash-and-equivalents, total-debt.";

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
