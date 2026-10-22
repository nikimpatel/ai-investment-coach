import { expect, test } from "@playwright/test";
import {
  expectNoInternalJargon,
  goToStep,
  mockAppleApi,
  openGuidedAppleAnalysis,
  openGuidedSummaryWithFirstStage,
  openWalkthrough,
  showApple,
} from "./helpers";

const LOAD_ERROR = "We couldn’t load Apple’s data right now. Please try again.";

test("the main flow screens show no internal build or tooling words", async ({ page }) => {
  await mockAppleApi(page);
  await page.goto("/#prototype");
  await expectNoInternalJargon(page, "landing");
  await openWalkthrough(page);
  for (const step of ["Research", "Finance", "Thesis", "Decision", "Reflect"]) {
    await goToStep(page, step);
    await expectNoInternalJargon(page, step);
  }
  await showApple(page);
  await expectNoInternalJargon(page, "Apple finance chart");
  await page.getByRole("tab", { name: "Table" }).click();
  await expectNoInternalJargon(page, "Apple finance table");
});

test("the Apple finance view has no fixture pill and a plain chart caption", async ({ page }) => {
  await mockAppleApi(page);
  await openWalkthrough(page);
  await showApple(page);
  await expect(page.getByText(/Apple SEC \(fixture\)/i)).toHaveCount(0);
  await expect(page.getByText("Revenue (USD). The chart matches the table.")).toBeVisible();
});

test("every guided stage screen uses plain language", async ({ page }) => {
  await mockAppleApi(page);
  await openWalkthrough(page);
  await openGuidedAppleAnalysis(page);
  await expectNoInternalJargon(page, "guided start");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expectNoInternalJargon(page, "bias introduction");
  await page.getByRole("button", { name: "Continue to the evidence" }).click();
  await expect(
    page.getByText("This stage looks at these figures from Apple’s annual filings:"),
  ).toBeVisible();
  await expectNoInternalJargon(page, "stage brief");
  await page.getByRole("button", { name: "Review evidence" }).click();
  await expectNoInternalJargon(page, "stage evidence");
  await page.getByRole("button", { name: "Interpret this evidence" }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expectNoInternalJargon(page, "bias check");
  await page.getByRole("button", { name: "Skip this check" }).click();
  await page.getByRole("button", { name: "Continue to your judgment" }).click();
  await page.getByRole("button", { name: "Record a judgment" }).click();
  await page
    .getByRole("textbox", { name: "Your interpretation of this historical evidence", exact: true })
    .fill("The ten-year revenue path rose overall, with some flat years.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByText("What would you need to know that these figures don’t show?"),
  ).toBeVisible();
  await expectNoInternalJargon(page, "after judgment");
});

test("the guided summary and saved thesis evidence use plain language", async ({ page }) => {
  await mockAppleApi(page);
  await openWalkthrough(page);
  await openGuidedSummaryWithFirstStage(page);
  await expectNoInternalJargon(page, "summary");
  await page.getByRole("button", { name: "Save to thesis" }).click();
  await page.getByRole("button", { name: "Exit guide" }).click();
  await goToStep(page, "Thesis");
  await expectNoInternalJargon(page, "Thesis with Apple evidence");
});

for (const [name, overrides] of [
  ["provider unavailable", { status: "ProviderUnavailable", detail: "Start the TenYearExplorer API (http://localhost:5080) and try again." }],
  ["invalid configuration", { status: "InvalidConfiguration", detail: "Set SEC__UseFixtureData=true for offline fixture mode." }],
] as const) {
  test(`a ${name} error is friendly and can be retried`, async ({ page }) => {
    await mockAppleApi(page, { ...overrides, points: [], summary: null, warnings: [{ code: "X", message: "Sprint 3 fixture mode" }] });
    await openWalkthrough(page);
    await goToStep(page, "Finance");
    await page.getByRole("tab", { name: /Apple/ }).click();
    const alert = page.getByRole("alert").filter({ hasText: "Couldn’t load Apple’s data" });
    await expect(alert).toContainText("Couldn’t load Apple’s data");
    await expect(alert).toContainText(LOAD_ERROR);
    await expectNoInternalJargon(page, name);

    await page.unrouteAll();
    await mockAppleApi(page);
    await alert.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByText("Ten-year trend summary")).toBeVisible();
  });
}

test("a network failure shows the friendly Apple error", async ({ page }) => {
  await page.route("**/api/companies/AAPL/financial-history**", (route) => route.abort());
  await openWalkthrough(page);
  await goToStep(page, "Finance");
  await page.getByRole("tab", { name: /Apple/ }).click();
  await expect(page.getByRole("alert").filter({ hasText: LOAD_ERROR })).toBeVisible();
  await expectNoInternalJargon(page, "network failure");
});

test("a guided stage that cannot load shows the friendly Apple error", async ({ page }) => {
  await mockAppleApi(page);
  await openWalkthrough(page);
  await showApple(page);
  await page.unrouteAll();
  await mockAppleApi(page, {
    status: "InsufficientHistory",
    detail: "Sprint 3 supports only years=10.",
    summary: null,
  });
  await page.getByRole("button", { name: "Start guided Apple analysis" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await page.getByRole("button", { name: "Continue to the evidence" }).click();
  await page.getByRole("button", { name: "Review evidence" }).click();
  await expect(page.getByText("Evidence unavailable")).toBeVisible();
  await expect(page.getByText(LOAD_ERROR)).toBeVisible();
  await expectNoInternalJargon(page, "guided load error");
});
