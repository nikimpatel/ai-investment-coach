interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
  /**
   * "always" keeps the bezel at every width (hero preview).
   * "desktop" shows it only at the lg breakpoint.
   * "never" is the wide or fluid layout.
   * The element tree stays the same so children are not remounted.
   */
  chrome?: "always" | "desktop" | "never";
}

export function PhoneFrame({
  children,
  className = "",
  chrome = "always",
}: PhoneFrameProps) {
  const always = chrome === "always";
  const desktop = chrome === "desktop";

  return (
    <div
      className={[
        "relative w-full",
        always ? "mx-auto max-w-[340px]" : "",
        desktop ? "lg:mx-auto lg:max-w-[340px]" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={always ? "Mobile product preview" : undefined}
    >
      <div
        className={[
          always
            ? "rounded-[2rem] border border-ink/10 bg-ink p-2 shadow-phone sm:p-2.5"
            : "",
          desktop
            ? "lg:rounded-[2rem] lg:border lg:border-ink/10 lg:bg-ink lg:p-2.5 lg:shadow-phone"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className={[
            "overflow-hidden bg-paper text-ink",
            always ? "relative rounded-[1.55rem]" : "rounded-2xl",
            desktop ? "lg:relative lg:rounded-[1.55rem]" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div
            className={[
              "pointer-events-none absolute inset-x-0 top-0 z-10 justify-center pt-2",
              always ? "flex" : "hidden",
              desktop ? "lg:flex" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-hidden
          >
            <div className="h-5 w-24 rounded-full bg-ink/90" />
          </div>
          <div
            className={[
              "flex flex-col",
              always
                ? "h-[min(640px,70vh)] min-h-[520px] pt-8 sm:h-[640px] sm:min-h-0"
                : "h-[min(920px,82vh)] min-h-[560px]",
              desktop
                ? "lg:h-[640px] lg:min-h-0 lg:pt-8"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
