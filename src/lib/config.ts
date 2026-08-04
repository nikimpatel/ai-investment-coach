/**
 * Validation prototype configuration.
 * Set earlyAccessUrl / interviewUrl when forms are ready.
 * Leave empty ("") to open an in-page placeholder modal instead of navigating away.
 */
export const siteConfig = {
  productName: "AI Investment Coach",
  /** External early-access form URL, or "" for placeholder modal */
  earlyAccessUrl: "",
  /** External interview booking URL, or "" for placeholder modal */
  interviewUrl: "",
} as const;
