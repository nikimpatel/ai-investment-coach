export function CoachingConcept() {
  return (
    <section className="border-t border-line bg-mist/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-deep">
            Personal coaching — not memory theatre
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl">
            Understand how you personally research, reason and decide.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            The product should not merely “remember you.” Over multiple
            decisions it can surface transparent, evidence-based patterns —
            always under your control to confirm, correct or dismiss.
          </p>
        </div>
        <ul className="space-y-4">
          {[
            "Frequently discussing growth without considering valuation",
            "Becoming more confident after prices rise",
            "Recording risks that never affect the final decision",
            "Making clearer calls when alternatives are compared",
          ].map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-sm leading-relaxed text-ink"
            >
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent"
                aria-hidden
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
