import type { AppleFinancialHistoryResponse } from "./apple-financial-api";
import type { AppleMetricId } from "./apple-metrics";
import type { BiasId } from "./bias-library";
import type { EvidenceRelationship } from "./types";

export const GUIDED_STAGE_IDS = [
  "revenue-growth",
  "profitability-margins",
  "profit-vs-cash",
  "capex-fcf",
  "cash-debt-position",
] as const;

export type GuidedStageId = (typeof GUIDED_STAGE_IDS)[number];

export type GuidedStageStep =
  | "brief"
  | "evidence"
  | "interpretation"
  | "bias"
  | "judgment"
  | "post";

export type GuidedScreenId =
  | "coc-capture"
  | "coc-interpretation"
  | "bias-intro"
  | `stage:${GuidedStageId}:${GuidedStageStep}`
  | "review"
  | "summary";

export type CircleStatus = "empty" | "confirmed" | "corrected" | "skipped";
export type ExplanationStatus = "unseen" | "confirmed" | "corrected" | "skipped";
export type BiasCheckStatus = "unseen" | "acknowledged" | "noted" | "skipped";
export type JudgmentStatus = "none" | "record" | "defer" | "uncertain";
export type SourceMode = "fixture" | "live" | "unknown";

export interface CircleChip {
  id: string;
  label: string;
  area: string | null;
}

export const CIRCLE_CHIPS: readonly CircleChip[] = [
  { id: "consumer-user", label: "Consumer electronics as a user", area: "Consumer electronics" },
  { id: "platform-user", label: "Software / platforms as a user", area: "Software platforms" },
  { id: "retail-brand", label: "Retail or brand businesses", area: "Retail" },
  { id: "supply-chain", label: "Manufacturing or supply chains", area: "Supply chains" },
  { id: "statements", label: "Financial statements generally", area: "Financial statements" },
  { id: "cash-flow", label: "Cash flow statements", area: "Cash flow statements" },
  { id: "balance-sheet", label: "Balance sheets / debt", area: "Balance sheets and debt" },
  { id: "technology", label: "Technology investing generally", area: "Technology investing" },
  { id: "apple", label: "Apple specifically", area: "Apple" },
  { id: "none-yet", label: "I don’t have one yet", area: null },
] as const;

export interface CircleInterpretation {
  areas: string[];
  wording: string;
}

export interface MetricSnapshot {
  metric: AppleMetricId;
  metricLabel: string;
  fiscalYears: string;
  startValue: string;
  endValue: string;
  sourceProvider: string;
  retrievedAtUtc: string;
  formula: string | null;
  isDerived: boolean;
}

export interface StageEvidenceSnapshot {
  metrics: MetricSnapshot[];
  calculations: string[];
  explanations: string[];
  openQuestions: string[];
  sourceProvider: string;
  retrievedAtUtc: string;
}

export interface JudgmentHistoryEntry {
  status: Exclude<JudgmentStatus, "none">;
  text: string;
  confidence: number | null;
  recordedAt: string;
}

export interface StageRecord {
  visitedAt: string | null;
  explanationStatus: ExplanationStatus;
  explanationCorrection: string;
  analogyShown: boolean;
  biasCheck: {
    biasId: BiasId;
    status: BiasCheckStatus;
    note: string;
  };
  judgment: {
    status: JudgmentStatus;
    text: string;
    confidence: number | null;
    recordedAt: string | null;
    revisedAt: string | null;
    history: JudgmentHistoryEntry[];
  };
  post: {
    counterEvidence: string;
    alternativeExplanations: string;
    missingInformation: string;
    mindChanger: string;
    completed: boolean;
    completeLaterChosen: boolean;
  };
  evidenceSnapshot: StageEvidenceSnapshot | null;
}

export interface AnalysisPacket {
  id: string;
  analysisId: string;
  stageId: GuidedStageId;
  stageName: string;
  factSnapshot: MetricSnapshot[];
  calculations: string[];
  deterministicExplanation: string[];
  learnerCorrection: string;
  judgmentStatus: Exclude<JudgmentStatus, "none">;
  judgmentText: string;
  biasCheckStatus: BiasCheckStatus;
  reviewIncomplete: boolean;
  sourceProvider: string;
  relationship: EvidenceRelationship;
  savedAt: string;
}

