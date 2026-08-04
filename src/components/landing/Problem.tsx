const pains = [
  {
    title: "Research scatters",
    body: "Notes live in screenshots, browser tabs and half-finished spreadsheets — hard to revisit with honesty.",
  },
  {
    title: "Decisions fade",
    body: "Months later it is unclear why you decided, what you feared, or what would have changed your mind.",
  },
  {
    title: "Patterns stay invisible",
    body: "You sense habits — chasing narratives, skipping valuation — but never see them with evidence.",
  },
];

export function Problem() {
  return (
    <section className="border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-deep">
          The problem
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl tracking-tight text-ink sm:text-4xl">
          Most investors improve their watchlist faster than their thinking.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Tools help you find ideas. Fewer tools help you explain an idea,
          pressure-test it, and learn from the decision afterward — without
          turning into a trading terminal.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {pains.map((pain) => (
            <div key={pain.title} className="border-t border-ink/10 pt-5">
              <h3 className="font-display text-xl text-ink">{pain.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {pain.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
