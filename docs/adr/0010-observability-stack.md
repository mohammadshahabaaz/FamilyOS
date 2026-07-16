## ADR-010: Observability stack (structured logs + traces + alerts)

**Status:** PROPOSED

**Context:**
Fastify's built-in Pino logger is already configured in `app.ts` (structured JSON, `pino-pretty` in dev). There is no tracing, no metrics, and no alerting. `CLAUDE.md`'s "Scale architecture" section doesn't mention observability at all — this is a genuine, un-covered gap heading into Phase 2, which adds more async surface area (BullMQ jobs per ADR-005) that can fail silently without anyone noticing.

**Options:**
1. **Structured logs only, extend what exists**: keep Pino, add request-id correlation via Fastify's built-in `request.id`, ship logs to a free-tier drain (e.g. Axiom/BetterStack) once deployed. Pros: near-zero new cost, builds directly on the existing setup. Cons: no automatic anomaly detection — someone has to go looking.
2. **Full stack now**: structured logs + OpenTelemetry tracing + Prometheus metrics + alert routing. Pros: complete observability from day one. Cons: FamilyOS is a single Fastify instance talking to Postgres/Redis/R2 — there's no service-to-service call graph to trace yet. This is infrastructure for a distributed system that doesn't exist, and directly conflicts with the "prefer zero-dependency approaches first" default.
3. **Logs + basic alerting, no tracing/metrics**: keep Pino, add a scheduled check against the existing `/health` endpoint with alerting on failure or error-rate spikes — reusing the project's own `monitor` agent (already defined for exactly this purpose) run on a schedule, rather than new infra. Pros: closes the actual gap (nobody is currently notified if the API goes down or a BullMQ queue's DLQ starts growing) without OTel/Prometheus overhead. Cons: no per-request tracing if a bug later needs deep cross-request debugging.

**Decision:** Option 3 — log correlation + scheduled health/DLQ-growth alerting via the existing `monitor` agent, deferring tracing/metrics.

**Consequences:** No new observability infrastructure to operate. The `monitor` agent's health-check role gets a concrete, scheduled job (e.g. via the `/loop` or cron skill) instead of only running ad hoc after deploys. Reassess Option 2 if/when BullMQ job volume grows enough, or the API is deployed as multiple instances, that blind spots become genuinely costly to debug without tracing.
