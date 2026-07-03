# Security Policy

## Supported Versions

We support security fixes natively tracking exact Node/React environments:
- **v1.x:** Actively supported.
- **Beta / alpha:** Not supported natively for enterprise deployments.

## Reporting a Vulnerability

If you explicitly discover a vulnerability directly mapping into the HRMS ecosystem, **DO NOT create a public issue**.
Instead, directly email the core maintainers explicitly securely.

## Authentication Model
Standard JWT tokens signed natively bounding internal RSA protocols map access explicitly across endpoints securely.

## Rate Limiting
Global protection natively mapped via `express-rate-limit`:
- Generic APIs: 100 requests / 15 minutes.
- Auth endpoints: 10 requests / 15 minutes bounding brute forcing securely.

## Compliance Protections
The Compliance Engine explicitly prevents modification of standard active payloads via Snapshot Architectures securely maintaining exact execution math.
