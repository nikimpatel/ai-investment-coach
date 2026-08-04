import { samplePattern } from "@/lib/sample-data";

export function PatternExample() {
  return (
    <section className="border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-deep">
          Evidence-based observation
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl tracking-tight text-ink sm:text-4xl">
          Patterns only appear when your history can support them.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          One decision is never enough. When a pattern is suggested, you see the
          underlying entries — then confirm, correct or dismiss it.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-t border-ink/10 pt-6">
            <h3 className="font-display text-2xl text-ink">
              {samplePattern.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {samplePattern.summary}
            </p>
            <p className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-muted">
              Evidence from {samplePattern.basedOnCount} decisions
            </p>
            <ul className="mt-3 space-y-4">
              {samplePattern.evidence.map((item) => (
                <li key={item.decision} className="border-l-2 border-accent/40 pl-4">
                  <p className="text-sm font-medium text-ink">{item.decision}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {item.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-mist px-6 py-6">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent-deep">
              If you confirm
            </p>
            <p className="mt-3 font-display text-xl text-ink">
              Future coaching can ask a better question — not push a trade.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              “{samplePattern.proposedCoaching}”
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              {["Confirm", "Correct", "Dismiss"].map((action) => (
                <span
                  key={action}
                  className="rounded-lg border border-ink/10 bg-paper px-3 py-1.5 text-ink"
                >
                  {action}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
