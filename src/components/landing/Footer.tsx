import Link from "next/link";
import { DISCLAIMER_PATH, EDUCATIONAL_DISCLAIMER } from "@/lib/compliance-copy";
import { siteConfig } from "@/lib/config";

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-xs leading-relaxed text-muted sm:px-8">
        <p className="font-display text-sm text-ink">{siteConfig.productName}</p>
        <p>{EDUCATIONAL_DISCLAIMER}</p>
        <p>
          <Link
            href={DISCLAIMER_PATH}
            className="font-medium text-accent-deep underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Disclaimer
          </Link>
        </p>
      </div>
    </footer>
  );
}
