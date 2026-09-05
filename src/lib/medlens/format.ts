export function formatDate(value: string | null | undefined): string {
  if (!value) return "Not provided in the source";
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Filenames are never trusted — stored paths use a generated id plus a safe extension. */
export function safeExtension(fileName: string, mimeType: string): string {
  const fromName = fileName.split(".").pop()?.toLowerCase() ?? "";
  const allowed = ["pdf", "png", "jpg", "jpeg", "webp"];
  if (allowed.includes(fromName)) return fromName;
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

export function sanitizeDisplayName(fileName: string): string {
  return fileName.replace(/[^\w.\- ]+/g, "").slice(0, 120) || "document";
}
