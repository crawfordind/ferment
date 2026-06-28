# Ferment Tracker — Build PRD & Agentic Execution Plan

**Audience:** the agentic coding team building this zero to ready-to-use.
**Companion doc:** the design PRD (screens, components, states) and the wireframes (provided separately). Wireframes are the source of truth for layout. This doc is the source of truth for architecture, data, and sequencing.
**Target deployment:** Vercel. **Database:** Turso (libSQL).

---

## How to use this document

- **Part A** is the technical spec. Read it fully before writing code. Treat the locked decisions in section A2 as non-negotiable for v1 unless explicitly changed.
- **Part B** is the work plan. Execute **one ticket at a time, in order.** Do not start a ticket until the previous one's "Done when" criteria pass.
- Every ticket ends with verifiable acceptance criteria. An agent should be able to confirm "Done when" without a human.
- Conventions, env vars, and definition of done are in section B0. Read those first.

---

# PART A — Build PRD

## A1. Objective

Ship a mobile-first, offline-capable web app for logging ferments (fertilizers first) with photos, tap-to-select sensory chips, and voice-to-text. It must be usable in the field with no signal and deploy cleanly to Vercel.

**Definition of "ready to use":** a single user can create a batch, log observations (photo + chips + voice + note) including while offline, see a per-batch timeline and a today/attention view, and have everything sync to Turso when back online, running in production on Vercel.

## A2. Locked technical decisions (v1)

Make these once, here, so no agent has to guess.

- **Framework:** Next.js 15 (App Router), React 19, TypeScript (strict).
- **Styling:** Tailwind CSS. **Component primitives:** shadcn/ui.
- **DB:** Turso (libSQL) via `@libsql/client`. **ORM:** Drizzle + drizzle-kit migrations.
- **Server state / caching:** TanStack Query.
- **Local store (offline):** IndexedDB via Dexie. Used as the write queue and read cache.
- **Photos:** Cloudflare R2 (S3-compatible). Direct browser upload via presigned PUT URLs.
- **Voice transcription:** server route behind a provider interface. Default provider: OpenAI audio transcription (`whisper-1` or current equivalent). Swappable.
- **PWA:** installable, service-worker cached, offline-first for capture.
- **Access control:** single shared passcode gate via middleware. Not multi-user auth.
- **AI agents (Mixture-of-Agents / judge):** **not used in v1.** Reserved for the future "ferment doctor." Do not build agent orchestration now.
- **Package manager:** pnpm. **Node:** 20+.

## A3. Architecture overview

- **Client (PWA):** renders screens, captures input, writes to a local Dexie queue first (optimistic), reads from a local cache hydrated by TanStack Query.
- **Sync layer:** when online, the queue flushes to API routes. All writes carry a client-generated UUID for idempotency, so a retried or duplicated write is a no-op.
- **API (Next.js route handlers):** validate with zod, read/write Turso via Drizzle, issue R2 presigned URLs, proxy transcription requests.
- **Turso:** system of record.
- **R2:** photo and voice-audio blob storage.
- **Templates and chips:** app-owned domain config. Templates and stages are seeded into the DB. Chip definitions live in versioned TS config and are referenced by key.

**Design principle for the data access layer:** build the local-queue-then-sync path from ticket one, even while the app is online. Do not build an online-only path and retrofit offline. Offline is a sequencing phase, not an afterthought.

## A4. Data model

SQLite/libSQL via Drizzle. IDs are app-generated UUIDv7 strings (sortable). Timestamps are ISO strings or epoch millis (pick one, be consistent; epoch millis recommended).

