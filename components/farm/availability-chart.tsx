import {
  SEASON,
  availableInMonth,
  getAllVarieties,
  seasonBar,
  windowLabel,
  type Variety,
} from "@/lib/varieties";

/**
 * Seasonal availability chart — the trust signal that converts trade buyers
 * (PRD §5.1a). Two synchronized renderings share one dataset:
 *
 *  - a month-by-variety bar grid for viewports ≥ 640px, and
 *  - a native <details> accordion grouped by month for narrow phones (the
 *    PRD's explicit 375px fallback).
 *
 * CSS toggles between them at the breakpoint, so there's no JavaScript and the
 * whole thing renders on the server. Every row also carries a screen-reader
 * sentence, since a shaded bar alone isn't accessible.
 */
export function AvailabilityChart({
  varieties = getAllVarieties(),
}: {
  varieties?: Variety[];
}) {
  const months = SEASON.months;

  return (
    <div className="rm-chart" role="group" aria-label="Seasonal flower availability, April through October">
      <ChartLegend />

      {/* Wide layout: bar grid. Scrolls horizontally only if it must. */}
      <div className="rm-chart-grid" aria-hidden={false}>
        <div className="rm-chart-headrow">
          <div className="rm-chart-namehead">Variety</div>
          <div className="rm-chart-track rm-chart-monthhead">
            {months.map((m) => (
              <span key={m.num} className="rm-chart-month">
                {m.short}
              </span>
            ))}
          </div>
        </div>

        {varieties.map((v) => {
          const bar = seasonBar(v);
          return (
            <div className="rm-chart-row" key={v.slug}>
              <div className="rm-chart-name">
                <span className="rm-chart-varname">{v.name}</span>
                {v.availableForContract ? (
                  <span className="rm-badge rm-badge-contract">Contract</span>
                ) : (
                  <span className="rm-badge rm-badge-market">Market only</span>
                )}
                {v.botanical ? <span className="rm-chart-botanical">{v.botanical}</span> : null}
              </div>
              <div className="rm-chart-track">
                {months.map((m) => (
                  <span key={m.num} className="rm-chart-cell" aria-hidden="true" />
                ))}
                <span
                  className={`rm-chart-bar ${v.availableForContract ? "is-contract" : "is-market"}`}
                  style={{ left: `${bar.leftPct}%`, width: `${bar.widthPct}%` }}
                  aria-hidden="true"
                />
                <span className="rm-sr-only">
                  {v.name}: available {windowLabel(v)}.{" "}
                  {v.availableForContract ? "Available for contract growing." : "Market and event sales only."}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Narrow layout: month accordion. */}
      <div className="rm-chart-accordion">
        {months.map((m, i) => {
          const inMonth = varieties.filter((v) => availableInMonth(v, m.num));
          return (
            <details key={m.num} className="rm-acc" open={i === 0}>
              <summary className="rm-acc-summary">
                <span>{m.label}</span>
                <span className="rm-acc-count">{inMonth.length} in bloom</span>
              </summary>
              <ul className="rm-acc-list">
                {inMonth.length === 0 ? (
                  <li className="rm-acc-empty">Nothing cutting this month.</li>
                ) : (
                  inMonth.map((v) => (
                    <li key={v.slug} className="rm-acc-item">
                      <span className="rm-acc-name">{v.name}</span>
                      <span
                        className={`rm-badge ${v.availableForContract ? "rm-badge-contract" : "rm-badge-market"}`}
                      >
                        {v.availableForContract ? "Contract" : "Market"}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </details>
          );
        })}
      </div>

      <p className="rm-chart-note">
        Windows are typical for our zone-6b fields and shift a week or two with the weather. Contract rows are grown to
        your order — reserve them in winter.
      </p>
    </div>
  );
}

function ChartLegend() {
  return (
    <div className="rm-legend" aria-hidden="true">
      <span className="rm-legend-item">
        <span className="rm-legend-swatch is-contract" /> Available for contract
      </span>
      <span className="rm-legend-item">
        <span className="rm-legend-swatch is-market" /> Market &amp; events only
      </span>
    </div>
  );
}
