import { siteConfig } from "@/lib/config";
import { CtaButton } from "@/components/ui/CtaButton";

export function Header() {
  return (
    <header className="relative z-20 border-b border-ink/5 bg-paper/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:gap-4 sm:px-8">
        <a
          href="#top"
          className="min-w-0 shrink font-display text-base tracking-tight text-ink sm:text-lg"
        >
          {siteConfig.productName}
        </a>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <a href="#how-it-works" className="transition hover:text-ink">
            How it works
          </a>
          <a href="#prototype" className="transition hover:text-ink">
            Try the prototype
          </a>
          <a href="#playbook" className="transition hover:text-ink">
            Playbook
          </a>
        </nav>
        <CtaButton
          kind="early-access"
          className="shrink-0 !px-3 !py-2 !text-xs sm:!px-5 sm:!py-2.5 sm:!text-sm"
        >
          Join early access
        </CtaButton>
      </div>
    </header>
  );
}
