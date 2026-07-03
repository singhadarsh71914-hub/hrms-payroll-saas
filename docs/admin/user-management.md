# User & Access Management

This guide details how System Administrators can manage identities, enforce security policies, and handle account lockouts.

## 1. System Administration Roles
The platform utilizes Role-Based Access Control (RBAC). 
- **SUPERADMIN:** Full read/write access to all global configurations, database migrations, and cross-company data.
- **ADMIN:** Company-level admin. Can modify company settings, approve payroll, and configure billing.
- **HR:** Operational access. Can run payroll, modify attendance, and manage employee profiles.
- **EMPLOYEE:** Restricted to self-service portals (payslips, leave requests, daily attendance).

## 2. Unlocking Accounts
If a user is locked out due to brute force protection (see `password_reset_attempts` in the database), the admin can manually unlock the account via Prisma Studio.

Run the local admin UI:
```bash
npx prisma studio
```
1. Navigate to the `User` table.
2. Locate the locked user by `email`.
3. Reset `password_reset_attempts` to `0`.
4. Click **Save 1 Change**.

## 3. Manual Password Overrides
In the event an employee loses access to their email and cannot use the self-service flow:
1. Log into the backend server environment.
2. Generate a hashed password using Node.js REPL:
```bash
node -e "require('bcryptjs').hash('NewTempPass123!', 10).then(console.log)"
```
3. Copy the output hash.
4. Execute the raw SQL update via Prisma:
```bash
npx prisma db execute --stdin
UPDATE "User" SET password_hash = 'COPIED_HASH_HERE' WHERE email = 'employee@company.com';
```

## 4. Forced Session Invalidation
If an employee is terminated immediately, you must revoke their active JWT tokens to cut off instant access.
1. Run Prisma Studio: `npx prisma studio`
2. Navigate to the `RefreshToken` table.
3. Filter by `user_id`.
4. Set the `revoked_at` field to the current timestamp.
5. Save changes. The employee's active session will die on their next API request.
