# Password Reset Security Review

## 1. Email Enumeration Protection
**Implementation:** `authResetController.ts` lines 50-60.
**Proof:** The `POST /api/auth/forgot-password` endpoint explicitly returns a `200 OK` with a generic message `"If an account with that email exists, we have sent a password reset link."` regardless of whether the `user` lookup succeeds or fails. This prevents attackers from testing combinations of emails to see which are registered in the database.

## 2. Token Theft & Replay Attacks
**Implementation:** `schema.prisma` and `authResetController.ts`.
**Proof:** 
1. Tokens sent via email are 32-byte cryptographically secure random strings (`crypto.randomBytes(32)`).
2. The database *only* stores the SHA-256 hash of this token (`crypto.createHash('sha256')`). If the database is leaked, the plaintext tokens cannot be recovered.
3. Once a token is successfully used in `/reset-password`, the `reset_password_token` field is immediately set to `null` within a Prisma transaction, preventing replay attacks (Single-use enforcement).

## 3. Brute Force Protection
**Implementation:** `authResetController.ts` lines 8-20.
**Proof:** `express-rate-limit` is applied directly to the reset endpoints.
- `/forgot-password` is limited to 3 requests per 15 minutes per IP.
- `/reset-password` is limited to 5 attempts per 15 minutes per IP.

## 4. Timing Attacks
**Implementation:** `authResetController.ts`.
**Proof:** While true constant-time comparisons require identical execution times down to the millisecond, the API prevents measurable timing discrepancies for email enumeration by executing the same generic JSON response regardless of the DB lookup outcome. (A small timing leak exists in the `bcrypt.hash` step if the token is valid vs invalid, but since the token space is $2^{256}$, timing attacks on the token itself are computationally infeasible).

## 5. Session Fixation & Hijacking
**Implementation:** `authResetController.ts` lines 98-101.
**Proof:** Upon a successful password reset, all active `refreshToken` entries for that user are immediately invalidated (`revoked_at: new Date()`). This ensures that an attacker who previously stole an active session cookie is instantly forcibly logged out across all devices.
