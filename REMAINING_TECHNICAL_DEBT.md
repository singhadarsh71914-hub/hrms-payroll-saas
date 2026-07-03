# Remaining Technical Debt

This document outlines the known compromises, disabled features, areas requiring future migrations, and external infrastructure dependencies that remain after the Phase S Stabilization Audit.

## 1. Known Compromises

- **E2E Testing Data Setup**: `global-setup.ts` uses raw SQL to inject users because Prisma is blocked from seeding during parallel test execution without explicit environment control. The soft-deletion workflow in `data-rights.spec.ts` had to be decoupled to prevent test bleed (e.g. `admin@e2e.com` being soft-deleted before `hrms.spec.ts` tries to log in).
- **Prisma Schema Exclusions**: Several features like `face_embedding` and `face_confidence` were removed from the `Employee` model and consolidated into `face_descriptor` due to repeated 500 errors. 
- **ZipArchive Initialization**: `archiver` required an explicit named import `{ ZipArchive }` because the ES modules `import archiver from 'archiver'` failed during the dynamic `tsx` backend execution.
- **Data Export & Soft Deletion**: Currently handles standard relational structures. Deep deletion or cross-model cascading (like cascading deletes to orphaned files) requires periodic scheduled purge jobs which are simulated but not yet fully automated via a background cron system.

## 2. Disabled Feature Flags

Currently, the following features are disabled or rely on mock endpoints to maintain stability:
- **Biometric Face Enrollment**: Simulated via a successful mock sequence. The frontend uses `navigator.mediaDevices.getUserMedia` when possible, but the backend disables strict tensor validation.
- **Rate Limiting (Non-production)**: Rate limiting (`authLimiter` and `globalLimiter`) is bypassed in `NODE_ENV !== "production"` to prevent tests from failing with 429 Too Many Requests.
- **Complex Analytics Calculations**: The Intelligence Dashboard mockups are returned cleanly from controllers rather than running complex, expensive SQL aggregations on incomplete data.

## 3. Areas Requiring Future Migrations

- **Auth Token Management**: Access tokens are currently stored in `localStorage`. A migration to HTTP-Only Secure cookies is required for production-level XSS protection.
- **Database Schema Validation**: Adding strict Prisma `@default` and `@map` validations for enums and dates, particularly for timezones which are currently stored as UTC but rely on frontend formatting.
- **Notification Real-time Support**: Migrating from polling/refresh to WebSocket or Server-Sent Events (SSE) for the Live Alerts Feed.
- **Soft Delete Indexing**: Queries currently must explicitly add `where: { is_active: true }` or similar. A global middleware or Prisma Extension should be implemented to enforce this automatically.

## 4. Infrastructure Dependencies

The platform currently depends on or anticipates the following infrastructure components:
- **PostgreSQL**: Primary datastore. Relies on the user having a local Postgres instance (or Dockerized Postgres) on port 5432.
- **Docker (Future)**: The application is designed to be containerized, but currently runs via local `npm run dev` and `npx playwright test`. Dockerfiles and `docker-compose.yml` should be finalized for consistent CI/CD.
- **SMTP Service (Future)**: Email verification and password reset workflows currently simulate sending emails and print to the console. A real SMTP provider (e.g., SendGrid, AWS SES) is needed for production.
- **Payment Gateway (Stripe - Future)**: Anticipated for payroll and external billing workflows; currently unintegrated.
