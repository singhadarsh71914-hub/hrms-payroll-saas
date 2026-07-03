# Incident Response Playbook

This document defines standard operating procedures for critical platform failures.

## 1. High CPU / Memory Utilization (Application Crash)
If the Node.js API container crashes continuously:

1. Identify the bottleneck using Docker stats:
```bash
docker stats
```
2. Check the raw application logs for memory leaks or infinite loops:
```bash
docker compose logs --tail=500 -f api
```
3. Restart the container if a memory threshold was breached:
```bash
docker compose restart api
```

## 2. Database Connection Exhaustion (HTTP 500s)
If the application reports `PrismaClientInitializationError` or `connection limit exceeded`:

1. Access the PostgreSQL container:
```bash
docker exec -it postgres psql -U user -d hrms_db
```
2. Check active connections:
```sql
SELECT sum(numbackends) FROM pg_stat_database;
```
3. Terminate idle connections:
```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND pid <> pg_backend_pid();
```
4. Update `prisma/schema.prisma` to reduce connection pooling limits (e.g., `?connection_limit=5`) and redeploy.

## 3. Data Breach / Compromise Protocol
If an unauthorized actor has gained access to the platform:

1. Immediately lock down all API traffic (Enable Maintenance Mode):
```bash
docker compose stop api
```
2. Rotate the JWT Secret to instantly invalidate all global sessions:
- Edit the `.env` file and change the `JWT_SECRET`.
3. Force a database rotation of all Refresh Tokens:
```bash
npx prisma db execute --stdin
UPDATE "RefreshToken" SET revoked_at = NOW();
```
4. Restart the API:
```bash
docker compose start api
```
5. Audit the system access logs via Prisma Studio to identify the intrusion vector.
