## ADR-005: Async work boundary (queue+DLQ vs inline vs fire-and-forget)

**Status:** PROPOSED

**Context:**
BullMQ is already a dependency, and `CLAUDE.md` names three jobs explicitly: memory-recall, story-expiry, thumbnail generation. Notification fan-out on event create (push to a Redis queue → BullMQ worker → Expo push per recipient group) is documented as planned but not yet implemented. Redis is already a hard runtime dependency (`ioredis`, used by auth refresh-token rotation and family caching), so requiring it for queues adds no new operational risk.

**Options:**
1. **Queue + DLQ for everything non-trivial async** (thumbnails, notification fan-out, memory-recall, story-expiry, all via BullMQ with bounded retries and a dead-letter queue) — Pros: consistent retry/backoff, survives API restarts, matches what BullMQ was already added for. Cons: failed jobs need a DLQ + alerting story (see ADR-010) or they vanish silently.
2. **Inline (synchronous in the request handler)** — Pros: simplest. Cons: thumbnail generation and Expo push fan-out to potentially hundreds of family members inside a `POST /events` handler would block the response and risk timeouts. Wrong fit.
3. **Fire-and-forget (kick off, don't await, no queue)** — Pros: fast response, no infra. Cons: no retry, no DLQ, silent data loss — a family photo that fails to thumbnail stays broken forever. Unacceptable for a memory-preservation product per the Founder Rule.

**Decision:** Option 1 — queue every job already implied by BullMQ's presence (thumbnails, notification fan-out, memory-recall, story-expiry), each with a bounded retry count and a DLQ.

**Consequences:** This was already implicitly decided by adding BullMQ to `package.json`; this ADR just makes the "always queue, never fire-and-forget" rule explicit so future async work (e.g. a new job type) defaults to the same pattern instead of being added ad hoc. DLQ visibility depends on ADR-010 (observability) being resolved — a queue without alerting on DLQ growth is only half the guarantee.
