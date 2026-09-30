import test from "node:test";
import assert from "node:assert/strict";
import {
  GUIDED_ANALYSIS_STORAGE_KEY,
  saveGuidedAnalysis,
  type StorageLike,
} from "../src/lib/guided-analysis-storage";
import { createGuidedAnalysis } from "../src/lib/guided-analysis";
import {
  PROTOTYPE_BRIEFING_DISMISSED_KEY,
  isBriefingDismissedValue,
  readBriefingDismissed,
  writeBriefingDismissed,
  type BriefingStorage,
} from "../src/lib/prototype-briefing-storage";

function makeStorage(): BriefingStorage & StorageLike & { snapshot(): Map<string, string> } {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => {
      values.delete(key);
    },
    snapshot: () => new Map(values),
  };
}

test("briefing dismissal uses its own key and does not alter guided analysis", () => {
  const storage = makeStorage();
  const analysis = createGuidedAnalysis("2026-09-28T00:00:00.000Z", "analysis-1");
  saveGuidedAnalysis(storage, analysis);
  const before = storage.getItem(GUIDED_ANALYSIS_STORAGE_KEY);

  assert.equal(readBriefingDismissed(storage), false);
  writeBriefingDismissed(storage);

  assert.equal(readBriefingDismissed(storage), true);
  assert.equal(storage.getItem(GUIDED_ANALYSIS_STORAGE_KEY), before);
  assert.notEqual(PROTOTYPE_BRIEFING_DISMISSED_KEY, GUIDED_ANALYSIS_STORAGE_KEY);
});

test("missing, invalid, or unreadable briefing values show the briefing", () => {
  assert.equal(isBriefingDismissedValue(null), false);
  assert.equal(isBriefingDismissedValue(""), false);
  assert.equal(isBriefingDismissedValue("true"), false);
  assert.equal(isBriefingDismissedValue("dismissed"), false);
  assert.equal(isBriefingDismissedValue("{"), false);
  assert.equal(isBriefingDismissedValue("[]"), false);
  assert.equal(isBriefingDismissedValue('{"dismissed":false}'), false);
  assert.equal(isBriefingDismissedValue('{"dismissed":"true"}'), false);
  assert.equal(isBriefingDismissedValue('{"dismissed":true}'), true);

  const throwing: BriefingStorage = {
    getItem: () => {
      throw new Error("storage unavailable");
    },
    setItem: () => {
      throw new Error("storage unavailable");
    },
  };
  assert.equal(readBriefingDismissed(throwing), false);
  assert.throws(() => writeBriefingDismissed(throwing));
});
