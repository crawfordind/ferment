# Decisions & deferrals

Running log of scope decisions made during the build, so follow-ups aren't lost.

## Ticket 7.2 — Local notifications / web push: DEFERRED (v1)

**Decision:** Not building OS-level local notifications / web push in v1.

**Rationale:**
- The design PRD explicitly decided stage reminders surface as an **in-app card at
  the top of Home** ("OS push can layer on later without redesign"). That mechanism
  is delivered by Ticket 7.1 (derived attention + the "N batches need attention
  today" banner), so the reminder need is met.
- Reliable scheduled local notifications on the web require a service worker
  (Phase 8) and are unreliable/unsupported for background scheduling on iOS Safari.
- The build plan marks 7.2 as P1 optional and says to skip if it risks the timeline.

**If revisited later:** add an opt-in toggle in Settings, register a service-worker
`showNotification` path, and schedule against due/overdue stage actions
(`computeAttention` already provides the due/overdue reasons to drive it).

## Phase 8 follow-up — server read-back can clobber optimistic local writes

`hooks/use-batch.ts` / `use-batches.ts` revalidate from the server on mount and
`offline/repository.ts#hydrate*FromServer` does an unconditional `bulkPut`. A server
read-back can therefore momentarily overwrite a newer un-flushed local write (seen as
a brief status flicker after saving an observation).

**Fix (Phase 8.2):** hydrate with last-write-wins by `updated_at` — only overwrite a
local row when the server row's `updatedAt` is newer than the local one.
