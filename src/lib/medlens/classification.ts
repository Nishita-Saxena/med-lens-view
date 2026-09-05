import type { ResultStatus } from "./types";

/**
 * Deterministic reference-range classification.
 *
 * This is intentionally NOT an AI operation. A result may only be classified
 * against a reference range that is explicitly present in the source document.
 * No generic, population, age- or sex-based range is ever substituted.
 */
export function classifyResult(input: {
  numericValue: number | null | undefined;
  rangeLower: number | null | undefined;
  rangeUpper: number | null | undefined;
}): ResultStatus {
  const { numericValue, rangeLower, rangeUpper } = input;
  if (numericValue === null || numericValue === undefined || Number.isNaN(numericValue)) {
    return "UNDETERMINED";
  }
  const hasLower = rangeLower !== null && rangeLower !== undefined;
  const hasUpper = rangeUpper !== null && rangeUpper !== undefined;
  if (!hasLower && !hasUpper) return "UNDETERMINED";

  if (hasLower && numericValue < (rangeLower as number)) return "LOW";
  if (hasUpper && numericValue > (rangeUpper as number)) return "HIGH";
  return "WITHIN_STATED_RANGE";
}

/** Parses a numeric value out of a raw reported value; qualitative results stay null. */
export function parseNumericValue(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const match = raw.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  // Only treat as numeric when the value is essentially a number, not prose.
  const cleaned = raw.replace(/[<>=~\s]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(match[0]);
}

export function formatRange(
  lower: number | null | undefined,
  upper: number | null | undefined,
  originalText: string | null | undefined,
  unit?: string | null,
): string | null {
  if (originalText && originalText.trim()) return originalText.trim();
  if (lower !== null && lower !== undefined && upper !== null && upper !== undefined) {
    return `${lower}–${upper}${unit ? ` ${unit}` : ""}`;
  }
  if (lower !== null && lower !== undefined) return `≥ ${lower}${unit ? ` ${unit}` : ""}`;
  if (upper !== null && upper !== undefined) return `≤ ${upper}${unit ? ` ${unit}` : ""}`;
  return null;
}
