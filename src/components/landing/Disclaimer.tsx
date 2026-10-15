import Link from "next/link";
import { DISCLAIMER_PATH, EDUCATIONAL_DISCLAIMER } from "@/lib/compliance-copy";

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
        <p className="mt-4 text-sm leading-relaxed text-muted">{EDUCATIONAL_DISCLAIMER}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          The coach does not recommend securities, predict prices, or tell you
          to buy, sell, or hold. Harborline Logistics and Apple’s historical
          figures are illustrative examples only.
        </p>
        <p className="mt-6">
          <Link
            href={DISCLAIMER_PATH}
            className="text-sm font-medium text-accent-deep underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Read the disclaimer
          </Link>
        </p>
      </div>
    </section>
  );
}
