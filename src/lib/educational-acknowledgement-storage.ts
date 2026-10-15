export const EDUCATIONAL_ACKNOWLEDGEMENT_KEY = "aic.educationalAcknowledgement.v1";

export interface AcknowledgementStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function isEducationalAcknowledgementValue(raw: string | null): boolean {
  if (raw === null) return false;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return false;
    }
    return (parsed as { accepted?: unknown }).accepted === true;
  } catch {
    return false;
  }
}

export function readEducationalAcknowledgement(
  storage: AcknowledgementStorage,
): boolean {
  try {
    return isEducationalAcknowledgementValue(
      storage.getItem(EDUCATIONAL_ACKNOWLEDGEMENT_KEY),
    );
  } catch {
    return false;
  }
}

export function writeEducationalAcknowledgement(
  storage: AcknowledgementStorage,
): void {
  storage.setItem(
    EDUCATIONAL_ACKNOWLEDGEMENT_KEY,
    JSON.stringify({ accepted: true }),
  );
}
