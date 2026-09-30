export const PROTOTYPE_BRIEFING_DISMISSED_KEY = "aic.prototypeBriefingDismissed.v1";

export interface BriefingStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function isBriefingDismissedValue(raw: string | null): boolean {
  if (raw === null) return false;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return false;
    }
    return (parsed as { dismissed?: unknown }).dismissed === true;
  } catch {
    return false;
  }
}

export function readBriefingDismissed(storage: BriefingStorage): boolean {
  try {
    return isBriefingDismissedValue(storage.getItem(PROTOTYPE_BRIEFING_DISMISSED_KEY));
  } catch {
    return false;
  }
}

export function writeBriefingDismissed(storage: BriefingStorage): void {
  storage.setItem(
    PROTOTYPE_BRIEFING_DISMISSED_KEY,
    JSON.stringify({ dismissed: true }),
  );
}
