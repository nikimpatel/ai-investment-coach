import { siteConfig } from "@/lib/config";
import { CtaButton } from "@/components/ui/CtaButton";

export function Header() {
  return (
    <header className="relative z-20 border-b border-ink/5 bg-paper/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:gap-4 sm:px-8">
        <a
          href="#top"
          className="min-w-0 shrink truncate font-display text-base tracking-tight text-ink sm:text-lg"
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
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <CtaButton
            kind="early-access"
            variant="ghost"
            className="!px-1.5 !py-2 !text-xs sm:!px-3 sm:!text-sm"
          >
            <span className="sm:hidden">Early access</span>
            <span className="hidden sm:inline">Join early access</span>
          </CtaButton>
          <a
            href="#prototype"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-accent px-2.5 py-2 text-xs font-medium text-paper transition hover:bg-accent-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-4 sm:py-2.5 sm:text-sm"
          >
            Try the walkthrough
          </a>
        </div>
      </div>
    </header>
  );
}
