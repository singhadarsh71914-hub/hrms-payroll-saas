# Changelog

All notable changes to this project will be documented in this file.

## [v1.0.0] - Enterprise HRMS Foundation

### Added
- **Employee Management:** Core HR module for employee onboarding, profiles, and directory.
- **Payroll Engine:** Complete immutable payroll processing system including salary structures, components, and mathematical formulas.
- **Compliance Engine:** Integrated Statutory rules for PT, ESI, LWF, Gratuity, and Tax Regimes with historical snapshots.
- **BullMQ Workers:** Asynchronous background processing mapping directly to standard Node worker patterns for payroll scaling.
- **Redis Infrastructure:** Persistent background job queues.
- **OpenTelemetry:** Fully instrumented distributed traces pushing automatically to Jaeger.
- **Prometheus Metrics:** Configured scalable memory arrays targeting operational dashboards.
- **Kubernetes Support:** Readiness and Liveness probes along with standard HPA configurations.
- **Enterprise Operations Dashboard:** Beautiful React-based UI tracking cluster health natively.

### Changed
- Replaced Morgan with Pino for high-performance structured JSON logging.
- Converted EventEmitter-based background processing to robust BullMQ workflows to ensure job persistence.

### Fixed
- Idempotency guarantees preventing duplicate payroll job collisions.
- Distributed locks using Redlock to prevent cross-container duplicate runs.

### Security
- Introduced Rate Limiting preventing aggressive spam on critical compliance endpoints.
- Role-based UI access segregating Admin functions from standard Employees.
- Scrubbing sensitive passwords and tokens inside error captures securely.

### Infrastructure
- Configured local `docker-compose.yml` adding Redis, PostgreSQL, Jaeger, and Prometheus metrics out of the box.
- Added Kubernetes Deployment, Service, and HPA specifications.
