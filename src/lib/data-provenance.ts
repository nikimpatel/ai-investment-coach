import type { CompanyFinancialSeries } from "./financial-types";

export interface DataProvenance {
  source: string;
  date: string;
}

const SEC_LIVE_PROVIDER = "sec edgar";
const SEC_FIXTURE_PROVIDER = "sec edgar fixture";

export function formatProvenanceDate(value: string): string {
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function latestFilingDate(filingDates: Array<string | null | undefined>): string | null {
  const valid = filingDates.filter(
    (date): date is string => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date),
  );
  return valid.length > 0 ? [...valid].sort().at(-1)! : null;
}

export function demoProvenance(
  series: Pick<CompanyFinancialSeries, "points">,
): DataProvenance {
  const first = series.points[0]?.fiscalYear;
  const last = series.points.at(-1)?.fiscalYear;
  return {
    source: "Invented for this prototype. Not from any filing, exchange or data provider.",
    date:
      first && last
        ? `Fictional figures for ${first}–${last}; no real-world date applies.`
        : "Fictional figures; no real-world date applies.",
  };
}

/**
 * `retrievedAtUtc` is only a real fetch time for live SEC requests. In fixture
 * mode the API stamps the request time onto a saved copy, so it is not shown.
 */
export function appleProvenance({
  sourceProvider,
  retrievedAtUtc,
  filingDates,
}: {
  sourceProvider: string;
  retrievedAtUtc: string | null;
  filingDates: Array<string | null | undefined>;
}): DataProvenance {
  const provider = sourceProvider.trim().toLowerCase();
  const latest = latestFilingDate(filingDates);
  const latestText = latest
    ? `Latest filing in this data: ${formatProvenanceDate(latest)}.`
    : "Filing dates not available.";

  if (provider === SEC_FIXTURE_PROVIDER) {
    return {
      source:
        "SEC EDGAR: Apple’s public annual filings (Form 10-K), from a saved copy bundled with this app.",
      date: latestText,
    };
  }

  if (provider === SEC_LIVE_PROVIDER) {
    const fetched = retrievedAtUtc
      ? ` Fetched from the SEC on ${formatProvenanceDate(retrievedAtUtc)}.`
      : "";
    return {
      source: "SEC EDGAR: Apple’s public annual filings (Form 10-K), fetched live.",
      date: `${latestText}${fetched}`,
    };
  }

  return {
    source: sourceProvider.trim() || "Source not reported by the data service.",
    date: latestText,
  };
}
