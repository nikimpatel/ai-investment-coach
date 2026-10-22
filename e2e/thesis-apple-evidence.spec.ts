import { expect, test } from "@playwright/test";
import {
  goToStep,
  mockAppleApi,
  openGuidedSummaryWithFirstStage,
  openWalkthrough,
  showApple,
} from "./helpers";

const APPLE_SOURCE =
  "SEC EDGAR: Apple’s public annual filings (Form 10-K), from a saved copy bundled with this app.";

test.beforeEach(async ({ page }) => {
  await mockAppleApi(page);
  await openWalkthrough(page);
});

test("Thesis names Apple when guided Apple evidence is saved to it", async ({ page }) => {
  await openGuidedSummaryWithFirstStage(page);
  await page.getByRole("button", { name: "Save to thesis" }).click();
  await expect(page.getByRole("button", { name: "Update thesis packet" })).toBeVisible();
  await page.getByRole("button", { name: "Exit guide" }).click();
  await goToStep(page, "Thesis");

  await expect(page.getByTestId("company-context")).toHaveText(
    /Analysing\s*Harborline Logistics \(HLG\)\s*Demo\s*with evidence from\s*Apple Inc\. \(AAPL\)\s*Real company/,
  );

  const section = page.getByRole("region", { name: "Guided Apple analysis evidence" });
  await expect(section.getByTestId("guided-analysis-packets-company")).toHaveText(
    /Apple Inc\. \(AAPL\)\s*Real company/,
  );
  const provenance = section.getByTestId("data-provenance");
  await expect(provenance).toContainText(`Source: ${APPLE_SOURCE}`);
  await expect(provenance).toContainText("Date: Latest filing in this data: Oct 31, 2025.");
  await expect(section).not.toContainText("SEC EDGAR fixture");
  await expect(page.locator("body")).not.toContainText(/fixture/i, { useInnerText: true });
});

test("Thesis names Apple when an Apple performance observation is added", async ({ page }) => {
  await showApple(page);
  await page.getByLabel(/Your relationship to the thesis/).selectOption("supports");
  await page.getByRole("button", { name: "Add to thesis", exact: true }).click();
  await goToStep(page, "Thesis");

  await expect(page.getByTestId("company-context")).toContainText(
    "with evidence from",
  );
  await expect(page.getByTestId("performance-evidence-company")).toHaveText(
    /Apple Inc\. \(AAPL\)\s*Real company/,
  );
  await expect(page.getByText(APPLE_SOURCE)).toBeVisible();
});

test("Decision and Reflect stay Harborline only after Apple evidence is saved", async ({ page }) => {
  await openGuidedSummaryWithFirstStage(page);
  await page.getByRole("button", { name: "Save to thesis" }).click();
  await page.getByRole("button", { name: "Exit guide" }).click();
  for (const step of ["Decision", "Reflect"]) {
    await goToStep(page, step);
    const context = page.getByTestId("company-context");
    await expect(context, step).toHaveText(/^Analysing\s*Harborline Logistics \(HLG\)\s*Demo$/);
    await expect(page.locator("body"), step).not.toContainText("Apple Inc.", {
      useInnerText: true,
    });
  }
});
