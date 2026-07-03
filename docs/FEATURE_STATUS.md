# Feature Status Truth Table

| Feature | Status | Notes |
|----------|---------|--------|
| Attendance A1/B1/C1 | WORKING | Tested. Self-attendance overrides admin. Source field actively enforced. |
| Face Recognition | FLAGGED | Schema uses `face_descriptor`. Flag `ENABLE_ADVANCED_BIOMETRICS` required. |
| Company Geofencing | DISABLED | Pending Location-level architecture. Removed from DB schema. |
| Payroll Processing | WORKING | "Zero employees paid" is legitimate historical batch data (no salaries assigned when processed). |
| Audit Logs | WORKING | Company-scoped. Prisma query fixed to use manual `user_id` mapping. |
| Notifications | WORKING | Mark-as-read verified. |
