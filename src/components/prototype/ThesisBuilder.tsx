"use client";

import { AlertCircle, Sparkles } from "@/components/ui/icons";
import type { ResearchAnswers, ThesisDraft } from "@/lib/types";

interface ThesisBuilderProps {
  thesis: ThesisDraft;
  research: ResearchAnswers;
  onChange: (next: Partial<ThesisDraft>) => void;
  onBack: () => void;
  onContinue: () => void;
}

const fields: {
  key: Exclude<keyof ThesisDraft, "performanceObservation">;
  label: string;
  hint: string;
}[] = [
  {
    key: "opportunity",
    label: "Opportunity",
    hint: "In one or two sentences, what is the idea?",
  },
  {
    key: "evidence",
    label: "Evidence",
    hint: "What supports it today?",
  },
  {
    key: "assumptions",
    label: "Key assumptions",
    hint: "What must remain true?",
  },
  {
    key: "risks",
    label: "Risks",
    hint: "What could invalidate the opportunity?",
  },
  {
    key: "valuation",
    label: "Valuation considerations",
    hint: "How are you thinking about price versus quality?",
  },
  {
    key: "falsifiers",
    label: "What would prove this wrong?",
    hint: "Concrete evidence or changes you would notice.",
  },
  {
    key: "openQuestions",
    label: "Questions still unanswered",
    hint: "Leave gaps visible — do not invent answers.",
  },
];

export function ThesisBuilder({
  thesis,
  research,
  onChange,
  onBack,
  onContinue,
}: ThesisBuilderProps) {
  const valuationThin = thesis.valuation.trim().length < 20;
  const growthHeavy =
    research.attraction === "growth-story" ||
    research.attraction === "recent-news";
  const missingValuationCue = growthHeavy && valuationThin;

  const filled = fields.filter((field) => thesis[field.key].trim().length > 8);
  const canContinue = filled.length >= 5;

  return (
    <div className="flex h-full flex-col">
      <header className="px-4 pb-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent-deep">
          Thesis builder
        </p>
        <h3 className="mt-1 font-display text-xl text-ink">
          Structure your reasoning
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Capture the thesis in your words. Coaching may flag gaps — it will not
          recommend an investment action.
        </p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
        {missingValuationCue && (
          <aside className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" />
              <div>
                <p className="text-xs font-medium text-ink">
                  Possible missing reasoning
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Your attraction leaned on a growth narrative, but valuation
                  notes are still thin. Add a brief price-versus-quality check —
                  or note why valuation is not central for you.
                </p>
              </div>
            </div>
          </aside>
        )}

        <label className="block rounded-xl border border-accent/25 bg-accent/5 px-3 py-2.5">
          <span className="text-sm font-medium text-ink">
            Performance observation
          </span>
          <span className="mt-0.5 block text-[11px] text-muted">
            From the financial-performance step. Edit or remove — this is
            evidence to interpret, not proof of a good investment.
          </span>
          <textarea
            value={thesis.performanceObservation}
            onChange={(event) =>
              onChange({ performanceObservation: event.target.value })
            }
            rows={3}
            placeholder="No performance observation added yet. You can add one from the Finance step."
            className="mt-1.5 w-full resize-none rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          {thesis.performanceObservation.trim().length > 0 && (
            <button
              type="button"
              onClick={() => onChange({ performanceObservation: "" })}
              className="mt-2 text-[11px] font-medium text-accent-deep underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Remove observation
            </button>
          )}
        </label>

        {fields.map((field) => (
          <label key={field.key} className="block">
            <span className="text-sm font-medium text-ink">{field.label}</span>
            <span className="mt-0.5 block text-[11px] text-muted">
              {field.hint}
            </span>
            <textarea
              value={thesis[field.key]}
              onChange={(event) => onChange({ [field.key]: event.target.value })}
              rows={field.key === "opportunity" ? 2 : 3}
              className="mt-1.5 w-full resize-none rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
        ))}

        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Educational decision-support only. Not a recommendation to buy, sell,
          or hold any security.
        </p>
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
          disabled={!canContinue}
          onClick={onContinue}
          className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-paper transition enabled:hover:bg-accent-deep disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Record decision
        </button>
      </div>
    </div>
  );
}
