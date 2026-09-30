import { PrototypeExperience } from "@/components/landing/PrototypeExperience";

export function MobilePreview() {
  return (
    <section id="prototype" className="scroll-mt-6 border-t border-line bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-sand">
            Interactive prototype
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
            Practise the thinking loop.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-paper/70">
            Research an idea, read the financial history, write a thesis, record
            a decision and reflect on what you learn. The core walkthrough takes
            about 5 minutes and stays in your browser.
          </p>
          <ol className="mt-8 space-y-3 text-sm text-paper/80">
            <li>1. Research</li>
            <li>2. Finance</li>
            <li>3. Thesis</li>
            <li>4. Decision</li>
            <li>5. Reflection</li>
          </ol>
        </div>
        <div className="mt-10 min-w-0">
          <PrototypeExperience />
        </div>
      </div>
    </section>
  );
}
