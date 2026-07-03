# Backup & Disaster Recovery Strategy

## Database Backups
Because the application relies on PostgreSQL, a daily `pg_dump` is mandatory to ensure point-in-time recovery for the `my_ai_project` database.

### Automated Backup Script
Create a cron job that executes the following script daily at 2:00 AM:

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/var/backups/hrms"
pg_dump postgresql://user:password@localhost:5432/my_ai_project -F c > "$BACKUP_DIR/db_backup_$DATE.dump"
```

## File Upload Backups
The `uploads/` directory contains critical HR documents (ID proofs, PF forms, etc.).
A cloud sync tool (e.g., AWS S3, Google Cloud Storage, or `rsync` to a remote volume) should mirror this directory continuously.

## Disaster Recovery Process
If the server or database is irrecoverably destroyed:

1. **Provision a new server**: Following `deployment.md`, setup Node, Postgres, and the source code.
2. **Restore Database**:
   ```bash
   pg_restore -d my_ai_project -1 /path/to/latest/db_backup.dump
   ```
3. **Restore Files**:
   Pull the latest `uploads/` directory from the cloud storage bucket into the root of the backend folder.
4. **Boot**:
   Start the API service via PM2. Check logs to ensure successful database connection.
