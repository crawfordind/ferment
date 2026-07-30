import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/http";
import { summarizePayload } from "@/lib/request/summary";
import { getService } from "@/lib/request/config";
import { HONEYPOT_FIELD, validateInquiry } from "@/lib/request/validate";

function base(overrides: Record<string, unknown> = {}) {
  return {
    serviceType: "contract-growing",
    name: "Ada Florist",
    email: "ada@studio.test",
    payload: {
      businessName: "Ada's Studio",
      businessType: "studio",
      seasons: ["2027"],
    },
    ...overrides,
  };
}

describe("validateInquiry", () => {
  it("accepts a well-formed contract-growing submission", () => {
    const result = validateInquiry(base());
    expect(result.spam).toBe(false);
    if (!result.spam) {
      expect(result.inquiry.serviceType).toBe("contract-growing");
      expect(result.inquiry.payload.businessName).toBe("Ada's Studio");
      expect(result.inquiry.payload.seasons).toEqual(["2027"]);
    }
  });

  it("flags a tripped honeypot as spam without throwing", () => {
    const result = validateInquiry(base({ [HONEYPOT_FIELD]: "http://spam" }));
    expect(result.spam).toBe(true);
  });

  it("rejects a missing required branch field", () => {
    expect(() =>
      validateInquiry(base({ payload: { businessType: "studio", seasons: ["2027"] } })),
    ).toThrow(ApiError);
  });

  it("rejects an invalid email", () => {
    expect(() => validateInquiry(base({ email: "not-an-email" }))).toThrow(ApiError);
  });

  it("rejects an unknown service", () => {
    expect(() => validateInquiry(base({ serviceType: "spaceship" }))).toThrow(/Unknown service/);
  });

  it("rejects a service that isn't open yet", () => {
    // Bloom bar is Phase 1 (enabled: false) — the API must not accept it.
    expect(() =>
      validateInquiry({
        serviceType: "bloom-bar",
        name: "Sam",
        email: "sam@test.dev",
        payload: { eventDate: "2027-06-01", zip: "17070" },
      }),
    ).toThrow(/isn't open/);
  });

  it("drops empty branch answers from the stored payload", () => {
    const result = validateInquiry(
      base({ payload: { businessName: "Ada's Studio", businessType: "studio", seasons: ["2027"], deliveryZip: "   " } }),
    );
    expect(result.spam).toBe(false);
    if (!result.spam) {
      expect(result.inquiry.payload).not.toHaveProperty("deliveryZip");
    }
  });
});

describe("summarizePayload", () => {
  it("maps option values back to human labels", () => {
    const service = getService("contract-growing")!;
    const rows = summarizePayload(service, {
      businessType: "studio",
      seasons: ["2027", "2028"],
      varieties: ["dahlia"],
    }, new Map([["dahlia", "Dahlia"]]));

    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.value]));
    expect(byLabel["Business type"]).toBe("Floral design studio");
    expect(byLabel["Season(s) of interest"]).toBe("2027 season, 2028 season");
    expect(byLabel["Varieties of interest"]).toBe("Dahlia");
  });
});
