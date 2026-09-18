"use client";

import { useEffect, useState } from "react";
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
import {
  createGuidedAnalysis,
  type AnalysisPacket,
  type AppleGuidedAnalysisV1,
} from "@/lib/guided-analysis";
import {
  loadGuidedAnalysis,
  resetGuidedAnalysis,
  saveGuidedAnalysis,
} from "@/lib/guided-analysis-storage";
import { DecisionJournal } from "./DecisionJournal";
import { FinancialPerformance } from "./FinancialPerformance";
import { GuidedAppleAnalysis } from "./GuidedAppleAnalysis";
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
      performanceEvidence: null,
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
  const [guidedAnalysis, setGuidedAnalysis] =
    useState<AppleGuidedAnalysisV1 | null>(null);
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [guidedStorageIssue, setGuidedStorageIssue] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const result = loadGuidedAnalysis(window.localStorage);
    window.queueMicrotask(() => {
      if (result.status === "ok") {
        setGuidedAnalysis(result.value);
      } else if (result.status === "newer-version") {
        setGuidedStorageIssue(
          "Saved Apple analysis is from a newer version. It was left unchanged.",
        );
      } else if (result.status === "invalid") {
        setGuidedStorageIssue(
          "Saved Apple analysis could not be read. It was left unchanged.",
        );
      }
    });
  }, []);

  useEffect(() => {
    if (!guidedAnalysis) return;
    const timer = window.setTimeout(() => {
      saveGuidedAnalysis(window.localStorage, guidedAnalysis);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [guidedAnalysis]);

  const go = (step: PrototypeStep) => {
    if (step === "performance" && guidedAnalysis) {
      setGuidedOpen(true);
    }
    setState((prev) => ({ ...prev, step }));
  };

  const startGuidedAnalysis = () => {
    if (guidedStorageIssue) return;
    if (!guidedAnalysis) {
      const created = createGuidedAnalysis(
        new Date().toISOString(),
        crypto.randomUUID(),
      );
      setGuidedAnalysis(created);
    }
    setGuidedOpen(true);
  };

  const clearGuidedAnalysis = () => {
    resetGuidedAnalysis(window.localStorage);
    setGuidedAnalysis(null);
    setGuidedStorageIssue(null);
    setGuidedOpen(false);
  };

  const saveAnalysisPacket = (packet: AnalysisPacket) => {
    setState((previous) => {
      const packets = previous.thesis.analysisPackets.filter(
        (candidate) => candidate.id !== packet.id,
      );
      return {
        ...previous,
        thesis: {
          ...previous.thesis,
          analysisPackets: [...packets, packet],
        },
      };
    });
  };

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
      content =
        guidedOpen && guidedAnalysis ? (
          <GuidedAppleAnalysis
            analysis={guidedAnalysis}
            onChange={setGuidedAnalysis}
            onExit={() => setGuidedOpen(false)}
            onReset={clearGuidedAnalysis}
            onSavePacket={saveAnalysisPacket}
            savedPacketIds={state.thesis.analysisPackets.map((packet) => packet.id)}
          />
        ) : (
        <FinancialPerformance
          initialDataset={guidedAnalysis ? "apple" : "harborline"}
          performanceObservation={state.thesis.performanceObservation}
          onObservationChange={(performanceObservation) =>
            setState((prev) => ({
              ...prev,
              thesis: { ...prev.thesis, performanceObservation },
            }))
          }
          performanceEvidence={state.thesis.performanceEvidence}
          onEvidenceChange={(performanceEvidence) =>
            setState((prev) => ({
              ...prev,
              thesis: { ...prev.thesis, performanceEvidence },
            }))
          }
          hasGuidedAnalysis={guidedAnalysis !== null}
          guidedStorageIssue={guidedStorageIssue}
          onStartGuidedAnalysis={startGuidedAnalysis}
          onResetGuidedAnalysis={clearGuidedAnalysis}
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
          onRestart={() => {
            setState(createInitialState());
            setGuidedOpen(false);
          }}
        />
      );
      break;
  }

  const body = (
    <>
      {!guidedOpen && (
        <StepRail
          current={state.step}
          onSelect={go}
        />
      )}
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
