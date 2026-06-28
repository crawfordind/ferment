/** Client-safe public URL for a photo's R2 key (browser thumbnail fallback). */
export function publicPhotoUrl(r2Key: string): string | null {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
  if (!base) {
    return null;
  }
  return `${base.replace(/\/+$/, "")}/${r2Key}`;
}

/** Best-effort image file extension from a captured File/Blob. */
export function imageExtFromFile(file: File): string {
  const fromType = file.type.split("/")[1]?.toLowerCase();
  if (fromType === "jpeg") {
    return "jpg";
  }
  if (fromType && /^[a-z0-9]+$/.test(fromType)) {
    return fromType;
  }
  const fromName = file.name.split(".").pop()?.toLowerCase();
  return fromName && /^[a-z0-9]+$/.test(fromName) ? fromName : "jpg";
}
