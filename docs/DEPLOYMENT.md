# Deployment Guide

## Prerequisites
- Node.js (v18+)
- PostgreSQL
- Redis
- Docker / Kubernetes

## Environment Variables
Ensure the following variables are securely injected into your deployment context:
```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
REDIS_URL="redis://host:6379"
JAEGER_ENDPOINT="http://jaeger:14268/api/traces"
SMTP_URL="smtp://user:pass@smtp.host.com"
```

## Docker Compose (Local & Testing)

We bundle standard testing environments directly via compose:
```bash
docker compose up -d
```
This boots Postgres, Redis, Prometheus, Jaeger, and the main Application servers dynamically.

## Kubernetes (Production)

The repository provides explicit manifest specs handling production clusters natively mapped to `k8s/`:
```bash
kubectl apply -f k8s/
```
The HPA (Horizontal Pod Autoscaler) requires native cluster metrics availability to scale the workers appropriately.
