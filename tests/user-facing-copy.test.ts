import test from "node:test";
import assert from "node:assert/strict";
import {
  APPLE_INSUFFICIENT_HISTORY_MESSAGE,
  APPLE_LOADING_MESSAGE,
  APPLE_LOAD_ERROR_MESSAGE,
  APPLE_LOAD_ERROR_TITLE,
  APPLE_UNSUPPORTED_METRIC_MESSAGE,
  MISSING_INFORMATION_HINT,
  STAGE_EVIDENCE_INTRO,
  appleChartCaption,
  appleTableCaption,
  containsInternalJargon,
} from "../src/lib/user-facing-copy";
import { APPLE_METRIC_OPTIONS } from "../src/lib/apple-metrics";
import { BIAS_CHECK_EXPLAINER, BIAS_LIBRARY } from "../src/lib/bias-library";
import { appleProvenance, demoProvenance } from "../src/lib/data-provenance";
import { GUIDED_STAGES } from "../src/lib/guided-analysis";
import { harborlineRevenueSeries } from "../src/lib/harborline-financials";
import { RESEARCH_WIZARD_STEPS } from "../src/lib/research-wizard";

test("the jargon detector catches internal build and tooling words", () => {
  for (const text of [
    "SEC EDGAR fixture",
    "Apple SEC (fixture)",
    "This stage uses existing Sprint 1–3 evidence only",
    "Financial API unavailable",
    "Start the TenYearExplorer API (http://localhost:5080) and try again.",
  ]) {
    assert.equal(containsInternalJargon(text), true, text);
  }
  assert.equal(containsInternalJargon("Revenue (USD). The chart matches the table."), false);
  assert.equal(containsInternalJargon("Rapid growth"), false);
});

test("the Apple load error is friendly and names no internal tooling", () => {
  assert.equal(APPLE_LOAD_ERROR_MESSAGE, "We couldn’t load Apple’s data right now. Please try again.");
  assert.doesNotMatch(APPLE_LOAD_ERROR_MESSAGE, /localhost|TenYearExplorer|\.NET|http/i);
});

test("the Apple chart caption is plain", () => {
  assert.equal(appleChartCaption("Revenue", "USD"), "Revenue (USD). The chart matches the table.");
});

test("no user-facing copy contains internal jargon", () => {
  const copy: string[] = [
    APPLE_INSUFFICIENT_HISTORY_MESSAGE,
    APPLE_LOADING_MESSAGE,
    APPLE_LOAD_ERROR_MESSAGE,
    APPLE_LOAD_ERROR_TITLE,
    APPLE_UNSUPPORTED_METRIC_MESSAGE,
    MISSING_INFORMATION_HINT,
    STAGE_EVIDENCE_INTRO,
    BIAS_CHECK_EXPLAINER,
    ...Object.values(BIAS_LIBRARY).flatMap((bias) => [bias.name, bias.prompt]),
    ...RESEARCH_WIZARD_STEPS.map((step) => step.whyWeAsk),
    ...GUIDED_STAGES.flatMap((stage) => [stage.name, stage.shortName, ...stage.openQuestions]),
    ...APPLE_METRIC_OPTIONS.flatMap((option) => [
      option.label,
      option.shortDescription,
      appleChartCaption(option.label, "USD"),
      appleTableCaption(option.label),
    ]),
  ];
  const demo = demoProvenance(harborlineRevenueSeries);
  copy.push(demo.source, demo.date);
  for (const sourceProvider of ["SEC EDGAR fixture", "SEC EDGAR"]) {
    const provenance = appleProvenance({
      sourceProvider,
      retrievedAtUtc: "2026-10-22T03:25:25Z",
      filingDates: ["2025-10-31"],
    });
    copy.push(provenance.source, provenance.date);
  }
  for (const text of copy) {
    assert.equal(containsInternalJargon(text), false, text);
  }
});
