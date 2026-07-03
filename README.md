# HRMS Payroll SaaS

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![Node](https://img.shields.io/badge/node.js-6DA55F?style=flat&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=flat&logo=kubernetes&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

Enterprise Indian HRMS & Payroll SaaS built with React, Express, Prisma, PostgreSQL, Redis, BullMQ, OpenTelemetry, and Kubernetes.

---

## Features

**HR Core**
- Employee Management
- Attendance
- Leave
- Performance

**Payroll**
- Salary Components
- Salary Structures
- Loans
- Reimbursements

**Compliance**
- PT (Professional Tax)
- ESI
- LWF
- Gratuity
- Tax Regimes

**Enterprise**
- BullMQ
- Redis
- OpenTelemetry
- Prometheus
- Kubernetes
- Immutable Payroll Runs

---

## Screenshots

*(See \docs/screenshots/\)*
- dashboard.png
- payroll.png
- statutory-compliance.png
- operations-dashboard.png

---

## Architecture

Frontend ? API ? Workers ? Redis ? PostgreSQL ? Metrics ? Jaeger

*See \docs/ARCHITECTURE.md\ for Mermaid diagrams.*

---

## Quick Start

\\\ash
# Start infrastructure
docker compose up -d

# Install dependencies
npm install

# Start development servers
npm run dev
\\\

---

## Deployment

**Docker:**
\\\ash
docker compose up
\\\

**Kubernetes:**
\\\ash
kubectl apply -f k8s/
\\\

---

## Roadmap

**Phase 9:** Executive Analytics
**Phase 10:** AI Insights

*See \docs/ROADMAP.md\ for full details.*
