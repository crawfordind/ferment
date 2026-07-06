import { ShoppingBag } from "lucide-react";

import { Widget } from "./widget";

/**
 * Placeholder module for a future marketplace (cultures, salts, jars, kits).
 * Present now so the dashboard has a clear slot to grow into.
 */
export function ProductsTeaser() {
  return (
    <Widget title="Shop" icon={ShoppingBag}>
      <div className="flex items-center gap-3 rounded-[var(--radius-card)] bg-subtle-fill px-3 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">Fermentation supplies</p>
          <p className="text-xs text-secondary">
            Curated cultures, salts, jars and kits — matched to your recipes. Coming soon.
          </p>
        </div>
        <span className="shrink-0 rounded-[var(--radius-chip)] bg-white px-2 py-0.5 text-[11px] font-semibold text-muted">
          Soon
        </span>
      </div>
    </Widget>
  );
}
