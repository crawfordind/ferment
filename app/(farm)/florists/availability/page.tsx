import type { Metadata } from "next";
import Link from "next/link";

import { AvailabilityChart } from "@/components/farm/availability-chart";

export const metadata: Metadata = {
  title: "Seasonal crop availability",
  description:
    "A month-by-month look at what Run-a-Muck Farms grows and when it's cuttable — from spring ranunculus and peonies to late-season dahlias.",
  alternates: { canonical: "/florists/availability" },
};

export default function AvailabilityPage() {
  return (
    <>
      <section className="rm-section rm-hero">
        <div className="rm-wrap">
          <span className="rm-eyebrow">Seasonal availability</span>
          <h1 className="rm-h1">What&apos;s in season, month by month.</h1>
          <p className="rm-lead">
            Our field calendar for the current season. Windows are typical for our zone-6b ground and shift a week or
            two with the weather. Rows marked <strong>Contract</strong> can be grown to your order.
          </p>
        </div>
      </section>

      <section className="rm-section-tight">
        <div className="rm-wrap">
          <AvailabilityChart />
        </div>
      </section>

      <section className="rm-section">
        <div className="rm-wrap rm-center">
          <h2 className="rm-h2">See something you want?</h2>
          <p className="rm-lead" style={{ margin: "0 auto 24px" }}>
            Reserve contract rows for your studio before the season fills up.
          </p>
          <Link href="/request?service=contract-growing" className="rm-btn rm-btn-primary">
            Request a growing contract
          </Link>
        </div>
      </section>
    </>
  );
}
