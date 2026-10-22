import test from "node:test";
import assert from "node:assert/strict";
import { BIAS_CHECK_EXPLAINER } from "../src/lib/bias-library";
import {
  canRecordJudgment,
  containsRecommendationLanguage,
  createStageRecord,
} from "../src/lib/guided-analysis";

test("the bias check is explained in one plain sentence", () => {
  const sentences = BIAS_CHECK_EXPLAINER.trim().split(/(?<=[.!?])\s+/);
  assert.equal(sentences.length, 1);
  assert.match(BIAS_CHECK_EXPLAINER, /^A bias check is /);
  assert.match(BIAS_CHECK_EXPLAINER, /\.$/);
  assert.ok(BIAS_CHECK_EXPLAINER.split(/\s+/).length <= 30);
});

test("the explanation avoids jargon, diagnosis and recommendations", () => {
  assert.doesNotMatch(BIAS_CHECK_EXPLAINER, /heuristic|cognitive|diagnos/i);
  assert.equal(containsRecommendationLanguage(BIAS_CHECK_EXPLAINER), false);
});

test("recording is blocked until the bias check is answered, which is when the explanation is shown", () => {
  const stage = createStageRecord("revenue-growth");
  assert.equal(stage.biasCheck.status, "unseen");
  assert.equal(canRecordJudgment(stage, "Revenue grew steadily."), false);
  for (const status of ["acknowledged", "noted", "skipped"] as const) {
    assert.equal(
      canRecordJudgment({ ...stage, biasCheck: { ...stage.biasCheck, status } }, "Revenue grew."),
      true,
      status,
    );
  }
});
