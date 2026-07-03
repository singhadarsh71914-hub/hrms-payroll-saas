# Monitoring & Health Checks

The HRMS platform provides built-in metrics and endpoints to monitor system health and performance without requiring third-party agents.

## 1. Application Health Checks
The API exposes lightweight, unauthenticated endpoints to verify routing and database connectivity.

To check if the HTTP server is responsive:
```bash
curl -I http://localhost:3000/health
```

To verify database connectivity is active:
```bash
curl -I http://localhost:3000/ready
```

## 2. Sentry Error Tracking (If Configured)
If `SENTRY_DSN` is configured in your `.env`, all frontend crashes and backend unhandled exceptions will automatically report to your Sentry dashboard.

To manually trigger a backend test event:
```bash
curl http://localhost:3000/debug-sentry
```
Verify the error appears in your Sentry console.

## 3. Reviewing Audit Logs
For compliance, the system records sensitive actions (Logins, Deletions, Exports) to the `AuditLog` table.
As an administrator, you can view these directly from the Frontend UI under **Compliance & Org > Audit Logs**.

Alternatively, inspect them directly from the database:
```bash
npx prisma studio
```
Navigate to the `AuditLog` model to filter by `action` or `user_id`.
