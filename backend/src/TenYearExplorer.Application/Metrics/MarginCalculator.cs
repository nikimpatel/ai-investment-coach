using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Application.Metrics;

/// <summary>
/// Deterministic FY-aligned margin calculations. Never invents missing numerators or revenue.
/// </summary>
public static class MarginCalculator
{
    public static DerivedMarginsResult Compute(
        IReadOnlyList<NormalizedAnnualPoint> revenuePoints,
        IReadOnlyList<NormalizedAnnualPoint> grossProfitPoints,
        IReadOnlyList<NormalizedAnnualPoint> operatingIncomePoints,
        IReadOnlyList<NormalizedAnnualPoint> netIncomePoints)
    {
        var warnings = new List<StructuredWarning>();
        var revenueByFy = revenuePoints.ToDictionary(p => p.FiscalYearLabel, StringComparer.OrdinalIgnoreCase);

        var gross = BuildSeries(
            "gross-margin",
            "Gross Margin",
            "Gross Profit ÷ Revenue × 100. Shows what share of sales remains after direct product/service costs.",
            revenueByFy,
            grossProfitPoints,
            warnings);

        var operating = BuildSeries(
            "operating-margin",
            "Operating Margin",
            "Operating Income ÷ Revenue × 100. Shows what share of sales remains after operating expenses.",
            revenueByFy,
            operatingIncomePoints,
            warnings);

        var net = BuildSeries(
            "net-margin",
            "Net Margin",
            "Net Income ÷ Revenue × 100. Shows what share of sales remains as bottom-line profit.",
            revenueByFy,
            netIncomePoints,
            warnings);

        return new DerivedMarginsResult(gross, operating, net, warnings);
    }

    private static DerivedMarginSeries BuildSeries(
        string code,
        string label,
        string description,
        IReadOnlyDictionary<string, NormalizedAnnualPoint> revenueByFy,
        IReadOnlyList<NormalizedAnnualPoint> numeratorPoints,
        List<StructuredWarning> warnings)
    {
        var numeratorByFy = numeratorPoints.ToDictionary(p => p.FiscalYearLabel, StringComparer.OrdinalIgnoreCase);
        var fiscalYears = revenueByFy.Keys
            .Union(numeratorByFy.Keys, StringComparer.OrdinalIgnoreCase)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(fy => fy, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var points = new List<MarginPoint>();
        decimal? previous = null;

        foreach (var fy in fiscalYears)
        {
            if (!revenueByFy.TryGetValue(fy, out var revenue))
            {
                warnings.Add(new StructuredWarning(
                    "MARGIN_MISSING_REVENUE",
                    $"Could not compute {label} for {fy}: revenue missing for that fiscal year.",
                    FiscalYear: fy));
                points.Add(new MarginPoint(fy, null, null, false));
                previous = null;
                continue;
            }

            if (!numeratorByFy.TryGetValue(fy, out var numerator))
            {
                warnings.Add(new StructuredWarning(
                    "MARGIN_MISSING_NUMERATOR",
                    $"Could not compute {label} for {fy}: numerator metric missing for that fiscal year.",
                    FiscalYear: fy));
                points.Add(new MarginPoint(fy, null, null, false));
                previous = null;
                continue;
            }

            if (revenue.PeriodEnd != numerator.PeriodEnd)
            {
                warnings.Add(new StructuredWarning(
                    "MARGIN_PERIOD_MISMATCH",
                    $"Skipped {label} for {fy}: revenue and numerator period-end dates do not match.",
                    FiscalYear: fy));
                points.Add(new MarginPoint(fy, null, null, false));
                previous = null;
                continue;
            }

            if (revenue.Value == 0)
            {
                warnings.Add(new StructuredWarning(
                    "MARGIN_ZERO_REVENUE",
                    $"Skipped {label} for {fy}: revenue is zero.",
                    FiscalYear: fy));
                points.Add(new MarginPoint(fy, null, null, false));
                previous = null;
                continue;
            }

            var margin = numerator.Value / revenue.Value * 100m;
            decimal? changePts = previous is null ? null : margin - previous;
            points.Add(new MarginPoint(fy, margin, changePts, true));
            previous = margin;
        }

        var available = points.Where(p => p.IsAvailable && p.MarginPercent is not null).ToList();
        decimal? start = available.Count > 0 ? available[0].MarginPercent : null;
        decimal? end = available.Count > 0 ? available[^1].MarginPercent : null;
        decimal? change = start is not null && end is not null ? end - start : null;

        return new DerivedMarginSeries(code, label, description, points, start, end, change);
    }
}
