import type { ResearchAnswers } from "./types";

export const MIN_WRITTEN_ANSWER_LENGTH = 13;

export type ResearchWizardStepId =
  | "attraction"
  | "time-horizon"
  | "evidence"
  | "risks"
  | "uncertainties";

export interface ResearchWizardStep {
  id: ResearchWizardStepId;
  required: boolean;
  whyWeAsk: string;
}

export const RESEARCH_WIZARD_STEPS: readonly ResearchWizardStep[] = [
  {
    id: "attraction",
    required: true,
    whyWeAsk:
      "What first draws you in shapes what you look for next; the Thesis step uses this answer to flag a missing valuation check.",
  },
  {
    id: "time-horizon",
    required: true,
    whyWeAsk:
      "How long you plan to stay invested decides which risks and numbers matter, and gives you a yardstick to check your thinking against later.",
  },
  {
    id: "evidence",
    required: true,
    whyWeAsk:
      "Writing evidence down separates facts from the story, so you can test each one later.",
  },
  {
    id: "risks",
    required: true,
    whyWeAsk:
      "Naming what could break the idea now makes warning signs harder to ignore later.",
  },
  {
    id: "uncertainties",
    required: true,
    whyWeAsk:
      "Listing your gaps shows what to research next before you decide how confident to be.",
  },
] as const;

export function requirementLabel(required: boolean): "Required" | "Optional" {
  return required ? "Required" : "Optional";
}

export function canAdvanceResearchStep(step: number, answers: ResearchAnswers): boolean {
  const written = (value: string) => value.trim().length >= MIN_WRITTEN_ANSWER_LENGTH;
  switch (RESEARCH_WIZARD_STEPS[step]?.id) {
    case "attraction":
      return Boolean(answers.attraction);
    case "time-horizon":
      return Boolean(answers.timeHorizon);
    case "evidence":
      return written(answers.evidence);
    case "risks":
      return written(answers.risks);
    case "uncertainties":
      return written(answers.uncertainties);
    default:
      return false;
  }
}
