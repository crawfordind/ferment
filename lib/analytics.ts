/**
 * Minimal, provider-agnostic client analytics. The PRD (§7) needs form starts
 * vs completions per service and CTA clicks per page, but the site has no
 * analytics vendor wired up yet. This pushes a typed event onto
 * `window.dataLayer` (the GTM/GA4 convention) and calls `window.gtag` if either
 * is present — and is a safe no-op if neither is. Drop in GA4/Plausible later
 * without touching call sites.
 */

type EventName =
  | "form_start"
  | "form_complete"
  | "form_error"
  | "cta_click";

type EventProps = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: EventName, props: EventProps = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ event: name, ...props });
    window.gtag?.("event", name, props);
  } catch {
    // Analytics must never break the page.
  }
}
