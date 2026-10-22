import test from "node:test";
import assert from "node:assert/strict";
import {
  appleProvenance,
  demoProvenance,
  formatProvenanceDate,
  latestFilingDate,
} from "../src/lib/data-provenance";
import { harborlineRevenueSeries } from "../src/lib/harborline-financials";

const filingDates = ["2016-10-26", "2025-10-31", "2024-11-01"];

test("demo data is described as invented, with its fictional period", () => {
  const provenance = demoProvenance(harborlineRevenueSeries);
  assert.match(provenance.source, /invented for this prototype/i);
  assert.match(provenance.source, /not from any filing/i);
  assert.equal(
    provenance.date,
    "Fictional figures for FY2016–FY2025; no real-world date applies.",
  );
});

test("demo provenance tolerates an empty series", () => {
  assert.equal(demoProvenance({ points: [] }).date, "Fictional figures; no real-world date applies.");
});

test("latest filing date ignores missing or malformed values", () => {
  assert.equal(latestFilingDate(filingDates), "2025-10-31");
  assert.equal(latestFilingDate([undefined, null, "not-a-date"]), null);
  assert.equal(latestFilingDate([]), null);
});

test("dates are formatted in UTC so they do not shift by timezone", () => {
  assert.equal(formatProvenanceDate("2025-10-31"), "Oct 31, 2025");
  assert.equal(formatProvenanceDate("2026-10-22T23:30:00Z"), "Oct 22, 2026");
  assert.equal(formatProvenanceDate("garbage"), "garbage");
});

test("fixture mode names SEC EDGAR, says it is a saved copy, and hides the request time", () => {
  const provenance = appleProvenance({
    sourceProvider: "SEC EDGAR fixture",
    retrievedAtUtc: "2026-10-22T03:25:25Z",
    filingDates,
  });
  assert.match(provenance.source, /SEC EDGAR/);
  assert.match(provenance.source, /public annual filings \(Form 10-K\)/);
  assert.match(provenance.source, /saved copy/);
  assert.match(provenance.date, /Latest filing in this data: Oct 31, 2025\./);
  assert.match(provenance.date, /capture date is not recorded/);
  assert.doesNotMatch(provenance.date, /Oct 22, 2026/);
});

test("live mode shows the latest filing and when it was fetched", () => {
  const provenance = appleProvenance({
    sourceProvider: "SEC EDGAR",
    retrievedAtUtc: "2026-10-22T03:25:25Z",
    filingDates,
  });
  assert.match(provenance.source, /fetched live/);
  assert.equal(
    provenance.date,
    "Latest filing in this data: Oct 31, 2025. Fetched from the SEC on Oct 22, 2026.",
  );
});

test("an unrecognised provider is shown as reported instead of guessed", () => {
  const provenance = appleProvenance({
    sourceProvider: "Some Vendor",
    retrievedAtUtc: null,
    filingDates: [undefined],
  });
  assert.equal(provenance.source, "Some Vendor");
  assert.equal(provenance.date, "Filing dates not available.");
  assert.equal(
    appleProvenance({ sourceProvider: " ", retrievedAtUtc: null, filingDates: [] }).source,
    "Source not reported by the data service.",
  );
});

test("guided evidence date shows only the filing date, never the fixture request time", () => {
  const provenance = appleProvenance({
    sourceProvider: "SEC EDGAR fixture",
    retrievedAtUtc: "2026-10-22T03:25:25Z",
    filingDates: ["2025-10-31"],
  });
  assert.equal(
    provenance.date,
    "Latest filing in this data: Oct 31, 2025. The saved copy’s capture date is not recorded in the data.",
  );
  assert.doesNotMatch(provenance.date, /saved to this analysis|Oct 22, 2026/i);
});
