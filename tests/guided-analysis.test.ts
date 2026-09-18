import test from "node:test";
import assert from "node:assert/strict";
import {
  GUIDED_STAGE_IDS,
  GUIDED_STAGES,
  assembleAppleAnalysisSummary,
  buildAnalysisPacket,
  canRecordJudgment,
  containsRecommendationLanguage,
  createGuidedAnalysis,
  interpretCircleOfCompetence,
  isAnalysisCompletable,
  updateJudgment,
  type MetricSnapshot,
} from "../src/lib/guided-analysis";
import {
  GUIDED_ANALYSIS_STORAGE_KEY,
  loadGuidedAnalysis,
  parseGuidedAnalysis,
  resetGuidedAnalysis,
  saveGuidedAnalysis,
  type StorageLike,
} from "../src/lib/guided-analysis-storage";
import { GUIDED_ANALOGIES } from "../src/lib/guided-analogies";

const now = "2026-09-18T00:00:00.000Z";

function makeMetricSnapshot(metric = "revenue"): MetricSnapshot {
  return {
    metric: metric as MetricSnapshot["metric"],
    metricLabel: "Revenue",
    fiscalYears: "FY2016 → FY2025",
    startValue: "$215.64b",
    endValue: "$416.16b",
    sourceProvider: "SEC EDGAR fixture",
    retrievedAtUtc: now,
    formula: null,
    isDerived: false,
  };
}

