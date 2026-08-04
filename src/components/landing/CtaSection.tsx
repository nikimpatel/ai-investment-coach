import { CtaButton } from "@/components/ui/CtaButton";

export function CtaSection() {
  return (
    <section className="border-t border-line bg-accent text-paper">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:flex-row lg:items-center">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            Help us validate a calmer way to invest deliberately.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-paper/75">
            Join the early-access group, or spend 20 minutes telling us how you
            currently research and review decisions.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <CtaButton
            kind="early-access"
            className="!bg-paper !text-ink hover:!bg-mist"
          >
            Join the early-access group
          </CtaButton>
          <CtaButton
            kind="interview"
            variant="secondary"
            className="!border-paper/30 !bg-transparent !text-paper hover:!bg-paper/10"
          >
            Help shape the product
          </CtaButton>
        </div>
      </div>
    </section>
  );
}
