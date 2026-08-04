import type { PrototypeStep } from "@/lib/types";

const steps: { id: PrototypeStep; label: string }[] = [
  { id: "research", label: "Research" },
  { id: "performance", label: "Finance" },
  { id: "thesis", label: "Thesis" },
  { id: "decision", label: "Decision" },
  { id: "reflection", label: "Reflect" },
];

interface StepRailProps {
  current: PrototypeStep;
  onSelect?: (step: PrototypeStep) => void;
}

export function StepRail({ current, onSelect }: StepRailProps) {
  const currentIndex = steps.findIndex((step) => step.id === current);

  return (
    <nav aria-label="Prototype steps" className="border-b border-line px-3 pb-3">
      <ol className="grid grid-cols-5 gap-1">
        {steps.map((step, index) => {
          const active = step.id === current;
          const done = index < currentIndex;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onSelect?.(step.id)}
                className={`flex w-full flex-col items-center gap-1 rounded-lg px-0.5 py-1.5 text-[10px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  active
                    ? "bg-accent/10 text-accent-deep"
                    : done
                      ? "text-ink"
                      : "text-muted"
                }`}
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={`h-1.5 w-full rounded-full ${
                    active || done ? "bg-accent" : "bg-line"
                  }`}
                  aria-hidden
                />
                {step.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
