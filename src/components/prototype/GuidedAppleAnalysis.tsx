"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAppleFinancialHistory,
  type AppleFinancialHistoryResponse,
  type AppleRelationshipSeries,
} from "@/lib/apple-financial-api";
import {
  buildAppleBeginnerExplanation,
  buildAppleMarginExplanation,
  buildAppleSummarySentences,
} from "@/lib/apple-trend-copy";
import { BIAS_LIBRARY } from "@/lib/bias-library";
import {
  CIRCLE_CHIPS,
  GUIDED_STAGE_IDS,
  assembleAppleAnalysisSummary,
  buildAnalysisPacket,
  getGuidedStage,
  interpretCircleOfCompetence,
  isAnalysisCompletable,
  metricSnapshotFromResponse,
  normalizeCircleChips,
  sourceModeFromProvider,
  updateJudgment,
  type AnalysisPacket,
  type AppleGuidedAnalysisV1,
  type GuidedScreenId,
  type GuidedStageId,
  type GuidedStageStep,
  type StageEvidenceSnapshot,
  type StageRecord,
} from "@/lib/guided-analysis";
import { GUIDED_ANALOGIES } from "@/lib/guided-analogies";
import {
  formatAppleMetricValue,
  formatMarginPercent,
  formatNetDebtValue,
} from "@/lib/apple-metrics";
import type { EvidenceRelationship } from "@/lib/types";

interface GuidedAppleAnalysisProps {
  analysis: AppleGuidedAnalysisV1;
  onChange: (analysis: AppleGuidedAnalysisV1) => void;
  onExit: () => void;
  onReset: () => void;
  onSavePacket: (packet: AnalysisPacket) => void;
  savedPacketIds: string[];
}

const LAYER_CLASS =
  "rounded-xl border border-line bg-paper px-3 py-2.5 text-xs leading-relaxed";
const ACTION_CLASS =
  "rounded-xl border border-line px-3 py-2 text-xs font-medium text-ink transition hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const PRIMARY_CLASS =
  "rounded-xl bg-accent px-3 py-2 text-xs font-medium text-paper transition enabled:hover:bg-accent-deep disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function nowIso() {
  return new Date().toISOString();
}

function parseStageScreen(
  screen: GuidedScreenId,
): { stageId: GuidedStageId; step: GuidedStageStep } | null {
  if (!screen.startsWith("stage:")) return null;
  const [, stageId, step] = screen.split(":");
  if (
    !GUIDED_STAGE_IDS.includes(stageId as GuidedStageId) ||
    !["brief", "evidence", "interpretation", "bias", "judgment", "post"].includes(
      step,
    )
  ) {
    return null;
  }
  return {
    stageId: stageId as GuidedStageId,
    step: step as GuidedStageStep,
  };
}

function stageScreen(stageId: GuidedStageId, step: GuidedStageStep): GuidedScreenId {
  return `stage:${stageId}:${step}`;
}

function nextStageScreen(stageId: GuidedStageId): GuidedScreenId {
  const index = GUIDED_STAGE_IDS.indexOf(stageId);
  const next = GUIDED_STAGE_IDS[index + 1];
  return next ? stageScreen(next, "brief") : "review";
}

function relationshipSpan(
  series: AppleRelationshipSeries | null,
): { start: number | null; end: number | null } {
  if (!series) return { start: null, end: null };
  const available = series.points.filter((point) => point.isAvailable && point.value !== null);
  return {
    start: available[0]?.value ?? null,
    end: available.at(-1)?.value ?? null,
  };
}

function relationshipCalculation(
  stageId: GuidedStageId,
  responses: AppleFinancialHistoryResponse[],
): string[] {
  const relationships = responses.find((response) => response.relationships)?.relationships;
  if (!relationships) return [];
  if (stageId === "profit-vs-cash" && relationships.cashConversion) {
    const span = relationshipSpan(relationships.cashConversion);
    return [
      `${relationships.cashConversion.formula}: ${formatMarginPercent(span.start)} → ${formatMarginPercent(span.end)}.`,
    ];
  }
  if (stageId === "capex-fcf" && relationships.freeCashFlowMargin) {
    const span = relationshipSpan(relationships.freeCashFlowMargin);
    return [
      `${relationships.freeCashFlowMargin.formula}: ${formatMarginPercent(span.start)} → ${formatMarginPercent(span.end)}.`,
    ];
  }
  if (stageId === "cash-debt-position" && relationships.netDebt) {
    const available = relationships.netDebt.points.filter(
      (point) => point.isAvailable && point.value !== null,
    );
    const first = available[0];
    const last = available.at(-1);
    return [
      `${relationships.netDebt.formula}: ${formatNetDebtValue(first?.value, first?.isNetCash ?? false, "USD")} → ${formatNetDebtValue(last?.value, last?.isNetCash ?? false, "USD")}.`,
    ];
  }
  return [];
}

