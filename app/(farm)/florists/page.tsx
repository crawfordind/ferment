import type { Metadata } from "next";
import Link from "next/link";

import { AvailabilityChart } from "@/components/farm/availability-chart";

export const metadata: Metadata = {
  title: "Contract growing for florists & designers",
  description:
    "Local, cut-to-order flowers for florists, designers, and event studios across Harrisburg, York, and the West Shore. Reserve 2027 contract rows this winter.",
  alternates: { canonical: "/florists" },
  openGraph: {
    type: "website",
    title: "Contract growing — Run-a-Muck Farms",
    description:
      "Local, cut-to-order flowers grown to your order. Varieties that ship badly from importers, delivered weekly in season.",
    url: "/florists",
  },
};

// Service schema for local trade-intent search (PRD §7).
const SERVICE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Contract flower growing",
  name: "Contract growing for florists & designers",
  description:
    "Local, cut-to-order specialty cut flowers grown to a florist's or designer's order, with weekly in-season delivery across the Harrisburg, York, and West Shore market.",
  areaServed: ["Harrisburg PA", "York PA", "West Shore PA", "New Cumberland PA"],
  provider: {
    "@type": "LocalBusiness",
    name: "Run-a-Muck Farms",
    address: {
      "@type": "PostalAddress",
      streetAddress: "224 4th St",
      addressLocality: "New Cumberland",
      addressRegion: "PA",
      addressCountry: "US",
    },
  },
};

const STEPS = [
  { title: "Inquire in fall", body: "Tell us your varieties, colors, and rough weekly volume. We talk it through." },
  { title: "Sign in winter", body: "A short contract and a deposit lock in your rows before we order seed." },
  { title: "We plant to order", body: "Your palette goes in the ground — grown for your dates, not a warehouse's." },
  { title: "Weekly delivery", body: "Cut-to-order stems arrive fresh each week through your season." },
];

export default function FloristsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SERVICE_SCHEMA) }}
      />

      {/* Hero */}
      <section className="rm-section rm-hero">
        <div className="rm-wrap">
          <span className="rm-eyebrow">For florists · designers · event studios</span>
          <h1 className="rm-h1">Local flowers, grown to your order.</h1>
          <p className="rm-lead">
            The specialty cuts that ship badly from importers — dahlias, ranunculus, sweet peas, lisianthus — grown here
            on the West Shore and delivered to you the week they&apos;re cut. You pick the palette in winter; we grow it
            for your dates.
          </p>
          <div className="rm-hero-cta">
            <Link href="/request?service=contract-growing" className="rm-btn rm-btn-primary">
              Request a growing contract
            </Link>
            <a href="#availability" className="rm-btn rm-btn-ghost">
              See what&apos;s in season
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="rm-section-tight">
        <div className="rm-wrap">
          <h2 className="rm-h2">How contract growing works</h2>
          <p className="rm-p">
            Contracts for the 2027 season are set this winter — that&apos;s the window to reserve your rows before seed
            is ordered.
          </p>
          <ol className="rm-steps" style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
            {STEPS.map((s, i) => (
              <li className="rm-step" key={s.title}>
                <span className="rm-step-num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="rm-h3">{s.title}</h3>
                <p className="rm-card-desc">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Seasonal availability — the single most important element (PRD §5.1a) */}
      <section className="rm-section-tight" id="availability">
        <div className="rm-wrap">
          <h2 className="rm-h2">Seasonal availability</h2>
          <p className="rm-p">
            What we grow and when it&apos;s cuttable across our zone-6b season. Rows marked{" "}
            <strong>Contract</strong> can be grown to your order and quantities.
          </p>
          <AvailabilityChart />
        </div>
      </section>

      {/* Contract terms */}
      <section className="rm-section-tight">
        <div className="rm-wrap">
          <h2 className="rm-h2">Contract terms, in plain language</h2>
          <div className="rm-panel">
            <dl className="rm-deflist">
              <div>
                <dt>Deposit</dt>
                <dd>
                  A deposit reserves your rows and covers the seed and plugs we buy specifically for you. The balance is
                  invoiced against weekly deliveries through the season.
                </dd>
              </div>
              <div>
                <dt>Delivery windows</dt>
                <dd>
                  Standing weekly deliveries during your crops&apos; windows (see the chart above). Order adjustments
                  are welcome up to the confirmation cutoff each week.
                </dd>
              </div>
              <div>
                <dt>Substitution policy</dt>
                <dd>
                  Field-grown flowers move with the weather. If a variety runs early or short, we substitute a
                  comparable stem in your palette and always clear it with you first — never a surprise in the box.
                </dd>
              </div>
            </dl>
            <p className="rm-help" style={{ marginTop: 16 }}>
              Exact deposit percentage and window lengths are confirmed on your contract.
            </p>
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="rm-section-tight">
        <div className="rm-wrap">
          <div className="rm-callout">
            <span aria-hidden="true">📍</span>
            <span>
              We deliver across <strong>Harrisburg, York, and the West Shore</strong>, with pickup at 224 4th St, New
              Cumberland. Outside that area? Ask — we&apos;ll see what we can work out.
            </span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rm-section">
        <div className="rm-wrap rm-center">
          <h2 className="rm-h2">Reserve your 2027 rows.</h2>
          <p className="rm-lead" style={{ margin: "0 auto 24px" }}>
            Tell us what you need and we&apos;ll put together a growing plan and a quote.
          </p>
          <Link href="/request?service=contract-growing" className="rm-btn rm-btn-primary">
            Request a growing contract
          </Link>
        </div>
      </section>
    </>
  );
}
