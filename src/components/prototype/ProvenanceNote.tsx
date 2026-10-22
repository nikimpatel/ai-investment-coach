export function ProvenanceNote({ source, date }: { source: string; date: string }) {
  return (
    <dl
      data-testid="data-provenance"
      className="space-y-0.5 text-[11px] leading-relaxed text-muted"
    >
      <div>
        <dt className="inline font-medium text-ink/80">Source: </dt>
        <dd className="inline">{source}</dd>
      </div>
      <div>
        <dt className="inline font-medium text-ink/80">Date: </dt>
        <dd className="inline">{date}</dd>
      </div>
    </dl>
  );
}
