# Handoff: Ferment Tracker — v1 (MVP) Wireframes

## Overview
Ferment Tracker is a mobile-first, offline-capable field logbook for tracking ferments (farm fertilizer ferments first: FPJ, FFJ, LABS, fish/plant ferments). The core job: let a grower standing over a bucket — one free hand, gloves on, often no signal — **log an observation in under 20 seconds** without a keyboard, and see **what needs attention today** the instant the app opens.

This bundle contains wireframes for every screen in the v1 deliverables checklist plus a shared-components sheet.

## About the Design Files
The file in this bundle (`Ferment Tracker Wireframes.dc.html`) is a **design reference created in HTML** — a prototype showing intended structure, layout, content, and behavior. **It is not production code to copy.** It is a single "design canvas" document that lays all screens out side-by-side on a pannable surface; it is not an app.

Your task is to **recreate these screens in the target codebase's environment** using its established patterns and libraries. If no app environment exists yet, choose an appropriate stack for an offline-first mobile app (e.g. React Native / Expo, Flutter, or SwiftUI + Kotlin) and implement there. Do **not** ship the HTML.

> Note on the file format: `.dc.html` is a component format that needs its sibling `support.js` to render in a browser. You don't need to run it — treat it as a visual + structural spec. Open it in a browser only if you want to see the screens; pan/zoom to move around the canvas.

## Fidelity
**Low-to-mid fidelity (wireframes).** These show **structure, hierarchy, flow, content, and states** — not final visual design. Placeholder boxes (diagonal hatch) stand in for photos. The grayscale + single green accent palette is a wireframe convention, **not** a brand.

**Apply your codebase's existing design system / component library for all styling** (real type ramp, color, elevation, motion). Where this repo has no design system, the "Design Tokens" section below is a reasonable, intentional starting point — but treat spacing/radius/color as directional, and honor the hard constraints in "Global Constraints" exactly.

## Global Constraints (these are requirements, not suggestions)
- **Mobile-first, single column.** Phone is the only v1 target. No web, no tablet.
- **Large tap targets:** min 44pt, ~56pt for primary field actions. Assume gloved hands.
- **High contrast**, readable in bright sun.
- **Thumb-zone priority:** primary actions live in the lower third of the screen.
- **Minimal typing:** tap, photo, and voice are the primary inputs; keyboard is always the fallback, never required.
- **Offline-first:** photo capture, chip selection, and voice *recording* must work fully offline and sync later. Show a quiet "saved offline, will sync" state — never block. Voice *transcription* may require connectivity: store the audio offline and transcribe on reconnect.
- **Status must never rely on color alone** — always pair with a shape and a text label (accessibility + sunlight).
- **Calm, uncluttered:** one primary thing per screen. No data slop.
- **Single user, single device.** No accounts, sign-in, sharing, or multi-user in v1.
- **Microcopy:** plain, warm, sentence case everywhere. No ALL CAPS sentences, no Title Case, no alarming language ("Worth a look", not "DANGER").

## Information Architecture & Navigation
- **Bottom bar** with two destinations + a prominent center action: **Home** · **＋ New Batch** (center, emphasized, raised circle) · **Settings**.
- **Batch Detail** and **Quick Log** open as full-screen flows layered over Home, then dismiss back.
- Primary flow: `Home → tap card → Batch Detail → tap Log → Quick Log → save → back to Batch Detail`.
- Create flow: `Home → tap ＋ → New Batch wizard (3 steps) → Batch Detail`.

---

## Screens / Views

