import { sampleCompany } from "./sample-data";
import type { PrototypeStep } from "./types";

export type DatasetMode = "harborline" | "apple";

export interface CompanyContext {
  name: string;
  ticker: string;
  isDemo: boolean;
}

export const DEMO_LABEL = "Demo";

export const DEMO_COMPANY: CompanyContext = {
  name: sampleCompany.name,
  ticker: sampleCompany.ticker,
  isDemo: true,
};

export const APPLE_COMPANY: CompanyContext = {
  name: "Apple Inc.",
  ticker: "AAPL",
  isDemo: false,
};

/**
 * Research, thesis, decision and reflection always work on the fictional
 * Harborline idea; only the finance step (and its guided analysis) can show Apple.
 */
export function getActiveCompany({
  step,
  financeDataset,
  guidedOpen,
}: {
  step: PrototypeStep;
  financeDataset: DatasetMode;
  guidedOpen: boolean;
}): CompanyContext {
  if (step !== "performance") return DEMO_COMPANY;
  if (guidedOpen || financeDataset === "apple") return APPLE_COMPANY;
  return DEMO_COMPANY;
}

export function describeCompany(company: CompanyContext): string {
  const base = `${company.name} (${company.ticker})`;
  return company.isDemo ? `${base} · ${DEMO_LABEL}` : base;
}
