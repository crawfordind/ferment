import type { ServiceDefinition } from "@/lib/request/config";

export type SummaryRow = { label: string; value: string };

function optionLabel(
  options: { value: string; label: string }[] | undefined,
  value: string,
  varietyLabels: Map<string, string>,
): string {
  const fromOptions = options?.find((o) => o.value === value)?.label;
  return fromOptions ?? varietyLabels.get(value) ?? value;
}

/**
 * Turn a stored branch payload into ordered, human-readable rows for the
 * notification email (and, later, the inbox view). Values are mapped back to
 * their option labels so Daniel reads "Flower shop / retail florist", not
 * "shop". `varietyLabels` maps a variety slug → display name for the
 * dynamically-populated variety multi-select.
 */
export function summarizePayload(
  service: ServiceDefinition,
  payload: Record<string, string | string[]>,
  varietyLabels: Map<string, string> = new Map(),
): SummaryRow[] {
  const rows: SummaryRow[] = [];
  for (const field of service.fields) {
    const raw = payload[field.name];
    if (raw === undefined) continue;
    const values = Array.isArray(raw) ? raw : [raw];
    if (values.length === 0) continue;
    const rendered =
      field.type === "select" || field.type === "multiselect"
        ? values.map((v) => optionLabel(field.options, v, varietyLabels)).join(", ")
        : values.join(", ");
    rows.push({ label: field.label, value: rendered });
  }
  return rows;
}
