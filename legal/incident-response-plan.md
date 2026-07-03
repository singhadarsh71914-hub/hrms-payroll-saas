# Incident Response Plan

**Effective Date:** 2026-06-28

This plan defines the procedures for responding to security and operational incidents.

## 1. Incident Classification
- **P1 (Critical):** Data breach, platform-wide outage, loss of critical data.
- **P2 (High):** Partial outage (e.g., payroll generation failing), localized security anomaly.
- **P3 (Medium):** Non-critical bug affecting multiple users.
- **P4 (Low):** Minor cosmetic issue or isolated user bug.

## 2. Response SLA
- **P1:** 15 minutes acknowledgment, 2 hours resolution target.
- **P2:** 1 hour acknowledgment, 24 hours resolution target.

## 3. Escalation Matrix
1. **L1 Support:** Triage incoming alerts from Sentry and Prometheus.
2. **L2 Engineering:** Investigate root cause and apply hotfixes.
3. **Data Protection Officer (DPO):** Engaged immediately for any suspected PII data breach.

## 4. Breach Notification (GDPR/CERT-In compliance)
In the event of a verified data breach involving Personally Identifiable Information (PII):
1. **Authorities:** We will notify the relevant supervisory authorities (e.g., CERT-In within 6 hours, GDPR regulators within 72 hours).
2. **Customers:** We will notify affected tenant administrators within 24 hours of breach verification.

## 5. Post-Mortem
Every P1/P2 incident requires a published Root Cause Analysis (RCA) document within 5 business days, detailing the timeline, impact, root cause, and preventative action items.

**[LEGAL REVIEW REQUIRED]** CERT-In guidelines mandate 6-hour reporting windows for specific cybersecurity incidents in India. Ensure team is trained.
