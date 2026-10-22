import { expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const appleRevenue = JSON.parse(
  fs.readFileSync(path.join(__dirname, "fixtures", "apple-revenue.json"), "utf8"),
) as Record<string, unknown>;

/** Serves a captured fixture-mode API response so tests do not need the .NET backend. */
export async function mockAppleApi(
  page: Page,
  overrides: Record<string, unknown> = {},
) {
  await page.route("**/api/companies/AAPL/financial-history**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...appleRevenue, ...overrides }),
    }),
  );
}

export async function openWalkthrough(page: Page) {
  await page.goto("/#prototype");
  await page.getByLabel(/I understand this is educational/).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Start the walkthrough" }).click();
  await expect(page.locator("#prototype-walkthrough")).toBeVisible();
}

export function walkthrough(page: Page) {
  return page.locator("#prototype-walkthrough");
}

export async function goToStep(page: Page, label: string) {
  await page
    .getByRole("navigation", { name: "Prototype steps" })
    .getByRole("button", { name: label })
    .click();
}

export async function showApple(page: Page) {
  await goToStep(page, "Finance");
  await page.getByRole("tab", { name: /Apple/ }).click();
  await expect(page.getByText("Ten-year trend summary")).toBeVisible();
}

export async function openGuidedAppleAnalysis(page: Page) {
  await showApple(page);
  await page.getByRole("button", { name: /(Start|Continue) guided Apple analysis/ }).click();
}

export async function walkToFirstBiasCheck(page: Page) {
  await openGuidedAppleAnalysis(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await page.getByRole("button", { name: "Continue to the evidence" }).click();
  await page.getByRole("button", { name: "Review evidence" }).click();
  await page.getByRole("button", { name: "Interpret this evidence" }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}

export const INTERNAL_JARGON = /\bfixtures?\b|\bsprints?\b|\bAPIs?\b|localhost|TenYearExplorer/i;

export async function expectNoInternalJargon(page: Page, where: string) {
  await expect(page.locator("body"), where).not.toContainText(INTERNAL_JARGON, {
    useInnerText: true,
  });
}

/** Defers the first stage, then jumps to the summary via saved state, as the remaining stages need more metrics. */
export async function openGuidedSummaryWithFirstStage(page: Page) {
  await walkToFirstBiasCheck(page);
  await page.getByRole("button", { name: "Skip this check" }).click();
  await page.getByRole("button", { name: "Continue to your judgment" }).click();
  await page.getByRole("button", { name: "Defer this judgment" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("aic.appleGuidedAnalysis.v1")))
    .toContain('"status":"defer"');
  await page.evaluate(() => {
    const key = "aic.appleGuidedAnalysis.v1";
    const saved = JSON.parse(window.localStorage.getItem(key)!);
    saved.currentScreen = "summary";
    window.localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.reload();
  await goToStep(page, "Finance");
  const summary = page.getByRole("button", { name: "Save to thesis" });
  const resume = page.getByRole("button", { name: "Continue guided Apple analysis" });
  await expect(summary.or(resume).first()).toBeVisible();
  if (await resume.isVisible()) await resume.click();
  await expect(summary).toBeVisible();
}
