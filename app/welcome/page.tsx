import type { Metadata } from "next";
import Link from "next/link";

import { WelcomeInteractions } from "./welcome-interactions";
import "./welcome.css";

export const metadata: Metadata = {
  title: "MyFerment — Field logbook for natural-farming ferments",
  description:
    "The offline-first field logbook built for KNF ferments — FPJ, FFJ, LABS and hydrolysate. Log a batch in twenty seconds and know exactly what stage it is in. Free and open source.",
  alternates: { canonical: "/welcome" },
  openGraph: {
    type: "website",
    title: "MyFerment — Field logbook for natural-farming ferments",
    description:
      "The offline-first field logbook built for KNF ferments. Log a batch in twenty seconds and know what to do next. Free and open source.",
    url: "/welcome",
  },
};

const REPO_URL = "https://github.com/crawfordind/ferment";

function Brandmark({ size = 30 }: { size?: number }) {
  return (
    <svg
      className="mf-brandmark"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      style={{ width: size, height: size }}
    >
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="9"
        fill="var(--mf-accent-tint)"
        stroke="var(--mf-accent)"
        strokeWidth="1.4"
      />
      <path
        d="M16 24c0-5 0-8 0-12"
        stroke="var(--mf-accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 13c-1.6-3-4.4-3.8-7-3.4.4 3.2 2.4 5.6 7 5.8"
        fill="var(--mf-accent)"
        opacity="0.85"
      />
      <path
        d="M16 16c1.4-2.6 3.8-3.4 6.2-3-.4 2.8-2.2 5-6.2 5.2"
        fill="var(--mf-accent)"
      />
    </svg>
  );
}

