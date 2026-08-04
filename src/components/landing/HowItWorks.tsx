const steps = [
  {
    n: "01",
    title: "Explore an idea",
    body: "Start with something you are already curious about — not a tip feed.",
  },
  {
    n: "02",
    title: "Answer guided questions",
    body: "Progressive prompts on attraction, horizon, evidence, risks and unknowns.",
  },
  {
    n: "03",
    title: "Build a thesis",
    body: "Structure opportunity, assumptions, valuation and what would prove you wrong.",
  },
  {
    n: "04",
    title: "Journal the decision",
    body: "Record stance, confidence and reconsider triggers in neutral language.",
  },
  {
    n: "05",
    title: "Reflect later",
    body: "Compare original reasoning with what happened — capture lessons.",
  },
  {
    n: "06",
    title: "Grow a playbook",
    body: "Confirm patterns only when evidence repeats — then reuse them next time.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-deep">
          How it works
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl tracking-tight text-ink sm:text-4xl">
          A loop designed for thoughtful investors — not day traders.
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <article key={step.n} className="border-t border-ink/10 pt-5">
              <p className="font-mono text-xs text-accent-deep">{step.n}</p>
              <h3 className="mt-3 font-display text-xl text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
