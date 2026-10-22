import { expect, test } from "@playwright/test";
import {
  goToStep,
  mockAppleApi,
  openGuidedAppleAnalysis,
  openWalkthrough,
  showApple,
} from "./helpers";

test("the demo company says its figures are invented and which years they cover", async ({ page }) => {
  await mockAppleApi(page);
  await openWalkthrough(page);
  await goToStep(page, "Finance");
  const provenance = page.getByTestId("data-provenance");
  await expect(provenance).toContainText(
    "Source: Invented for this prototype. Not from any filing, exchange or data provider.",
  );
  await expect(provenance).toContainText(
    "Date: Fictional figures for FY2016–FY2025; no real-world date applies.",
  );
});

test("Apple fixture data names the public SEC source and the latest filing date", async ({ page }) => {
  await mockAppleApi(page);
  await openWalkthrough(page);
  await showApple(page);
  const provenance = page.getByTestId("data-provenance");
  await expect(provenance).toContainText("SEC EDGAR: Apple’s public annual filings (Form 10-K)");
  await expect(provenance).toContainText("saved copy bundled with this app");
  await expect(provenance).toContainText("Latest filing in this data: Oct 31, 2025.");
  await expect(provenance).toContainText("capture date is not recorded");
  await expect(provenance).not.toContainText("Oct 22, 2026");
});

test("live Apple data also shows when it was fetched from the SEC", async ({ page }) => {
  await mockAppleApi(page, { sourceProvider: "SEC EDGAR" });
  await openWalkthrough(page);
  await showApple(page);
  const provenance = page.getByTestId("data-provenance");
  await expect(provenance).toContainText("fetched live");
  await expect(provenance).toContainText(
    "Latest filing in this data: Oct 31, 2025. Fetched from the SEC on Oct 22, 2026.",
  );
});

test("guided evidence keeps the source and filing date", async ({ page }) => {
  await mockAppleApi(page);
  await openWalkthrough(page);
  await openGuidedAppleAnalysis(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await page.getByRole("button", { name: "Continue to the evidence" }).click();
  await page.getByRole("button", { name: "Review evidence" }).click();

  const provenance = page.getByTestId("data-provenance");
  await expect(provenance).toContainText("SEC EDGAR: Apple’s public annual filings (Form 10-K)");
  await expect(provenance).toContainText(
    "Date: Latest filing in this data: Oct 31, 2025. The saved copy’s capture date is not recorded in the data.",
  );
  await expect(provenance).not.toContainText("Saved to this analysis");
  await expect(provenance).not.toContainText("Oct 22, 2026");
});