export interface AppleGuidedAnalysisV1 {
  schemaVersion: 1;
  analysisId: string;
  createdAt: string;
  updatedAt: string;
  company: "AAPL";
  sourceMode: SourceMode;
  currentScreen: GuidedScreenId;
  circleOfCompetence: {
    chips: string[];
    note: string;
    interpretation: string;
    status: CircleStatus;
    revisedAfterJudgment: boolean;
  };
  biasIntroCompletedAt: string | null;
  stages: Record<GuidedStageId, StageRecord>;
  review: { completedAt: string | null };
  summary: {
    generatedAt: string | null;
    selectedPacketIds: string[];
  };
}

export interface GuidedStageDefinition {
  id: GuidedStageId;
  name: string;
  shortName: string;
  metrics: AppleMetricId[];
  primaryBias: BiasId;
  secondaryBias: BiasId;
  openQuestions: string[];
}

export const GUIDED_STAGES: readonly GuidedStageDefinition[] = [
  {
    id: "revenue-growth",
    name: "Revenue and growth",
    shortName: "Revenue",
    metrics: ["revenue"],
    primaryBias: "recency",
    secondaryBias: "anchoring",
    openQuestions: ["What is outside this ten-year revenue history?"],
  },
  {
    id: "profitability-margins",
    name: "Profitability and margins",
    shortName: "Margins",
    metrics: ["gross-profit", "operating-income", "net-income"],
    primaryBias: "narrative",
    secondaryBias: "confirmation",
    openQuestions: ["Which mix, cost, or one-off effects are not explained by the margins?"],
  },
  {
    id: "profit-vs-cash",
    name: "Profit versus cash generation",
    shortName: "Profit vs cash",
    metrics: ["net-income", "operating-cash-flow"],
    primaryBias: "confirmation",
    secondaryBias: "recency",
    openQuestions: ["What timing or working-capital effects could explain the difference?"],
  },
  {
    id: "capex-fcf",
    name: "Capital expenditure and free cash flow",
    shortName: "CapEx & FCF",
    metrics: ["capital-expenditure", "free-cash-flow"],
    primaryBias: "overconfidence",
    secondaryBias: "recency",
    openQuestions: ["How much CapEx was maintenance versus growth spending?"],
  },
  {
    id: "cash-debt-position",
    name: "Cash, debt and financial position",
    shortName: "Cash & debt",
    metrics: ["cash-and-equivalents", "total-debt"],
    primaryBias: "halo",
    secondaryBias: "anchoring",
    openQuestions: ["Which assets, obligations, or liquidity constraints are outside net debt?"],
  },
] as const;

export function getGuidedStage(stageId: GuidedStageId): GuidedStageDefinition {
  const stage = GUIDED_STAGES.find((candidate) => candidate.id === stageId);
  if (!stage) {
    throw new Error(`Unknown guided stage: ${stageId}`);
  }
  return stage;
}

export function normalizeCircleChips(chips: string[]): string[] {
  const accepted = new Set(CIRCLE_CHIPS.map((chip) => chip.id));
  const unique = [...new Set(chips.filter((chip) => accepted.has(chip)))];
  if (unique.includes("none-yet")) {
    return ["none-yet"];
  }
  return unique;
}

export function interpretCircleOfCompetence(
  chips: string[],
  note: string,
): CircleInterpretation {
  const normalized = normalizeCircleChips(chips);
  const areas = normalized
    .map((id) => CIRCLE_CHIPS.find((chip) => chip.id === id)?.area)
    .filter((area): area is string => Boolean(area));

  if (/\bretail(?:\s+business)?\b/i.test(note) && !areas.includes("Retail")) {
    areas.push("Retail");
  }

  if (areas.length === 0 && !note.trim()) {
    return {
      areas: [],
      wording:
        "You have not defined a circle of competence yet. You can still review Apple’s reported facts and leave judgments uncertain.",
    };
  }

  const described = areas.length > 0 ? areas.join(", ") : "your optional note";
  const noteSuffix = note.trim() ? ` Your note: “${note.trim()}”.` : "";
  return {
    areas,
    wording:
      `You described your current circle as: ${described}.${noteSuffix} ` +
      "You have not claimed this is complete. Apple’s evidence here is limited to reported annual financial history; it proves neither competence nor incompetence.",
  };
}