### 1. Home (Dashboard)
**Purpose:** triage — surface what needs attention today, and route everywhere.
**Layout:** vertical scroll of batch cards. Optional reminder card pinned at top. Cards needing action today are grouped under a quiet "NEEDS ATTENTION" heading; the rest under "ALL ACTIVE". Persistent bottom bar.
**States provided (4 frames):**
- **Empty** — dashed circle illustration, "No batches yet", one big primary "＋ Start your first batch".
- **Needs attention + active** — reminder card ("2 batches need attention today"), then NEEDS ATTENTION group (a needs-action card and a watch card), then ALL ACTIVE.
- **All quiet** — no NEEDS ATTENTION group; a soft "All caught up for today" line, then ALL ACTIVE cards.
- **Loading** — skeleton cards (gray bars), no spinner.
**Reminders:** stage reminders appear as an **in-app card at the top of Home** (decided). OS push can layer on later without redesign.

**Batch card (the hero component — see components sheet):**
- Left **category color stripe** (~6px) + **photo thumbnail** (~52px square) + middle block + right block.
- Middle: **batch name** (bold, ~16px, dominant), **short code** below (~11px, muted, e.g. `FPJ-03`), and an optional **action hint pill** ("Strain today", "White film — worth a look").
- Right: **Day chip** ("Day 7", outlined pill, `white-space:nowrap`) and a **status indicator** (shape + label).
- Card: white fill, 2px ink border, ~13px radius, overflow hidden.

### 2. New Batch — 3-tap wizard
**Purpose:** create a batch with minimal decision load. Auto-fill everything possible; target well under a minute. Back preserves input. Validation is gentle/inline, never a blocking modal.
- **Step 1 — Category:** large tappable list. **Fertilizers** active (selected radio). Food / Beverage shown but disabled with a "Coming soon" pill (so the multi-category architecture is legible). 3-segment progress bar.
- **Step 2 — Type:** list within Fertilizers (FPJ selected, FFJ, LABS, Fish ferment, + **Custom** = blank template). Selecting a type silently loads its stage template (drives stage banner + chip sets later).
- **Step 3 — Name & size:** auto-suggested **Name** (editable, "Nettle FPJ"), auto **Short code** (editable, "FPJ-03", shown on muted fill to signal auto), **Batch size** (number + unit selector; **weight is default**, volume allowed), optional **snap first photo** (skippable). Primary action **Start batch** uses the green accent.

### 3. Batch Detail
**Purpose:** the full story of one ferment + the launch point for logging.
**Layout:** header (photo + identity + status + day + current-stage banner) → reverse-chronological **timeline** of observation rows → one **persistent ＋ Log button** fixed in the thumb zone. Secondary actions (edit, advance stage, archive/finish) live in a low-prominence overflow (⋯).
**Current-stage banner:** plain-language expectation from the type template, e.g. *"Day 7: should smell sweet and sour, bubbling slowing. Flag if it smells rotten."*
**Timeline row:** timestamp/day · photo thumb · selected sensory chips as small read-only tags · note text.
**States provided (4 frames):**
- **Fresh (no logs)** — header + stage banner + inviting empty timeline ("No logs yet. Tap Log to add your first.").
- **Active — Variant A (photo-dominant header):** full-bleed photo as the hero with name/day/code overlaid; stage banner is a one-line strip below. *(This is the preferred direction.)*
- **Active — Variant B (banner-dominant header):** compact identity row (small thumb + name + status) with a large boxed stage banner ("WHERE IT SHOULD BE → Day 7 — time to strain"). Open question: which header wins; lean A for daily scanning, B early in a batch.
- **Finished / archived** — desaturated, read-only treatment, "Finished · Day 9" badge, outcome line (e.g. "Strained Apr 14 · 1.8 kg → ~900 ml"), a photo timeline strip, and a **"WHAT'S NEXT?"** block with two actions:
  - **Move to another container** — decant/re-jar, keeps the same record.
  - **Start a secondary ferment** — opens New Batch **pre-linked to this batch as its parent** (batch lineage). *Note: lineage is a PRD "future" item surfaced here at the user's request — confirm it's in v1 scope before building the link.*
  - Footer: "Reopen batch" and "Export" as low-prominence text links.

