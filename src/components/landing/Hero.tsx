import { CtaButton } from "@/components/ui/CtaButton";
import { siteConfig } from "@/lib/config";
import { StaticPhonePreview } from "./StaticPhonePreview";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-hero"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-sand/40 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div className="animate-fade-up">
          <p className="font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]">
            {siteConfig.productName}
          </p>
          <h1 className="mt-5 max-w-xl font-display text-2xl leading-snug text-ink/90 sm:text-3xl">
            Build a better investing process—not just a bigger watchlist.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            Think through investment ideas, capture your reasoning and build a
            personal investing playbook that improves with you.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <CtaButton kind="early-access">Join the early-access group</CtaButton>
            <CtaButton kind="interview" variant="secondary">
              Help shape the product
            </CtaButton>
          </div>
          <p className="mt-6 max-w-md text-xs leading-relaxed text-muted">
            <a href="#prototype" className="font-medium text-accent-deep underline-offset-4 hover:underline">
              Try the interactive prototype
            </a>{" "}
            — a fictional company walkthrough in your browser.
          </p>
        </div>

        <div className="animate-fade-up-delay flex justify-center lg:justify-end">
          <StaticPhonePreview />
        </div>
      </div>
    </section>
  );
}
