import { siteConfig } from "@/lib/config";

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="font-display text-sm text-ink">{siteConfig.productName}</p>
        <p>
          Phase 0 validation prototype · Educational use only · Not financial
          advice
        </p>
      </div>
    </footer>
  );
}