function makeStorage(initial: string | null = null): StorageLike {
  const values = new Map<string, string>();
  if (initial !== null) values.set(GUIDED_ANALYSIS_STORAGE_KEY, initial);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("Circle of Competence handles empty, chips, notes, Retail mapping, and none-yet", () => {
  const empty = interpretCircleOfCompetence([], "");
  assert.deepEqual(empty.areas, []);
  assert.match(empty.wording, /not defined/i);

  const chips = interpretCircleOfCompetence(["cash-flow"], "");
  assert.deepEqual(chips.areas, ["Cash flow statements"]);

  const retail = interpretCircleOfCompetence([], "I understand a retail business.");
  assert.deepEqual(retail.areas, ["Retail"]);

  const note = interpretCircleOfCompetence([], "I work around supply chains.");
  assert.deepEqual(note.areas, []);
  assert.match(note.wording, /optional note/i);

  const none = interpretCircleOfCompetence(["none-yet", "apple"], "");
  assert.deepEqual(none.areas, []);
});

test("bias assignments are complete and deterministic for all five stages", () => {
  assert.deepEqual(
    GUIDED_STAGES.map((stage) => stage.id),
    GUIDED_STAGE_IDS,
  );
  for (const stage of GUIDED_STAGES) {
    assert.ok(stage.primaryBias);
    assert.ok(stage.secondaryBias);
    assert.notEqual(stage.primaryBias, stage.secondaryBias);
  }
});

test("all five analogies include a limitation", () => {
  assert.deepEqual(Object.keys(GUIDED_ANALOGIES), [...GUIDED_STAGE_IDS]);
  for (const analogy of Object.values(GUIDED_ANALOGIES)) {
    assert.ok(analogy.comparison.length > 10);
    assert.ok(analogy.limitation.length > 10);
  }
});

test("storage round-trips v1 and keeps unknown future versions untouched", () => {
  const analysis = createGuidedAnalysis(now, "analysis-1");
  analysis.currentScreen = "stage:revenue-growth:evidence";
  const storage = makeStorage();
  saveGuidedAnalysis(storage, analysis);
  const restored = loadGuidedAnalysis(storage);
  assert.equal(restored.status, "ok");
  if (restored.status === "ok") {
    assert.equal(restored.value.currentScreen, analysis.currentScreen);
  }

  const futureRaw = '{"schemaVersion":2,"important":"keep-me"}';
  const future = parseGuidedAnalysis(futureRaw);
  assert.deepEqual(future, { status: "newer-version", version: 2, raw: futureRaw });

  resetGuidedAnalysis(storage);
  assert.equal(loadGuidedAnalysis(storage).status, "empty");
});

test("storage defaults missing optional v1 fields", () => {
  const result = parseGuidedAnalysis(
    JSON.stringify({
      schemaVersion: 1,
      analysisId: "partial",
      createdAt: now,
      updatedAt: now,
      company: "AAPL",
    }),
  );
  assert.equal(result.status, "ok");
  if (result.status === "ok") {
    assert.equal(result.value.currentScreen, "coc-capture");
    assert.equal(result.value.stages["capex-fcf"].judgment.status, "none");
    assert.deepEqual(result.value.summary.selectedPacketIds, []);
  }
});

test("Record is blocked until a bias response and text exist; defer and uncertain are allowed", () => {
  const analysis = createGuidedAnalysis(now, "analysis-2");
  const stage = analysis.stages["revenue-growth"];
  assert.equal(canRecordJudgment(stage, "Historical revenue increased."), false);
  assert.throws(
    () =>
      updateJudgment(
        stage,
        { status: "record", text: "Historical revenue increased.", confidence: null },
        now,
      ),
    /bias-check response/i,
  );

  const deferred = updateJudgment(
    stage,
    { status: "defer", text: "", confidence: null },
    now,
  );
  assert.equal(deferred.judgment.status, "defer");
  const uncertain = updateJudgment(
    stage,
    { status: "uncertain", text: "", confidence: null },
    now,
  );
  assert.equal(uncertain.judgment.status, "uncertain");
});

test("judgment and confidence edits retain history instead of silently overwriting", () => {
  const analysis = createGuidedAnalysis(now, "analysis-3");
  let stage = analysis.stages["revenue-growth"];
  stage = {
    ...stage,
    biasCheck: { ...stage.biasCheck, status: "acknowledged" },
  };
  stage = updateJudgment(
    stage,
    { status: "record", text: "Revenue history became stronger.", confidence: 6 },
    now,
  );
  stage = updateJudgment(
    stage,
    { status: "record", text: "Revenue history ended stronger, with uneven years.", confidence: 5 },
    "2026-09-18T01:00:00.000Z",
  );
  assert.equal(stage.judgment.history.length, 1);
  assert.equal(stage.judgment.history[0]?.confidence, 6);
  assert.equal(stage.judgment.revisedAt, "2026-09-18T01:00:00.000Z");
});

test("summary preserves layers and thesis packets exclude analogies", () => {
  const analysis = createGuidedAnalysis(now, "analysis-4");
  let stage = analysis.stages["revenue-growth"];
  stage = {
    ...stage,
    visitedAt: now,
    explanationStatus: "confirmed",
    analogyShown: true,
    biasCheck: { ...stage.biasCheck, status: "acknowledged" },
    evidenceSnapshot: {
      metrics: [makeMetricSnapshot()],
      calculations: ["Revenue CAGR was 7.6%."],
      explanations: ["The ending revenue level was higher than the starting level."],
      openQuestions: ["What explains product mix?"],
      sourceProvider: "SEC EDGAR fixture",
      retrievedAtUtc: now,
    },
  };
  stage = updateJudgment(
    stage,
    { status: "record", text: "The historical path supports a measured view.", confidence: 5 },
    now,
  );
  analysis.stages["revenue-growth"] = stage;

  const summary = assembleAppleAnalysisSummary(analysis);
  assert.equal(summary.stages[0]?.facts.length, 1);
  assert.equal(summary.stages[0]?.calculations.length, 1);
  assert.equal(summary.stages[0]?.judgment.status, "record");

  const packet = buildAnalysisPacket(analysis, "revenue-growth", "supports", now);
  const serializedPacket = JSON.stringify(packet);
  assert.equal(serializedPacket.includes(GUIDED_ANALOGIES["revenue-growth"].comparison), false);
  assert.equal(packet.sourceProvider, "SEC EDGAR fixture");
  assert.equal(packet.id, "analysis-4:revenue-growth");
});

test("analysis can complete with deferred or uncertain stages and marks Complete later records", () => {
  const analysis = createGuidedAnalysis(now, "analysis-5");
  analysis.biasIntroCompletedAt = now;
  for (const [index, stageId] of GUIDED_STAGE_IDS.entries()) {
    const stage = analysis.stages[stageId];
    analysis.stages[stageId] = {
      ...updateJudgment(
        stage,
        { status: index % 2 === 0 ? "defer" : "uncertain", text: "", confidence: null },
        now,
      ),
      visitedAt: now,
    };
  }
  assert.equal(isAnalysisCompletable(analysis), true);

  let recorded = analysis.stages["revenue-growth"];
  recorded = {
    ...recorded,
    biasCheck: { ...recorded.biasCheck, status: "skipped" },
  };
  recorded = updateJudgment(
    recorded,
    { status: "record", text: "A historical interpretation.", confidence: 4 },
    now,
  );
  analysis.stages["revenue-growth"] = {
    ...recorded,
    post: { ...recorded.post, completeLaterChosen: true },
  };
  assert.equal(isAnalysisCompletable(analysis), true);
});

test("generated structures do not contain recommendations or a quality score", () => {
  const analysis = createGuidedAnalysis(now, "analysis-6");
  assert.equal(containsRecommendationLanguage(assembleAppleAnalysisSummary(analysis)), false);
  assert.equal(containsRecommendationLanguage(GUIDED_STAGES), false);
});
