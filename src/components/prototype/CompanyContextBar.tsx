import { DEMO_LABEL, type CompanyContext } from "@/lib/company-context";

export function CompanyContextBar({ company }: { company: CompanyContext }) {
  return (
    <p
      data-testid="company-context"
      aria-live="polite"
      className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 px-3 pb-2 text-[11px] text-muted"
    >
      <span>Analysing</span>
      <span className="font-medium text-ink">
        {company.name} ({company.ticker})
      </span>
      {company.isDemo ? (
        <span className="rounded-md border border-sand/80 bg-sand/30 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-ink/80">
          {DEMO_LABEL}
        </span>
      ) : (
        <span className="rounded-md border border-accent/30 bg-accent/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-accent-deep">
          Real company
        </span>
      )}
    </p>
  );
}
