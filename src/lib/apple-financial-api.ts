import type { AppleMetricId } from "./apple-metrics";

export type FinancialHistoryStatus =
  | "Success"
  | "PartiallySupported"
  | "UnsupportedMetric"
  | "InsufficientHistory"
  | "ProviderUnavailable"
  | "InvalidConfiguration";

export interface AppleFinancialPoint {
  fiscalYear: string;
  fiscalYearEnd: number;
  periodStart: string | null;
  periodEnd: string;
  value: number;
  yearOverYearChange: number | null;
  filingDate: string;
  form: string;
  accession: string;
  concept: string;
  unit: string;
}

export interface AppleFinancialSummary {
  startValue: number;
  endValue: number;
  startFiscalYear: string;
  endFiscalYear: string;
  intervals: number;
  absoluteChange: number;
  totalPercentageChange: number | null;
  cagr: number | null;
  cagrUnavailableReason: string | null;
  positiveGrowthYears: number;
  negativeGrowthYears: number;
  flatGrowthYears: number;
  highest: { fiscalYear: string; value: number } | null;
  lowest: { fiscalYear: string; value: number } | null;
  largestIncrease: {
    fiscalYear: string;
    absoluteChange: number;
    relativeChange: number;
  } | null;
  largestDecline: {
    fiscalYear: string;
    absoluteChange: number;
    relativeChange: number;
  } | null;
}

export interface AppleMarginPoint {
  fiscalYear: string;
  marginPercent: number | null;
  changePercentagePoints: number | null;
  isAvailable: boolean;
}

export interface AppleMarginSeries {
  code: string;
  label: string;
  description: string;
  points: AppleMarginPoint[];
  startMarginPercent: number | null;
  endMarginPercent: number | null;
  changePercentagePoints: number | null;
}

export interface AppleDerivedMargins {
  grossMargin: AppleMarginSeries | null;
  operatingMargin: AppleMarginSeries | null;
  netMargin: AppleMarginSeries | null;
}

export interface AppleFinancialHistoryResponse {
  status: FinancialHistoryStatus;
  company: { name: string; symbol: string; cik: string };
  symbol: string;
  cik: string;
  currency: string;
  metric: string;
  metricLabel: string;
  metricDescription: string;
  reportingUnit: string;
  displayFormat: string;
  period: string;
  years: number;
  points: AppleFinancialPoint[];
  summary: AppleFinancialSummary | null;
  margins: AppleDerivedMargins | null;
  sourceProvider: string;
  retrievedAtUtc: string;
  cacheStatus: string;
  warnings: Array<{
    code: string;
    message: string;
    fiscalYear: string | null;
    concept: string | null;
  }>;
  detail: string | null;
}

export async function fetchAppleFinancialHistory(
  metric: AppleMetricId = "revenue",
): Promise<AppleFinancialHistoryResponse> {
  const response = await fetch(
    `/api/companies/AAPL/financial-history?metric=${encodeURIComponent(metric)}&period=annual&years=10`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as AppleFinancialHistoryResponse;
  return payload;
}

/** @deprecated Use fetchAppleFinancialHistory */
export async function fetchAppleRevenueHistory(): Promise<AppleFinancialHistoryResponse> {
  return fetchAppleFinancialHistory("revenue");
}
