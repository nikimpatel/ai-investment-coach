import { expect, test } from "@playwright/test";
import { goToStep, mockAppleApi, openWalkthrough } from "./helpers";

const reasons = [
  /^Why we ask: What first draws you in shapes what you look for next; if it was a growth story or recent news, the Thesis step reminds you to check valuation\.$/,
  /^Why we ask: How long you plan to stay invested decides which risks/,
  /^Why we ask: Writing evidence down separates facts from the story/,
  /^Why we ask: Naming what could break the idea now/,
  /^Why we ask: Listing your gaps shows what to research next/,
];

test.beforeEach(async ({ page }) => {
  await mockAppleApi(page);
  await openWalkthrough(page);
});

test("every wizard step shows why we ask and whether it is required", async ({ page }) => {
  for (const [index, reason] of reasons.entries()) {
    await expect(page.getByText(`Question ${index + 1} of 5`)).toBeVisible();
    await expect(page.getByTestId("why-we-ask")).toHaveCount(1);
    await expect(page.getByTestId("why-we-ask")).toHaveText(reason);
    await expect(page.getByTestId("question-requirement")).toHaveText("Required");
    if (index < reasons.length - 1) {
      await page.getByRole("button", { name: "Next question" }).click();
    }
  }
  await expect(page.getByRole("button", { name: "Review performance" })).toBeEnabled();
});

test("the note on the first question is marked optional and is not needed to continue", async ({ page }) => {
  await expect(page.getByTestId("note-requirement")).toHaveText("Optional");
  await page.getByRole("textbox", { name: /Note/ }).fill("");
  await expect(page.getByRole("button", { name: "Next question" })).toBeEnabled();
});

test("required written answers still block Next when too short", async ({ page }) => {
  await page.getByRole("button", { name: "Next question" }).click();
  await page.getByRole("button", { name: "Next question" }).click();
  const evidence = page.getByRole("textbox", { name: /What evidence supports the idea/ });
  await evidence.fill("too short");
  await expect(page.getByRole("button", { name: "Next question" })).toBeDisabled();
  await evidence.fill("Filings show steady contract renewals.");
  await expect(page.getByRole("button", { name: "Next question" })).toBeEnabled();
});

test("the Thesis valuation reminder appears only for growth-story or recent-news answers", async ({ page }) => {
  const reminder = page.getByText("Possible missing reasoning");
  const cases = [
    ["A growth story that clicked", true],
    ["Recent news or a podcast", true],
    ["I recognise the brand or sector", false],
    ["It looked reasonably valued", false],
    ["Income / dividend appeal", false],
    ["Someone I trust mentioned it", false],
  ] as const;
  for (const [answer, shown] of cases) {
    await goToStep(page, "Research");
    await page.getByRole("radio", { name: answer }).check();
    await goToStep(page, "Thesis");
    await expect(page.getByRole("heading", { name: "Structure your reasoning" })).toBeVisible();
    if (shown) await expect(reminder, answer).toBeVisible();
    else await expect(reminder, answer).toHaveCount(0);
  }
});
