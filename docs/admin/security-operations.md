# Security Operations

This document outlines standard administrative tasks to maintain a secure posture.

## 1. Rate Limiting Management
The API utilizes `express-rate-limit` to prevent brute force and DDoS attacks.
- Global routes: 100 requests / 15 minutes.
- Auth routes: 10 requests / 15 minutes.
- Heavy endpoints (Account Deletion/Export): 5 requests / 60 minutes.

If an IP address is blocked legitimately (e.g., an office router), you must wait for the window to expire. Rate limit states are held in memory. Restarting the API container instantly clears all active limit blocks:
```bash
docker compose restart api
```

## 2. SSL / TLS Verification
Ensure your frontend domain is strictly serving over HTTPS.
To check expiration locally, if using a reverse proxy (like NGINX):
```bash
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

## 3. Reviewing Inactive Users
Users who have been soft-deleted are marked as `is_active: false`. After 30 days, their `scheduled_purge_at` timestamp triggers.

To view all pending deletions natively via SQL:
```bash
npx prisma db execute --stdin
SELECT email, deleted_at, scheduled_purge_at FROM "User" WHERE is_active = false;
```

To permanently purge records manually (Bypassing the 30 day wait):
```bash
npx prisma db execute --stdin
DELETE FROM "User" WHERE is_active = false;
```
*(Note: Prisma requires CASCADE constraints configured properly on relations to allow raw DELETES. It is safer to use the Prisma Client script).*
