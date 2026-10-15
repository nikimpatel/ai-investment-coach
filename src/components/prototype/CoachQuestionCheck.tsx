"use client";

import { useState } from "react";
import {
  respondToCoachQuestion,
  type CoachReply,
} from "@/lib/advice-guardrail";

export function CoachQuestionCheck() {
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState<CoachReply | null>(null);

  return (
    <form
      className="min-w-0"
      onSubmit={(event) => {
        event.preventDefault();
        setReply(respondToCoachQuestion(question));
      }}
    >
      <label className="block text-[11px] font-medium text-ink" htmlFor="coach-question">
        Ask the coach
      </label>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
        <input
          id="coach-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs text-ink outline-none focus:border-accent"
          placeholder="Ask how to research or reflect"
        />
        <button
          type="submit"
          className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Check
        </button>
      </div>
      {reply ? (
        <p
          role="status"
          className={`mt-2 text-xs leading-relaxed ${reply.refused ? "text-ink" : "text-muted"}`}
        >
          {reply.message}
        </p>
      ) : null}
    </form>
  );
}
