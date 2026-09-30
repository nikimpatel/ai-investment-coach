"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PrototypeApp } from "@/components/prototype/PrototypeApp";
import {
  readBriefingDismissed,
  writeBriefingDismissed,
  type BriefingStorage,
} from "@/lib/prototype-briefing-storage";

function browserStorage(): BriefingStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function PrototypeExperience() {
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const walkthroughRef = useRef<HTMLDivElement>(null);
  const shouldFocusWalkthrough = useRef(false);

  useLayoutEffect(() => {
    const storage = browserStorage();
    if (storage && readBriefingDismissed(storage)) {
      // Read after mount, then swap before paint. The server render stays on the briefing.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage
      setShowWalkthrough(true);
    }
  }, []);

  useEffect(() => {
    if (!showWalkthrough || !shouldFocusWalkthrough.current) return;
    shouldFocusWalkthrough.current = false;
    walkthroughRef.current?.focus();
  }, [showWalkthrough]);

  const revealWalkthrough = () => {
    const storage = browserStorage();
    if (storage) {
      try {
        writeBriefingDismissed(storage);
      } catch {
        // Still reveal for this visit. The next load shows the briefing again.
      }
    }
    shouldFocusWalkthrough.current = true;
    setShowWalkthrough(true);
  };

  if (!showWalkthrough) {
    return <PrototypeBriefing onDismiss={revealWalkthrough} />;
  }

  return (
    <div
      ref={walkthroughRef}
      id="prototype-walkthrough"
      tabIndex={-1}
      aria-label="Interactive walkthrough"
      className="rounded-[2.2rem] bg-paper/5 p-3 ring-1 ring-paper/10 outline-none focus:[outline-style:solid] focus:outline-2 focus:outline-offset-4 focus:outline-sand"
    >
      <PrototypeApp />
    </div>
  );
}

function PrototypeBriefing({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="w-full max-w-lg rounded-[1.5rem] bg-paper p-5 text-ink shadow-phone sm:p-6">
      <h3 className="font-display text-2xl tracking-tight">What this is</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        A coach for how you research, decide and learn from investment
        decisions. It is not a stock screener, tip feed or trading tool.
      </p>

      <h3 className="mt-6 font-display text-2xl tracking-tight">What you will do</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Walk one investment idea through:
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ink">
        <li>Research</li>
        <li>Finance</li>
        <li>Thesis</li>
        <li>Decision</li>
        <li>Reflection</li>
      </ol>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        About 5 minutes for the core walkthrough.
      </p>

      <h3 className="mt-6 font-display text-2xl tracking-tight">What not to expect</h3>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted">
        <li>No login is required</li>
        <li>Nothing is bought, sold or traded</li>
        <li>Harborline Logistics is fictional</li>
        <li>Apple figures are historical SEC data provided for education only</li>
      </ul>

      <div className="mt-6 flex flex-col items-start gap-3">
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-3 text-sm font-medium text-paper transition hover:bg-accent-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Start the walkthrough
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-medium text-muted underline-offset-4 transition hover:text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
