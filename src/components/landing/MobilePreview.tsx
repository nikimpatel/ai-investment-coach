import { PrototypeApp } from "@/components/prototype/PrototypeApp";

export function MobilePreview() {
  return (
    <section id="prototype" className="border-t border-line bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-sand">
            Interactive prototype
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
            Walk the decision loop on a fictional company.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-paper/70">
            Harborline Logistics is made up — so you can focus on the thinking
            process, not ticker drama. Move through research, thesis, decision
            and reflection. Everything runs locally in your browser.
          </p>
          <ol className="mt-8 space-y-3 text-sm text-paper/80">
            <li>1. Answer progressive research questions</li>
            <li>2. Flesh out a structured thesis</li>
            <li>3. Journal stance and confidence</li>
            <li>4. Review a multi-decision pattern with evidence</li>
          </ol>
        </div>
        <div className="flex justify-center lg:justify-end">
          <div className="rounded-[2.2rem] bg-paper/5 p-3 ring-1 ring-paper/10">
            <PrototypeApp />
          </div>
        </div>
      </div>
    </section>
  );
}
