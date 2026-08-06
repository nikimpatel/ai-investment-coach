using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Application.Metrics;

/// <summary>
/// Deterministic Sprint 3 calculations. AI is never involved in these values.
/// </summary>
public static class CashFlowDebtCalculator
{
    public static DerivedRelationshipSeries BuildFreeCashFlow(
        IReadOnlyList<NormalizedAnnualPoint> operatingCashFlow,
        IReadOnlyList<NormalizedAnnualPoint> capitalExpenditure)
    {
        var capexByEnd = capitalExpenditure.ToDictionary(p => p.PeriodEnd);
        var points = operatingCashFlow.Select(ocf =>
        {
            if (!capexByEnd.TryGetValue(ocf.PeriodEnd, out var capex))
            {
                return Unavailable(
                    ocf,
                    "Capital expenditure is unavailable for the same fiscal period.",
                    [Trace(SupportedMetrics.OperatingCashFlowDefinition, ocf)]);
            }

            return Available(
                ocf,
                ocf.Value - capex.Value,
                [
                    Trace(SupportedMetrics.OperatingCashFlowDefinition, ocf),
                    Trace(SupportedMetrics.CapitalExpenditureDefinition, capex),
                ]);
        }).ToList();

        return new DerivedRelationshipSeries(
            Code: SupportedMetrics.FreeCashFlow,
            Label: "Free Cash Flow",
            Description: "Derived, non-GAAP cash remaining after property, plant, and equipment spending.",
            Formula: SupportedMetrics.FreeCashFlowDefinition.Formula!,
            ReportingUnit: "USD",
            DisplayFormat: "currency",
            IsNonGaap: true,
            Points: points);
    }

    public static DerivedRelationshipSeries BuildTotalDebt(
        IReadOnlyList<NormalizedAnnualPoint> commercialPaper,
        IReadOnlyList<NormalizedAnnualPoint> currentTermDebt,
        IReadOnlyList<NormalizedAnnualPoint> noncurrentTermDebt)
    {
        var currentByEnd = currentTermDebt.ToDictionary(p => p.PeriodEnd);
        var noncurrentByEnd = noncurrentTermDebt.ToDictionary(p => p.PeriodEnd);
        var points = commercialPaper.Select(commercial =>
        {
            var inputs = new List<DerivedInputTrace>
            {
                Trace("commercial-paper", "Commercial Paper", commercial),
            };

            if (!currentByEnd.TryGetValue(commercial.PeriodEnd, out var current))
            {
                return Unavailable(
                    commercial,
                    "Current term debt is unavailable for the same fiscal year end.",
                    inputs);
            }

            inputs.Add(Trace("current-term-debt", "Current Term Debt", current));
            if (!noncurrentByEnd.TryGetValue(commercial.PeriodEnd, out var noncurrent))
            {
                return Unavailable(
                    commercial,
                    "Noncurrent term debt is unavailable for the same fiscal year end.",
                    inputs);
            }

            inputs.Add(Trace("noncurrent-term-debt", "Noncurrent Term Debt", noncurrent));
            return Available(
                commercial,
                commercial.Value + current.Value + noncurrent.Value,
                inputs);
        }).ToList();

        return new DerivedRelationshipSeries(
            Code: SupportedMetrics.TotalDebt,
            Label: "Total Debt",
            Description: "Commercial paper plus current and noncurrent term debt. Total liabilities are not used.",
            Formula: SupportedMetrics.TotalDebtDefinition.Formula!,
            ReportingUnit: "USD",
            DisplayFormat: "currency",
            IsNonGaap: false,
            Points: points);
    }

    public static DerivedRelationshipsResult BuildRelationships(
        DerivedRelationshipSeries freeCashFlow,
        IReadOnlyList<NormalizedAnnualPoint> operatingCashFlow,
        IReadOnlyList<NormalizedAnnualPoint> netIncome,
        IReadOnlyList<NormalizedAnnualPoint> revenue,
        IReadOnlyList<NormalizedAnnualPoint> cashAndEquivalents,
        DerivedRelationshipSeries totalDebt)
    {
        var cashConversion = BuildRatio(
            code: "cash-conversion",
            label: "Cash Conversion",
            description: "Operating cash flow as a percentage of net income.",
            formula: "Cash Conversion = Operating Cash Flow ÷ Net Income × 100",
            numerator: operatingCashFlow,
            denominator: netIncome,
            numeratorDefinition: SupportedMetrics.OperatingCashFlowDefinition,
            denominatorDefinition: SupportedMetrics.NetIncomeDefinition,
            invalidDenominator: value => value <= 0,
            invalidReason: "Net income is zero or negative; cash conversion is not meaningful.");

        var fcfMargin = BuildRatio(
            code: "free-cash-flow-margin",
            label: "Free Cash Flow Margin",
            description: "Derived free cash flow as a percentage of revenue.",
            formula: "Free Cash Flow Margin = Free Cash Flow ÷ Revenue × 100",
            numerator: freeCashFlow,
            denominator: revenue,
            denominatorDefinition: SupportedMetrics.RevenueDefinition,
            invalidDenominator: value => value <= 0,
            invalidReason: "Revenue is zero or negative; free cash flow margin is unavailable.");

        var netDebt = BuildNetDebt(totalDebt, cashAndEquivalents);
        return new DerivedRelationshipsResult(freeCashFlow, cashConversion, fcfMargin, netDebt);
    }

