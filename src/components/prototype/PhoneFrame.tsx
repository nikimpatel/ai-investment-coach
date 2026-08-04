interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function PhoneFrame({ children, className = "" }: PhoneFrameProps) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[340px] ${className}`}
      aria-label="Mobile product preview"
    >
      <div className="rounded-[2rem] border border-ink/10 bg-ink p-2 shadow-phone sm:p-2.5">
        <div className="relative overflow-hidden rounded-[1.55rem] bg-paper">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-2">
            <div className="h-5 w-24 rounded-full bg-ink/90" aria-hidden />
          </div>
          <div className="flex h-[min(640px,70vh)] min-h-[520px] flex-col pt-8 sm:h-[640px] sm:min-h-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
