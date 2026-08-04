import type { AppleFinancialHistoryResponse } from "@/lib/apple-financial-api";
import { formatCompactCurrency, formatPercent } from "@/lib/financial-calcs";

/** Deterministic sentences from verified API summary/points only — no AI. */
export function buildAppleSummarySentences(
  data: AppleFinancialHistoryResponse,
): string[] {
  const summary = data.summary;
  if (!summary || data.points.length === 0) return [];

  const currency = data.currency;
  const yearsDisplayed = summary.intervals + 1;
  const startLabel = formatCompactCurrency(summary.startValue, currency);
  const endLabel = formatCompactCurrency(summary.endValue, currency);
  const cagrLabel =
    summary.cagr === null ? "unavailable" : formatPercent(summary.cagr);

  const sentences = [
    `Revenue increased in ${summary.positiveGrowthYears} of the last ${summary.intervals} year-to-year periods across ${yearsDisplayed} fiscal years.`,
    `Revenue moved from ${startLabel} in ${summary.startFiscalYear} to ${endLabel} in ${summary.endFiscalYear}.`,
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
      `Highest annual revenue in the window: ${summary.highest.fiscalYear} (${formatCompactCurrency(summary.highest.value, currency)}).`,
    );
  }

  return sentences;
}

export function buildAppleBeginnerExplanation(
  data: AppleFinancialHistoryResponse,
): string {
  const summary = data.summary;
  if (!summary) {
    return "Verified annual revenue history is not available yet.";
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
        ? "There was one weaker year when revenue fell."
        : `There were ${summary.negativeGrowthYears} years when revenue fell year over year.`;

  const cagrPart =
    summary.cagr === null
      ? ""
      : ` The compound annual growth rate (CAGR) over ${summary.intervals} intervals was ${formatPercent(summary.cagr)} — a smoothed long-term pace, not a promise that each year grew evenly.`;

  return `Over this decade of SEC-sourced annual revenue, Apple’s revenue ended ${direction} than it started. ${consistency}${cagrPart} Use this as evidence to interpret — not as proof the company is a good or bad investment.`;
}

export const DEFAULT_APPLE_OBSERVATION =
  "Apple’s annual revenue rose over the decade overall, with a mix of stronger and weaker year-to-year changes — including at least one decline — so the path was not a straight line.";
