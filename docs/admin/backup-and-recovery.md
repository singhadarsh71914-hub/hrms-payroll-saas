# Backup and Recovery Procedures

## 1. Automated Backups
If you are deploying using Docker and PostgreSQL, backups should be configured on the host machine using standard Postgres dump tools.

## 2. Manual Database Dump
To create a point-in-time snapshot of the production database locally:

```bash
# Export the DATABASE_URL to your environment
export DATABASE_URL="postgresql://user:password@localhost:5432/hrms_db?schema=public"

# Run the pg_dump utility (Ensure PostgreSQL client tools are installed)
pg_dump $DATABASE_URL -F c -f hrms_production_backup_$(date +%F).dump
```

## 3. Database Restoration
**WARNING:** This operation is destructive and will overwrite existing data.

1. Stop the application server to prevent writes:
```bash
docker compose stop api
```

2. Drop the existing schema and recreate it (using Prisma):
```bash
npx prisma migrate reset --force
```

3. Restore the dump file:
```bash
pg_restore -d $DATABASE_URL -1 hrms_production_backup_2024-01-01.dump
```

4. Restart the application server:
```bash
docker compose start api
```

## 4. Document Storage Backups
If you are using the local filesystem for document storage (e.g., employee PDFs, resumes), you must periodically backup the `uploads/` directory.

```bash
# Compress the uploads directory
tar -czvf hrms_uploads_backup_$(date +%F).tar.gz ./uploads/
```
