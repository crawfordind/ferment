import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thank you",
  description: "Your request is in. We'll be in touch within two business days.",
  alternates: { canonical: "/request/thank-you" },
  robots: { index: false },
};

export default function ThankYouPage() {
  return (
    <section className="rm-section">
      <div className="rm-wrap rm-center">
        <span className="rm-card-glyph" aria-hidden="true" style={{ fontSize: 44 }}>
          🌾
        </span>
        <h1 className="rm-h1">Thank you — it&apos;s in.</h1>
        <p className="rm-lead" style={{ margin: "0 auto 24px" }}>
          We&apos;ve got your request and sent a confirmation to your inbox. Daniel reads every inquiry himself and will
          get back to you within two business days — usually sooner.
        </p>
        <div className="rm-hero-cta" style={{ justifyContent: "center" }}>
          <Link href="/florists" className="rm-btn rm-btn-ghost">
            Back to growing contracts
          </Link>
          <Link href="/florists/availability" className="rm-btn rm-btn-ghost">
            See what&apos;s in season
          </Link>
        </div>
      </div>
    </section>
  );
}
