export function Disclaimer() {
  return (
    <section className="border-t border-line bg-paper">
      <div className="mx-auto max-w-3xl px-5 py-14 text-center sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-deep">
          Educational decision-support
        </p>
        <h2 className="mt-3 font-display text-2xl tracking-tight text-ink sm:text-3xl">
          Not personal financial advice.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          AI Investment Coach is a reflection and decision-support tool for
          self-directed investors. It does not recommend securities, predict
          prices, or tell you to buy, sell or hold. Any coaching language is
          educational — designed to improve how you think, not to replace your
          judgement, licensed advice or your broker.
        </p>
      </div>
    </section>
  );
}