**batches**
- `id` (pk, uuid)
- `code` (text, unique, e.g. `FPJ-03`)
- `name` (text)
- `category` (text, v1 always `fertilizer`)
- `type` (text, e.g. `fpj`, `ffj`, `labs`, `fish`, `plant`, `custom`)
- `template_id` (fk → templates.id)
- `size_value` (real, nullable)
- `size_unit` (text, nullable; default unit configurable)
- `status` (text: `active` | `finished` | `archived`)
- `health` (text: `on_track` | `watch` | `needs_action`)
- `started_at` (int)
- `finished_at` (int, nullable)
- `current_stage_index` (int, default 0)
- `thumbnail_photo_id` (fk → photos.id, nullable)
- `created_at`, `updated_at` (int)
- **Future-commercial (nullable, leave in schema, no UI in v1):** `lot_id`, `coa_url`, `sop_version`. These exist so the commercial layer is a feature flag later, not a migration.

**observations**
- `id` (pk, uuid; this is the client-generated id, ensures idempotency)
- `batch_id` (fk → batches.id)
- `observed_at` (int)
- `day_in_process` (int; computed at write time from batch.started_at)
- `note` (text, nullable)
- `voice_audio_key` (text, nullable; R2 key)
- `voice_transcript` (text, nullable)
- `transcript_status` (text: `none` | `pending` | `done` | `failed`)
- `created_at`, `updated_at` (int)

**observation_chips** (join, enables search and charting later)
- `observation_id` (fk)
- `chip_key` (text; references chip config by key)
- pk = (`observation_id`, `chip_key`)

**photos**
- `id` (pk, uuid; client-generated)
- `batch_id` (fk)
- `observation_id` (fk, nullable; a batch cover photo may have no observation)
- `r2_key` (text)
- `width`, `height` (int, nullable)
- `taken_at` (int)
- `upload_status` (text: `pending` | `done` | `failed`)
- `created_at` (int)

**templates**
- `id` (pk)
- `type` (text, unique within category)
- `category` (text)
- `name` (text)
- `default_unit` (text)

**template_stages**
- `id` (pk)
- `template_id` (fk)
- `stage_index` (int)
- `name` (text)
- `day_start` (int)
- `day_end` (int, nullable; null = open-ended, e.g. JLF)
- `expectation_text` (text; the plain-language banner shown on Batch Detail)
- `action_label` (text, nullable; e.g. "Strain", "Turn")

**Chips** are NOT a DB table in v1. They live in `lib/chips.ts` as a typed config:
- each chip: `{ key, group: 'smell'|'activity'|'surface', label, severity: 'neutral'|'warning' }`
- per-type chip ordering/surfacing lives in the same config, keyed by ferment type.

**Deferred tables (do not build, but keep IDs FK-friendly):** `batch_lineage`, `ph_brix_readings`. Mentioned so no one designs them out.

## A5. Feature requirements (technical, mapped from the design PRD)

- **R1 Batch lifecycle.** Create (3-step wizard), view, edit, finish, archive. Auto short-code generation per type (`{TYPE}-{NN}` zero-padded, unique).
- **R2 Observation capture.** Photo(s), sensory chips (tailored per type, "more" to expand full set), voice-to-text, free note. Nothing required. Offline-capable.
- **R3 Timeline.** Reverse-chronological observations per batch, with photos, chip tags, note, day marker.
- **R4 Stage awareness.** Compute day-in-process and current stage from batch start + template stages. Show the stage expectation banner.
- **R5 Status engine.** Derive `health` from (a) warning chips on the latest observation and (b) stage timing (overdue stage action). Pure, testable function.
- **R6 Today / attention.** Home surfaces batches needing action today (due stage action, overdue, or `needs_action` health).
- **R7 Photos.** Capture, presigned R2 upload, thumbnails, batch cover photo. Offline blobs upload on reconnect.
- **R8 Voice.** Record (MediaRecorder), transcribe via API, show editable transcript, store audio + transcript. Offline: store audio, mark transcript `pending`, transcribe on reconnect.
- **R9 Offline + sync.** Optimistic local writes, idempotent flush to Turso on reconnect, clear sync-state indicators.
- **R10 Access gate.** Single passcode keeps the public URL private.