### 4. Quick Log — the 20-second screen (highest-traffic)
**Purpose:** capture one observation fast. **Nothing is required** — the user can save a photo only, chips only, or a voice note only. Friction kills logging.
**Layout (top→bottom):** Photo block → standard-response chips → voice note → optional free-text note → **Save**.
**Photo:** big one-tap camera target; thumbnails appear after capture; single photo effortless, multiple allowed (a "＋" tile to add more).
**Sensory chips (the core):** tappable toggles grouped by sense, **tailored per ferment type** (template surfaces the most relevant first; "More" expander reveals the full set). Suggested fertilizer set:
- **Smell:** Sweet, Sour, Boozy, Yeasty, Earthy, **Ammonia**, **Rotten**
- **Activity:** Bubbling lots, Some bubbles, Calm
- **Surface:** Clean, White film, **Fuzzy mold**, **Slime**
- **Caution chips** (bold above): Ammonia, Rotten, Fuzzy mold, Slime read slightly cautionary (amber outline) and, when selected, can **nudge batch status toward Watch / Needs action**. Make the nudge quiet, not alarming.
**Voice note (voice-to-text):** one control to record; on release, auto-transcribe. Show the transcript so the user can glance/fix a word. **Store both audio and transcript** (transcript is the searchable artifact). States: idle → recording (clear active indicator: pulsing dot, timer, waveform) → transcribing → transcript-ready/editable → error (keep audio, offer retry). Offline: store audio, transcribe on reconnect, say so plainly.
**Free note:** plain text field, optional, never the primary path.
**States provided (5 frames):** empty (just opened) · photo + chips selected · voice recording · transcript-ready (shown with an offline "saved offline" banner) · **Variant B chips-first layout** (camera demoted to a single top-right tap; everything fits one screen with no scroll, to defend the 20-second goal — worth a usability gut-check).

### 5. Settings (low fidelity, single-user)
**Purpose:** minimal. Keep tiny in v1.
**Contents:** PREFERENCES — Default units (Weight/Volume segmented control, Weight default), Stage reminders (toggle, on), Sounds & haptics (toggle). DATA & ABOUT — Export all data (can be a stub), Help & privacy, About (version). No account/sign-in (single user, single device).

