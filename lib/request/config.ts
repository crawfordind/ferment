/**
 * The unified quote-request form, defined once as data.
 *
 * The PRD's core design principle is "one form engine, not five forms." This
 * module is that engine's source of truth: every service branch, its fields,
 * and their options live here. The client renders from it (`/request`) and the
 * server validates against it (`lib/request/validate.ts`), so a field can never
 * be required in the UI but optional on the server, or vice versa.
 *
 * Framework-free on purpose — no React, no server-only imports — so both sides
 * can share it.
 */

export type ServiceType = "contract-growing" | "bloom-bar" | "wedding" | "design";

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "select"
  | "multiselect"
  | "date"
  | "number";

export type FieldOption = { value: string; label: string };

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: FieldOption[];
  /**
   * Populate options at render time from a live collection instead of a static
   * list. Currently only the Variety collection ("varieties").
   */
  optionsFrom?: "varieties";
  /** Show an inline availability hint when a date is picked (Phase 1 blackout dates). */
  checkAvailability?: boolean;
};

export type ServiceDefinition = {
  type: ServiceType;
  /** Card label in the service selector. */
  label: string;
  /** One-line "this is for you if…" line. */
  tagline: string;
  /** Emoji glyph for the selector card (kept dependency-free). */
  glyph: string;
  /** Subject-line fragment for Daniel's notification email. */
  emailSubject: string;
  /** Whether this branch is live in the current phase. Contract growing ships first (PRD §8). */
  enabled: boolean;
  fields: Field[];
};

