import type { ResultStatus } from "./types";

export interface ObservationLike {
  id: string;
  document_id: string | null;
  test_name: string;
  value: string | null;
  numeric_value: number | null;
  unit: string | null;
  range_lower: number | null;
  range_upper: number | null;
  range_original_text: string | null;
  status: string;
  report_date: string | null;
  source_page: number | null;
  verification_status: string;
  created_at: string;
}

export interface DocumentLike {
  id: string;
  file_name: string;
  report_date: string | null;
  uploaded_at: string;
  checksum: string | null;
  processing_status: string;
}

export interface Conflict {
  id: string;
  kind: "CONFLICTING_VALUE" | "UNIT_MISMATCH" | "DUPLICATE_DOCUMENT";
  title: string;
  explanation: string;
  entries: { label: string; detail: string }[];
}

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Detects potential inconsistencies. MedLens never decides which value is
 * correct — it only surfaces the conflict for human review.
 */
export function detectConflicts(
  observations: ObservationLike[],
  documents: DocumentLike[],
): Conflict[] {
  const conflicts: Conflict[] = [];
  const docById = new Map(documents.map((d) => [d.id, d]));

  // Same test + same reported date with different values.
  const groups = new Map<string, ObservationLike[]>();
  for (const o of observations) {
    if (o.verification_status === "REJECTED") continue;
    const key = `${norm(o.test_name)}|${o.report_date ?? "no-date"}`;
    const list = groups.get(key) ?? [];
    list.push(o);
    groups.set(key, list);
  }

  for (const [key, list] of groups) {
    if (list.length < 2) continue;
    const values = new Set(list.map((o) => `${o.value ?? ""}`.trim()));
    const units = new Set(list.map((o) => norm(o.unit ?? "")));
    const testName = list[0]!.test_name;

    if (values.size > 1) {
      conflicts.push({
        id: `value-${key}`,
        kind: "CONFLICTING_VALUE",
        title: `${testName} has conflicting values for the same reported date`,
        explanation:
          "Two or more extracted results report different values for the same test on the same date. MedLens does not decide which value is correct — please check each source and verify manually.",
        entries: list.map((o) => ({
          label: `${o.value ?? "No value"}${o.unit ? ` ${o.unit}` : ""}`,
          detail: `${docById.get(o.document_id ?? "")?.file_name ?? "Manually added"}${
            o.source_page ? ` — page ${o.source_page}` : ""
          }`,
        })),
      });
    } else if (units.size > 1) {
      conflicts.push({
        id: `unit-${key}`,
        kind: "UNIT_MISMATCH",
        title: `${testName} is reported with inconsistent units`,
        explanation:
          "The same test appears with different units. Values in different units are not compared automatically. Human verification is required.",
        entries: list.map((o) => ({
          label: `${o.value ?? "No value"} ${o.unit ?? "(no unit)"}`,
          detail: docById.get(o.document_id ?? "")?.file_name ?? "Manually added",
        })),
      });
    }
  }

  // Duplicate uploads by checksum.
  const byChecksum = new Map<string, DocumentLike[]>();
  for (const d of documents) {
    if (!d.checksum) continue;
    const list = byChecksum.get(d.checksum) ?? [];
    list.push(d);
    byChecksum.set(d.checksum, list);
  }
  for (const [sum, list] of byChecksum) {
    if (list.length < 2) continue;
    conflicts.push({
      id: `dup-${sum}`,
      kind: "DUPLICATE_DOCUMENT",
      title: "The same document appears to have been uploaded more than once",
      explanation:
        "These files have identical contents. Review them and remove any copy you do not need.",
      entries: list.map((d) => ({
        label: d.file_name,
        detail: `Uploaded ${new Date(d.uploaded_at).toLocaleString()}`,
      })),
    });
  }

  return conflicts;
}

export interface ComparisonRow {
  testName: string;
  unit: string | null;
  previous: ObservationLike | null;
  current: ObservationLike | null;
  change: string;
  comparable: boolean;
}

/** Compares two reports. Values with different units are never converted. */
export function compareObservations(
  previous: ObservationLike[],
  current: ObservationLike[],
): ComparisonRow[] {
  const names = new Set([
    ...previous.map((o) => norm(o.test_name)),
    ...current.map((o) => norm(o.test_name)),
  ]);
  const rows: ComparisonRow[] = [];

  for (const name of names) {
    const p = previous.find((o) => norm(o.test_name) === name) ?? null;
    const c = current.find((o) => norm(o.test_name) === name) ?? null;
    const testName = c?.test_name ?? p?.test_name ?? name;
    let comparable = false;
    let change = "Not comparable";

    if (!p || !c) {
      change = p ? "Not present in the newer report" : "Not present in the earlier report";
    } else if (norm(p.unit ?? "") !== norm(c.unit ?? "")) {
      change = "Units differ — not comparable";
    } else if (p.numeric_value === null || c.numeric_value === null) {
      change = "Non-numeric result — not comparable";
    } else {
      comparable = true;
      const delta = Number((c.numeric_value - p.numeric_value).toFixed(4));
      change = delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${delta}`;
    }

    rows.push({ testName, unit: c?.unit ?? p?.unit ?? null, previous: p, current: c, change, comparable });
  }

  return rows.sort((a, b) => a.testName.localeCompare(b.testName));
}

export function statusOf(o: { status: string }): ResultStatus {
  const s = o.status as ResultStatus;
  return (["LOW", "WITHIN_STATED_RANGE", "HIGH", "UNDETERMINED"] as const).includes(s)
    ? s
    : "UNDETERMINED";
}