export default function WelcomePage() {
  return (
    <div className="mf-page">
      {/* Top bar */}
      <div className="mf-topbar">
        <div className="mf-wrap">
          <a className="mf-brand" href="#top">
            <Brandmark />
            <span>MyFerment</span>
          </a>
          <nav className="mf-topnav">
            <a href="#gap" className="mf-hide-sm">
              The gap
            </a>
            <a href="#how" className="mf-hide-sm">
              How it works
            </a>
            <a href="#compare" className="mf-hide-sm">
              Compare
            </a>
            <a
              className="mf-badge-oss mf-hide-sm"
              href={REPO_URL}
              target="_blank"
              rel="noopener"
            >
              MIT · Open source <span aria-hidden="true">↗</span>
            </a>
            <Link className="mf-btn-topbar" href="/login">
              Open the app <span aria-hidden="true">↗</span>
            </Link>
          </nav>
        </div>
      </div>

      <span id="top" />

      {/* Hero */}
      <section className="mf-section mf-hero">
        <div className="mf-wrap">
          <div className="mf-hero-grid">
            <div className="mf-hero-copy">
              <span className="mf-eyebrow">
                Field logbook · FPJ · FFJ · LABS · Hydrolysate
              </span>
              <h1>Stop guessing what day your ferment is on.</h1>
              <p className="mf-lead">
                MyFerment is the offline-first field logbook built for
                natural-farming ferments. Log a batch in twenty seconds — a
                photo, a tap, or your voice — and it tells you what stage it’s in
                and what to do next.
              </p>
              <div className="mf-hero-cta">
                <Link className="mf-btn mf-btn-primary" href="/login">
                  Open MyFerment{" "}
                  <span aria-hidden="true" style={{ fontWeight: 600 }}>
                    ↗
                  </span>
                </Link>
                <a className="mf-btn mf-btn-ghost" href="#how">
                  See how it works
                </a>
              </div>
              <div className="mf-hero-meta">
                <span>Works with no signal</span>
                <span>No account to self-host</span>
                <span>Free &amp; open source</span>
              </div>
            </div>

            <div className="mf-phone-stage">
              <div
                className="mf-phone"
                role="img"
                aria-label="MyFerment app screen showing a fermented plant juice batch on day 7 with a watch status and a stage guidance banner."
              >
                <div className="mf-screen">
                  <div className="mf-screen-head">
                    <div className="mf-screen-title">Your ferments</div>
                    <div className="mf-screen-sub">Today · 2 active</div>
                  </div>

                  <div className="mf-bcard" id="mf-hero-card">
                    <div className="mf-bcard-top">
                      <div className="mf-swatch">🌿</div>
                      <div>
                        <div className="mf-bcard-name">Nettle FPJ</div>
                        <div className="mf-bcard-code">FPJ-03 · started Jul 20</div>
                      </div>
                      <div className="mf-day-chip">
                        <b id="mf-day-num">7</b>
                        <span>DAY</span>
                      </div>
                    </div>

                    <div className="mf-status-row">
                      <span
                        className="mf-status-dot mf-st-watch"
                        id="mf-status-dot"
                      />
                      <span
                        className="mf-status-label"
                        id="mf-status-label"
                        style={{ color: "var(--mf-watch)" }}
                      >
                        Watch
                      </span>
                      <span className="mf-status-note" id="mf-status-note">
                        strain due soon
                      </span>
                    </div>

                    <div className="mf-stage-banner">
                      <div>
                        <span className="mf-lbl">Stage · Drawing</span>
                        <p>
                          Sugar is pulling juice from the plant. You should see
                          liquid pooling. Strain around day 7 before it turns.
                        </p>
                      </div>
                    </div>

                    <div className="mf-chip-row" id="mf-chip-row">
                      <button className="mf-chip" type="button" aria-pressed="true">
                        sweet–sour
                      </button>
                      <button className="mf-chip" type="button" aria-pressed="true">
                        liquid pooling
                      </button>
                      <button
                        className="mf-chip mf-warn"
                        type="button"
                        aria-pressed="false"
                      >
                        mold film
                      </button>
                      <button
                        className="mf-chip"
                        type="button"
                        aria-pressed="false"
                      >
                        bubbles
                      </button>
                    </div>

                    <button className="mf-voice-btn" id="mf-voice-btn" type="button">
                      <span>🎙</span> Add a voice note
                      <span className="mf-wave" aria-hidden="true">
                        <i style={{ animationDelay: "0s" }} />
                        <i style={{ animationDelay: "0.15s" }} />
                        <i style={{ animationDelay: "0.3s" }} />
                        <i style={{ animationDelay: "0.45s" }} />
                      </span>
                    </button>
                  </div>

                  <div className="mf-save-pop" id="mf-save-pop">
                    <span className="mf-disc">
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 12.5l4.2 4.2L19 7"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="mf-rule" />

      {/* The gap */}
      <section className="mf-section" id="gap">
        <div className="mf-wrap">
          <div className="mf-head mf-reveal">
            <span className="mf-eyebrow">The gap</span>
            <h2>Every fermentation tool is built for someone else’s bucket.</h2>
            <p className="mf-lead">
              Natural farmers make FPJ, FFJ, LABS, and fish hydrolysate — living
              ferments on a clock. Yet the tools people reach for were designed
              for beer, for kimchi, or for math. None of them track a KNF batch
              through its stages.
            </p>
          </div>

          <div className="mf-alt-grid">
            <div className="mf-alt mf-reveal">
              <span className="mf-k">The default</span>
              <h3>Paper &amp; spreadsheets</h3>
              <p>
                Infinitely flexible, zero structure. No stage guidance, no
                reminders, and the notebook stays in the shed while the bucket’s
                in the field.
              </p>
              <span className="mf-verdict">No sense of what’s due</span>
            </div>
            <div className="mf-alt mf-reveal">
              <span className="mf-k">Wrong domain</span>
              <h3>Homebrew &amp; food-ferment apps</h3>
              <p>
                Brewfather, Fermento and friends are polished — for beer, mead,
                kraut and kombucha. They’ve never heard of FPJ, and can’t tell
                you when to strain.
              </p>
              <span className="mf-verdict">Not for farm inputs</span>
            </div>
            <div className="mf-alt mf-reveal">
              <span className="mf-k">Half the job</span>
              <h3>KNF calculators</h3>
              <p>
                The one KNF app is a dilution calculator with how-to notes. It’ll
                do the ratio math — but it doesn’t track a single batch over
                time.
              </p>
              <span className="mf-verdict">Calculates, doesn’t log</span>
            </div>
          </div>
        </div>
      </section>

      <hr className="mf-rule" />

      {/* How it works */}
      <section className="mf-section" id="how">
        <div className="mf-wrap">
          <div className="mf-head mf-reveal">
            <span className="mf-eyebrow">How it works</span>
            <h2>From bucket to “what do I do today” in four moves.</h2>
            <p className="mf-lead">
              Built for one-handed use, standing over the barrel, with dirt on
              your phone and no bars of signal.
            </p>
          </div>

          <div className="mf-steps mf-reveal">
            <div className="mf-step">
              <div className="mf-n">01</div>
              <div className="mf-ic">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3>Start a batch</h3>
              <p>
                Pick the ferment type in a three-step wizard. It auto-names it
                and stamps a short code — <b className="mf-mono">FPJ-03</b> — so
                every jar is traceable.
              </p>
            </div>
            <div className="mf-step">
              <div className="mf-n">02</div>
              <div className="mf-ic">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 8h3l1.5-2h7L17 8h3v11H4z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="13"
                    r="3.2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              </div>
              <h3>Capture in the field</h3>
              <p>
                Snap a photo, tap sensory chips, or just talk — voice notes
                transcribe themselves. Saves instantly, even fully offline.
              </p>
            </div>
            <div className="mf-step">
              <div className="mf-n">03</div>
              <div className="mf-ic">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3v9l6 3"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              </div>
              <h3>Know the stage</h3>
              <p>
                It counts the days and shows plain-language expectations for
                exactly this ferment — plus the next action:{" "}
                <b className="mf-mono">Strain</b>, <b className="mf-mono">Turn</b>.
              </p>
            </div>
            <div className="mf-step">
              <div className="mf-n">04</div>
              <div className="mf-ic">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 17l-6 2.4L7.5 13l-5-4.3L9 8z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>See what needs you</h3>
              <p>
                A health engine reads your notes and the clock, then flags every
                batch that needs attention today — before it’s ruined.
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr className="mf-rule" />

      {/* Features */}
      <section className="mf-section" id="features">
        <div className="mf-wrap">
          <div className="mf-head mf-reveal">
            <span className="mf-eyebrow">What’s in it</span>
            <h2>Small app. Real depth where it counts.</h2>
            <p className="mf-lead">
              Everything below is shipping today — not a roadmap. It’s a focused
              tool that does the field-logbook job completely.
            </p>
          </div>

          <div className="mf-feat-grid">
            <div className="mf-feat mf-wide mf-reveal">
              <div className="mf-ic">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="7" cy="8" r="2.4" fill="var(--mf-accent)" />
                  <circle cx="12" cy="8" r="2.4" fill="var(--mf-watch)" />
                  <circle cx="17" cy="8" r="2.4" fill="var(--mf-action)" />
                  <path
                    d="M4 15h16M4 19h11"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3>A status engine, not just a log</h3>
              <p>
                Warning chips and overdue stage actions roll up into one honest
                signal per batch —{" "}
                <b style={{ color: "var(--mf-accent-deep)" }}>On track</b>,{" "}
                <b style={{ color: "var(--mf-watch)" }}>Watch</b>, or{" "}
                <b style={{ color: "var(--mf-action)" }}>Needs action</b>. Status
                is never color alone: every state carries an icon and a label.
              </p>
              <span className="mf-tag">the differentiator</span>
            </div>
            <div className="mf-feat mf-reveal">
              <div className="mf-ic">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13a7 7 0 0114 0"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M2 13h2M20 13h2M12 3v2"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 20l4-4 4 4"
                    stroke="var(--mf-accent)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>Offline-first</h3>
              <p>
                Capture never waits on a network. Writes queue locally and sync
                to the cloud — idempotently — the moment you’re back in range.
              </p>
              <span className="mf-tag">works with no signal</span>
            </div>
            <div className="mf-feat mf-reveal">
              <div className="mf-ic">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="9"
                    y="3"
                    width="6"
                    height="11"
                    rx="3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M6 11a6 6 0 0012 0M12 17v4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3>Voice, photo &amp; chips</h3>
              <p>
                Three ways to record a moment: a transcribed voice note, a camera
                shot, or tap-to-select sensory chips tuned to each ferment type.
              </p>
              <span className="mf-tag">~20s per entry</span>
            </div>
            <div className="mf-feat mf-reveal">
              <div className="mf-ic">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 19V5a1 1 0 011-1h11l4 4v11a1 1 0 01-1 1H5a1 1 0 01-1-1z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 9h6M8 13h8M8 17h5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3>26 method guides</h3>
              <p>
                A built-in knowledge base — FPJ, FFJ, LABS, IMO, OHN, WCA,
                bokashi, hydrolysate and more — plus a fermentation blog, in a
                Learn hub.
              </p>
              <span className="mf-tag">reference on hand</span>
            </div>
            <div className="mf-feat mf-reveal">
              <div className="mf-ic">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="4"
                    y="3"
                    width="16"
                    height="18"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M8 8h8M8 12h8M8 16h4"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3>Dilution &amp; cost</h3>
              <p>
                A built-in dilution calculator and batch economics, in metric or
                imperial — so the ratio math and the cost per litre come along
                for free.
              </p>
              <span className="mf-tag">metric + imperial</span>
            </div>
            <div className="mf-feat mf-reveal">
              <div className="mf-ic">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3a9 9 0 100 18 7 7 0 010-14 4 4 0 000 8"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>Installs like an app</h3>
              <p>
                A proper PWA: add it to your home screen, launch it offline, and
                read it day or night with a real, low-glare dark mode.
              </p>
              <span className="mf-tag">PWA · dark mode</span>
            </div>
            <div className="mf-feat mf-reveal">
              <div className="mf-ic">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 18l-5-6 5-6M15 6l5 6-5 6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>Yours to keep</h3>
              <p>
                MIT-licensed and self-hostable on your own Vercel, Turso and R2.
                No subscription, no lock-in, no one else holding your records.
              </p>
              <a
                className="mf-tag"
                href={REPO_URL}
                target="_blank"
                rel="noopener"
                style={{ textDecoration: "none" }}
              >
                View the source ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      <hr className="mf-rule" />

      {/* Comparison */}
      <section className="mf-section" id="compare">
        <div className="mf-wrap">
          <div className="mf-head mf-reveal">
            <span className="mf-eyebrow">How it stacks up</span>
            <h2>
              The calculator apps don’t track. The tracking apps aren’t for KNF.
            </h2>
            <p className="mf-lead">
              An honest look at what natural farmers actually use today, and
              where each one stops short. We’d rather show you the gaps than hide
              them.
            </p>
          </div>

          <div className="mf-cmp-shell mf-reveal">
            <div className="mf-cmp-scroll">
              <table className="mf-cmp">
                <thead>
                  <tr>
                    <th className="mf-dim">&nbsp;</th>
                    <th className="mf-me">MyFerment</th>
                    <th>KNF calculator</th>
                    <th>Brewfather</th>
                    <th>Food-ferment apps</th>
                    <th>Spreadsheet</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.dim}>
                      <td className="mf-dim">{row.dim}</td>
                      {row.cells.map((cell, i) => (
                        <td key={i} className={i === 0 ? "mf-me" : undefined}>
                          <span className="mf-cell">
                            <span className={`mf-mark mf-${cell.mark}`}>
                              {MARK_GLYPH[cell.mark]}
                            </span>
                            <small>{cell.note}</small>
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mf-cmp-legend mf-reveal">
            <span>
              <span
                className="mf-mark mf-yes"
                style={{ width: 18, height: 18, fontSize: 11 }}
              >
                ✓
              </span>{" "}
              Yes
            </span>
            <span>
              <span
                className="mf-mark mf-par"
                style={{ width: 18, height: 18, fontSize: 11 }}
              >
                ~
              </span>{" "}
              Partial
            </span>
            <span>
              <span
                className="mf-mark mf-no"
                style={{ width: 18, height: 18, fontSize: 11 }}
              >
                –
              </span>{" "}
              No / not its job
            </span>
          </div>
          <p className="mf-cmp-note mf-reveal">
            <b>On the honesty of this table:</b> competitors are moving targets —
            offline behavior, pricing and accounts change often, and a few cells
            here are conservative estimates. To the best of our research, no
            shipping product both targets KNF / agricultural ferments{" "}
            <em>and</em> tracks batches over time. If that changes, this table
            should too.
          </p>
        </div>
      </section>

      <hr className="mf-rule" />

      {/* What it's not */}
      <section className="mf-section" id="not">
        <div className="mf-wrap">
          <div className="mf-head mf-reveal">
            <span className="mf-eyebrow">Plain about the edges</span>
            <h2>What MyFerment is not.</h2>
            <p className="mf-lead">
              A tool that tries to be everything helps no one. Here’s where it
              deliberately stops — so you know exactly what you’re picking up.
            </p>
          </div>

          <div className="mf-not-grid">
            <div className="mf-not-item mf-reveal">
              <span className="mf-mk">✕</span>
              <div>
                <h3>Not a beer or mead brewing app</h3>
                <p>
                  No recipe-design engine, no Tilt or iSpindel hydrometer
                  integrations. If you’re brewing to drink, Brewfather is your
                  tool.
                </p>
              </div>
            </div>
            <div className="mf-not-item mf-reveal">
              <span className="mf-mk">✕</span>
              <div>
                <h3>Not whole-farm management</h3>
                <p>
                  No livestock, crop planning, accounting or storefront. It logs
                  ferments — it doesn’t run the whole operation.
                </p>
              </div>
            </div>
            <div className="mf-not-item mf-reveal">
              <span className="mf-mk">✕</span>
              <div>
                <h3>Not a lab or QC system — yet</h3>
                <p>
                  Chips capture <em>sensory</em> signals, not instrument
                  readings. No COAs, no calibrated pH / Brix logs, no compliance
                  records.
                </p>
              </div>
            </div>
            <div className="mf-not-item mf-reveal">
              <span className="mf-mk">✕</span>
              <div>
                <h3>Not a kitchen ferment journal</h3>
                <p>
                  Kraut, kombucha and sourdough aren’t its templates. The format
                  could suit them — but that’s not who it’s built for today.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mf-section" id="get" style={{ paddingTop: 0 }}>
        <div className="mf-wrap">
          <div className="mf-cta mf-reveal">
            <span className="mf-eyebrow" style={{ justifyContent: "center" }}>
              Built for the people who make their own inputs
            </span>
            <h2 style={{ marginTop: 18 }}>
              Your ferments deserve a logbook that knows what they are.
            </h2>
            <p className="mf-lead">
              For hands-on natural farmers, market gardeners and KNF
              practitioners who want to remember what they did, when they did it,
              and what to do next — free, and yours to keep.
            </p>
            <div className="mf-cta-actions">
              <Link className="mf-btn mf-btn-primary" href="/login">
                Open MyFerment{" "}
                <span aria-hidden="true" style={{ fontWeight: 600 }}>
                  ↗
                </span>
              </Link>
              <a className="mf-btn mf-btn-ghost" href="#how">
                See how it works
              </a>
            </div>
            <div className="mf-cta-facts">
              <span>
                <b>MIT</b> licensed
              </span>
              <span>
                <b>Offline-first</b> PWA
              </span>
              <span>
                <b>Self-hostable</b> — Next.js · Turso · R2
              </span>
            </div>
          </div>
        </div>
      </section>

      <footer className="mf-footer">
        <div className="mf-wrap">
          <div className="mf-brand">
            <Brandmark size={24} />
            MyFerment
          </div>
          <p className="mf-fnote">
            A field logbook for fermentation ·{" "}
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener"
              style={{
                color: "var(--mf-accent)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              GitHub&nbsp;↗
            </a>{" "}
            · © 2026 · Released under the MIT License
          </p>
        </div>
      </footer>

      <WelcomeInteractions />
    </div>
  );
}

type Mark = "yes" | "par" | "no";

const MARK_GLYPH: Record<Mark, string> = { yes: "✓", par: "~", no: "–" };

const COMPARISON: Array<{
  dim: string;
  cells: Array<{ mark: Mark; note: string }>;
}> = [
  {
    dim: "Purpose-built for KNF / farm ferments",
    cells: [
      { mark: "yes", note: "FPJ·FFJ·LABS" },
      { mark: "par", note: "KNF, calc only" },
      { mark: "no", note: "beer / mead" },
      { mark: "no", note: "kraut / kombucha" },
      { mark: "no", note: "DIY" },
    ],
  },
  {
    dim: "Tracks a batch through its stages",
    cells: [
      { mark: "yes", note: "day + stage" },
      { mark: "no", note: "no logging" },
      { mark: "par", note: "for beer" },
      { mark: "par", note: "for food" },
      { mark: "no", note: "manual" },
    ],
  },
  {
    dim: "Works fully offline in the field",
    cells: [
      { mark: "yes", note: "offline-first" },
      { mark: "par", note: "likely" },
      { mark: "par", note: "syncs" },
      { mark: "par", note: "varies" },
      { mark: "yes", note: "paper / local" },
    ],
  },
  {
    dim: "Fast capture — photo, voice & chips",
    cells: [
      { mark: "yes", note: "~20s" },
      { mark: "no", note: "no capture" },
      { mark: "par", note: "manual entry" },
      { mark: "par", note: "notes / photo" },
      { mark: "no", note: "typing" },
    ],
  },
  {
    dim: "Built-in knowledge base",
    cells: [
      { mark: "yes", note: "26 guides" },
      { mark: "par", note: "brief notes" },
      { mark: "yes", note: "beer wiki" },
      { mark: "par", note: "some" },
      { mark: "no", note: "none" },
    ],
  },
  {
    dim: "Price",
    cells: [
      { mark: "yes", note: "free / MIT" },
      { mark: "par", note: "~$4 once" },
      { mark: "par", note: "free + ~$2/mo" },
      { mark: "par", note: "free–cheap" },
      { mark: "yes", note: "free" },
    ],
  },
  {
    dim: "Your data — no account, self-host",
    cells: [
      { mark: "yes", note: "self-hostable" },
      { mark: "no", note: "store install" },
      { mark: "no", note: "vendor cloud" },
      { mark: "no", note: "usually account" },
      { mark: "yes", note: "your file" },
    ],
  },
];