export function createStageRecord(stageId: GuidedStageId): StageRecord {
  const stage = getGuidedStage(stageId);
  return {
    visitedAt: null,
    explanationStatus: "unseen",
    explanationCorrection: "",
    analogyShown: false,
    biasCheck: {
      biasId: stage.primaryBias,
      status: "unseen",
      note: "",
    },
    judgment: {
      status: "none",
      text: "",
      confidence: null,
      recordedAt: null,
      revisedAt: null,
      history: [],
    },
    post: {
      counterEvidence: "",
      alternativeExplanations: "",
      missingInformation: "",
      mindChanger: "",
      completed: false,
      completeLaterChosen: false,
    },
    evidenceSnapshot: null,
  };
}

export function createGuidedAnalysis(
  now: string,
  analysisId: string,
): AppleGuidedAnalysisV1 {
  return {
    schemaVersion: 1,
    analysisId,
    createdAt: now,
    updatedAt: now,
    company: "AAPL",
    sourceMode: "unknown",
    currentScreen: "coc-capture",
    circleOfCompetence: {
      chips: [],
      note: "",
      interpretation: "",
      status: "empty",
      revisedAfterJudgment: false,
    },
    biasIntroCompletedAt: null,
    stages: Object.fromEntries(
      GUIDED_STAGE_IDS.map((stageId) => [stageId, createStageRecord(stageId)]),
    ) as Record<GuidedStageId, StageRecord>,
    review: { completedAt: null },
    summary: { generatedAt: null, selectedPacketIds: [] },
  };
}

export function canRecordJudgment(stage: StageRecord, text = stage.judgment.text): boolean {
  return stage.biasCheck.status !== "unseen" && text.trim().length > 0;
}

export function updateJudgment(
  stage: StageRecord,
  next: {
    status: Exclude<JudgmentStatus, "none">;
    text: string;
    confidence: number | null;
  },
  now: string,
): StageRecord {
  if (next.status === "record" && !canRecordJudgment(stage, next.text)) {
    throw new Error("A recorded judgment requires a bias-check response and judgment text.");
  }
  if (next.confidence !== null && (next.confidence < 1 || next.confidence > 10)) {
    throw new Error("Confidence must be between 1 and 10.");
  }

  const current = stage.judgment;
  const firstConfidence =
    current.status === next.status &&
    current.text === next.text &&
    current.confidence === null &&
    next.confidence !== null &&
    current.history.length === 0 &&
    current.revisedAt === null;
  const hasPrior =
    !firstConfidence &&
    current.status !== "none" &&
    (current.status !== next.status ||
      current.text !== next.text ||
      current.confidence !== next.confidence);
  const history = [...current.history];
  if (hasPrior && current.recordedAt) {
    history.push({
      status: current.status as Exclude<JudgmentStatus, "none">,
      text: current.text,
      confidence: current.confidence,
      recordedAt: current.recordedAt,
    });
  }

  return {
    ...stage,
    judgment: {
      status: next.status,
      text: next.text,
      confidence: next.confidence,
      recordedAt: current.recordedAt ?? now,
      revisedAt: hasPrior ? now : current.revisedAt,
      history,
    },
  };
}

export function sourceModeFromProvider(sourceProvider: string): SourceMode {
  const normalized = sourceProvider.toLowerCase();
  if (normalized.includes("fixture")) return "fixture";
  if (normalized.includes("sec")) return "live";
  return "unknown";
}

export function metricSnapshotFromResponse(
  data: AppleFinancialHistoryResponse,
  format: (value: number, displayFormat: string, currency: string) => string,
): MetricSnapshot {
  if (!data.summary) {
    throw new Error(`Cannot snapshot ${data.metric} without a summary.`);
  }
  return {
    metric: data.metric as AppleMetricId,
    metricLabel: data.metricLabel,
    fiscalYears: `${data.summary.startFiscalYear} → ${data.summary.endFiscalYear}`,
    startValue: format(data.summary.startValue, data.displayFormat, data.currency),
    endValue: format(data.summary.endValue, data.displayFormat, data.currency),
    sourceProvider: data.sourceProvider,
    retrievedAtUtc: data.retrievedAtUtc,
    formula: data.formula,
    isDerived: data.isDerived,
  };
}