function buildEvidenceSnapshot(
  stageId: GuidedStageId,
  responses: AppleFinancialHistoryResponse[],
): StageEvidenceSnapshot {
  const invalid = responses.find(
    (response) =>
      !["Success", "PartiallySupported"].includes(response.status) || !response.summary,
  );
  if (invalid) {
    throw new Error(
      invalid.detail || `Reliable ${invalid.metricLabel || invalid.metric} history is unavailable.`,
    );
  }
  const sourceProvider = responses[0]?.sourceProvider ?? "Unknown";
  const retrievedAtUtc = responses
    .map((response) => response.retrievedAtUtc)
    .sort()
    .at(-1) ?? nowIso();
  const calculations = responses.flatMap(buildAppleSummarySentences);
  if (stageId === "profitability-margins" && responses[0]) {
    calculations.push(...buildAppleMarginExplanation(responses[0]));
  }
  calculations.push(...relationshipCalculation(stageId, responses));
  return {
    metrics: responses.map((response) =>
      metricSnapshotFromResponse(
        response,
        (value, displayFormat, currency) =>
          formatAppleMetricValue(value, displayFormat, currency).compact,
      ),
    ),
    calculations,
    explanations: responses.map(buildAppleBeginnerExplanation),
    openQuestions: getGuidedStage(stageId).openQuestions,
    sourceProvider,
    retrievedAtUtc,
  };
}

