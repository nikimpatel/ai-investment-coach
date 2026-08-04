"use client";

import { useState } from "react";
import {
  laterObservation,
  sampleCompany,
  seededThesis,
} from "@/lib/sample-data";
import type {
  DecisionEntry,
  PatternState,
  PrototypeState,
  PrototypeStep,
  ResearchAnswers,
  ThesisDraft,
} from "@/lib/types";
import { DecisionJournal } from "./DecisionJournal";
import { FinancialPerformance } from "./FinancialPerformance";
import { GuidedResearch } from "./GuidedResearch";
import { PhoneFrame } from "./PhoneFrame";
import { ReflectionPlaybook } from "./ReflectionPlaybook";
import { StepRail } from "./StepRail";
import { ThesisBuilder } from "./ThesisBuilder";

const initialResearch: ResearchAnswers = {
  attraction: "recent-news",
  attractionNote: sampleCompany.seedAttraction,
  timeHorizon: "3-5-years",
  evidence: seededThesis.evidence,
  risks: seededThesis.risks,
  uncertainties: seededThesis.openQuestions,
};

const initialDecision: DecisionEntry = {
  stance: "",
  confidence: 6,
  reasoning: "",
  revisitTriggers: "",
};

const initialPattern: PatternState = {
  action: null,
  correctionNote: "",
  influenceFuture: false,
};

function createInitialState(): PrototypeState {
  return {
    step: "research",
    researchStep: 0,
    research: { ...initialResearch },
    thesis: {
      ...seededThesis,
      valuation: "",
      openQuestions: seededThesis.openQuestions,
      performanceObservation: "",
    },
    decision: { ...initialDecision },
    pattern: { ...initialPattern },
    lessonNote: laterObservation.userLessonSeed,
  };
}

interface PrototypeAppProps {
  className?: string;
  showChrome?: boolean;
}

export function PrototypeApp({
  className = "",
  showChrome = true,
}: PrototypeAppProps) {
  const [state, setState] = useState<PrototypeState>(createInitialState);

  const go = (step: PrototypeStep) =>
    setState((prev) => ({ ...prev, step }));

  let content: React.ReactNode;

  switch (state.step) {
    case "research":
      content = (
        <GuidedResearch
          researchStep={state.researchStep}
          answers={state.research}
          onChange={(next) =>
            setState((prev) => ({
              ...prev,
              research: { ...prev.research, ...next },
            }))
          }
          onStepChange={(researchStep) =>
            setState((prev) => ({ ...prev, researchStep }))
          }
          onContinue={() => {
            setState((prev) => ({
              ...prev,
              step: "performance",
              thesis: hydrateThesis(prev.research, prev.thesis),
            }));
          }}
        />
      );
      break;
    case "performance":
      content = (
        <FinancialPerformance
          performanceObservation={state.thesis.performanceObservation}
          onObservationChange={(performanceObservation) =>
            setState((prev) => ({
              ...prev,
              thesis: { ...prev.thesis, performanceObservation },
            }))
          }
          onBack={() => go("research")}
          onContinue={() => go("thesis")}
        />
      );
      break;
    case "thesis":
      content = (
        <ThesisBuilder
          thesis={state.thesis}
          research={state.research}
          onChange={(next) =>
            setState((prev) => ({
              ...prev,
              thesis: { ...prev.thesis, ...next },
            }))
          }
          onBack={() => go("performance")}
          onContinue={() => go("decision")}
        />
      );
      break;
    case "decision":
      content = (
        <DecisionJournal
          decision={state.decision}
          onChange={(next) =>
            setState((prev) => ({
              ...prev,
              decision: { ...prev.decision, ...next },
            }))
          }
          onBack={() => go("thesis")}
          onContinue={() => go("reflection")}
        />
      );
      break;
    case "reflection":
      content = (
        <ReflectionPlaybook
          thesis={state.thesis}
          decision={state.decision}
          pattern={state.pattern}
          lessonNote={state.lessonNote}
          onPatternChange={(next) =>
            setState((prev) => ({
              ...prev,
              pattern: { ...prev.pattern, ...next },
            }))
          }
          onLessonChange={(lessonNote) =>
            setState((prev) => ({ ...prev, lessonNote }))
          }
          onBack={() => go("decision")}
          onRestart={() => setState(createInitialState())}
        />
      );
      break;
  }

  const body = (
    <>
      <StepRail
        current={state.step}
        onSelect={(step) => {
          setState((prev) => ({ ...prev, step }));
        }}
      />
      <div className="min-h-0 flex-1">{content}</div>
    </>
  );

  if (!showChrome) {
    return (
      <div className={`flex h-full flex-col bg-paper ${className}`}>{body}</div>
    );
  }

  return <PhoneFrame className={className}>{body}</PhoneFrame>;
}

function hydrateThesis(
  research: ResearchAnswers,
  thesis: ThesisDraft,
): ThesisDraft {
  return {
    ...thesis,
    evidence: thesis.evidence || research.evidence || thesis.evidence,
    risks: thesis.risks || research.risks || thesis.risks,
    openQuestions:
      thesis.openQuestions ||
      research.uncertainties ||
      thesis.openQuestions,
  };
}
