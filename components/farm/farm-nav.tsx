import Link from "next/link";

/**
 * Primary navigation for the Run-a-Muck service site. Phase 0 surfaces only the
 * routes that are live (PRD §8); the remaining IA items — Flowers, Events &
 * Weddings, Workshops, Design — join the nav as their pages ship in later
 * phases. The mobile menu is a native <details> disclosure so it needs no
 * client JavaScript and stays keyboard-accessible.
 */
const LINKS = [
  { href: "/florists", label: "For Florists" },
  { href: "/florists/availability", label: "Seasonal Availability" },
];

export function FarmNav() {
  return (
    <header className="rm-header">
      <div className="rm-wrap rm-header-inner">
        <Link href="/farm" className="rm-brand" aria-label="Run-a-Muck Farms home">
          <span className="rm-brand-glyph" aria-hidden="true">
            🌾
          </span>
          <span className="rm-brand-name">Run-a-Muck Farms</span>
        </Link>

        <nav className="rm-nav-desktop" aria-label="Primary">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rm-nav-link">
              {l.label}
            </Link>
          ))}
          <Link href="/request" className="rm-btn rm-btn-primary rm-btn-sm">
            Request a Quote
          </Link>
        </nav>

        <details className="rm-nav-mobile">
          <summary className="rm-nav-toggle" aria-label="Open menu">
            <span className="rm-nav-toggle-bar" aria-hidden="true" />
            <span className="rm-nav-toggle-bar" aria-hidden="true" />
            <span className="rm-nav-toggle-bar" aria-hidden="true" />
          </summary>
          <div className="rm-nav-drawer">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="rm-nav-link">
                {l.label}
              </Link>
            ))}
            <Link href="/request" className="rm-btn rm-btn-primary">
              Request a Quote
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
