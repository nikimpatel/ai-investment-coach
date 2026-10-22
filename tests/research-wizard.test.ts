import test from "node:test";
import assert from "node:assert/strict";
import {
  MIN_WRITTEN_ANSWER_LENGTH,
  RESEARCH_WIZARD_STEPS,
  canAdvanceResearchStep,
  requirementLabel,
} from "../src/lib/research-wizard";
import type { ResearchAnswers } from "../src/lib/types";

const empty: ResearchAnswers = {
  attraction: "",
  attractionNote: "",
  timeHorizon: "",
  evidence: "",
  risks: "",
  uncertainties: "",
};

test("the wizard has five steps, each with a one-line reason", () => {
  assert.deepEqual(
    RESEARCH_WIZARD_STEPS.map((step) => step.id),
    ["attraction", "time-horizon", "evidence", "risks", "uncertainties"],
  );
  for (const step of RESEARCH_WIZARD_STEPS) {
    assert.ok(step.whyWeAsk.trim().length > 20, step.id);
    assert.doesNotMatch(step.whyWeAsk, /\n/, step.id);
    assert.equal(step.whyWeAsk.trim().split(/(?<=[.!?])\s+/).length, 1, step.id);
    assert.doesNotMatch(step.whyWeAsk, /\b(buy|sell|hold)\b/i, step.id);
  }
});

test("requirement labels are Required or Optional", () => {
  assert.equal(requirementLabel(true), "Required");
  assert.equal(requirementLabel(false), "Optional");
});

test("steps marked required block Next until answered", () => {
  RESEARCH_WIZARD_STEPS.forEach((step, index) => {
    if (step.required) {
      assert.equal(canAdvanceResearchStep(index, empty), false, step.id);
    }
  });
});

test("the optional attraction note never blocks the first step", () => {
  assert.equal(canAdvanceResearchStep(0, { ...empty, attraction: "valuation" }), true);
  assert.equal(
    canAdvanceResearchStep(0, { ...empty, attraction: "valuation", attractionNote: "" }),
    true,
  );
});

test("written answers need a short sentence, matching the previous threshold", () => {
  const short = "x".repeat(MIN_WRITTEN_ANSWER_LENGTH - 1);
  const enough = "x".repeat(MIN_WRITTEN_ANSWER_LENGTH);
  assert.equal(MIN_WRITTEN_ANSWER_LENGTH, 13);
  assert.equal(canAdvanceResearchStep(2, { ...empty, evidence: short }), false);
  assert.equal(canAdvanceResearchStep(2, { ...empty, evidence: enough }), true);
  assert.equal(canAdvanceResearchStep(3, { ...empty, risks: `  ${short}  ` }), false);
  assert.equal(canAdvanceResearchStep(4, { ...empty, uncertainties: enough }), true);
  assert.equal(canAdvanceResearchStep(1, { ...empty, timeHorizon: "3-5-years" }), true);
});

test("unknown steps cannot advance", () => {
  assert.equal(canAdvanceResearchStep(99, empty), false);
});