/** Asked on every service, before the branch-specific questions. */
export const COMMON_FIELDS: Field[] = [
  { name: "name", label: "Your name", type: "text", required: true, placeholder: "First and last" },
  { name: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" },
  { name: "phone", label: "Phone", type: "tel", placeholder: "(717) 555-0123" },
];

/** Asked on every service, after the branch-specific questions. */
export const TRAILING_FIELDS: Field[] = [
  {
    name: "source",
    label: "How did you hear about us?",
    type: "select",
    options: [
      { value: "instagram", label: "Instagram" },
      { value: "google", label: "Google / search" },
      { value: "flower-stand", label: "One of our flower stands" },
      { value: "referral", label: "Word of mouth / referral" },
      { value: "market", label: "Farmers market or event" },
      { value: "other", label: "Somewhere else" },
    ],
  },
  {
    name: "notes",
    label: "Anything else we should know?",
    type: "textarea",
    placeholder: "Optional — the more you tell us, the tighter the quote.",
  },
];

const BUSINESS_TYPES: FieldOption[] = [
  { value: "studio", label: "Floral design studio" },
  { value: "shop", label: "Flower shop / retail florist" },
  { value: "event-company", label: "Event or planning company" },
  { value: "other", label: "Other" },
];

const STEM_VOLUMES: FieldOption[] = [
  { value: "under-100", label: "Under 100 stems / week" },
  { value: "100-300", label: "100–300 stems / week" },
  { value: "300-600", label: "300–600 stems / week" },
  { value: "600-plus", label: "600+ stems / week" },
  { value: "unsure", label: "Not sure yet" },
];

const SEASONS: FieldOption[] = [
  { value: "2027", label: "2027 season" },
  { value: "2028", label: "2028 season" },
];

const WEDDING_BUDGETS: FieldOption[] = [
  { value: "under-500", label: "Under $500" },
  { value: "500-1500", label: "$500 – $1,500" },
  { value: "1500-3000", label: "$1,500 – $3,000" },
  { value: "3000-6000", label: "$3,000 – $6,000" },
  { value: "6000-plus", label: "$6,000+" },
  { value: "unsure", label: "Not sure yet" },
];

export const SERVICES: ServiceDefinition[] = [
  {
    type: "contract-growing",
    label: "Contract growing",
    tagline: "For florists & designers buying local, cut-to-order flowers.",
    glyph: "🌿",
    emailSubject: "Contract growing inquiry",
    enabled: true,
    fields: [
      { name: "businessName", label: "Business name", type: "text", required: true },
      { name: "businessType", label: "Business type", type: "select", required: true, options: BUSINESS_TYPES },
      { name: "websiteOrInstagram", label: "Website or Instagram", type: "text", placeholder: "@yourstudio or a link" },
      { name: "seasons", label: "Season(s) of interest", type: "multiselect", required: true, options: SEASONS },
      {
        name: "varieties",
        label: "Varieties of interest",
        type: "multiselect",
        optionsFrom: "varieties",
        help: "Pick the crops you'd want us to grow for you. You can refine quantities later.",
      },
      { name: "weeklyStemVolume", label: "Estimated weekly stem volume", type: "select", options: STEM_VOLUMES },
      {
        name: "deliveryPreference",
        label: "Delivery preference",
        type: "select",
        options: [
          { value: "delivered", label: "Delivered" },
          { value: "pickup", label: "Pickup at 224 4th St, New Cumberland" },
        ],
      },
      { name: "deliveryZip", label: "Delivery ZIP", type: "text", placeholder: "For a delivery estimate" },
    ],
  },
  {
    type: "bloom-bar",
    label: "Bloom bar",
    tagline: "A mobile flower bar that travels to your event.",
    glyph: "💐",
    emailSubject: "Bloom bar inquiry",
    // Ships in Phase 1 (PRD §8) once the travel radius + fee are confirmed (open question §10.4).
    enabled: false,
    fields: [
      { name: "eventDate", label: "Event date", type: "date", required: true, checkAvailability: true },
      { name: "eventType", label: "Event type", type: "text", placeholder: "Wedding, shower, corporate…" },
      { name: "venueName", label: "Venue name", type: "text" },
      { name: "zip", label: "Venue ZIP", type: "text", required: true },
      { name: "guestCount", label: "Approx. guest count", type: "number" },
      {
        name: "tier",
        label: "Tier of interest",
        type: "select",
        options: [
          { value: "buckets", label: "Buckets" },
          { value: "kit", label: "Kit" },
          { value: "full-bar", label: "Full Bar (staffed)" },
          { value: "not-sure", label: "Not sure yet" },
        ],
      },
      { name: "startTime", label: "Start time", type: "text", placeholder: "e.g. 4:00 PM" },
      { name: "duration", label: "Expected duration", type: "text", placeholder: "e.g. 2 hours" },
      {
        name: "indoorOutdoor",
        label: "Indoor or outdoor?",
        type: "select",
        options: [
          { value: "indoor", label: "Indoor" },
          { value: "outdoor", label: "Outdoor" },
          { value: "both", label: "Both / not sure" },
        ],
      },
    ],
  },
  {
    type: "wedding",
    label: "Wedding flowers",
    tagline: "DIY buckets, a bloom bar, or blooms grown for your palette.",
    glyph: "💍",
    emailSubject: "Wedding inquiry",
    enabled: false,
    fields: [
      { name: "weddingDate", label: "Wedding date", type: "date", required: true, checkAvailability: true },
      { name: "venue", label: "Venue", type: "text" },
      { name: "zip", label: "Venue ZIP", type: "text", required: true },
      { name: "guestCount", label: "Approx. guest count", type: "number" },
      {
        name: "interestedIn",
        label: "Interested in",
        type: "multiselect",
        options: [
          { value: "buckets", label: "DIY buckets" },
          { value: "bloom-bar", label: "Bloom bar at the reception" },
          { value: "grown-for-you", label: "Grown for you (booked a season ahead)" },
          { value: "not-sure", label: "Not sure yet" },
        ],
      },
      { name: "budget", label: "Budget range", type: "select", options: WEDDING_BUDGETS },
      { name: "palette", label: "Color palette or vibe", type: "textarea", placeholder: "Blush + burgundy, garden-y, moody…" },
    ],
  },
  {
    type: "design",
    label: "Regenerative design",
    tagline: "Food-forest & silvopasture design — with the nursery stock to plant it.",
    glyph: "🌳",
    emailSubject: "Design inquiry",
    enabled: false,
    fields: [
      { name: "propertyLocation", label: "Property address or ZIP", type: "text", required: true },
      { name: "acreage", label: "Approx. acreage", type: "text", placeholder: "e.g. 3 acres" },
      {
        name: "goals",
        label: "Goals",
        type: "multiselect",
        options: [
          { value: "food-forest", label: "Food forest" },
          { value: "silvopasture", label: "Silvopasture" },
          { value: "orchard", label: "Orchard" },
          { value: "water", label: "Water management" },
          { value: "whole-site", label: "Whole-site design" },
          { value: "other", label: "Other" },
        ],
      },
      { name: "timeline", label: "Timeline", type: "text", placeholder: "This year, next spring, exploring…" },
      {
        name: "tier",
        label: "Tier of interest",
        type: "select",
        options: [
          { value: "site-read", label: "Site read (remote assessment)" },
          { value: "food-forest-plan", label: "Food forest plan (drawn, site visit)" },
          { value: "plan-plus-stock", label: "Plan plus nursery stock grown to spec" },
        ],
      },
    ],
  },
];

export function getService(type: string | null | undefined): ServiceDefinition | undefined {
  return SERVICES.find((s) => s.type === type);
}

export function isServiceType(value: unknown): value is ServiceType {
  return typeof value === "string" && SERVICES.some((s) => s.type === value);
}

/** All fields for a service in submission order: common → branch → trailing. */
export function fieldsForService(service: ServiceDefinition): Field[] {
  return [...COMMON_FIELDS, ...service.fields, ...TRAILING_FIELDS];
}