## A6. Offline and sync strategy (the hard part, spec'd)

- **Write path:** UI action → write to Dexie (local cache + outbox entry) → optimistic UI update → if online, flush outbox to API. Each entity uses its client-generated UUID as primary key, so server upserts are idempotent.
- **Read path:** TanStack Query reads from local cache first, revalidates from API when online.
- **Outbox entry:** `{ id, kind: 'batch'|'observation'|'photo'|'transcript', payload, attempts, status }`. Flush in dependency order (batch before its observations before its photos).
- **Conflict policy (v1):** last-write-wins by `updated_at`. Single user, so conflicts are rare; do not over-engineer.
- **Photos offline:** store the captured blob in Dexie; on reconnect, presign → PUT to R2 → patch photo row with `r2_key` and `upload_status = done`.
- **Transcription offline:** store audio blob locally, observation `transcript_status = pending`; on reconnect, upload audio, transcribe, patch transcript.
- **Sync indicators:** per-item subtle state ("saved offline, will sync"), and a global sync status. Never block capture on network.

## A7. Voice transcription

- API route `POST /api/transcribe` accepts an audio blob, returns `{ transcript }`.
- Provider behind an interface `Transcriber.transcribe(audio): Promise<string>`. Default impl calls the configured transcription API with key from env.
- Keep the client agnostic: it sends audio, gets text. Provider swap is a one-file change.

## A8. Non-functional requirements

- **Performance:** Home and Batch Detail interactive in under ~1.5s on a mid phone. Quick Log opens instantly.
- **Offline:** full capture works with no network. App shell loads offline.
- **Accessibility:** tap targets >= 44pt (primary ~56pt), status never color-only (icon/shape/label too), respects large text, sufficient contrast for sunlight.
- **PWA:** installable, app-shell cached, custom icons and manifest.
- **Type safety:** TS strict, zod validation at every API boundary, no `any` in shared code.

## A9. Environment variables

