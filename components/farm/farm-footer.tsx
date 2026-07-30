import Link from "next/link";

export function FarmFooter() {
  return (
    <footer className="rm-footer">
      <div className="rm-wrap rm-footer-inner">
        <div className="rm-footer-brand">
          <span className="rm-brand-glyph" aria-hidden="true">
            🌾
          </span>
          <div>
            <p className="rm-footer-name">Run-a-Muck Farms</p>
            <p className="rm-footer-muted">Cut-to-order flowers &amp; regenerative design · New Cumberland, PA</p>
          </div>
        </div>

        <nav className="rm-footer-links" aria-label="Footer">
          <Link href="/florists">For Florists</Link>
          <Link href="/florists/availability">Seasonal Availability</Link>
          <Link href="/request">Request a Quote</Link>
        </nav>

        <p className="rm-footer-note">
          The farm is not open to visitors. In-person activity happens at 224 4th St, New Cumberland, and at client and
          event locations.
        </p>
      </div>
    </footer>
  );
}
