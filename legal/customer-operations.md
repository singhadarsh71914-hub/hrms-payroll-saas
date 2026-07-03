# Customer Operations Manual

## 1. SLA Definitions
- **Uptime SLA:** 99.9% availability for core application access.
- **Support SLA:** 
  - **P1 (Critical):** 1-hour response time (System down)
  - **P2 (High):** 4-hour response time (Major feature broken)
  - **P3 (Normal):** 24-hour response time (General queries)

## 2. Support Email Workflows
1. Incoming emails to `support@company.com` route to our Helpdesk system (e.g., Zendesk).
2. Automated receipt confirmation sent to the user with an expected response time based on SLAs.
3. Triage agent categorizes issue (Bug, Billing, Access, Feature Request).
4. If a bug is confirmed, a Jira ticket is created for Engineering.
5. Support follows up upon Jira ticket resolution.

## 3. Escalation Procedures
- If a ticket exceeds SLA limits by 20%, it is automatically escalated to the Support Lead.
- If a ticket involves a P1 critical issue or data breach, the On-Call Engineering Lead and DPO are paged via PagerDuty immediately.

## 4. Status Page Requirements
- A public Statuspage (e.g., Atlassian Statuspage) must be hosted on a separate domain (e.g., `status.company.com`).
- It must independently monitor:
  - Frontend Application Load Time
  - Backend API Availability
  - Database Connectivity
  - Third-party Integrations (e.g., SMTP, Face Recognition APIs)

## 5. Onboarding Documentation
All new organizations will receive an Onboarding Guide detailing:
1. Administrator configuration of Departments and Designations.
2. Employee bulk upload process (CSV).
3. Leave policy setup.
4. Payroll component mapping.
5. Biometric enrollment instructions for employees.
