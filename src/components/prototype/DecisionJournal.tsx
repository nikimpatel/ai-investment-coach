"use client";

import type { DecisionEntry, DecisionStance } from "@/lib/types";

interface DecisionJournalProps {
  decision: DecisionEntry;
  onChange: (next: Partial<DecisionEntry>) => void;
  onBack: () => void;
  onContinue: () => void;
}

const stances: { value: DecisionStance; label: string; hint: string }[] = [
  {
    value: "continuing-research",
    label: "Continuing research",
    hint: "Not deciding yet — gathering more clarity",
  },
  {
    value: "watching",
    label: "Watching closely",
    hint: "On a personal watch process, no action committed",
  },
  {
    value: "ready-to-decide-myself",
    label: "Ready to decide for myself",
    hint: "Prepared to decide independently — any execution stays with your broker",
  },
  {
    value: "passing-for-now",
    label: "Passing for now",
    hint: "Idea does not clear your process today",
  },
];

export function DecisionJournal({
  decision,
  onChange,
  onBack,
  onContinue,
}: DecisionJournalProps) {
  const canContinue =
    Boolean(decision.stance) &&
    decision.reasoning.trim().length > 12 &&
    decision.revisitTriggers.trim().length > 12;

  return (
    <div className="flex h-full flex-col">
      <header className="px-4 pb-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent-deep">
          Decision journal
        </p>
        <h3 className="mt-1 font-display text-xl text-ink">
          Record what you decided — and why
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Use neutral language. This is your journal, not a buy/sell/hold tip.
        </p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        <fieldset>
          <legend className="text-sm font-medium text-ink">Your stance</legend>
          <div className="mt-2 space-y-2">
            {stances.map((stance) => (
              <label
                key={stance.value}
                className={`block cursor-pointer rounded-xl border px-3 py-2.5 transition ${
                  decision.stance === stance.value
                    ? "border-accent bg-accent/5"
                    : "border-line hover:border-ink/20"
                }`}
              >
                <span className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="radio"
                    name="stance"
                    checked={decision.stance === stance.value}
                    onChange={() => onChange({ stance: stance.value })}
                    className="accent-[var(--accent)]"
                  />
                  {stance.label}
                </span>
                <span className="mt-1 block pl-6 text-[11px] text-muted">
                  {stance.hint}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="flex items-center justify-between text-sm font-medium text-ink">
            Confidence right now
            <span className="tabular-nums text-accent-deep">
              {decision.confidence}/10
            </span>
          </span>
          <input
            type="range"
            min={1}
            max={10}
            value={decision.confidence}
            onChange={(event) =>
              onChange({ confidence: Number(event.target.value) })
            }
            className="mt-3 w-full accent-[var(--accent)]"
            aria-valuemin={1}
            aria-valuemax={10}
            aria-valuenow={decision.confidence}
          />
          <span className="mt-1 flex justify-between text-[11px] text-muted">
            <span>Exploring</span>
            <span>High conviction</span>
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">
            Reasoning at this moment
          </span>
          <textarea
            value={decision.reasoning}
            onChange={(event) => onChange({ reasoning: event.target.value })}
            rows={4}
            className="mt-1.5 w-full resize-none rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            placeholder="Why this stance, given the thesis you just wrote?"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">
            What evidence would make you reconsider?
          </span>
          <textarea
            value={decision.revisitTriggers}
            onChange={(event) =>
              onChange({ revisitTriggers: event.target.value })
            }
            rows={3}
            className="mt-1.5 w-full resize-none rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            placeholder="Specific evidence or changes you’d notice…"
          />
        </label>
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
          See reflection
        </button>
      </div>
    </div>
  );
}