### Shared Components Sheet
A reference board documenting the reusable kit: **Batch card**, **Status — 3 states** (On track = circle / Watch = diamond / Needs action = triangle, each with a text label), **Sensory chip** (default / selected / caution / caution-selected), **Day chip**, **Primary button**, **Current-stage banner**, and the **Identity system** (photo + category color + bold short code; future: printable QR label — leave room, don't build).

---

## Interactions & Behavior
- **Home card tap →** Batch Detail. **＋ (center) →** New Batch wizard. **Pull to refresh** optional.
- **New Batch:** Next advances steps; Back preserves all input; Start batch lands on the new Batch Detail with the stage banner pre-populated from the type template.
- **Batch Detail:** ＋ Log opens Quick Log; on save, the new observation row appears at the **top** of the timeline. Overflow (⋯): edit details, advance/complete stage, archive/finish.
- **Quick Log:** photo capture, chip toggles, hold-to-talk voice, optional note; **Save** returns to Batch Detail. Selecting a caution chip may quietly raise the batch's status.
- **Finished batch:** "Move container" (re-jar, same record) and "Start secondary" (new linked batch) — confirm lineage scope first.
- **Loading:** skeletons, not spinners. **Offline:** non-blocking "saved offline, will sync" affordance; never a hard error wall. **Errors:** keep the user's input, explain simply, offer retry.

## State Management
- **Batch:** id, category (fertilizer), type (FPJ/FFJ/LABS/fish/plant/custom), name, shortCode (auto), size {value, unit}, createdAt, status (onTrack | watch | needsAction), currentStage / dayInProcess (derived from createdAt + template), parentBatchId (nullable — for secondary/lineage), archived/finished flags + outcome.
- **Observation (log):** id, batchId, createdAt, photos[] (local URIs, sync state), chips[] (by sense), voice {audioRef, transcript, transcriptionState: idle|pending|done|error}, noteText.
- **Type template:** ordered stages with day ranges + plain-language expectation strings + the prioritized chip set per sense. Drives the stage banner and Quick Log chip ordering.
- **Sync/offline queue:** captures persist locally first; a background job syncs and runs pending transcriptions when connectivity returns.
- **Status derivation:** computed from caution-chip selections and stage timing; surfaces on the card dot and the Detail status chip.

## Design Tokens (directional — prefer your codebase's system)
**These are the wireframe's working values, not a brand. Replace with the repo's tokens where one exists.**
- **Type:** the wireframe uses *Plus Jakarta Sans* (400/500/600/700/800) as a clean placeholder. Use your app's real font. Weights: body 400–500, labels 600, headings/values 700–800. Section labels are ~11px 600 with ~0.4px letter-spacing, uppercase.
- **Colors (wireframe palette):**
  - Ink / text: `#2b2b2b`; secondary text `#7a7468`; muted `#9a9486` / `#b3aa96`.
  - Surface / paper: `#fdfcf9`; subtle fill `#f6f3ec` / `#f3efe6`; hairline `#ece7dd`; borders `#c9c4ba` / `#d8d2c6`; ink border `#2b2b2b`.
  - **Category accent — Fertilizers (green):** `#5f7a3f` (used for stripe, selected radios, primary CTA, banner accent). Other categories would each get their own accent.
  - **Status:** On track green `#5f7a3f`; Watch amber `#c9a93a` (diamond); Needs action terracotta `#b8743a` (triangle), with darker text `#8a5224`.
  - **Caution chips:** outline `#c08a4a`, text `#8a5a24`; selected fill `#f3ead3` with `#c79a4a` border, text `#7a6320`.
  - Archived/finished: desaturated grays `#9a958a` / `#6a6557`, `filter: grayscale(1)` on photos.
- **Radii:** chips/pills ~15px (fully rounded), cards ~13–15px, buttons ~26–30px (pill), phone screen 30px, photo tiles ~8–12px.
- **Spacing:** screen gutters 16px; card padding 8–13px; control gaps 6–10px.
- **Shadows:** cards rest near-flat with a 1px border; raised CTA / FAB ~ `0 3px 8px rgba(0,0,0,.2)`.
- **Touch targets:** ≥44px, primary field actions ~56px.

## Assets
- **No production assets in this bundle.** All photos are placeholders (diagonal-hatch boxes) — the real app fills these from the device camera.
- **Icons:** the wireframe uses text/glyph stand-ins (＋, ←, ✕, ⋯, ▶, status shapes drawn with CSS). Use your app's icon set; status shapes (circle/diamond/triangle) should remain real shapes, not just colors.
- **No brand assets** are used.

## Reference Material
- **`Ferment Tracker Wireframes.dc.html`** — all screens, on one pannable canvas, grouped by section (1 Home · 2 New Batch · 3 Batch Detail · 4 Quick Log · 5 Settings & components). Sticky notes on the canvas flag open design questions. Two tweak controls exist on the prototype (accent color, show/hide annotations) — these are prototype affordances, not app features.
- **`support.js`** — runtime needed only to render the `.dc.html` in a browser. Not part of the app.
- The original Product Requirements Document (PRD) is the source of truth for scope, goals, non-goals, and the open questions in §14 — refer to it alongside these wireframes.

## Open Questions to Resolve With the Designer/PM (from the PRD)
1. **Chips** — tailored per type (current direction) vs one shared set.
2. **Batch Detail header** — photo-dominant (A) vs banner-dominant (B), or auto-switch by status.
3. **Quick Log** — single-photo default (current) vs the chips-first Variant B.
4. **Status auto-nudge** — how visibly selecting a caution chip changes batch status.
5. **Batch lineage / "Start secondary"** — confirm whether this future-item is in v1.
