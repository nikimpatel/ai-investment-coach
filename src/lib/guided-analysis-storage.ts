import {
  GUIDED_STAGE_IDS,
  createGuidedAnalysis,
  createStageRecord,
  type AppleGuidedAnalysisV1,
  type GuidedStageId,
  type StageRecord,
} from "./guided-analysis";

export const GUIDED_ANALYSIS_STORAGE_KEY = "aic.appleGuidedAnalysis.v1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type GuidedAnalysisLoadResult =
  | { status: "empty" }
  | { status: "ok"; value: AppleGuidedAnalysisV1; raw: string }
  | { status: "newer-version"; version: number; raw: string }
  | { status: "invalid"; raw: string };

function mergeStageRecord(
  stageId: GuidedStageId,
  value: Partial<StageRecord> | undefined,
): StageRecord {
  const fallback = createStageRecord(stageId);
  return {
    ...fallback,
    ...value,
    biasCheck: {
      ...fallback.biasCheck,
      ...(value?.biasCheck ?? {}),
    },
    judgment: {
      ...fallback.judgment,
      ...(value?.judgment ?? {}),
      history: Array.isArray(value?.judgment?.history) ? value.judgment.history : [],
    },
    post: {
      ...fallback.post,
      ...(value?.post ?? {}),
    },
  };
}

function normalizeV1(value: Record<string, unknown>): AppleGuidedAnalysisV1 {
  const now = typeof value.updatedAt === "string" ? value.updatedAt : new Date(0).toISOString();
  const analysisId = typeof value.analysisId === "string" ? value.analysisId : "restored-analysis";
  const fallback = createGuidedAnalysis(now, analysisId);
  const stagesValue =
    value.stages && typeof value.stages === "object"
      ? (value.stages as Partial<Record<GuidedStageId, Partial<StageRecord>>>)
      : {};
  const circle =
    value.circleOfCompetence && typeof value.circleOfCompetence === "object"
      ? (value.circleOfCompetence as Partial<AppleGuidedAnalysisV1["circleOfCompetence"]>)
      : {};
  const review =
    value.review && typeof value.review === "object"
      ? (value.review as Partial<AppleGuidedAnalysisV1["review"]>)
      : {};
  const summary =
    value.summary && typeof value.summary === "object"
      ? (value.summary as Partial<AppleGuidedAnalysisV1["summary"]>)
      : {};

  return {
    ...fallback,
    ...value,
    schemaVersion: 1,
    analysisId,
    company: "AAPL",
    circleOfCompetence: {
      ...fallback.circleOfCompetence,
      ...circle,
      chips: Array.isArray(circle.chips)
        ? circle.chips.filter((item): item is string => typeof item === "string")
        : [],
    },
    stages: Object.fromEntries(
      GUIDED_STAGE_IDS.map((stageId) => [
        stageId,
        mergeStageRecord(stageId, stagesValue[stageId]),
      ]),
    ) as Record<GuidedStageId, StageRecord>,
    review: { ...fallback.review, ...review },
    summary: {
      ...fallback.summary,
      ...summary,
      selectedPacketIds: Array.isArray(summary.selectedPacketIds)
        ? summary.selectedPacketIds.filter(
            (item): item is string => typeof item === "string",
          )
        : [],
    },
  } as AppleGuidedAnalysisV1;
}

export function parseGuidedAnalysis(raw: string | null): GuidedAnalysisLoadResult {
  if (raw === null) return { status: "empty" };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { status: "invalid", raw };
    }
    const object = parsed as Record<string, unknown>;
    const version = typeof object.schemaVersion === "number" ? object.schemaVersion : 0;
    if (version > 1) {
      return { status: "newer-version", version, raw };
    }
    if (version !== 1) {
      return { status: "invalid", raw };
    }
    return { status: "ok", value: normalizeV1(object), raw };
  } catch {
    return { status: "invalid", raw };
  }
}

export function serializeGuidedAnalysis(value: AppleGuidedAnalysisV1): string {
  return JSON.stringify(value);
}

export function loadGuidedAnalysis(storage: StorageLike): GuidedAnalysisLoadResult {
  return parseGuidedAnalysis(storage.getItem(GUIDED_ANALYSIS_STORAGE_KEY));
}

export function saveGuidedAnalysis(
  storage: StorageLike,
  value: AppleGuidedAnalysisV1,
): void {
  storage.setItem(GUIDED_ANALYSIS_STORAGE_KEY, serializeGuidedAnalysis(value));
}

export function resetGuidedAnalysis(storage: StorageLike): void {
  storage.removeItem(GUIDED_ANALYSIS_STORAGE_KEY);
}