Provide a `.env.example`. Required:
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL` (for serving photos)
- `TRANSCRIPTION_API_KEY`
- `TRANSCRIPTION_PROVIDER` (default identifier)
- `APP_PASSCODE` (or a hash of it) for the access gate
- `APP_SECRET` (cookie signing)

## A10. Out of scope (v1)

AI ferment diagnosis, commercial batch records / COA / PDF export, recipe versioning, batch lineage, QR labels, cross-batch charts, multi-user accounts, web push as a hard requirement (P1 optional), additional ferment categories beyond fertilizers.

---

# PART B — Step-by-step execution plan

## B0. Working conventions (read once)

- **One ticket at a time, in order.** Confirm "Done when" before moving on.
- **Branching:** one branch + PR per ticket. Name `phaseN/ticket-N.x-slug`.
- **Every ticket must end green:** `pnpm typecheck`, `pnpm lint`, `pnpm build` all pass. No ticket is "done" with a red build.
- **Tests:** add unit tests for pure logic (code generator, status engine, sync queue ordering). One happy-path e2e by the end.
- **Commits:** small, descriptive. Reference ticket id.
- **Do not scope-creep.** If a ticket reveals new work, note it as a follow-up; do not silently expand.
- **Wireframes drive UI.** Match the provided wireframes for layout. If a wireframe is missing for a state, build the obvious version and flag it.

**Definition of done (per ticket):** code written, types pass, lint passes, build passes, acceptance criteria verified, relevant tests added and passing, PR opened.

---

## Phase 0 — Foundation and tooling

**Ticket 0.1 — Scaffold the app**
- **Build:** Next.js 15 App Router + TS strict + Tailwind. pnpm. ESLint + Prettier. Add `pnpm` scripts: `dev`, `build`, `typecheck`, `lint`, `test`. Set up basic CI config that runs typecheck + lint + build.
- **Done when:** fresh clone runs `pnpm install && pnpm build` green; a placeholder home route renders.

**Ticket 0.2 — Mobile shell and design tokens**
- **Build:** install shadcn/ui, configure Tailwind theme tokens (spacing, radius, color slots) to match the design PRD constraints (large tap targets, high contrast). Build the app shell: single-column mobile layout, bottom nav with Home, center ＋, Settings. Routes stubbed.
- **Done when:** the three nav destinations route correctly; layout is mobile-first; tap targets meet 44pt minimum.

**Ticket 0.3 — Env and config validation**
- **Build:** `.env.example` with all A9 vars. A typed config loader (zod) that validates env at startup and fails loudly if missing. No secrets committed.
- **Done when:** missing a required var fails the build/start with a clear message; valid env passes.

---

## Phase 1 — Data layer

**Ticket 1.1 — Turso + Drizzle setup**
- **Build:** `@libsql/client` connection, Drizzle config, drizzle-kit migration tooling. Scripts: `db:generate`, `db:migrate`, `db:push`, `db:seed`.
- **Done when:** can connect to a Turso dev DB and run an empty migration successfully.

**Ticket 1.2 — Schema**
- **Build:** Drizzle schema for all A4 tables (batches, observations, observation_chips, photos, templates, template_stages), including the nullable future-commercial fields. Generate and apply migration.
- **Done when:** migration applies clean; tables exist; types are exported for app use.

**Ticket 1.3 — Domain config and seed**
- **Build:** `lib/chips.ts` (chip definitions + per-type surfacing) and a seed script inserting templates + stages for the v1 ferment types (`fpj`, `ffj`, `labs`, `fish`, `plant`, `custom`) with real `expectation_text` per stage. Use sensible, factual stage expectations.
- **Done when:** `pnpm db:seed` populates templates/stages; chip config exports typed and grouped; selecting a type can resolve its chips and stages.

**Ticket 1.4 — Batch code generator**
- **Build:** pure function generating the next unique `{TYPE}-{NN}` code, plus a name suggester. Unit tested (handles gaps, padding, uniqueness against existing codes).
- **Done when:** unit tests pass for first code, increment, and collision cases.

---

## Phase 2 — Data access and offline-ready API

**Ticket 2.1 — API route handlers**
- **Build:** REST-ish route handlers with zod validation for: create/list/get/update batches; create/list observations; attach chips; create photo + transcript records. **All writes are upserts keyed by the client-provided UUID (idempotent).** Compute `day_in_process` server-side as a safety net.
- **Done when:** each endpoint validates input, upserts correctly, and re-sending the same payload is a no-op (verified by test).

**Ticket 2.2 — Query client and typed hooks**
- **Build:** TanStack Query provider; typed hooks (`useBatches`, `useBatch`, `useObservations`, mutation hooks). Shared API client with error handling.
- **Done when:** a temporary debug screen can list and create a batch against Turso through the hooks.

**Ticket 2.3 — Local store and outbox (used even while online)**
- **Build:** Dexie schema mirroring core tables + an `outbox`. Write-through layer: mutations write Dexie first (optimistic), enqueue an outbox entry, then flush to API. Flush respects dependency order (batch → observation → photo/transcript). Idempotent by UUID.
- **Done when:** creating a batch updates the UI instantly from local cache, then persists to Turso; killing the network mid-flush leaves a pending outbox entry that flushes on retry without duplication (tested).

---

## Phase 3 — Core screens (online happy path)

Build to the wireframes. Voice and photo are stubbed here and wired in later phases.

**Ticket 3.1 — Home dashboard**
- **Build:** batch card component (photo/placeholder, name, code, category accent, day chip, status dot), "Needs attention" vs "All active" grouping, empty state, loading skeletons.
- **Done when:** Home renders real batches from cache; empty and loading states match wireframes; tapping a card routes to Batch Detail.

**Ticket 3.2 — New Batch wizard**
- **Build:** 3-step flow (category → type → name/code/size), auto-filled name and code (from 1.4), template loaded on type select, "Start batch" creates the batch and routes to its detail. Fertilizers active, other categories disabled "coming soon."
- **Done when:** a batch can be created end to end in under a minute; reminders/stage state initialized; lands on Batch Detail.

**Ticket 3.3 — Batch Detail**
- **Build:** header card (photo, name, code, status chip, day), stage-expectation banner (from template, phase 6 fills logic; static read for now), reverse-chron timeline of observations, fixed ＋ Log button, overflow actions (edit, finish, archive). Fresh/active/finished states.
- **Done when:** detail renders header + timeline from cache; ＋ Log opens Quick Log; finish/archive update status and reflect in UI.

**Ticket 3.4 — Quick Log (core, photo/voice stubbed)**
- **Build:** photo block (button stubbed), tailored sensory chips with "more" expander and toggle state, free note, save. Save writes an observation + chip selections through the offline-ready layer and returns to Batch Detail with the new row on top.
- **Done when:** an observation with chips + note saves offline-first and appears instantly on the timeline; warning chips are visually distinct.

---

## Phase 4 — Photos (R2)

**Ticket 4.1 — R2 presign route**
- **Build:** `/api/photos/presign` returns a presigned PUT URL + final `r2_key`. Configure bucket and `R2_PUBLIC_BASE_URL`.
- **Done when:** a client can PUT a file to R2 via the presigned URL and fetch it back from the public base URL.

**Ticket 4.2 — Capture, upload, thumbnails**
- **Build:** camera capture in Quick Log (and optional first-photo in the wizard). Online path: presign → upload → create photo row. Set batch `thumbnail_photo_id` to latest. Render thumbnails on cards, header, and timeline.
- **Done when:** photographing in Quick Log produces a visible thumbnail on the timeline and updates the batch cover; photo persists in R2 and Turso.

---

## Phase 5 — Voice to text

**Ticket 5.1 — Recording UI**
- **Build:** MediaRecorder-based control with states: idle, recording, transcribing, transcript-ready (editable), error. Permissions handled gracefully.
- **Done when:** recording produces an audio blob; all UI states render correctly.

**Ticket 5.2 — Transcription route + provider**
- **Build:** `/api/transcribe` + `Transcriber` interface + default provider impl using `TRANSCRIPTION_API_KEY`.
- **Done when:** posting audio returns a transcript; provider is swappable via one file.

**Ticket 5.3 — Wire voice into Quick Log**
- **Build:** on stop, upload audio to R2 and transcribe; show editable transcript; store audio key + transcript on the observation. Offline: store audio locally, mark `transcript_status = pending`.
- **Done when:** online, a voice note saves with a correct editable transcript; offline, audio is stored and transcript marked pending.

---

## Phase 6 — Domain logic: stages, expectations, status

**Ticket 6.1 — Day and stage computation**
- **Build:** pure functions: `dayInProcess(batch)` and `currentStage(batch, template)`. Unit tested across stage boundaries and open-ended final stages.
- **Done when:** tests pass; Batch Detail banner shows the correct stage expectation for the current day.

**Ticket 6.2 — Status engine**
- **Build:** pure `computeHealth(batch, latestObservation, template)` returning `on_track | watch | needs_action`, driven by warning chips and stage-action timing. Wire so saving an observation recomputes and persists `health`.
- **Done when:** unit tests cover warning-chip and overdue-action cases; selecting "rotten" moves a batch toward watch/needs_action visibly.

**Ticket 6.3 — Expectation content pass**
- **Build:** ensure every seeded stage has accurate, plain-language `expectation_text` and `action_label`. Review against the ferment types.
- **Done when:** each type shows correct expectations across its stages.

---

## Phase 7 — Attention and reminders

**Ticket 7.1 — Derived attention on Home**
- **Build:** compute "needs attention today" from stage-action due/overdue + `needs_action` health. Drive Home's grouping.
- **Done when:** a batch with a due/overdue stage action surfaces at the top of Home with the right action hint.

**Ticket 7.2 — (P1, optional) Local notifications / web push**
- **Build:** opt-in reminders for due stage actions. Scope to what is reliable on the target platform; skip if it risks the timeline.
- **Done when:** opt-in reminders fire for a due action, or the ticket is explicitly deferred with a note.

---

## Phase 8 — Offline and PWA

**Ticket 8.1 — PWA shell**
- **Build:** manifest, icons, service worker, app-shell precache, installability.
- **Done when:** the app installs to a home screen and the shell loads with no network.

**Ticket 8.2 — Offline read + write flush**
- **Build:** verify reads serve from cache offline; outbox flushes on reconnect in dependency order; global + per-item sync indicators.
- **Done when:** create a batch and log observations fully offline, then go online and watch everything sync to Turso with no duplicates.

**Ticket 8.3 — Offline media**
- **Build:** offline photo blobs upload on reconnect; offline `pending` transcripts transcribe on reconnect; statuses update.
- **Done when:** a photo and a voice note captured offline both complete (R2 upload + transcript) automatically once online.

---

## Phase 9 — Access gate

**Ticket 9.1 — Passcode middleware**
- **Build:** Next.js middleware gating all routes behind `APP_PASSCODE` (compare against hash), set a signed cookie on success, simple unlock screen.
- **Done when:** an un-authed visitor hits the unlock screen; correct passcode grants access; wrong passcode is rejected.

---

## Phase 10 — Polish and QA

**Ticket 10.1 — States and accessibility pass**
- **Build:** sweep every screen for empty/loading/error states per the design PRD. A11y: contrast, tap targets, status not color-only, large-text support, focus order.
- **Done when:** all listed states exist; a11y checks pass on the core flows.

**Ticket 10.2 — Test and stabilization pass**
- **Build:** unit tests green for code generator, day/stage, status engine, sync ordering. One e2e: create batch → log photo+chips+voice → see timeline → finish. Fix flakiness.
- **Done when:** the e2e passes headless; CI is green.

---

## Phase 11 — Deploy

**Ticket 11.1 — Vercel + production resources**
- **Build:** Vercel project, production env vars, production Turso DB (migrate + seed templates), production R2 bucket. Production build deploys.
- **Done when:** the production URL loads behind the passcode and the app shell works.

**Ticket 11.2 — Production smoke test**
- **Build:** run the full happy path in production: create a batch, log offline (toggle network), confirm sync, photo in R2, transcript saved. Verify PWA install.
- **Done when:** every step of the smoke test passes in production. **This is "ready to use."**

---

## Suggested repo structure

```
/app                # routes (home, batch/[id], new, settings, unlock)
  /api              # route handlers (batches, observations, photos/presign, transcribe)
/components         # ui + feature components (BatchCard, ChipGroup, Timeline, VoiceRecorder)
/lib
  db.ts             # libsql client
  schema.ts         # drizzle schema
  chips.ts          # chip config + per-type surfacing
  codes.ts          # batch code generator
  stages.ts         # day/stage computation
  status.ts         # status engine
  transcriber.ts    # provider interface + default impl
  r2.ts             # presign helpers
/offline
  dexie.ts          # local store + outbox
  sync.ts           # flush logic
/drizzle            # migrations
/tests              # unit + e2e
```

## Sequencing rationale (for the team)

The app is usable online by end of Phase 6 and field-ready (offline) by end of Phase 8. Photos and voice slot in after the core CRUD works so a broken capture provider never blocks the main loop. Offline is its own phase but the data layer is built offline-ready from Phase 2, so it is integration work, not a rewrite. AI is intentionally absent from v1.

---

*If any ticket fights the core goal (log an observation in under 20 seconds, offline, one-handed), flag it. That goal wins over feature completeness.*
