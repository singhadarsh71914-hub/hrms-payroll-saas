# Platform Upgrade Guide

Follow these steps to safely update the HRMS application to the latest version.

## 1. Create a Snapshot
Always perform a database backup prior to pulling new code. Reference the [Backup and Recovery Procedures](./backup-and-recovery.md).

## 2. Pull the Latest Code
Navigate to the root directory of the project on your server.
```bash
cd hrms-payroll-saas
git fetch --all
git pull origin main
```

## 3. Rebuild the Containers
Rebuild the Docker images to install any newly added Node.js dependencies (NPM) and compile the Vite frontend bundle.
```bash
docker compose build
```

## 4. Apply Database Migrations
Start the Postgres container (if not running) and apply any new database schema changes.
```bash
docker compose up -d postgres
docker compose run --rm api npx prisma migrate deploy
docker compose run --rm api npx prisma generate
```

## 5. Restart Services
Restart the entire stack using the newly built images.
```bash
docker compose down
docker compose up -d
```

## 6. Verification
Verify the application is running without crash loops:
```bash
docker compose ps
docker compose logs --tail=100 api
```
Access the web URL and confirm the version number (typically in the footer or settings page) reflects the latest release.
