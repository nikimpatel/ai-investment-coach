"use client";

import { BookOpen, Check, Pencil, X } from "@/components/ui/icons";
import {
  laterObservation,
  sampleCompany,
  samplePattern,
} from "@/lib/sample-data";
import type {
  DecisionEntry,
  DecisionStance,
  PatternState,
  ThesisDraft,
} from "@/lib/types";

interface ReflectionPlaybookProps {
  thesis: ThesisDraft;
  decision: DecisionEntry;
  pattern: PatternState;
  lessonNote: string;
  onPatternChange: (next: Partial<PatternState>) => void;
  onLessonChange: (value: string) => void;
  onBack: () => void;
  onRestart: () => void;
}

const stanceLabels: Record<DecisionStance, string> = {
  "continuing-research": "Continuing research",
  watching: "Watching closely",
  "ready-to-decide-myself": "Ready to decide for myself",
  "passing-for-now": "Passing for now",
};

export function ReflectionPlaybook({
  thesis,
  decision,
  pattern,
  lessonNote,
  onPatternChange,
  onLessonChange,
  onBack,
  onRestart,
}: ReflectionPlaybookProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="px-4 pb-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent-deep">
          Reflection & playbook
        </p>
        <h3 className="mt-1 font-display text-xl text-ink">
          Compare then vs later
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Patterns appear only when several past decisions support them — and
          you stay in control.
        </p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
        <section className="rounded-xl border border-line p-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            Original reasoning · {sampleCompany.name}
          </p>
          <p className="mt-2 text-sm text-ink">
            <span className="font-medium">Opportunity:</span>{" "}
            {thesis.opportunity || "—"}
          </p>
          <p className="mt-1.5 text-sm text-ink">
            <span className="font-medium">Stance:</span>{" "}
            {(decision.stance && stanceLabels[decision.stance]) || "—"} ·
            confidence {decision.confidence}/10
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            {decision.reasoning || "No reasoning captured yet."}
          </p>
        </section>

        <section className="rounded-xl border border-line bg-mist/70 p-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            {laterObservation.title}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            {laterObservation.whatChanged}
          </p>
        </section>

        <label className="block rounded-xl border border-line p-3">
          <span className="flex items-center gap-2 text-sm font-medium text-ink">
            <BookOpen className="h-4 w-4 text-accent-deep" />
            Lesson you want to keep
          </span>
          <textarea
            value={lessonNote}
            onChange={(event) => onLessonChange(event.target.value)}
            rows={3}
            className="mt-2 w-full resize-none rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            placeholder={laterObservation.userLessonSeed}
          />
        </label>

        <section className="rounded-xl border border-accent/25 bg-accent/5 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-accent-deep">
                Suggested pattern · based on{" "}
                {samplePattern.basedOnCount} past entries
              </p>
              <h4 className="mt-1 text-sm font-medium text-ink">
                {samplePattern.title}
              </h4>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {samplePattern.summary}
          </p>

          <div className="mt-3 space-y-2">
            <p className="text-[11px] font-medium text-ink">Evidence</p>
            {samplePattern.evidence.map((item) => (
              <div
                key={item.decision}
                className="rounded-lg border border-line bg-paper px-2.5 py-2"
              >
                <p className="text-xs font-medium text-ink">{item.decision}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>

          {pattern.action === null && (
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onPatternChange({ action: "confirm", influenceFuture: true })
                }
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-ink px-2 py-2 text-[11px] font-medium text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Check className="h-3.5 w-3.5" />
                Confirm
              </button>
              <button
                type="button"
                onClick={() => onPatternChange({ action: "correct" })}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-line bg-paper px-2 py-2 text-[11px] font-medium text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <Pencil className="h-3.5 w-3.5" />
                Correct
              </button>
              <button
                type="button"
                onClick={() =>
                  onPatternChange({
                    action: "dismiss",
                    influenceFuture: false,
                  })
                }
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-line bg-paper px-2 py-2 text-[11px] font-medium text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <X className="h-3.5 w-3.5" />
                Dismiss
              </button>
            </div>
          )}

          {pattern.action === "correct" && (
            <div className="mt-3">
              <label className="block text-xs text-muted">
                How would you reframe this?
                <textarea
                  value={pattern.correctionNote}
                  onChange={(event) =>
                    onPatternChange({ correctionNote: event.target.value })
                  }
                  rows={2}
                  className="mt-1 w-full resize-none rounded-lg border border-line bg-paper px-2.5 py-2 text-sm text-ink outline-none focus:border-accent"
                  placeholder="e.g. I skip valuation only for high-quality compounders I already know well."
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  onPatternChange({ action: "confirm", influenceFuture: true })
                }
                className="mt-2 w-full rounded-lg bg-ink px-3 py-2 text-xs font-medium text-paper"
              >
                Save correction
              </button>
            </div>
          )}

          {pattern.action === "confirm" && (
            <div className="mt-3 space-y-2 rounded-lg border border-line bg-paper p-2.5">
              <p className="text-xs font-medium text-ink">
                Confirmed for your playbook
              </p>
              {pattern.correctionNote && (
                <p className="text-[11px] leading-relaxed text-muted">
                  Your framing: {pattern.correctionNote}
                </p>
              )}
              <label className="flex items-start gap-2 text-[11px] leading-relaxed text-ink">
                <input
                  type="checkbox"
                  checked={pattern.influenceFuture}
                  onChange={(event) =>
                    onPatternChange({ influenceFuture: event.target.checked })
                  }
                  className="mt-0.5 accent-[var(--accent)]"
                />
                Use this in future guided questions
              </label>
              {pattern.influenceFuture && (
                <p className="rounded-lg bg-mist px-2.5 py-2 text-[11px] leading-relaxed text-muted">
                  Next research session will ask: “
                  {samplePattern.proposedCoaching}”
                </p>
              )}
            </div>
          )}

          {pattern.action === "dismiss" && (
            <p className="mt-3 rounded-lg border border-line bg-paper px-2.5 py-2 text-[11px] leading-relaxed text-muted">
              Dismissed. This pattern will not influence coaching unless it
              resurfaces with new evidence.
            </p>
          )}
        </section>
      </div>

      <div className="flex gap-2 border-t border-line px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-line px-4 py-2.5 text-sm text-ink transition hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="flex-1 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Restart walkthrough
        </button>
      </div>
    </div>
  );
}
