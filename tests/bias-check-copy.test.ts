import test from "node:test";
import assert from "node:assert/strict";
import { BIAS_CHECK_EXPLAINER } from "../src/lib/bias-library";
import { containsRecommendationLanguage } from "../src/lib/guided-analysis";

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
