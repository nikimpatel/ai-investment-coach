import type { FinancialKpiId } from "./financial-types";

export type AppleMetricId =
  | "revenue"
  | "gross-profit"
  | "operating-income"
  | "net-income"
  | "diluted-eps";

export type EvidenceRelationship = "supports" | "weakens" | "neutral";

export interface AppleMetricOption {
  id: AppleMetricId;
  label: string;
  shortDescription: string;
}

export const APPLE_METRIC_OPTIONS: AppleMetricOption[] = [
  {
    id: "revenue",
    label: "Revenue",
    shortDescription: "Total net sales for the fiscal year.",
  },
  {
    id: "gross-profit",
    label: "Gross Profit",
    shortDescription: "Sales left after direct product and service costs.",
  },
  {
    id: "operating-income",
    label: "Operating Income",
    shortDescription: "Profit from core operations before interest and taxes.",
  },
  {
    id: "net-income",
    label: "Net Income",
    shortDescription: "Bottom-line profit after all expenses and taxes.",
  },
  {
    id: "diluted-eps",
    label: "Diluted EPS",
    shortDescription: "Earnings per share including potential dilution.",
  },
];

/** Harborline Sprint 0 still only enables revenue. */
export const harborlineKpiOptions: Array<{
  id: FinancialKpiId;
  label: string;
  status: "enabled" | "coming-soon";
}> = [{ id: "revenue", label: "Revenue", status: "enabled" }];

export function formatAppleMetricValue(
  value: number,
  displayFormat: string,
  currency: string,
): { exact: string; compact: string } {
  if (displayFormat === "per-share") {
    const exact = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
    return { exact: `${exact}/share`, compact: exact };
  }

  const exact = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  let compact: string;
  if (abs >= 1_000_000_000_000) {
    compact = `${sign}$${(abs / 1_000_000_000_000).toFixed(2)}t`;
  } else if (abs >= 1_000_000_000) {
    compact = `${sign}$${(abs / 1_000_000_000).toFixed(2)}b`;
  } else if (abs >= 1_000_000) {
    compact = `${sign}$${(abs / 1_000_000).toFixed(1)}m`;
  } else {
    compact = exact;
  }

  return { exact, compact };
}

export function formatMarginPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}%`;
}

export function formatPercentagePoints(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} pp`;
}
