import { expect, test } from "@playwright/test";
import {
  goToStep,
  mockAppleApi,
  openGuidedAppleAnalysis,
  openWalkthrough,
  showApple,
  walkthrough,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await mockAppleApi(page);
  await openWalkthrough(page);
});

test("the demo company is named and labelled Demo on every Harborline step", async ({ page }) => {
  const context = page.getByTestId("company-context");
  for (const step of ["Research", "Finance", "Thesis", "Decision", "Reflect"]) {
    await goToStep(page, step);
    await expect(context, step).toHaveText(/Analysing\s*Harborline Logistics \(HLG\)\s*Demo/);
  }
});

test("switching the finance dataset switches the company label", async ({ page }) => {
  const context = page.getByTestId("company-context");
  await goToStep(page, "Finance");
  await expect(page.getByRole("tab", { name: "Harborline (Demo)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(context).toContainText("Demo");

  await showApple(page);
  await expect(context).toHaveText(/Analysing\s*Apple Inc\. \(AAPL\)\s*Real company/);
  await expect(context).not.toContainText("Demo");

  await page.getByRole("tab", { name: "Harborline (Demo)" }).click();
  await expect(context).toContainText("Harborline Logistics (HLG)");
  await expect(context).toContainText("Demo");
});

test("the guided Apple analysis keeps the company visible", async ({ page }) => {
  await openGuidedAppleAnalysis(page);
  await expect(page.getByText(/Apple guided analysis/)).toBeVisible();
  const context = page.getByTestId("company-context");
  await expect(context).toBeVisible();
  await expect(context).toContainText("Apple Inc. (AAPL)");

  await page.getByRole("button", { name: "Exit guide" }).click();
  await expect(context).toContainText("Apple Inc. (AAPL)");
  await goToStep(page, "Thesis");
  await expect(context).toContainText("Harborline Logistics (HLG)");
});

test("the company label sits inside the walkthrough without clipping", async ({ page }) => {
  const context = page.getByTestId("company-context");
  const box = await context.boundingBox();
  const frame = await walkthrough(page).boundingBox();
  expect(box && frame).toBeTruthy();
  expect(box!.x).toBeGreaterThanOrEqual(frame!.x);
  expect(box!.x + box!.width).toBeLessThanOrEqual(frame!.x + frame!.width + 1);
});