export function GuidedAppleAnalysis({
  analysis,
  onChange,
  onExit,
  onReset,
  onSavePacket,
  savedPacketIds,
}: GuidedAppleAnalysisProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const loadingStageRef = useRef<GuidedStageId | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [packetRelationships, setPacketRelationships] = useState<
    Partial<Record<GuidedStageId, EvidenceRelationship>>
  >({});
  const stageContext = parseStageScreen(analysis.currentScreen);

  useEffect(() => {
    headingRef.current?.focus();
  }, [analysis.currentScreen]);

  useEffect(() => {
    if (!stageContext || stageContext.step !== "evidence") return;
    const { stageId } = stageContext;
    if (
      analysis.stages[stageId].evidenceSnapshot ||
      loadingStageRef.current === stageId ||
      loadError
    ) {
      return;
    }
    let cancelled = false;
    loadingStageRef.current = stageId;
    const definition = getGuidedStage(stageId);
    void Promise.all(definition.metrics.map(fetchAppleFinancialHistory))
      .then((responses) => {
        if (cancelled) return;
        const snapshot = buildEvidenceSnapshot(stageId, responses);
        const next = {
          ...analysis,
          sourceMode: sourceModeFromProvider(snapshot.sourceProvider),
          updatedAt: nowIso(),
          stages: {
            ...analysis.stages,
            [stageId]: {
              ...analysis.stages[stageId],
              visitedAt: analysis.stages[stageId].visitedAt ?? nowIso(),
              evidenceSnapshot: snapshot,
            },
          },
        };
        onChange(next);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load Apple evidence.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) loadingStageRef.current = null;
      });
    return () => {
      cancelled = true;
    };
  }, [analysis, loadError, onChange, stageContext]);

  const setScreen = (screen: GuidedScreenId) =>
    onChange({ ...analysis, currentScreen: screen, updatedAt: nowIso() });

  const updateStage = (stageId: GuidedStageId, stage: StageRecord) =>
    onChange({
      ...analysis,
      updatedAt: nowIso(),
      stages: { ...analysis.stages, [stageId]: stage },
    });

  const progressLabel = useMemo(() => {
    if (analysis.currentScreen.startsWith("coc-")) return "Circle of Competence";
    if (analysis.currentScreen === "bias-intro") return "Bias introduction";
    if (analysis.currentScreen === "review") return "Review";
    if (analysis.currentScreen === "summary") return "Summary";
    if (stageContext) {
      const index = GUIDED_STAGE_IDS.indexOf(stageContext.stageId) + 1;
      return `Stage ${index} of 5`;
    }
    return "Guided analysis";
  }, [analysis.currentScreen, stageContext]);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-line px-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-accent-deep">
              Apple guided analysis · {progressLabel}
            </p>
            <h3
              ref={headingRef}
              tabIndex={-1}
              className="mt-1 font-display text-lg text-ink outline-none"
            >
              {screenTitle(analysis.currentScreen)}
            </h3>
          </div>
          <button type="button" onClick={onExit} className={ACTION_CLASS}>
            Exit guide
          </button>
        </div>
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="mt-2 text-[10px] font-medium text-muted underline-offset-2 hover:underline"
        >
          Reset guided Apple analysis
        </button>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {renderScreen({
          analysis,
          stageContext,
          loadError,
          setLoadError,
          packetRelationships,
          savedPacketIds,
          setPacketRelationships,
          setScreen,
          updateStage,
          onChange,
          onSavePacket,
        })}
      </main>

      {resetOpen && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-ink/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guided-reset-title"
        >
          <div className="rounded-2xl bg-paper p-4 shadow-lift">
            <h4 id="guided-reset-title" className="font-display text-lg text-ink">
              Reset guided Apple analysis?
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              This clears saved Apple analysis progress. Restart walkthrough does not.
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" className={ACTION_CLASS} onClick={() => setResetOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={PRIMARY_CLASS}
                onClick={() => {
                  setResetOpen(false);
                  onReset();
                }}
              >
                Reset analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function screenTitle(screen: GuidedScreenId): string {
  if (screen === "coc-capture") return "Your Circle of Competence";
  if (screen === "coc-interpretation") return "Check the interpretation";
  if (screen === "bias-intro") return "Pause before judging";
  if (screen === "review") return "Bias and counter-evidence review";
  if (screen === "summary") return "Apple Analysis Summary";
  const parsed = parseStageScreen(screen);
  return parsed ? getGuidedStage(parsed.stageId).name : "Guided Apple analysis";
}

interface RenderContext {
  analysis: AppleGuidedAnalysisV1;
  stageContext: ReturnType<typeof parseStageScreen>;
  loadError: string | null;
  setLoadError: React.Dispatch<React.SetStateAction<string | null>>;
  packetRelationships: Partial<Record<GuidedStageId, EvidenceRelationship>>;
  savedPacketIds: string[];
  setPacketRelationships: React.Dispatch<
    React.SetStateAction<Partial<Record<GuidedStageId, EvidenceRelationship>>>
  >;
  setScreen: (screen: GuidedScreenId) => void;
  updateStage: (stageId: GuidedStageId, stage: StageRecord) => void;
  onChange: (analysis: AppleGuidedAnalysisV1) => void;
  onSavePacket: (packet: AnalysisPacket) => void;
}

function renderScreen(context: RenderContext) {
  const { analysis, setScreen, onChange } = context;
  if (analysis.currentScreen === "coc-capture") {
    const selected = analysis.circleOfCompetence.chips;
    const anyJudgment = GUIDED_STAGE_IDS.some(
      (id) => analysis.stages[id].judgment.status !== "none",
    );
    return (
      <div className="space-y-3">
        <p className="text-xs leading-relaxed text-muted">
          Select what you believe you understand today. This is not a score.
        </p>
        <fieldset>
          <legend className="text-xs font-medium text-ink">Areas you recognise</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CIRCLE_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                aria-pressed={selected.includes(chip.id)}
                onClick={() => {
                  const nextChips = selected.includes(chip.id)
                    ? selected.filter((id) => id !== chip.id)
                    : [...selected, chip.id];
                  onChange({
                    ...analysis,
                    updatedAt: nowIso(),
                    circleOfCompetence: {
                      ...analysis.circleOfCompetence,
                      chips: normalizeCircleChips(nextChips),
                      revisedAfterJudgment:
                        analysis.circleOfCompetence.revisedAfterJudgment || anyJudgment,
                    },
                  });
                }}
                className={`${ACTION_CLASS} ${
                  selected.includes(chip.id) ? "border-accent bg-accent/5" : ""
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="block text-xs font-medium text-ink">
          Optional note
          <textarea
            rows={3}
            value={analysis.circleOfCompetence.note}
            onChange={(event) =>
              onChange({
                ...analysis,
                updatedAt: nowIso(),
                circleOfCompetence: {
                  ...analysis.circleOfCompetence,
                  note: event.target.value,
                  revisedAfterJudgment:
                    analysis.circleOfCompetence.revisedAfterJudgment || anyJudgment,
                },
              })
            }
            placeholder="For example: I understand a retail business."
            className="mt-1 w-full resize-none rounded-xl border border-line bg-paper px-3 py-2 text-sm font-normal text-ink outline-none focus:border-accent"
          />
        </label>
        <button
          type="button"
          className={PRIMARY_CLASS}
          onClick={() => {
            const interpretation = interpretCircleOfCompetence(
              analysis.circleOfCompetence.chips,
              analysis.circleOfCompetence.note,
            );
            onChange({
              ...analysis,
              currentScreen: "coc-interpretation",
              updatedAt: nowIso(),
              circleOfCompetence: {
                ...analysis.circleOfCompetence,
                interpretation: interpretation.wording,
                status: "empty",
              },
            });
          }}
        >
          Continue
        </button>
      </div>
    );
  }

  if (analysis.currentScreen === "coc-interpretation") {
    return (
      <div className="space-y-3">
        <Layer label="Explanation">
          {analysis.circleOfCompetence.interpretation}
        </Layer>
        <p className="text-xs text-muted">Confirm, correct, or skip this wording.</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={PRIMARY_CLASS}
            onClick={() =>
              onChange({
                ...analysis,
                currentScreen: "bias-intro",
                updatedAt: nowIso(),
                circleOfCompetence: {
                  ...analysis.circleOfCompetence,
                  status: "confirmed",
                },
              })
            }
          >
            Confirm
          </button>
          <button type="button" className={ACTION_CLASS} onClick={() => setScreen("coc-capture")}>
            Correct
          </button>
          <button
            type="button"
            className={ACTION_CLASS}
            onClick={() =>
              onChange({
                ...analysis,
                currentScreen: "bias-intro",
                updatedAt: nowIso(),
                circleOfCompetence: {
                  ...analysis.circleOfCompetence,
                  status: "skipped",
                },
              })
            }
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  if (analysis.currentScreen === "bias-intro") {
    return (
      <div className="space-y-3">
        <Layer label="Bias check">
          These prompts create a pause before a story becomes a judgment. Completing one
          is not an admission of bias, and the product will never diagnose you.
        </Layer>
        <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted">
          <li>Facts and calculations remain separate from your interpretation.</li>
          <li>You may skip a check; the Summary will show that choice.</li>
          <li>Confidence is a self-report, not a grade or correctness score.</li>
        </ul>
        <button
          type="button"
          className={PRIMARY_CLASS}
          onClick={() =>
            onChange({
              ...analysis,
              biasIntroCompletedAt: analysis.biasIntroCompletedAt ?? nowIso(),
              currentScreen: stageScreen("revenue-growth", "brief"),
              updatedAt: nowIso(),
            })
          }
        >
          Continue to the evidence
        </button>
      </div>
    );
  }

  if (analysis.currentScreen === "review") {
    return <ReviewScreen context={context} />;
  }
  if (analysis.currentScreen === "summary") {
    return <SummaryScreen context={context} />;
  }
  if (context.stageContext) {
    return <StageScreen context={context} />;
  }
  return null;
}

function StageScreen({ context }: { context: RenderContext }) {
  const {
    analysis,
    stageContext,
    loadError,
    setLoadError,
    setScreen,
    updateStage,
    onChange,
  } = context;
  if (!stageContext) return null;
  const { stageId, step } = stageContext;
  const definition = getGuidedStage(stageId);
  const stage = analysis.stages[stageId];

  if (step === "brief") {
    return (
      <div className="space-y-3">
        <p className="text-xs leading-relaxed text-muted">
          This stage uses existing Sprint 1–3 evidence only:
        </p>
        <ul className="space-y-1 text-xs text-ink">
          {definition.metrics.map((metric) => (
            <li key={metric}>• {metric}</li>
          ))}
        </ul>
        <Layer label="Open question">{definition.openQuestions[0]}</Layer>
        <button
          type="button"
          className={PRIMARY_CLASS}
          onClick={() => setScreen(stageScreen(stageId, "evidence"))}
        >
          Review evidence
        </button>
      </div>
    );
  }

  if (step === "evidence") {
    if (!stage.evidenceSnapshot) {
      return (
        <div role="status" className={`${LAYER_CLASS} text-muted`}>
          {loadError ? (
            <>
              <p className="font-medium text-ink">Evidence unavailable</p>
              <p className="mt-1">{loadError}</p>
              <button
                type="button"
                className={`${ACTION_CLASS} mt-2`}
                onClick={() => setLoadError(null)}
              >
                Try again
              </button>
            </>
          ) : (
            "Loading verified Apple annual history…"
          )}
        </div>
      );
    }
    const analogy = GUIDED_ANALOGIES[stageId];
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1 text-[10px] text-muted">
          <span className="rounded-md border border-line px-2 py-1">
            {stage.evidenceSnapshot.sourceProvider}
          </span>
          <span className="rounded-md border border-line px-2 py-1">
            Saved {new Date(stage.evidenceSnapshot.retrievedAtUtc).toLocaleDateString()}
          </span>
        </div>
        {stage.evidenceSnapshot.metrics.map((metric) => (
          <Layer key={metric.metric} label="Fact">
            <span className="font-medium">{metric.metricLabel}</span>: {metric.startValue} →{" "}
            {metric.endValue} ({metric.fiscalYears})
            {metric.formula ? <span className="mt-1 block">{metric.formula}</span> : null}
          </Layer>
        ))}
        <Layer label="Calculation">
          <ul className="space-y-1">
            {stage.evidenceSnapshot.calculations.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
        </Layer>
        <Layer label="Explanation">
          {stage.evidenceSnapshot.explanations[0]}
        </Layer>
        <button
          type="button"
          aria-expanded={stage.analogyShown}
          className={ACTION_CLASS}
          onClick={() => updateStage(stageId, { ...stage, analogyShown: !stage.analogyShown })}
        >
          {stage.analogyShown ? "Hide" : "Show"} a familiar comparison
        </button>
        {stage.analogyShown && (
          <aside className="rounded-xl border border-sand/80 bg-sand/25 px-3 py-2.5 text-xs">
            <p className="font-medium text-ink">Familiar comparison — not Apple evidence</p>
            <p className="mt-1 text-ink/85">{analogy.comparison}</p>
            <p className="mt-1 text-muted">Limitation: {analogy.limitation}</p>
          </aside>
        )}
        <button
          type="button"
          className={PRIMARY_CLASS}
          onClick={() => setScreen(stageScreen(stageId, "interpretation"))}
        >
          Interpret this evidence
        </button>
      </div>
    );
  }

  if (step === "interpretation") {
    return (
      <div className="space-y-3">
        <Layer label="Explanation">
          {stage.evidenceSnapshot?.explanations[0] ?? "No explanation is available."}
        </Layer>
        <fieldset>
          <legend className="text-xs font-medium text-ink">
            Does this deterministic reading work for you?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["confirmed", "corrected", "skipped"] as const).map((status) => (
              <button
                key={status}
                type="button"
                aria-pressed={stage.explanationStatus === status}
                className={`${ACTION_CLASS} ${
                  stage.explanationStatus === status ? "border-accent bg-accent/5" : ""
                }`}
                onClick={() =>
                  updateStage(stageId, { ...stage, explanationStatus: status })
                }
              >
                {status === "confirmed"
                  ? "Confirm"
                  : status === "corrected"
                    ? "Correct"
                    : "Skip"}
              </button>
            ))}
          </div>
        </fieldset>
        {stage.explanationStatus === "corrected" && (
          <label className="block text-xs font-medium text-ink">
            How would you phrase this instead?
            <textarea
              rows={3}
              value={stage.explanationCorrection}
              onChange={(event) =>
                updateStage(stageId, {
                  ...stage,
                  explanationCorrection: event.target.value,
                })
              }
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 font-normal outline-none focus:border-accent"
            />
          </label>
        )}
        <button
          type="button"
          disabled={
            stage.explanationStatus === "unseen" ||
            (stage.explanationStatus === "corrected" &&
              !stage.explanationCorrection.trim())
          }
          className={PRIMARY_CLASS}
          onClick={() => setScreen(stageScreen(stageId, "bias"))}
        >
          Continue
        </button>
      </div>
    );
  }

  if (step === "bias") {
    const bias = BIAS_LIBRARY[stage.biasCheck.biasId];
    return (
      <div className="space-y-3">
        <fieldset className={LAYER_CLASS}>
          <legend className="px-1 text-[10px] font-medium uppercase tracking-wide text-accent-deep">
            Bias check · {bias.name}
          </legend>
          <p>{bias.prompt}</p>
          <div className="mt-3 grid gap-2">
            {(
              [
                ["acknowledged", "I’ll keep this in mind"],
                ["noted", "I added a note"],
                ["skipped", "Skip this check"],
              ] as const
            ).map(([status, label]) => (
              <button
                key={status}
                type="button"
                aria-pressed={stage.biasCheck.status === status}
                className={`${ACTION_CLASS} ${
                  stage.biasCheck.status === status ? "border-accent bg-accent/5" : ""
                }`}
                onClick={() =>
                  updateStage(stageId, {
                    ...stage,
                    biasCheck: { ...stage.biasCheck, status },
                  })
                }
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        {stage.biasCheck.status === "noted" && (
          <label className="block text-xs font-medium text-ink">
            Reflection note
            <textarea
              rows={3}
              value={stage.biasCheck.note}
              onChange={(event) =>
                updateStage(stageId, {
                  ...stage,
                  biasCheck: { ...stage.biasCheck, note: event.target.value },
                })
              }
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 font-normal outline-none focus:border-accent"
            />
          </label>
        )}
        <button
          type="button"
          className="text-[11px] text-muted underline-offset-2 hover:underline"
          onClick={() =>
            updateStage(stageId, {
              ...stage,
              biasCheck: {
                biasId:
                  stage.biasCheck.biasId === definition.primaryBias
                    ? definition.secondaryBias
                    : definition.primaryBias,
                status: "unseen",
                note: "",
              },
            })
          }
        >
          {stage.biasCheck.biasId === definition.primaryBias
            ? "Another check"
            : "Back to primary check"}
        </button>
        <button
          type="button"
          className={PRIMARY_CLASS}
          onClick={() => setScreen(stageScreen(stageId, "judgment"))}
        >
          Continue to your judgment
        </button>
      </div>
    );
  }

  if (step === "judgment") {
    return (
      <JudgmentScreen
        stage={stage}
        stageId={stageId}
        onCommit={(next, status) =>
          onChange({
            ...analysis,
            updatedAt: nowIso(),
            currentScreen:
              status === "record"
                ? stageScreen(stageId, "post")
                : nextStageScreen(stageId),
            stages: { ...analysis.stages, [stageId]: next },
          })
        }
      />
    );
  }

  return (
    <PostJudgmentScreen
      stage={stage}
      stageId={stageId}
      onUpdate={(next) => updateStage(stageId, next)}
      onDone={(next) =>
        onChange({
          ...analysis,
          updatedAt: nowIso(),
          currentScreen: nextStageScreen(stageId),
          stages: { ...analysis.stages, [stageId]: next },
        })
      }
    />
  );
}

function JudgmentScreen({
  stage,
  stageId,
  onCommit,
}: {
  stage: StageRecord;
  stageId: GuidedStageId;
  onCommit: (
    stage: StageRecord,
    status: "record" | "defer" | "uncertain",
  ) => void;
}) {
  const [choice, setChoice] = useState(stage.judgment.status);
  const [text, setText] = useState(stage.judgment.text);
  const recordAllowed = stage.biasCheck.status !== "unseen";
  const canContinue =
    choice !== "none" && (choice !== "record" || (recordAllowed && text.trim().length > 0));
  return (
    <div className="space-y-3">
      <Layer label="Your judgment">
        Interpret this stage’s historical evidence only. This is not an investment action.
      </Layer>
      <fieldset>
        <legend className="text-xs font-medium text-ink">Choose a stage status</legend>
        <div className="mt-2 grid gap-2">
          {(
            [
              ["record", "Record a judgment"],
              ["defer", "Defer this judgment"],
              ["uncertain", "I remain uncertain"],
            ] as const
          ).map(([status, label]) => (
            <button
              key={status}
              type="button"
              aria-pressed={choice === status}
              className={`${ACTION_CLASS} ${
                choice === status ? "border-accent bg-accent/5" : ""
              }`}
              onClick={() => setChoice(status)}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      {choice === "record" && (
        <label className="block text-xs font-medium text-ink">
          Your interpretation of this historical evidence
          <textarea
            rows={4}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 font-normal outline-none focus:border-accent"
          />
          {!recordAllowed && (
            <span className="mt-1 block text-[11px] text-muted">
              Complete or explicitly skip the bias check before recording.
            </span>
          )}
        </label>
      )}
      {choice === "uncertain" && (
        <label className="block text-xs font-medium text-ink">
          Optional note
          <textarea
            rows={3}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 font-normal outline-none focus:border-accent"
          />
        </label>
      )}
      <button
        type="button"
        disabled={!canContinue}
        className={PRIMARY_CLASS}
        onClick={() => {
          const next = updateJudgment(
            stage,
            {
              status: choice as "record" | "defer" | "uncertain",
              text: choice === "defer" ? "" : text,
              confidence: stage.judgment.confidence,
            },
            nowIso(),
          );
          onCommit(next, choice as "record" | "defer" | "uncertain");
        }}
      >
        Continue
      </button>
      <p className="text-[10px] text-muted">Stage: {getGuidedStage(stageId).name}</p>
    </div>
  );
}

function PostJudgmentScreen({
  stage,
  stageId,
  onUpdate,
  onDone,
}: {
  stage: StageRecord;
  stageId: GuidedStageId;
  onUpdate: (stage: StageRecord) => void;
  onDone: (stage: StageRecord) => void;
}) {
  const fields = [
    ["counterEvidence", "Counter-evidence", "Which displayed fact could weaken your view?"],
    ["alternativeExplanations", "Alternative explanations", "What else could produce these numbers?"],
    ["missingInformation", "Missing information", "What is outside Sprint 1–3 scope?"],
    ["mindChanger", "What would change my mind", "Name an observation, not a price target."],
  ] as const;
  const complete =
    fields.every(([key]) => stage.post[key].trim()) && stage.judgment.confidence !== null;
  return (
    <div className="space-y-3">
      {fields.map(([key, label, hint]) => (
        <label key={key} className="block text-xs font-medium text-ink">
          {label}
          <span className="block text-[10px] font-normal text-muted">{hint}</span>
          <textarea
            rows={3}
            value={stage.post[key]}
            onChange={(event) =>
              onUpdate({
                ...stage,
                post: { ...stage.post, [key]: event.target.value },
              })
            }
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 font-normal outline-none focus:border-accent"
          />
        </label>
      ))}
      <label className="block text-xs font-medium text-ink">
        Shared confidence: {stage.judgment.confidence ?? "not set"} / 10
        <span className="block text-[10px] font-normal text-muted">
          A self-report, not a grade or correctness score.
        </span>
        <input
          type="range"
          min={1}
          max={10}
          value={stage.judgment.confidence ?? 5}
          onChange={(event) =>
            onUpdate(
              updateJudgment(
                stage,
                {
                  status: "record",
                  text: stage.judgment.text,
                  confidence: Number(event.target.value),
                },
                nowIso(),
              ),
            )
          }
          className="mt-2 w-full accent-accent"
        />
      </label>
      {stage.judgment.history.length > 0 && (
        <p className="text-[11px] text-muted">
          Revised · {stage.judgment.history.length} prior version
          {stage.judgment.history.length === 1 ? "" : "s"} retained.
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          className={ACTION_CLASS}
          onClick={() => {
            onDone({
              ...stage,
              post: { ...stage.post, completed: false, completeLaterChosen: true },
            });
          }}
        >
          Complete later
        </button>
        <button
          type="button"
          disabled={!complete}
          className={PRIMARY_CLASS}
          onClick={() => {
            onDone({
              ...stage,
              post: { ...stage.post, completed: true, completeLaterChosen: false },
            });
          }}
        >
          Complete review
        </button>
      </div>
      <p className="text-[10px] text-muted">Stage: {getGuidedStage(stageId).name}</p>
    </div>
  );
}

function ReviewScreen({ context }: { context: RenderContext }) {
  const { analysis, setScreen } = context;
  const ordered = [...GUIDED_STAGE_IDS].sort((a, b) => {
    const aIncomplete =
      analysis.stages[a].judgment.status === "record" && !analysis.stages[a].post.completed;
    const bIncomplete =
      analysis.stages[b].judgment.status === "record" && !analysis.stages[b].post.completed;
    return Number(bIncomplete) - Number(aIncomplete);
  });
  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-muted">
        Review every stage without a score or bias tally.
      </p>
      {ordered.map((stageId) => {
        const stage = analysis.stages[stageId];
        const incomplete = stage.judgment.status === "record" && !stage.post.completed;
        return (
          <section key={stageId} className={LAYER_CLASS}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-ink">{getGuidedStage(stageId).name}</p>
                <p className="mt-1 text-muted">
                  Judgment: {stage.judgment.status} · Bias check: {stage.biasCheck.status}
                </p>
              </div>
              {incomplete && (
                <span className="rounded bg-sand/40 px-1.5 py-0.5 text-[10px]">
                  Review incomplete
                </span>
              )}
            </div>
            <p className="mt-2">Counter-evidence: {stage.post.counterEvidence || "not yet written"}</p>
            <p className="mt-1">
              Alternative: {stage.post.alternativeExplanations || "not yet written"}
            </p>
            <p className="mt-1">
              Confidence: {stage.judgment.confidence ?? "not set"}
              {stage.judgment.history.length > 0 ? " · Revised" : ""}
            </p>
            <button
              type="button"
              className="mt-2 text-[11px] font-medium text-accent-deep underline"
              onClick={() =>
                setScreen(
                  stageScreen(
                    stageId,
                    stage.judgment.status === "record" ? "post" : "evidence",
                  ),
                )
              }
            >
              Edit this stage
            </button>
          </section>
        );
      })}
      <button
        type="button"
        disabled={!isAnalysisCompletable(analysis)}
        className={PRIMARY_CLASS}
        onClick={() => setScreen("summary")}
      >
        Build Apple Analysis Summary
      </button>
    </div>
  );
}

function SummaryScreen({ context }: { context: RenderContext }) {
  const {
    analysis,
    packetRelationships,
    savedPacketIds,
    setPacketRelationships,
    onChange,
    onSavePacket,
  } = context;
  const summary = assembleAppleAnalysisSummary(analysis);
  return (
    <div className="space-y-3">
      <aside className="rounded-xl border border-accent/30 bg-accent/5 px-3 py-2.5 text-xs">
        {summary.disclaimer}
      </aside>
      <Layer label="Circle of Competence">
        {summary.circleOfCompetence.interpretation || "Circle of Competence not confirmed."}
        <span className="mt-1 block text-muted">
          Status: {summary.circleOfCompetence.status}
          {summary.circleOfCompetence.revisedAfterJudgment ? " · Edited after judgment" : ""}
        </span>
      </Layer>
      {summary.stages.map((item) => {
        const packetId = `${analysis.analysisId}:${item.id}`;
        const relationship = packetRelationships[item.id] ?? "neutral";
        const canSave = item.judgment.status !== "none" && item.facts.length > 0;
        return (
          <section key={item.id} className={LAYER_CLASS}>
            <p className="font-medium text-ink">{item.name}</p>
            <p className="mt-1 text-[10px] font-medium uppercase text-accent-deep">Fact</p>
            {item.facts.map((fact) => (
              <p key={fact.metric}>
                {fact.metricLabel}: {fact.startValue} → {fact.endValue}
              </p>
            ))}
            <p className="mt-2 text-[10px] font-medium uppercase text-accent-deep">
              Explanation
            </p>
            <p>{item.explanations[0] || "Not available."}</p>
            <p className="mt-2 text-[10px] font-medium uppercase text-accent-deep">
              Your judgment
            </p>
            <p>{item.judgment.status}: {item.judgment.text || "No note."}</p>
            <p className="mt-2 text-[10px] font-medium uppercase text-accent-deep">
              Bias check
            </p>
            <p>{item.biasCheck.status}</p>
            <p className="mt-2 text-[10px] font-medium uppercase text-accent-deep">
              Counter-evidence
            </p>
            <p>
              {item.counterEvidence ||
                (item.judgment.status === "record"
                  ? "Review incomplete"
                  : "Not required for this deferred or uncertain judgment.")}
            </p>
            {item.reviewIncomplete && (
              <p className="mt-1 font-medium text-ink">Review incomplete</p>
            )}
            <p className="mt-2 text-[10px] font-medium uppercase text-accent-deep">
              Open question
            </p>
            <p>{item.openQuestions[0]}</p>
            {canSave && (
              <div className="mt-3 border-t border-line pt-2">
                <label className="text-[11px] font-medium text-ink">
                  Relationship to thesis
                  <select
                    value={relationship}
                    onChange={(event) =>
                      setPacketRelationships((previous) => ({
                        ...previous,
                        [item.id]: event.target.value as EvidenceRelationship,
                      }))
                    }
                    className="mt-1 block rounded-lg border border-line bg-paper px-2 py-1 text-xs"
                  >
                    <option value="supports">Supports</option>
                    <option value="weakens">Weakens</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </label>
                <button
                  type="button"
                  className={`${PRIMARY_CLASS} mt-2`}
                  onClick={() => {
                    const packet = buildAnalysisPacket(
                      analysis,
                      item.id,
                      relationship,
                      nowIso(),
                    );
                    onSavePacket(packet);
                    onChange({
                      ...analysis,
                      updatedAt: nowIso(),
                      summary: {
                        generatedAt: analysis.summary.generatedAt ?? nowIso(),
                        selectedPacketIds: [
                          ...new Set([...analysis.summary.selectedPacketIds, packet.id]),
                        ],
                      },
                    });
                  }}
                >
                  {savedPacketIds.includes(packetId) ? "Update thesis packet" : "Save to thesis"}
                </button>
                <p className="mt-1 text-[10px] text-muted">
                  Source saved with packet: {item.facts[0]?.sourceProvider}
                </p>
              </div>
            )}
          </section>
        );
      })}
      <p role="status" className="text-[11px] text-muted">
        Saved locally. Familiar comparisons are omitted from evidence packets.
      </p>
    </div>
  );
}

function Layer({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className={LAYER_CLASS}>
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-accent-deep">
        {label}
      </p>
      <div className="text-ink/85">{children}</div>
    </section>
  );
}