    private static DerivedRelationshipSeries BuildRatio(
        string code,
        string label,
        string description,
        string formula,
        IReadOnlyList<NormalizedAnnualPoint> numerator,
        IReadOnlyList<NormalizedAnnualPoint> denominator,
        MetricDefinition numeratorDefinition,
        MetricDefinition denominatorDefinition,
        Func<decimal, bool> invalidDenominator,
        string invalidReason)
    {
        var numeratorSeries = new DerivedRelationshipSeries(
            numeratorDefinition.Code,
            numeratorDefinition.Label,
            numeratorDefinition.Description,
            numeratorDefinition.Formula ?? numeratorDefinition.Label,
            numeratorDefinition.ReportingUnit,
            numeratorDefinition.DisplayFormat,
            numeratorDefinition.IsNonGaap,
            numerator.Select(p => Available(
                p,
                p.Value,
                [Trace(numeratorDefinition, p)])).ToList());

        return BuildRatio(
            code,
            label,
            description,
            formula,
            numeratorSeries,
            denominator,
            denominatorDefinition,
            invalidDenominator,
            invalidReason);
    }

    private static DerivedRelationshipSeries BuildRatio(
        string code,
        string label,
        string description,
        string formula,
        DerivedRelationshipSeries numerator,
        IReadOnlyList<NormalizedAnnualPoint> denominator,
        MetricDefinition denominatorDefinition,
        Func<decimal, bool> invalidDenominator,
        string invalidReason)
    {
        var denominatorByEnd = denominator.ToDictionary(p => p.PeriodEnd);
        var points = numerator.Points.Select(n =>
        {
            if (!n.IsAvailable || n.Value is null)
            {
                return n with { Value = null, IsAvailable = false };
            }

            if (!denominatorByEnd.TryGetValue(n.PeriodEnd, out var d))
            {
                return n with
                {
                    Value = null,
                    IsAvailable = false,
                    UnavailableReason = $"{denominatorDefinition.Label} is unavailable for the same fiscal period.",
                };
            }

            var inputs = n.Inputs.Concat([Trace(denominatorDefinition, d)]).ToList();
            if (invalidDenominator(d.Value))
            {
                return n with
                {
                    Value = null,
                    IsAvailable = false,
                    UnavailableReason = invalidReason,
                    Inputs = inputs,
                };
            }

            return n with
            {
                Value = n.Value.Value / d.Value * 100m,
                IsAvailable = true,
                UnavailableReason = null,
                Inputs = inputs,
            };
        }).ToList();

        return new DerivedRelationshipSeries(
            code,
            label,
            description,
            formula,
            "%",
            "percent",
            numerator.IsNonGaap,
            points);
    }

    private static DerivedRelationshipSeries BuildNetDebt(
        DerivedRelationshipSeries totalDebt,
        IReadOnlyList<NormalizedAnnualPoint> cashAndEquivalents)
    {
        var cashByEnd = cashAndEquivalents.ToDictionary(p => p.PeriodEnd);
        var points = totalDebt.Points.Select(debt =>
        {
            if (!debt.IsAvailable || debt.Value is null)
            {
                return debt with { Value = null, IsAvailable = false };
            }

            if (!cashByEnd.TryGetValue(debt.PeriodEnd, out var cash))
            {
                return debt with
                {
                    Value = null,
                    IsAvailable = false,
                    UnavailableReason = "Cash and equivalents are unavailable for the same fiscal year end.",
                };
            }

            var value = debt.Value.Value - cash.Value;
            return debt with
            {
                Value = value,
                IsAvailable = true,
                UnavailableReason = null,
                IsNetCash = value < 0,
                Inputs = debt.Inputs.Concat(
                    [Trace(SupportedMetrics.CashAndEquivalentsDefinition, cash)]).ToList(),
            };
        }).ToList();

        return new DerivedRelationshipSeries(
            Code: "net-debt",
            Label: "Net Debt",
            Description: "Total debt less cash and equivalents. A negative value is presented as net cash.",
            Formula: "Net Debt = Total Debt − Cash & Equivalents",
            ReportingUnit: "USD",
            DisplayFormat: "currency",
            IsNonGaap: false,
            Points: points);
    }

    private static DerivedRelationshipPoint Available(
        NormalizedAnnualPoint point,
        decimal value,
        IReadOnlyList<DerivedInputTrace> inputs) =>
        new(
            point.FiscalYearLabel,
            point.FiscalYearEndYear,
            point.PeriodEnd,
            value,
            true,
            null,
            false,
            inputs);

    private static DerivedRelationshipPoint Unavailable(
        NormalizedAnnualPoint point,
        string reason,
        IReadOnlyList<DerivedInputTrace> inputs) =>
        new(
            point.FiscalYearLabel,
            point.FiscalYearEndYear,
            point.PeriodEnd,
            null,
            false,
            reason,
            false,
            inputs);

    private static DerivedInputTrace Trace(
        MetricDefinition definition,
        NormalizedAnnualPoint point) =>
        Trace(definition.Code, definition.Label, point);

    private static DerivedInputTrace Trace(
        string metric,
        string label,
        NormalizedAnnualPoint point) =>
        new(
            metric,
            label,
            point.Value,
            point.Concept,
            point.PeriodStart,
            point.PeriodEnd,
            point.FilingDate,
            point.Form,
            point.Accession);
}
