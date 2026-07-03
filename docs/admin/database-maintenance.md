# Database Maintenance

Routine database maintenance ensures optimal query speeds and disk space utilization for your PostgreSQL instance.

## 1. Schema Migrations
Whenever the HRMS platform is updated with a new feature, database schema migrations must be applied.

Check for unapplied migrations:
```bash
npx prisma migrate status
```

Apply pending migrations to the production database:
```bash
npx prisma migrate deploy
```

Generate the internal Prisma Client typings (required after pulling new code):
```bash
npx prisma generate
```

## 2. Vacuuming (PostgreSQL)
Postgres requires vacuuming to reclaim storage occupied by dead tuples (e.g., after heavy soft-deletions or bulk imports).

Access the Postgres interactive terminal:
```bash
docker exec -it postgres psql -U user -d hrms_db
```

Run a standard vacuum to clear dead tuples:
```sql
VACUUM VERBOSE;
```

If disk space is critical, run a full vacuum (Warning: This locks the tables and blocks reads/writes during execution):
```sql
VACUUM FULL;
```

## 3. Viewing Database Size
To monitor overall consumption:
```bash
npx prisma db execute --stdin
SELECT pg_size_pretty(pg_database_size('hrms_db'));
```
