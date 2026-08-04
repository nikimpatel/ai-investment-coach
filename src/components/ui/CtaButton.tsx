"use client";

import { useState } from "react";
import { siteConfig } from "@/lib/config";
import { Modal } from "./Modal";

type CtaKind = "early-access" | "interview";

interface CtaButtonProps {
  kind: CtaKind;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}

const copy: Record<
  CtaKind,
  { url: string; modalTitle: string; modalBody: string }
> = {
  "early-access": {
    url: siteConfig.earlyAccessUrl,
    modalTitle: "Early-access list",
    modalBody:
      "Thanks for your interest. The early-access signup isn’t open yet — we’ll share a form when the list is ready.",
  },
  interview: {
    url: siteConfig.interviewUrl,
    modalTitle: "Help shape the product",
    modalBody:
      "Interview booking isn’t linked yet. We’d love a short conversation about how you research investments — check back soon for a scheduling link.",
  },
};

export function CtaButton({
  kind,
  children,
  variant = "primary",
  className = "",
}: CtaButtonProps) {
  const [open, setOpen] = useState(false);
  const config = copy[kind];

  const styles =
    variant === "primary"
      ? "bg-accent text-paper hover:bg-accent-deep"
      : variant === "secondary"
        ? "border border-ink/15 bg-paper text-ink hover:border-ink/30 hover:bg-mist"
        : "text-ink underline-offset-4 hover:underline";

  const handleClick = () => {
    if (config.url) {
      window.open(config.url, "_blank", "noopener,noreferrer");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${styles} ${className}`}
      >
        {children}
      </button>
      <Modal
        open={open}
        title={config.modalTitle}
        description={config.modalBody}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
