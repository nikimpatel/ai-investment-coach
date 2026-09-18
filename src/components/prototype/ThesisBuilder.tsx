"use client";

import { AlertCircle, Sparkles } from "@/components/ui/icons";
import type {
  EvidenceRelationship,
  ResearchAnswers,
  ThesisDraft,
} from "@/lib/types";

interface ThesisBuilderProps {
  thesis: ThesisDraft;
  research: ResearchAnswers;
  onChange: (next: Partial<ThesisDraft>) => void;
  onBack: () => void;
  onContinue: () => void;
}

const fields: {
  key: Exclude<
    keyof ThesisDraft,
    "performanceObservation" | "performanceEvidence" | "analysisPackets"
  >;
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
  const packetGroups = (
    [
      ["supports", "Supporting evidence"],
      ["weakens", "Weakening evidence"],
      ["neutral", "Neutral evidence"],
    ] as const
  ).map(([relationship, label]) => ({
    relationship,
    label,
    packets: thesis.analysisPackets.filter(
      (packet) => packet.relationship === relationship,
    ),
  }));

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
              onChange({
                performanceObservation: event.target.value,
                performanceEvidence: thesis.performanceEvidence
                  ? {
                      ...thesis.performanceEvidence,
                      text: event.target.value,
                    }
                  : null,
              })
            }
            rows={3}
            placeholder="No performance observation added yet. You can add one from the Finance step."
            className="mt-1.5 w-full resize-none rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          {thesis.performanceEvidence && (
            <div className="mt-2 rounded-lg border border-line bg-paper px-2.5 py-2 text-[11px] leading-relaxed text-muted">
              <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
                <dt className="font-medium text-ink">Company</dt>
                <dd>{thesis.performanceEvidence.company}</dd>
                <dt className="font-medium text-ink">Metric</dt>
                <dd>{thesis.performanceEvidence.metricOrMargin}</dd>
                <dt className="font-medium text-ink">Years</dt>
                <dd>{thesis.performanceEvidence.fiscalYears}</dd>
                <dt className="font-medium text-ink">Values</dt>
                <dd>{thesis.performanceEvidence.exactValues}</dd>
                <dt className="font-medium text-ink">Source</dt>
                <dd>{thesis.performanceEvidence.sourceType}</dd>
              </dl>
              <label className="mt-2 block">
                <span className="font-medium text-ink">Your relationship</span>
                <select
                  value={thesis.performanceEvidence.relationship}
                  onChange={(event) =>
                    onChange({
                      performanceEvidence: {
                        ...thesis.performanceEvidence!,
                        relationship: event.target.value as EvidenceRelationship,
                      },
                    })
                  }
                  className="mt-1 block rounded-lg border border-line bg-paper px-2 py-1 text-xs text-ink outline-none focus:border-accent"
                >
                  <option value="supports">Supports</option>
                  <option value="weakens">Weakens</option>
                  <option value="neutral">Neutral</option>
                </select>
              </label>
            </div>
          )}
          {thesis.performanceObservation.trim().length > 0 && (
            <button
              type="button"
              onClick={() =>
                onChange({
                  performanceObservation: "",
                  performanceEvidence: null,
                })
              }
              className="mt-2 text-[11px] font-medium text-accent-deep underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Remove observation
            </button>
          )}
        </label>

        {thesis.analysisPackets.length > 0 && (
          <section
            aria-labelledby="guided-analysis-packets-heading"
            className="rounded-xl border border-line bg-paper px-3 py-3"
          >
            <h4
              id="guided-analysis-packets-heading"
              className="text-sm font-medium text-ink"
            >
              Guided Apple analysis evidence
            </h4>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Saved fact snapshots and your interpretations. Familiar comparisons
              are never included.
            </p>
            <div className="mt-3 space-y-3">
              {packetGroups.map((group) => (
                <section key={group.relationship}>
                  <h5 className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    {group.label}
                  </h5>
                  {group.packets.length === 0 ? (
                    <p className="mt-1 text-[11px] text-muted">None saved.</p>
                  ) : (
                    <div className="mt-1 space-y-2">
                      {group.packets.map((packet) => (
                        <article
                          key={packet.id}
                          className="rounded-lg border border-line bg-mist px-2.5 py-2 text-[11px]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-ink">{packet.stageName}</p>
                            <span className="rounded border border-line bg-paper px-1.5 py-0.5 text-[9px] text-muted">
                              {packet.sourceProvider}
                            </span>
                          </div>
                          <p className="mt-1 text-muted">
                            {packet.factSnapshot
                              .map(
                                (fact) =>
                                  `${fact.metricLabel}: ${fact.startValue} → ${fact.endValue}`,
                              )
                              .join(" · ")}
                          </p>
                          <p className="mt-1 text-ink/85">
                            Judgment: {packet.judgmentStatus}
                            {packet.judgmentText ? ` — ${packet.judgmentText}` : ""}
                          </p>
                          {packet.reviewIncomplete && (
                            <p className="mt-1 font-medium text-ink">
                              Review incomplete
                            </p>
                          )}
                          <label className="mt-2 block">
                            <span className="font-medium text-ink">
                              Relationship
                            </span>
                            <select
                              value={packet.relationship}
                              onChange={(event) =>
                                onChange({
                                  analysisPackets: thesis.analysisPackets.map(
                                    (candidate) =>
                                      candidate.id === packet.id
                                        ? {
                                            ...candidate,
                                            relationship: event.target
                                              .value as EvidenceRelationship,
                                          }
                                        : candidate,
                                  ),
                                })
                              }
                              className="mt-1 block rounded-lg border border-line bg-paper px-2 py-1 text-xs"
                            >
                              <option value="supports">Supports</option>
                              <option value="weakens">Weakens</option>
                              <option value="neutral">Neutral</option>
                            </select>
                          </label>
                          <div className="mt-2 flex gap-3">
                            <button
                              type="button"
                              onClick={onBack}
                              className="font-medium text-accent-deep underline"
                            >
                              Edit in guide
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onChange({
                                  analysisPackets:
                                    thesis.analysisPackets.filter(
                                      (candidate) => candidate.id !== packet.id,
                                    ),
                                })
                              }
                              className="font-medium text-accent-deep underline"
                            >
                              Remove
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </section>
        )}

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
