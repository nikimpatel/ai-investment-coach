/** Metric identifiers for the financial-performance explorer. */
export type FinancialKpiId = "revenue";

export type FinancialKpiStatus = "enabled" | "coming-soon";

export interface FinancialKpiOption {
  id: FinancialKpiId;
  label: string;
  status: FinancialKpiStatus;
}

export interface AnnualFinancialPoint {
  /** Fiscal year label, e.g. "FY2016". */
  fiscalYear: string;
  /** Calendar year the fiscal year ends in, e.g. 2016. */
  fiscalYearEnd: number;
  /** Exact annual value in currency units (e.g. AUD dollars). */
  value: number;
}

export interface CompanyFinancialSeries {
  companyName: string;
  ticker: string;
  currency: string;
  kpiId: FinancialKpiId;
  kpiLabel: string;
  unitNote: string;
  sourceLabel: string;
  fictional: true;
  points: AnnualFinancialPoint[];
}

export interface YearOverYearChange {
  fiscalYear: string;
  fiscalYearEnd: number;
  value: number;
  priorValue: number;
  /** Absolute change in currency units. */
  absoluteChange: number;
  /** Relative change as a decimal (0.12 = +12%). Null when prior is zero. */
  relativeChange: number | null;
}

export interface LargestDecline {
  fiscalYear: string;
  fiscalYearEnd: number;
  relativeChange: number;
  absoluteChange: number;
}

export interface TrendSummaryStats {
  start: AnnualFinancialPoint;
  end: AnnualFinancialPoint;
  intervals: number;
  /** CAGR as a decimal (0.053 = 5.3%). */
  cagr: number | null;
  positiveGrowthYears: number;
  negativeGrowthYears: number;
  flatGrowthYears: number;
  yoy: YearOverYearChange[];
  largestDecline: LargestDecline | null;
}
