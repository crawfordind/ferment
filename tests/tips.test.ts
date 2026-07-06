import { describe, expect, it } from "vitest";

import { FERMENT_TIPS, personalizeTips, type FermentTip } from "@/lib/tips";

const tips: FermentTip[] = [
  { id: "veg", tag: "Food", title: "veg", body: "", appliesTo: ["food"] },
  { id: "brew", tag: "Bev", title: "brew", body: "", appliesTo: ["beverage"] },
  { id: "knf", tag: "KNF", title: "knf", body: "", appliesTo: ["fertilizer"] },
  { id: "general", tag: "Gen", title: "general", body: "" },
];

describe("personalizeTips", () => {
  it("keeps the original order when there are no active sections", () => {
    const { tips: ordered, matchedIds } = personalizeTips(tips, []);
    expect(ordered.map((t) => t.id)).toEqual(["veg", "brew", "knf", "general"]);
    expect(matchedIds.size).toBe(0);
  });

  it("puts shelf-specific matches first, then general, then the rest", () => {
    const { tips: ordered, matchedIds } = personalizeTips(tips, ["fertilizer"]);
    expect(ordered.map((t) => t.id)).toEqual(["knf", "general", "veg", "brew"]);
    expect(matchedIds.has("knf")).toBe(true);
    expect(matchedIds.has("general")).toBe(false);
  });

  it("matches across multiple active sections", () => {
    const { tips: ordered, matchedIds } = personalizeTips(tips, ["food", "beverage"]);
    expect(ordered.slice(0, 2).map((t) => t.id).sort()).toEqual(["brew", "veg"]);
    expect(matchedIds).toEqual(new Set(["veg", "brew"]));
  });

  it("does not lose or duplicate any tip", () => {
    const { tips: ordered } = personalizeTips(FERMENT_TIPS, ["food"]);
    expect(ordered).toHaveLength(FERMENT_TIPS.length);
    expect(new Set(ordered.map((t) => t.id)).size).toBe(FERMENT_TIPS.length);
  });
});