export function isStageReviewIncomplete(stage: StageRecord): boolean {
  if (stage.judgment.status !== "record") return false;
  return !stage.post.completed;
}

export function isAnalysisCompletable(analysis: AppleGuidedAnalysisV1): boolean {
  if (!analysis.biasIntroCompletedAt) return false;
  return GUIDED_STAGE_IDS.every((stageId) => {
    const stage = analysis.stages[stageId];
    if (!stage.visitedAt || stage.judgment.status === "none") return false;
    if (stage.judgment.status !== "record") return true;
    return (
      stage.biasCheck.status !== "unseen" &&
      (stage.post.completed || stage.post.completeLaterChosen)
    );
  });
}

export function buildAnalysisPacket(
  analysis: AppleGuidedAnalysisV1,
  stageId: GuidedStageId,
  relationship: EvidenceRelationship,
  now: string,
): AnalysisPacket {
  const stage = analysis.stages[stageId];
  if (!stage.evidenceSnapshot || stage.judgment.status === "none") {
    throw new Error("A visited stage with a judgment is required to build a packet.");
  }
  return {
    id: `${analysis.analysisId}:${stageId}`,
    analysisId: analysis.analysisId,
    stageId,
    stageName: getGuidedStage(stageId).name,
    factSnapshot: stage.evidenceSnapshot.metrics,
    calculations: stage.evidenceSnapshot.calculations,
    deterministicExplanation: stage.evidenceSnapshot.explanations,
    learnerCorrection: stage.explanationCorrection,
    judgmentStatus: stage.judgment.status,
    judgmentText: stage.judgment.text,
    biasCheckStatus: stage.biasCheck.status,
    reviewIncomplete: isStageReviewIncomplete(stage),
    sourceProvider: stage.evidenceSnapshot.sourceProvider,
    relationship,
    savedAt: now,
  };
}

export interface AppleAnalysisSummary {
  disclaimer: string;
  circleOfCompetence: {
    interpretation: string;
    status: CircleStatus;
    revisedAfterJudgment: boolean;
  };
  stages: Array<{
    id: GuidedStageId;
    name: string;
    facts: MetricSnapshot[];
    calculations: string[];
    explanations: string[];
    learnerCorrection: string;
    judgment: StageRecord["judgment"];
    biasCheck: StageRecord["biasCheck"];
    counterEvidence: string;
    alternativeExplanations: string;
    missingInformation: string;
    mindChanger: string;
    reviewIncomplete: boolean;
    openQuestions: string[];
  }>;
}

export function assembleAppleAnalysisSummary(
  analysis: AppleGuidedAnalysisV1,
): AppleAnalysisSummary {
  return {
    disclaimer:
      "Educational decision-support only. This summary is not personal financial advice or an investment recommendation.",
    circleOfCompetence: {
      interpretation: analysis.circleOfCompetence.interpretation,
      status: analysis.circleOfCompetence.status,
      revisedAfterJudgment: analysis.circleOfCompetence.revisedAfterJudgment,
    },
    stages: GUIDED_STAGE_IDS.map((stageId) => {
      const stage = analysis.stages[stageId];
      const definition = getGuidedStage(stageId);
      return {
        id: stageId,
        name: definition.name,
        facts: stage.evidenceSnapshot?.metrics ?? [],
        calculations: stage.evidenceSnapshot?.calculations ?? [],
        explanations: stage.evidenceSnapshot?.explanations ?? [],
        learnerCorrection: stage.explanationCorrection,
        judgment: stage.judgment,
        biasCheck: stage.biasCheck,
        counterEvidence: stage.post.counterEvidence,
        alternativeExplanations: stage.post.alternativeExplanations,
        missingInformation: stage.post.missingInformation,
        mindChanger: stage.post.mindChanger,
        reviewIncomplete: isStageReviewIncomplete(stage),
        openQuestions: stage.evidenceSnapshot?.openQuestions ?? definition.openQuestions,
      };
    }),
  };
}

export function containsRecommendationLanguage(value: unknown): boolean {
  const serialized = JSON.stringify(value).toLowerCase();
  return /\b(buy|sell|hold)\b/.test(serialized) || serialized.includes("quality score");
}
