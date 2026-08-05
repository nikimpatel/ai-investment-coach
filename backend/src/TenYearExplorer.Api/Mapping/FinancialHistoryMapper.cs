using TenYearExplorer.Api.Contracts;
using TenYearExplorer.Domain.Enums;
using TenYearExplorer.Domain.Models;

namespace TenYearExplorer.Api.Mapping;

public static class FinancialHistoryMapper
{
    public static FinancialHistoryResponse ToResponse(FinancialHistoryResult result) =>
        new(
            Status: result.Status.ToString(),
            Company: new CompanyDto(result.Company.Name, result.Company.Symbol, result.Company.Cik),
            Symbol: result.Company.Symbol,
            Cik: result.Company.Cik,
            Currency: result.Currency,
            Metric: result.Metric,
            MetricLabel: result.MetricLabel,
            MetricDescription: result.MetricDescription,
            ReportingUnit: result.ReportingUnit,
            DisplayFormat: result.DisplayFormat,
            Period: result.Period,
            Years: result.RequestedYears,
            Points: result.Points.Select(p => new FinancialHistoryPointDto(
                p.FiscalYear,
                p.FiscalYearEnd,
                p.PeriodStart?.ToString("yyyy-MM-dd"),
                p.PeriodEnd.ToString("yyyy-MM-dd"),
                p.Value,
                p.YearOverYearChange,
                p.FilingDate.ToString("yyyy-MM-dd"),
                p.Form,
                p.Accession,
                p.Concept,
                p.Unit)).ToList(),
            Summary: result.Summary is null ? null : new FinancialHistorySummaryDto(
                result.Summary.StartValue,
                result.Summary.EndValue,
                result.Summary.StartFiscalYear,
                result.Summary.EndFiscalYear,
                result.Summary.Intervals,
                result.Summary.AbsoluteChange,
                result.Summary.TotalPercentageChange,
                result.Summary.Cagr,
                result.Summary.CagrUnavailableReason,
                result.Summary.PositiveGrowthYears,
                result.Summary.NegativeGrowthYears,
                result.Summary.FlatGrowthYears,
                result.Summary.Highest is null ? null : new ExtremeYearDto(result.Summary.Highest.FiscalYear, result.Summary.Highest.Value),
                result.Summary.Lowest is null ? null : new ExtremeYearDto(result.Summary.Lowest.FiscalYear, result.Summary.Lowest.Value),
                result.Summary.LargestIncrease is null ? null : new LargestMoveDto(
                    result.Summary.LargestIncrease.FiscalYear,
                    result.Summary.LargestIncrease.AbsoluteChange,
                    result.Summary.LargestIncrease.RelativeChange),
                result.Summary.LargestDecline is null ? null : new LargestMoveDto(
                    result.Summary.LargestDecline.FiscalYear,
                    result.Summary.LargestDecline.AbsoluteChange,
                    result.Summary.LargestDecline.RelativeChange)),
            Margins: MapMargins(result.Margins),
            SourceProvider: result.SourceProvider,
            RetrievedAtUtc: result.RetrievedAtUtc,
            CacheStatus: result.CacheStatus.ToString(),
            Warnings: result.Warnings.Select(w => new WarningDto(w.Code, w.Message, w.FiscalYear, w.Concept)).ToList(),
            Detail: result.Detail);

    private static DerivedMarginsDto? MapMargins(DerivedMarginsResult? margins)
    {
        if (margins is null)
        {
            return null;
        }

        return new DerivedMarginsDto(
            MapSeries(margins.GrossMargin),
            MapSeries(margins.OperatingMargin),
            MapSeries(margins.NetMargin));
    }

    private static DerivedMarginSeriesDto? MapSeries(DerivedMarginSeries? series)
    {
        if (series is null)
        {
            return null;
        }

        return new DerivedMarginSeriesDto(
            series.Code,
            series.Label,
            series.Description,
            series.Points.Select(p => new MarginPointDto(
                p.FiscalYear,
                p.MarginPercent,
                p.ChangePercentagePoints,
                p.IsAvailable)).ToList(),
            series.StartMarginPercent,
            series.EndMarginPercent,
            series.ChangePercentagePoints);
    }

    public static int ToHttpStatusCode(FinancialHistoryStatus status) =>
        status switch
        {
            FinancialHistoryStatus.Success => StatusCodes.Status200OK,
            FinancialHistoryStatus.PartiallySupported => StatusCodes.Status200OK,
            FinancialHistoryStatus.UnsupportedMetric => StatusCodes.Status400BadRequest,
            FinancialHistoryStatus.InsufficientHistory => StatusCodes.Status422UnprocessableEntity,
            FinancialHistoryStatus.ProviderUnavailable => StatusCodes.Status503ServiceUnavailable,
            FinancialHistoryStatus.InvalidConfiguration => StatusCodes.Status503ServiceUnavailable,
            _ => StatusCodes.Status500InternalServerError,
        };
}
