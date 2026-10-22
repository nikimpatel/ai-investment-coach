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

const INSUFFICIENT_HISTORY = {
  status: "InsufficientHistory",
  detail: "Only 6 reliable annual points available; 10 requested.",
  years: 10,
  points: [],
  summary: null,
  warnings: [{ code: "X", message: "Sprint 3 fixture mode" }],
};
const INVALID_CONFIGURATION = {
  status: "InvalidConfiguration",
  detail: "SEC ApplicationName and ContactEmail must be configured for live requests. Set SEC__UseFixtureData=true for offline fixture mode.",
  points: [],
  summary: null,
  warnings: [{ code: "INVALID_CONFIGURATION", message: "Set SEC__UseFixtureData=true" }],
};
const UNAVAILABLE =
  "Apple’s data isn’t available right now. You can explore the Harborline demo instead.";

async function openAppleFinanceTab(page: import("@playwright/test").Page) {
  await openWalkthrough(page);
  await goToStep(page, "Finance");
  await page.getByRole("tab", { name: /Apple/ }).click();
}

async function openFirstGuidedStageEvidence(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Start guided Apple analysis" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await page.getByRole("button", { name: "Continue to the evidence" }).click();
  await page.getByRole("button", { name: "Review evidence" }).click();
}

test("a provider unavailable error is friendly and can be retried", async ({ page }) => {
  await mockAppleApi(page, {
    status: "ProviderUnavailable",
    detail: "Start the TenYearExplorer API (http://localhost:5080) and try again.",
    points: [],
    summary: null,
    warnings: [{ code: "X", message: "Sprint 3 fixture mode" }],
  });
  await openAppleFinanceTab(page);
  const alert = page.getByRole("alert").filter({ hasText: "Couldn’t load Apple’s data" });
  await expect(alert).toContainText(LOAD_ERROR);
  await expectNoInternalJargon(page, "provider unavailable");

  await page.unrouteAll();
  await mockAppleApi(page);
  await alert.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Ten-year trend summary")).toBeVisible();
});

test("a configuration error is not offered as retryable and points to the demo", async ({ page }) => {
  await mockAppleApi(page, INVALID_CONFIGURATION);
  await openAppleFinanceTab(page);
  const alert = page.getByRole("alert").filter({ hasText: UNAVAILABLE });
  await expect(alert).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0);
  await expect(page.getByText(LOAD_ERROR)).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(
    /SEC__|ApplicationName|ContactEmail|\.NET/,
    { useInnerText: true },
  );
  await expectNoInternalJargon(page, "invalid configuration");

  await alert.getByRole("button", { name: "Explore the Harborline demo" }).click();
  await expect(page.getByRole("tab", { name: "Harborline (Demo)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("Finance explains insufficient history with the year count and no retry", async ({ page }) => {
  await mockAppleApi(page, INSUFFICIENT_HISTORY);
  await openAppleFinanceTab(page);
  const alert = page.getByRole("alert").filter({ hasText: "Insufficient reliable history" });
  await expect(alert).toContainText(
    "There isn’t enough reliable yearly data to show this measure (we have 6 of 10 years). You can explore the Harborline demo instead.",
  );
  await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0);
  await expect(page.getByText(LOAD_ERROR)).toHaveCount(0);
  await expectNoInternalJargon(page, "finance insufficient history");

  await alert.getByRole("button", { name: "Explore the Harborline demo" }).click();
  await expect(page.getByRole("tab", { name: "Harborline (Demo)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("a network failure shows the friendly Apple error", async ({ page }) => {
  await page.route("**/api/companies/AAPL/financial-history**", (route) => route.abort());
  await openAppleFinanceTab(page);
  const alert = page.getByRole("alert").filter({ hasText: LOAD_ERROR });
  await expect(alert).toBeVisible();
  await expect(alert.getByRole("button", { name: "Try again" })).toBeVisible();
  await expectNoInternalJargon(page, "network failure");
});

test("the guided analysis explains insufficient history accurately, with no retry", async ({ page }) => {
  await mockAppleApi(page);
  await openWalkthrough(page);
  await showApple(page);
  await page.unrouteAll();
  await mockAppleApi(page, INSUFFICIENT_HISTORY);
  await openFirstGuidedStageEvidence(page);

  await expect(page.getByText("Evidence unavailable")).toBeVisible();
  await expect(
    page.getByText(
      "There isn’t enough reliable history for Apple to run the guided analysis (we have 6 of 10 years). You can explore the Harborline demo instead.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0);
  await expect(page.getByText(LOAD_ERROR)).toHaveCount(0);
  await expectNoInternalJargon(page, "guided insufficient history");

  await page.getByRole("button", { name: "Explore the Harborline demo" }).click();
  await expect(page.getByRole("tab", { name: "Harborline (Demo)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByTestId("company-context")).toContainText("Harborline Logistics (HLG)");
});

test("the guided analysis does not offer a retry for a configuration error", async ({ page }) => {
  await mockAppleApi(page);
  await openWalkthrough(page);
  await showApple(page);
  await page.unrouteAll();
  await mockAppleApi(page, INVALID_CONFIGURATION);
  await openFirstGuidedStageEvidence(page);

  await expect(page.getByText(UNAVAILABLE)).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Explore the Harborline demo" })).toBeVisible();
  await expectNoInternalJargon(page, "guided configuration error");
});

test("the guided analysis offers a retry for a temporary failure", async ({ page }) => {
  await mockAppleApi(page);
  await openWalkthrough(page);
  await showApple(page);
  await page.unrouteAll();
  await page.route("**/api/companies/AAPL/financial-history**", (route) => route.abort());
  await openFirstGuidedStageEvidence(page);

  await expect(page.getByText(LOAD_ERROR)).toBeVisible();
  await page.unrouteAll();
  await mockAppleApi(page);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("button", { name: "Interpret this evidence" })).toBeVisible();
});

test("the guided analysis uses the plain loading message", async ({ page }) => {
  await mockAppleApi(page);
  await openWalkthrough(page);
  await showApple(page);
  await page.unrouteAll();
  await page.route("**/api/companies/AAPL/financial-history**", () => {});
  await openFirstGuidedStageEvidence(page);
  await expect(page.getByText("Loading Apple’s annual figures…")).toBeVisible();
  await expect(page.getByText(/verified Apple annual history/)).toHaveCount(0);
});
