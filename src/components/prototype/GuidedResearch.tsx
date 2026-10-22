"use client";

import { sampleCompany } from "@/lib/sample-data";
import {
  RESEARCH_WIZARD_STEPS,
  canAdvanceResearchStep,
  requirementLabel,
} from "@/lib/research-wizard";
import type { AttractionDriver, ResearchAnswers, TimeHorizon } from "@/lib/types";

interface GuidedResearchProps {
  researchStep: number;
  answers: ResearchAnswers;
  onChange: (next: Partial<ResearchAnswers>) => void;
  onStepChange: (step: number) => void;
  onContinue: () => void;
}

const attractionOptions: { value: AttractionDriver; label: string }[] = [
  { value: "growth-story", label: "A growth story that clicked" },
  { value: "familiar-brand", label: "I recognise the brand or sector" },
  { value: "recent-news", label: "Recent news or a podcast" },
  { value: "valuation", label: "It looked reasonably valued" },
  { value: "dividend", label: "Income / dividend appeal" },
  { value: "peer-tip", label: "Someone I trust mentioned it" },
];

const horizonOptions: { value: TimeHorizon; label: string }[] = [
  { value: "under-1-year", label: "Under 1 year" },
  { value: "1-3-years", label: "1–3 years" },
  { value: "3-5-years", label: "3–5 years" },
  { value: "5-plus-years", label: "5+ years" },
];

export function GuidedResearch({
  researchStep,
  answers,
  onChange,
  onStepChange,
  onContinue,
}: GuidedResearchProps) {
  const total = RESEARCH_WIZARD_STEPS.length;
  const currentStep = RESEARCH_WIZARD_STEPS[researchStep];
  const canAdvance = canAdvanceResearchStep(researchStep, answers);

  return (
    <div className="flex h-full flex-col">
      <header className="px-4 pb-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent-deep">
          Guided research
        </p>
        <h3 className="mt-1 font-display text-xl text-ink">
          {sampleCompany.name}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {sampleCompany.tagline}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mb-4 rounded-xl bg-mist px-3 py-2.5 text-xs leading-relaxed text-ink/80">
          {sampleCompany.summary}
        </div>

        <div className="mb-3 flex items-center gap-2 text-[11px] text-muted">
          <span>
            Question {researchStep + 1} of {total}
          </span>
          {currentStep && (
            <RequirementTag required={currentStep.required} testId="question-requirement" />
          )}
        </div>

        {researchStep === 0 && (
          <fieldset>
            <legend className="font-display text-lg text-ink">
              What first attracted you to this idea?
            </legend>
            <WhyWeAsk text={RESEARCH_WIZARD_STEPS[0].whyWeAsk} />
            <div className="mt-3 space-y-2">
              {attractionOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                    answers.attraction === option.value
                      ? "border-accent bg-accent/5"
                      : "border-line hover:border-ink/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="attraction"
                    value={option.value}
                    checked={answers.attraction === option.value}
                    onChange={() => onChange({ attraction: option.value })}
                    className="accent-[var(--accent)]"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <label className="mt-3 block text-xs text-muted">
              <span className="flex items-center gap-2">
                Note
                <RequirementTag required={false} testId="note-requirement" />
              </span>
              <textarea
                value={answers.attractionNote}
                onChange={(event) =>
                  onChange({ attractionNote: event.target.value })
                }
                rows={2}
                className="mt-1 w-full resize-none rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                placeholder="What stuck with you?"
              />
            </label>
          </fieldset>
        )}

        {researchStep === 1 && (
          <fieldset>
            <legend className="font-display text-lg text-ink">
              What time horizon are you thinking in?
            </legend>
            <WhyWeAsk text={RESEARCH_WIZARD_STEPS[1].whyWeAsk} />
            <p className="mt-2 text-xs text-muted">
              No right answer — just name the horizon you would actually hold for.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {horizonOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange({ timeHorizon: option.value })}
                  className={`rounded-xl border px-3 py-3 text-sm transition ${
                    answers.timeHorizon === option.value
                      ? "border-accent bg-accent/5 text-ink"
                      : "border-line text-muted hover:border-ink/20 hover:text-ink"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {researchStep === 2 && (
          <label className="block">
            <span className="font-display text-lg text-ink">
              What evidence supports the idea so far?
            </span>
            <WhyWeAsk text={RESEARCH_WIZARD_STEPS[2].whyWeAsk} />
            <p className="mt-2 text-xs text-muted">
              Facts, filings, customer behaviour — not price movement alone.
            </p>
            <textarea
              value={answers.evidence}
              onChange={(event) => onChange({ evidence: event.target.value })}
              rows={6}
              className="mt-3 w-full resize-none rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
              placeholder="e.g. Retention commentary, contract mix, peer comparisons…"
            />
          </label>
        )}

        {researchStep === 3 && (
          <label className="block">
            <span className="font-display text-lg text-ink">
              What risks could break the idea?
            </span>
            <WhyWeAsk text={RESEARCH_WIZARD_STEPS[3].whyWeAsk} />
            <p className="mt-2 text-xs text-muted">
              Name risks even if you still like the opportunity.
            </p>
            <textarea
              value={answers.risks}
              onChange={(event) => onChange({ risks: event.target.value })}
              rows={6}
              className="mt-3 w-full resize-none rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
              placeholder="Competition, execution, regulation, concentration…"
            />
          </label>
        )}

        {researchStep === 4 && (
          <label className="block">
            <span className="font-display text-lg text-ink">
              What are you still uncertain about?
            </span>
            <WhyWeAsk text={RESEARCH_WIZARD_STEPS[4].whyWeAsk} />
            <p className="mt-2 text-xs text-muted">
              Honest gaps beat false confidence.
            </p>
            <textarea
              value={answers.uncertainties}
              onChange={(event) =>
                onChange({ uncertainties: event.target.value })
              }
              rows={6}
              className="mt-3 w-full resize-none rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
              placeholder="Customer concentration, organic growth, management incentives…"
            />
          </label>
        )}
      </div>

      <div className="flex gap-2 border-t border-line px-4 py-3">
        <button
          type="button"
          disabled={researchStep === 0}
          onClick={() => onStepChange(researchStep - 1)}
          className="rounded-xl border border-line px-4 py-2.5 text-sm text-ink transition enabled:hover:bg-mist disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Back
        </button>
        {researchStep < total - 1 ? (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => onStepChange(researchStep + 1)}
            className="flex-1 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper transition enabled:hover:bg-ink/90 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Next question
          </button>
        ) : (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={onContinue}
            className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-paper transition enabled:hover:bg-accent-deep disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Review performance
          </button>
        )}
      </div>
    </div>
  );
}

function WhyWeAsk({ text }: { text: string }) {
  return (
    <p data-testid="why-we-ask" className="mt-1.5 text-[11px] leading-relaxed text-muted">
      <span className="font-medium text-ink/80">Why we ask:</span> {text}
    </p>
  );
}

function RequirementTag({ required, testId }: { required: boolean; testId: string }) {
  return (
    <span
      data-testid={testId}
      className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] ${
        required ? "border-line text-ink/70" : "border-sand/80 bg-sand/30 text-ink/80"
      }`}
    >
      {requirementLabel(required)}
    </span>
  );
}
