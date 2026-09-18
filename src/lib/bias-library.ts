export type BiasId =
  | "confirmation"
  | "recency"
  | "anchoring"
  | "narrative"
  | "halo"
  | "overconfidence"
  | "outcome-preview";

export interface BiasDefinition {
  id: BiasId;
  name: string;
  prompt: string;
}

export const BIAS_LIBRARY: Record<BiasId, BiasDefinition> = {
  confirmation: {
    id: "confirmation",
    name: "Confirmation seeking",
    prompt: "Are you mainly looking for facts that fit a story you already like?",
  },
  recency: {
    id: "recency",
    name: "Recency / latest year",
    prompt: "Is the most recent year doing more work than the ten-year path?",
  },
  anchoring: {
    id: "anchoring",
    name: "Anchoring",
    prompt: "Are you stuck on the first number you saw: the start year, peak, or latest?",
  },
  narrative: {
    id: "narrative",
    name: "Narrative fluency",
    prompt: "Is a familiar Apple story standing in for the table?",
  },
  halo: {
    id: "halo",
    name: "Brand / halo",
    prompt: "Is admiration for the products doing work the financial facts did not do?",
  },
  overconfidence: {
    id: "overconfidence",
    name: "Overconfidence",
    prompt: "How would your wording change if you were less sure?",
  },
  "outcome-preview": {
    id: "outcome-preview",
    name: "Outcome temptation",
    prompt:
      "Are you judging the quality of your process by whether Apple feels successful?",
  },
};
