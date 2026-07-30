import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Run-a-Muck Farms — Local flowers, grown to order",
  description:
    "A first-season flower farm on the West Shore. Cut-to-order flowers for florists, mobile bloom bars for events, and regenerative land design — from New Cumberland, PA.",
  alternates: { canonical: "/farm" },
  openGraph: {
    type: "website",
    title: "Run-a-Muck Farms",
    description: "Local, cut-to-order flowers and regenerative design from New Cumberland, PA.",
    url: "/farm",
  },
};

const LOCAL_BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Run-a-Muck Farms",
  description:
    "Local, cut-to-order specialty cut flowers, mobile bloom bars for events, and regenerative land design serving the Harrisburg, York, and West Shore market.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "224 4th St",
    addressLocality: "New Cumberland",
    addressRegion: "PA",
    postalCode: "17070",
    addressCountry: "US",
  },
  areaServed: ["Harrisburg PA", "York PA", "West Shore PA"],
};

export default function FarmLandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_SCHEMA) }}
      />

      <section className="rm-section rm-hero">
        <div className="rm-wrap">
          <span className="rm-eyebrow">Cut-to-order flowers · New Cumberland, PA</span>
          <h1 className="rm-h1">Flowers grown down the road, not flown across the world.</h1>
          <p className="rm-lead">
            Run-a-Muck Farms grows specialty cut flowers on the West Shore — for the florists who want them local, the
            events that want them memorable, and the land that wants to be put back together.
          </p>
        </div>
      </section>

      {/* Three-card selector — the primary sorting mechanism (PRD §4) */}
      <section className="rm-section-tight">
        <div className="rm-wrap">
          <h2 className="rm-h2">What brings you in?</h2>
          <div className="rm-cards">
            <Link href="/florists" className="rm-card">
              <span className="rm-card-glyph" aria-hidden="true">
                🌿
              </span>
              <span className="rm-card-title">Grow with us</span>
              <span className="rm-card-desc">
                Florists &amp; designers: reserve local, cut-to-order flowers for your season.
              </span>
              <span className="rm-card-cta">See contract growing →</span>
            </Link>

            <Link href="/request" className="rm-card">
              <span className="rm-card-glyph" aria-hidden="true">
                💐
              </span>
              <span className="rm-card-title">Book an event</span>
              <span className="rm-card-desc">
                A mobile bloom bar or wedding flowers, styled around your day. Bloom bar &amp; wedding pages arrive this
                fall — start a request now.
              </span>
              <span className="rm-card-cta">Start a request →</span>
            </Link>

            <div className="rm-card" aria-disabled="true">
              <span className="rm-card-glyph" aria-hidden="true">
                🌷
              </span>
              <span className="rm-card-title">Buy flowers</span>
              <span className="rm-card-desc">
                Self-serve flower stands around the West Shore — fresh bouquets, honor-system checkout. Drop locations
                posted each week in season.
              </span>
              <span className="rm-card-cta" style={{ color: "var(--muted)" }}>
                Coming this season
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rm-section">
        <div className="rm-wrap rm-center">
          <h2 className="rm-h2">Buying wholesale for a shop or studio?</h2>
          <p className="rm-lead" style={{ margin: "0 auto 24px" }}>
            Contracts for the 2027 season are set this winter. Reserve your rows before seed is ordered.
          </p>
          <Link href="/florists" className="rm-btn rm-btn-primary">
            Explore contract growing
          </Link>
        </div>
      </section>
    </>
  );
}
