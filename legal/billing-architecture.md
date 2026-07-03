# Billing Architecture Design

## 1. Subscription Models
The platform operates on a B2B SaaS model billed per active employee seat.
- **Base Fee:** Fixed monthly fee for the organization (includes 10 seats).
- **Per-Seat Fee:** Tiered pricing per active employee beyond the initial 10.
- **Billing Cycles:** Monthly and Annual (20% discount).
- **Free Trial:** 14-day full-feature access without requiring a credit card up front.

## 2. Infrastructure
- **Payment Gateway:** Stripe (or Razorpay for local Indian businesses if mandated).
- **Invoicing:** Stripe Invoicing integrated for automated GST (Goods and Services Tax) compliance.
- **Tax Handling:** Stripe Tax automatically calculates local GST/VAT based on the company's billing address.

## 3. Stripe Webhook Handling
To ensure consistency without mocking or manual reconciliation, our backend will implement a single endpoint (`POST /api/billing/webhook`).
- **Signature Verification:** The `Stripe-Signature` header will be cryptographically verified using the webhook secret.
- **Idempotency:** We will store processed `event.id` in a database table to prevent duplicate processing if Stripe retries delivery.
- **Events to Listen:**
  - `checkout.session.completed`: Upgrades trial to paid.
  - `invoice.paid`: Extends subscription expiry date.
  - `invoice.payment_failed`: Triggers a 3-day grace period email; downgrades account to read-only if unpaid after grace period.
  - `customer.subscription.deleted`: Marks account for archiving.

## 4. Upgrade/Downgrade Workflows
- **Proration:** Handled natively by Stripe when modifying seat counts mid-cycle.
- **Downgrades:** Will only take effect at the end of the current billing cycle to avoid complex refund math.
- **Refunds:** Manual only, handled via Support tickets to prevent API abuse.
