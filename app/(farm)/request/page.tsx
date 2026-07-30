import type { Metadata } from "next";

import { RequestForm } from "@/components/farm/request-form";
import { getService, isServiceType, type ServiceType } from "@/lib/request/config";
import { getContractVarieties } from "@/lib/varieties";

export const metadata: Metadata = {
  title: "Request a quote",
  description:
    "Tell us about your project — contract growing, a bloom bar, wedding flowers, or regenerative design — and we'll get back to you within two business days.",
  alternates: { canonical: "/request" },
};

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  const initialService: ServiceType | undefined = isServiceType(service) ? service : undefined;
  const active = initialService ? getService(initialService) : undefined;

  // Only contract growing is a live branch in Phase 0; if someone lands on a
  // not-yet-open service, fall back to the selector rather than a dead form.
  const usableService = active?.enabled ? initialService : undefined;

  const varietyOptions = getContractVarieties().map((v) => ({ value: v.slug, label: v.name }));

  return (
    <>
      <section className="rm-section rm-hero">
        <div className="rm-wrap">
          <span className="rm-eyebrow">Request a quote</span>
          <h1 className="rm-h1">Let&apos;s talk about your flowers.</h1>
          <p className="rm-lead">
            {usableService
              ? "A few quick questions so we can put together an accurate quote — no back-and-forth required."
              : "Pick what you're after and we'll ask only the questions that matter for it."}
          </p>
        </div>
      </section>

      <section className="rm-section-tight">
        <div className="rm-wrap">
          <RequestForm initialService={usableService} varietyOptions={varietyOptions} />
        </div>
      </section>
    </>
  );
}
