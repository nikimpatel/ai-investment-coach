const pillars = [
  {
    title: "Your theses",
    body: "Structured write-ups you can reopen when life gets noisy.",
  },
  {
    title: "Your lessons",
    body: "Notes captured after outcomes — in your language, not market jargon.",
  },
  {
    title: "Your patterns",
    body: "Habits you endorse, rewrite or reject. Nothing silent. Nothing permanent without consent.",
  },
];

export function Playbook() {
  return (
    <section id="playbook" className="border-t border-line bg-mist/40">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-deep">
          Personal investing playbook
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl tracking-tight text-ink sm:text-4xl">
          A living record of how you invest — not a scorecard of returns.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Over time the playbook becomes the difference between accumulating
          tickers and accumulating judgement.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="border-t border-ink/10 pt-5">
              <h3 className="font-display text-xl text-ink">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
