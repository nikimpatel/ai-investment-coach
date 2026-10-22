export const APPLE_LOAD_ERROR_TITLE = "Couldn’t load Apple’s data";
export const APPLE_LOAD_ERROR_MESSAGE =
  "We couldn’t load Apple’s data right now. Please try again.";
export const APPLE_UNSUPPORTED_METRIC_MESSAGE =
  "This measure isn’t available for Apple yet. Please choose another one.";
export const APPLE_INSUFFICIENT_HISTORY_MESSAGE =
  "There isn’t enough reliable yearly data to show this measure.";
export const APPLE_LOADING_MESSAGE = "Loading Apple’s annual figures…";

export const STAGE_EVIDENCE_INTRO = "This stage looks at these figures from Apple’s annual filings:";
export const MISSING_INFORMATION_HINT = "What would you need to know that these figures don’t show?";

export function appleChartCaption(metricLabel: string, currency: string): string {
  return `${metricLabel} (${currency}). The chart matches the table.`;
}

export function appleTableCaption(metricLabel: string): string {
  return `Exact annual ${metricLabel.toLowerCase()} and year-over-year growth from Apple’s SEC filings`;
}

/** Internal or developer terms that should never reach a user screen. */
const INTERNAL_JARGON = /\bfixtures?\b|\bsprints?\b|\bAPIs?\b|localhost|TenYearExplorer/i;

export function containsInternalJargon(text: string): boolean {
  return INTERNAL_JARGON.test(text);
}
