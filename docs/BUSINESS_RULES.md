# HRMS Business Rules

These rules are strictly enforced across the application and no future PR may violate them.

## Attendance Collision Rules

- **A1: Employee self-attendance wins.** 
  If an employee actively marks their own attendance (source: `EMPLOYEE_SELF`), it takes precedence over all automated and admin fallbacks.

- **B1: Admin fallback works.** 
  Admins may mark attendance ONLY if the employee has not submitted it themselves.

- **C1: Employee overrides admin.** 
  If an admin marked attendance earlier, and the employee later submits attendance, the employee submission must override the admin entry, transitioning the record back to `EMPLOYEE_SELF`.
  **Admin override of `EMPLOYEE_SELF` attendance must return HTTP 409 Conflict.**

## Module Safeguards

- Core modules (Login, Employee creation, Onboarding, Notifications, Attendance, Leave, Payroll) must NEVER be broken by experimental advanced features.
- If a flag-driven feature compromises these boundaries, the feature flag must be disabled immediately.
