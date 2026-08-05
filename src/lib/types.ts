export type PrototypeStep =
  | "research"
  | "performance"
  | "thesis"
  | "decision"
  | "reflection";

export type AttractionDriver =
  | "growth-story"
  | "familiar-brand"
  | "recent-news"
  | "valuation"
  | "dividend"
  | "peer-tip";

export type TimeHorizon =
  | "under-1-year"
  | "1-3-years"
  | "3-5-years"
  | "5-plus-years";

export type DecisionStance =
  | "continuing-research"
  | "ready-to-decide-myself"
  | "passing-for-now"
  | "watching";

export type PatternAction = "confirm" | "correct" | "dismiss" | null;

export type EvidenceRelationship = "supports" | "weakens" | "neutral";

export interface PerformanceObservationEvidence {
  company: string;
  metricOrMargin: string;
  fiscalYears: string;
  exactValues: string;
  text: string;
  sourceType: string;
  relationship: EvidenceRelationship;
}

export interface ResearchAnswers {
  attraction: AttractionDriver | "";
  attractionNote: string;
  timeHorizon: TimeHorizon | "";
  evidence: string;
  risks: string;
  uncertainties: string;
}

export interface ThesisDraft {
  opportunity: string;
  evidence: string;
  assumptions: string;
  risks: string;
  valuation: string;
  falsifiers: string;
  openQuestions: string;
  /** Observation captured from the financial-performance step. */
  performanceObservation: string;
  /** Structured source details for the performance observation. */
  performanceEvidence: PerformanceObservationEvidence | null;
}

export interface DecisionEntry {
  stance: DecisionStance | "";
  confidence: number;
  reasoning: string;
  revisitTriggers: string;
}

export interface PatternState {
  action: PatternAction;
  correctionNote: string;
  influenceFuture: boolean;
}

export interface PrototypeState {
  step: PrototypeStep;
  researchStep: number;
  research: ResearchAnswers;
  thesis: ThesisDraft;
  decision: DecisionEntry;
  pattern: PatternState;
  lessonNote: string;
}
