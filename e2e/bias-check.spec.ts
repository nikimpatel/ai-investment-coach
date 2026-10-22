import { expect, test } from "@playwright/test";
import {
  goToStep,
  mockAppleApi,
  openWalkthrough,
  showApple,
  walkToFirstBiasCheck,
} from "./helpers";

const EXPLAINER =
  "A bias check is one quick question that helps you notice when a common thinking shortcut, rather than the evidence, may be shaping your view.";

test.beforeEach(async ({ page }) => {
  await mockAppleApi(page);
  await openWalkthrough(page);
});

test("the guided analysis card explains the bias check before it starts", async ({ page }) => {
  await showApple(page);
  await expect(page.getByTestId("bias-check-explainer")).toHaveText(EXPLAINER);
});

test("the bias introduction and each bias check explain the term", async ({ page }) => {
  await showApple(page);
  await page.getByRole("button", { name: "Start guided Apple analysis" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Confirm" }).click();

  await expect(page.getByRole("heading", { name: "Pause before judging" })).toBeVisible();
  await expect(page.getByTestId("bias-check-explainer")).toHaveText(EXPLAINER);

  await page.getByRole("button", { name: "Continue to the evidence" }).click();
  await page.getByRole("button", { name: "Review evidence" }).click();
  await page.getByRole("button", { name: "Interpret this evidence" }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  const check = page.getByRole("group", { name: /Bias check ·/ });
  await expect(check).toBeVisible();
  await expect(check.getByTestId("bias-check-explainer")).toHaveText(EXPLAINER);

  await page.getByRole("button", { name: "Another check" }).click();
  await expect(check.getByTestId("bias-check-explainer")).toHaveText(EXPLAINER);
});

test("the review screen explains the bias check status it lists", async ({ page }) => {
  await walkToFirstBiasCheck(page);
  await page.getByRole("button", { name: "Skip this check" }).click();
  await page.getByRole("button", { name: "Continue to your judgment" }).click();
  await page.getByRole("button", { name: "Defer this judgment" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // Jump to the review screen via saved state, as the remaining stages need more API metrics.
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("aic.appleGuidedAnalysis.v1")))
    .toContain('"status":"defer"');
  await page.evaluate(() => {
    const key = "aic.appleGuidedAnalysis.v1";
    const saved = JSON.parse(window.localStorage.getItem(key)!);
    saved.currentScreen = "review";
    window.localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.reload();
  await goToStep(page, "Finance");
  const review = page.getByRole("heading", { name: "Bias and counter-evidence review" });
  const resume = page.getByRole("button", { name: "Continue guided Apple analysis" });
  await expect(review.or(resume)).toBeVisible();
  if (await resume.isVisible()) await resume.click();
  await expect(
    page.getByRole("heading", { name: "Bias and counter-evidence review" }),
  ).toBeVisible();
  await expect(page.getByTestId("bias-check-explainer")).toHaveText(EXPLAINER);
  await expect(page.getByText(/Bias check: skipped/)).toBeVisible();
});

test("recording a judgment before answering the bias check explains the bias check", async ({ page }) => {
  await walkToFirstBiasCheck(page);
  await page.getByRole("button", { name: "Continue to your judgment" }).click();
  await page.getByRole("button", { name: "Record a judgment" }).click();

  const blocked = page.getByText("Complete or explicitly skip the bias check before recording.");
  await expect(blocked).toBeVisible();
  await expect(blocked.getByTestId("bias-check-explainer")).toHaveText(EXPLAINER);
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeDisabled();
});

test("the interpretation field's name excludes the bias explainer, which describes it instead", async ({ page }) => {
  await walkToFirstBiasCheck(page);
  await page.getByRole("button", { name: "Continue to your judgment" }).click();
  await page.getByRole("button", { name: "Record a judgment" }).click();

  const field = page.getByRole("textbox", {
    name: "Your interpretation of this historical evidence",
    exact: true,
  });
  await expect(field).toHaveAccessibleName("Your interpretation of this historical evidence");
  await expect(field).toHaveAccessibleDescription(
    `Complete or explicitly skip the bias check before recording. ${EXPLAINER}`,
  );
});
