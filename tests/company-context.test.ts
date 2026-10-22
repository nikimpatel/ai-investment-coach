import test from "node:test";
import assert from "node:assert/strict";
import {
  APPLE_COMPANY,
  DEMO_COMPANY,
  DEMO_LABEL,
  REAL_COMPANY_LABEL,
  describeCompaniesOnScreen,
  describeCompany,
  getActiveCompany,
  getCompaniesOnScreen,
} from "../src/lib/company-context";
import { harborlineRevenueSeries } from "../src/lib/harborline-financials";
import { sampleCompany } from "../src/lib/sample-data";
import type { PrototypeStep } from "../src/lib/types";

const steps: PrototypeStep[] = ["research", "performance", "thesis", "decision", "reflection"];

test("the demo company matches the fictional Harborline data and is labelled Demo", () => {
  assert.equal(DEMO_COMPANY.name, sampleCompany.name);
  assert.equal(DEMO_COMPANY.name, harborlineRevenueSeries.companyName);
  assert.equal(DEMO_COMPANY.ticker, harborlineRevenueSeries.ticker);
  assert.equal(DEMO_COMPANY.isDemo, true);
  assert.equal(DEMO_LABEL, "Demo");
  assert.equal(describeCompany(DEMO_COMPANY), "Harborline Logistics (HLG) · Demo");
});

test("Apple is never labelled Demo", () => {
  assert.equal(APPLE_COMPANY.isDemo, false);
  assert.equal(describeCompany(APPLE_COMPANY), "Apple Inc. (AAPL)");
  assert.doesNotMatch(describeCompany(APPLE_COMPANY), /demo/i);
});

test("every step resolves to a company, so one is always shown", () => {
  for (const step of steps) {
    for (const financeDataset of ["harborline", "apple"] as const) {
      for (const guidedOpen of [false, true]) {
        const company = getActiveCompany({ step, financeDataset, guidedOpen });
        assert.ok(company.name && company.ticker, `${step}/${financeDataset}/${guidedOpen}`);
      }
    }
  }
});

test("only the finance step follows the dataset toggle", () => {
  assert.equal(
    getActiveCompany({ step: "performance", financeDataset: "harborline", guidedOpen: false }),
    DEMO_COMPANY,
  );
  assert.equal(
    getActiveCompany({ step: "performance", financeDataset: "apple", guidedOpen: false }),
    APPLE_COMPANY,
  );
  for (const step of steps.filter((candidate) => candidate !== "performance")) {
    assert.equal(
      getActiveCompany({ step, financeDataset: "apple", guidedOpen: false }),
      DEMO_COMPANY,
      step,
    );
  }
});

test("the guided analysis is always about Apple", () => {
  assert.equal(
    getActiveCompany({ step: "performance", financeDataset: "harborline", guidedOpen: true }),
    APPLE_COMPANY,
  );
});

test("Thesis names Apple alongside Harborline when Apple evidence is on the page", () => {
  const companies = getCompaniesOnScreen({
    step: "thesis",
    financeDataset: "harborline",
    guidedOpen: false,
    thesisHasAppleEvidence: true,
  });
  assert.deepEqual(companies, [DEMO_COMPANY, APPLE_COMPANY]);
  assert.equal(
    describeCompaniesOnScreen(companies),
    "Harborline Logistics (HLG) · Demo with evidence from Apple Inc. (AAPL)",
  );
  assert.equal(REAL_COMPANY_LABEL, "Real company");
});

test("Thesis without Apple evidence names only Harborline", () => {
  const companies = getCompaniesOnScreen({
    step: "thesis",
    financeDataset: "apple",
    guidedOpen: false,
    thesisHasAppleEvidence: false,
  });
  assert.deepEqual(companies, [DEMO_COMPANY]);
});

test("Apple evidence saved in the thesis only changes the Thesis label", () => {
  for (const step of steps.filter((candidate) => candidate !== "thesis")) {
    const companies = getCompaniesOnScreen({
      step,
      financeDataset: "harborline",
      guidedOpen: false,
      thesisHasAppleEvidence: true,
    });
    assert.deepEqual(companies, [DEMO_COMPANY], step);
  }
});
