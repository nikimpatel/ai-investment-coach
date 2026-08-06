import type { AppleFinancialHistoryResponse } from "@/lib/apple-financial-api";
import {
  formatAppleMetricValue,
  formatMarginPercent,
  formatPercentagePoints,
} from "@/lib/apple-metrics";
import { formatPercent } from "@/lib/financial-calcs";

function formatMetricValue(
  data: AppleFinancialHistoryResponse,
  value: number,
): string {
  return formatAppleMetricValue(
    value,
    data.displayFormat || "currency",
    data.currency,
  ).compact;
}

/** Deterministic sentences from verified API summary/points only — no AI. */
export function buildAppleSummarySentences(
  data: AppleFinancialHistoryResponse,
): string[] {
  const summary = data.summary;
  if (!summary || data.points.length === 0) return [];

  const label = data.metricLabel || "Metric";
  const yearsDisplayed = summary.intervals + 1;
  const startLabel = formatMetricValue(data, summary.startValue);
  const endLabel = formatMetricValue(data, summary.endValue);
  const cagrLabel =
    summary.cagr === null ? "unavailable" : formatPercent(summary.cagr);

  const sentences = [
    `${label} increased in ${summary.positiveGrowthYears} of the last ${summary.intervals} year-to-year periods across ${yearsDisplayed} fiscal years.`,
    `${label} moved from ${startLabel} in ${summary.startFiscalYear} to ${endLabel} in ${summary.endFiscalYear}.`,
    `CAGR across the displayed period (${summary.intervals} compounding intervals) was ${cagrLabel}.`,
  ];

  if (summary.largestDecline) {
    sentences.push(
      `The largest annual decline occurred in ${summary.largestDecline.fiscalYear} (${formatPercent(summary.largestDecline.relativeChange)}).`,
    );
  } else {
    sentences.push("There were no declining years in the displayed period.");
  }

  if (summary.highest) {
    sentences.push(
      `Highest annual ${label.toLowerCase()} in the window: ${summary.highest.fiscalYear} (${formatMetricValue(data, summary.highest.value)}).`,
    );
  }

  return sentences;
}

export function buildAppleBeginnerExplanation(
  data: AppleFinancialHistoryResponse,
): string {
  const summary = data.summary;
  const label = data.metricLabel || "This metric";
  if (!summary) {
    return `Verified annual ${label.toLowerCase()} history is not available yet.`;
  }

  const direction =
    summary.endValue > summary.startValue
      ? "higher"
      : summary.endValue < summary.startValue
        ? "lower"
        : "similar";

  const consistency =
    summary.negativeGrowthYears === 0
      ? "Growth was positive in every year-to-year period shown."
      : summary.negativeGrowthYears === 1
        ? "There was one weaker year when the value fell."
        : `There were ${summary.negativeGrowthYears} years when the value fell year over year.`;

  const cagrPart =
    summary.cagr === null
      ? summary.cagrUnavailableReason
        ? ` CAGR is not shown here because ${summary.cagrUnavailableReason.toLowerCase()}`
        : ""
      : ` The compound annual growth rate (CAGR) over ${summary.intervals} intervals was ${formatPercent(summary.cagr)} — a smoothed long-term pace, not a promise that each year grew evenly.`;

  const meaning = data.metricDescription
    ? ` Fact: ${data.metricDescription}`
    : "";

  return `Over this decade of SEC-sourced annual figures, Apple’s ${label.toLowerCase()} ended ${direction} than it started. ${consistency}${cagrPart}${meaning} Educational note: a rising or falling figure alone does not prove management quality or future returns. Use this as evidence to interpret — not as a buy, sell, or hold conclusion.`;
}

export function buildAppleMarginExplanation(
  data: AppleFinancialHistoryResponse,
): string[] {
  const margins = data.margins;
  if (!margins) return [];

  const lines: string[] = [];
  const series = [
    margins.grossMargin,
    margins.operatingMargin,
    margins.netMargin,
  ].filter(Boolean);

  for (const margin of series) {
    if (!margin) continue;
    if (
      margin.startMarginPercent === null ||
      margin.endMarginPercent === null ||
      margin.changePercentagePoints === null
    ) {
      continue;
    }

    const direction =
      margin.changePercentagePoints > 0
        ? "wider"
        : margin.changePercentagePoints < 0
          ? "narrower"
          : "unchanged";

    lines.push(
      `Fact: ${margin.label} moved from ${formatMarginPercent(margin.startMarginPercent)} in the first displayed year to ${formatMarginPercent(margin.endMarginPercent)} in the last (${formatPercentagePoints(margin.changePercentagePoints)}; ${direction}).`,
    );
  }

  if (lines.length > 0) {
    lines.push(
      "General education: a changing margin can reflect pricing, costs, product mix, or one-off items — the chart alone does not identify the cause.",
    );
  }

  return lines;
}

export function buildDefaultAppleObservation(
  data: AppleFinancialHistoryResponse,
): string {
  const summary = data.summary;
  const label = data.metricLabel || "metric";
  if (!summary) {
    return `Apple’s ${label} history from SEC filings needs further review before drawing conclusions.`;
  }

  const start = formatMetricValue(data, summary.startValue);
  const end = formatMetricValue(data, summary.endValue);
  return `Apple ${label} moved from ${start} in ${summary.startFiscalYear} to ${end} in ${summary.endFiscalYear} across ${summary.intervals + 1} fiscal years (${summary.positiveGrowthYears} up / ${summary.negativeGrowthYears} down year-over-year). This is historical evidence to interpret — not an investment conclusion.`;
}

/** @deprecated Prefer buildDefaultAppleObservation(data) */
export const DEFAULT_APPLE_OBSERVATION =
  "Apple’s annual revenue rose over the decade overall, with a mix of stronger and weaker year-to-year changes — including at least one decline — so the path was not a straight line.";
