import { sampleCompany } from "./sample-data";
import type { PrototypeStep } from "./types";

export type DatasetMode = "harborline" | "apple";

export interface CompanyContext {
  name: string;
  ticker: string;
  isDemo: boolean;
}

export const DEMO_LABEL = "Demo";
export const REAL_COMPANY_LABEL = "Real company";
export const EVIDENCE_JOINER = "with evidence from";

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

/**
 * Companies whose data is on screen. Thesis is the only later step that shows
 * saved Apple evidence alongside the Harborline thesis.
 */
export function getCompaniesOnScreen({
  step,
  financeDataset,
  guidedOpen,
  thesisHasAppleEvidence,
}: {
  step: PrototypeStep;
  financeDataset: DatasetMode;
  guidedOpen: boolean;
  thesisHasAppleEvidence: boolean;
}): CompanyContext[] {
  const primary = getActiveCompany({ step, financeDataset, guidedOpen });
  if (step === "thesis" && thesisHasAppleEvidence) return [primary, APPLE_COMPANY];
  return [primary];
}

export function describeCompaniesOnScreen(companies: CompanyContext[]): string {
  return companies.map(describeCompany).join(` ${EVIDENCE_JOINER} `);
}

export function describeCompany(company: CompanyContext): string {
  const base = `${company.name} (${company.ticker})`;
  return company.isDemo ? `${base} · ${DEMO_LABEL}` : base;
}
