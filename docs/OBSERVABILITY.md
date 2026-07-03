# Enterprise Observability

## Infrastructure

We utilize an advanced open-source observability matrix tailored for Kubernetes scaling.

## Tracing (OpenTelemetry + Jaeger)
- **OpenTelemetry SDK:** Wraps Express HTTP operations and Prisma executions.
- **Jaeger:** Consumes Traces visualizing database bounds, cache latency, and HTTP waterfall limits.

## Metrics (Prometheus)
- `prom-client` intercepts application routes emitting standard CPU, memory, and HTTP response distributions directly to the `/metrics` endpoint for Prometheus scraping.

## Structured Logging (Pino)
- `pino-http` seamlessly intercepts logs injecting structural identifiers (request IDs, company IDs).

## Worker Health (Bull Board)
- Native GUI mapped natively binding internally to BullMQ tracking payload sizes, execution latency, and Dead Letter Queue arrays dynamically.

## Health Checks
Two isolated endpoints explicitly mapped for container restarts:
- `/health/live`: Fast baseline HTTP liveness execution.
- `/health/ready`: Deep-ping DB bounds explicitly checking Postgres and Redis limits.
