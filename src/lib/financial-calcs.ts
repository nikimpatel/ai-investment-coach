import type {
  AnnualFinancialPoint,
  LargestDecline,
  TrendSummaryStats,
  YearOverYearChange,
} from "./financial-types";

/**
 * Year-over-year changes for a chronological series.
 * N annual points produce N-1 YoY rows.
 */
export function computeYearOverYear(
  points: AnnualFinancialPoint[],
): YearOverYearChange[] {
  if (points.length < 2) return [];

  const rows: YearOverYearChange[] = [];
  for (let i = 1; i < points.length; i += 1) {
    const prior = points[i - 1];
    const current = points[i];
    const absoluteChange = current.value - prior.value;
    const relativeChange =
      prior.value === 0 ? null : absoluteChange / prior.value;
    rows.push({
      fiscalYear: current.fiscalYear,
      fiscalYearEnd: current.fiscalYearEnd,
      value: current.value,
      priorValue: prior.value,
      absoluteChange,
      relativeChange,
    });
  }
  return rows;
}

/**
 * CAGR across displayed annual values.
 * Ten values ⇒ nine year-to-year intervals.
 * CAGR = (end / start) ^ (1 / intervals) − 1
 */
export function computeCagr(
  startValue: number,
  endValue: number,
  intervals: number,
): number | null {
  if (intervals <= 0) return null;
  if (startValue <= 0 || endValue <= 0) return null;
  return (endValue / startValue) ** (1 / intervals) - 1;
}

export function countGrowthYears(yoy: YearOverYearChange[]): {
  positive: number;
  negative: number;
  flat: number;
} {
  let positive = 0;
  let negative = 0;
  let flat = 0;

  for (const row of yoy) {
    if (row.relativeChange === null) continue;
    if (row.relativeChange > 0) positive += 1;
    else if (row.relativeChange < 0) negative += 1;
    else flat += 1;
  }

  return { positive, negative, flat };
}

/** Largest annual decline by relative change (most negative). */
export function findLargestDecline(
  yoy: YearOverYearChange[],
): LargestDecline | null {
  let worst: LargestDecline | null = null;

  for (const row of yoy) {
    if (row.relativeChange === null || row.relativeChange >= 0) continue;
    if (!worst || row.relativeChange < worst.relativeChange) {
      worst = {
        fiscalYear: row.fiscalYear,
        fiscalYearEnd: row.fiscalYearEnd,
        relativeChange: row.relativeChange,
        absoluteChange: row.absoluteChange,
      };
    }
  }

  return worst;
}

export function buildTrendSummary(
  points: AnnualFinancialPoint[],
): TrendSummaryStats | null {
  if (points.length < 2) return null;

  const start = points[0];
  const end = points[points.length - 1];
  const intervals = points.length - 1;
  const yoy = computeYearOverYear(points);
  const counts = countGrowthYears(yoy);

  return {
    start,
    end,
    intervals,
    cagr: computeCagr(start.value, end.value, intervals),
    positiveGrowthYears: counts.positive,
    negativeGrowthYears: counts.negative,
    flatGrowthYears: counts.flat,
    yoy,
    largestDecline: findLargestDecline(yoy),
  };
}

/** Factual summary sentences derived from the series — not hard-coded claims. */
export function buildSummarySentences(stats: TrendSummaryStats): string[] {
  const yearsDisplayed = stats.intervals + 1;
  const startLabel = formatCompactCurrency(stats.start.value, "AUD");
  const endLabel = formatCompactCurrency(stats.end.value, "AUD");
  const cagrLabel =
    stats.cagr === null ? "unavailable" : formatPercent(stats.cagr);

  const sentences = [
    `Revenue increased in ${stats.positiveGrowthYears} of the last ${stats.intervals} year-to-year periods across ${yearsDisplayed} fiscal years.`,
    `Revenue moved from ${startLabel} in ${stats.start.fiscalYear} to ${endLabel} in ${stats.end.fiscalYear}.`,
    `CAGR across the displayed period (${stats.intervals} compounding intervals) was ${cagrLabel}.`,
  ];

  if (stats.largestDecline) {
    sentences.push(
      `The largest annual decline occurred in ${stats.largestDecline.fiscalYear} (${formatPercent(stats.largestDecline.relativeChange)}).`,
    );
  } else {
    sentences.push("There were no declining years in the displayed period.");
  }

  return sentences;
}

export function buildBeginnerExplanation(stats: TrendSummaryStats): string {
  const direction =
    stats.end.value > stats.start.value
      ? "higher"
      : stats.end.value < stats.start.value
        ? "lower"
        : "similar";

  const consistency =
    stats.negativeGrowthYears === 0
      ? "Growth was positive in every year-to-year period shown."
      : stats.negativeGrowthYears === 1
        ? "There was one weaker year when revenue fell."
        : `There were ${stats.negativeGrowthYears} years when revenue fell year over year.`;

  const cagrPart =
    stats.cagr === null
      ? ""
      : ` The compound annual growth rate (CAGR) over ${stats.intervals} intervals was ${formatPercent(stats.cagr)} — a smoothed long-term pace, not a promise that each year grew evenly.`;

  return `Over this decade of demonstration data, Harborline’s revenue ended ${direction} than it started. ${consistency}${cagrPart} Use this as evidence to interpret — not as proof the company is a good or bad investment.`;
}

/** Compact currency for chart axes / summaries (exact values stay in the table). */
export function formatCompactCurrency(
  value: number,
  currency = "AUD",
): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const prefix =
    currency === "AUD" ? "A$" : currency === "USD" ? "$" : `${currency} `;
  const locale = currency === "USD" ? "en-US" : "en-AU";

  if (abs >= 1_000_000_000) {
    const billions = abs / 1_000_000_000;
    return `${sign}${prefix}${trimTrailingZeros(billions.toFixed(2))}b`;
  }
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    return `${sign}${prefix}${trimTrailingZeros(millions.toFixed(1))}m`;
  }
  return `${sign}${prefix}${Math.round(abs).toLocaleString(locale)}`;
}

/** Exact currency for tables and accessible detail. */
export function formatExactCurrency(value: number, currency = "AUD"): string {
  const locale = currency === "USD" ? "en-US" : "en-AU";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(decimal: number, digits = 1): string {
  const pct = decimal * 100;
  const fixed = pct.toFixed(digits);
  const signed = pct > 0 ? `+${fixed}` : fixed;
  return `${signed}%`;
}

function trimTrailingZeros(value: string): string {
  return value.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}
