# Privacy Policy

**Effective Date:** 2026-06-28

This Privacy Policy explains how we collect, use, and share information when you use our HRMS and Payroll Software as a Service ("Service").

## 1. Data Collection
We collect the following data:
- **Personal Information:** Name, email, date of birth, government IDs (e.g., PAN, Aadhaar for India compliance).
- **Biometric Data:** Face embeddings used for attendance verification. **We do not store raw photos long-term**; only mathematically processed face embeddings.
- **Geolocation Data:** GPS coordinates during check-in/check-out to verify geofence rules.

## 2. GDPR and User Rights
Under GDPR and similar privacy regulations, users have the right to:
- **Access and Export:** You can export your data via the `GET /api/account/export` endpoint.
- **Data Deletion:** You can delete your account via the `DELETE /api/account` endpoint.
- **Revocation:** You may revoke consent for biometric processing at any time by contacting HR.

## 3. Biometric Processing
Face embeddings are strictly used to prevent attendance spoofing. Data is:
- Stored securely using AES-256 encryption at rest.
- Never sold or shared with third-party advertisers.
- Automatically purged if an employee is terminated.

## 4. Retention Schedules
- **Payroll Data:** Retained for 7 years as required by Indian financial compliance laws.
- **Attendance Logs:** Retained for 3 years.
- **Biometrics:** Deleted within 30 days of employee offboarding.

## 5. Security Disclosures
Our application employs industry-standard encryption, rate limiting, and RBAC (Role-Based Access Control) to isolate tenant data.

**[LEGAL REVIEW REQUIRED]** Make sure to replace company name and insert specific DPO contact details before commercial launch.
