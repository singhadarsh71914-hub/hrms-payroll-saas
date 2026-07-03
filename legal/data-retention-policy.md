# Data Retention Policy

**Effective Date:** 2026-06-28

This policy outlines how long we retain different categories of data on the HRMS platform.

## 1. Statutory Retention (India)
- **Payroll & Tax Records:** Retained for a minimum of 7 years from the end of the financial year, as mandated by the Income Tax Act, 1961 and Companies Act, 2013.
- **PF/ESI Records:** Retained for 5 years post-employment termination.

## 2. Operational Data
- **Attendance Logs:** Retained for 3 years to facilitate historical audits.
- **Audit Logs:** System actions are retained in warm storage for 1 year, and archived to cold storage for 3 additional years.
- **Biometric Embeddings:** Strictly deleted within 30 days of the employee's `date_of_leaving` or account termination.

## 3. Account Deletion Workflow
Upon a verified `DELETE /api/account` request (or administrative deletion):
1. **Immediate Soft Delete:** The user is marked as inactive and access is immediately revoked.
2. **30-Day Grace Period:** Accounts can be recovered by administrators within 30 days.
3. **Hard Deletion:** After 30 days, PII (Personally Identifiable Information) is scrubbed or anonymized, preserving only anonymized IDs for statutory payroll records.

**[LEGAL REVIEW REQUIRED]** Validate retention maximums under regional laws for biometric data.
