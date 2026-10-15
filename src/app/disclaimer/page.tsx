import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { EDUCATIONAL_DISCLAIMER } from "@/lib/compliance-copy";

export const metadata: Metadata = {
  title: `Disclaimer — ${siteConfig.productName}`,
  description: EDUCATIONAL_DISCLAIMER,
};

export default function DisclaimerPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-14 sm:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent-deep">
        Australia
      </p>
      <h1 className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        Educational disclaimer
      </h1>
      <p className="mt-6 text-base leading-relaxed text-ink">{EDUCATIONAL_DISCLAIMER}</p>

      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted">
        <p>
          {siteConfig.productName} helps you practise a research and reflection
          process. It is general educational information. It is not personal
          financial advice, and it is not a recommendation to buy, sell, or hold
          any security.
        </p>
        <p>
          Nothing in the walkthrough considers your objectives, financial
          situation, or needs. A licensed financial adviser can consider those
          circumstances. This product does not act for you, place trades, or
          predict prices.
        </p>
        <p>
          Harborline Logistics is a fictional company used as an illustrative
          example only. Apple figures are historical SEC data, also shown as an
          illustrative example. Past figures are not a view on either company
          and are not a price target.
        </p>
        <p>
          If a question asks for a buy, sell, or hold call, a price target, or a
          personalised recommendation, the coach refuses it and points you back
          to education and reflection.
        </p>
      </div>

      <p className="mt-10">
        <Link
          href="/"
          className="text-sm font-medium text-accent-deep underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Back to the coach
        </Link>
      </p>
    </main>
  );
}
