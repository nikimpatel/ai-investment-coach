import { PhoneFrame } from "@/components/prototype/PhoneFrame";
import { sampleCompany } from "@/lib/sample-data";

/** Non-interactive hero visual — guided thinking as the dominant product image. */
export function StaticPhonePreview() {
  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-4 pb-4 pt-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent-deep">
          Guided research
        </p>
        <h3 className="mt-1 font-display text-xl text-ink">
          {sampleCompany.name}
        </h3>
        <p className="mt-1 text-xs text-muted">{sampleCompany.tagline}</p>
        <div className="mt-4 rounded-xl bg-mist px-3 py-2.5 text-xs leading-relaxed text-ink/80">
          What first attracted you to this idea?
        </div>
        <div className="mt-3 space-y-2">
          {[
            "A growth story that clicked",
            "Recent news or a podcast",
            "It looked reasonably valued",
          ].map((label, index) => (
            <div
              key={label}
              className={`rounded-xl border px-3 py-2.5 text-sm ${
                index === 1
                  ? "border-accent bg-accent/5 text-ink"
                  : "border-line text-muted"
              }`}
            >
              {label}
            </div>
          ))}
        </div>
        <div className="mt-auto rounded-xl bg-ink px-4 py-2.5 text-center text-sm font-medium text-paper">
          Next question
        </div>
      </div>
    </PhoneFrame>
  );
}
