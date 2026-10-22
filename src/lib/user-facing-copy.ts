export const APPLE_LOAD_ERROR_TITLE = "Couldn’t load Apple’s data";
export const APPLE_LOAD_ERROR_MESSAGE =
  "We couldn’t load Apple’s data right now. Please try again.";
export const APPLE_UNSUPPORTED_METRIC_MESSAGE =
  "This measure isn’t available for Apple yet. Please choose another one.";
export const APPLE_INSUFFICIENT_HISTORY_TITLE = "Insufficient reliable history";
export const APPLE_UNAVAILABLE_TITLE = "Apple’s data isn’t available";
export const APPLE_UNAVAILABLE_MESSAGE =
  "Apple’s data isn’t available right now. You can explore the Harborline demo instead.";
export const EXPLORE_DEMO_ACTION = "Explore the Harborline demo";
export const APPLE_LOADING_MESSAGE = "Loading Apple’s annual figures…";

export type AppleLoadIssue =
  | { kind: "retryable" }
  | { kind: "unavailable" }
  | { kind: "unsupported-metric" }
  | { kind: "insufficient-history"; availableYears: number | null; requestedYears: number | null };

interface AppleResponseStatus {
  status: string;
  years?: number | null;
  detail?: string | null;
  points?: unknown[] | null;
  summary?: unknown;
}

/**
 * The backend reports the reliable-year count only in its detail text
 * ("Only N reliable annual points available; Y requested." or "No reliable annual …").
 */
export function availableYearsFromDetail(detail: string | null | undefined): number | null {
  if (!detail) return null;
  const only = /\bOnly (\d+) reliable annual points? available\b/i.exec(detail);
  if (only) return Number(only[1]);
  if (/\bNo reliable annual\b/i.test(detail)) return 0;
  return null;
}

export function classifyAppleResponse(response: AppleResponseStatus): AppleLoadIssue | null {
  switch (response.status) {
    case "Success":
    case "PartiallySupported":
      if (response.summary && (response.points?.length ?? 0) > 0) return null;
      break;
    case "ProviderUnavailable":
      return { kind: "retryable" };
    case "InvalidConfiguration":
      return { kind: "unavailable" };
    case "UnsupportedMetric":
      return { kind: "unsupported-metric" };
  }
  const requestedYears =
    typeof response.years === "number" && response.years > 0 ? response.years : null;
  return {
    kind: "insufficient-history",
    availableYears: availableYearsFromDetail(response.detail),
    requestedYears,
  };
}

function yearCount(availableYears: number | null, requestedYears: number | null): string {
  if (availableYears !== null && requestedYears !== null) {
    return ` (we have ${availableYears} of ${requestedYears} years)`;
  }
  if (requestedYears !== null) return ` (we need ${requestedYears} years)`;
  return "";
}

export function financeInsufficientHistoryMessage(
  availableYears: number | null,
  requestedYears: number | null,
): string {
  return `There isn’t enough reliable yearly data to show this measure${yearCount(availableYears, requestedYears)}. You can explore the Harborline demo instead.`;
}

export function guidedInsufficientHistoryMessage(
  availableYears: number | null,
  requestedYears: number | null,
): string {
  return `There isn’t enough reliable history for Apple to run the guided analysis${yearCount(availableYears, requestedYears)}. You can explore the Harborline demo instead.`;
}

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
