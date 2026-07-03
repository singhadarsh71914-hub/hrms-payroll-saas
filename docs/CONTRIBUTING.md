# Contributing Guide

Welcome! We aggressively welcome pull requests mapping to Enterprise scalability constraints.

## Development Setup

```bash
git clone https://github.com/singhadarsh71914-hub/hrms-payroll-saas.git
cd hrms-payroll-saas
docker compose up -d redis postgres
npm install
npm run dev
```

## Branch Naming

All branches must map logically:
- `feature/*`
- `fix/*`
- `docs/*`
- `refactor/*`

## Commit Conventions

We strictly enforce conventional commits format preventing massive monolithic dumps:
- `feat:` (New features)
- `fix:` (Bug fixes)
- `docs:` (Documentation)
- `refactor:` (Code modifications without breaking logic)
- `test:` (Test suites)

## Pull Request Checklist
- [ ] Tests successfully executed.
- [ ] `eslint` explicitly executed cleanly natively without errors.
- [ ] Type constraints mapped and verified via `tsc --noEmit`.
- [ ] Meaningful titles bounding execution constraints appropriately.
