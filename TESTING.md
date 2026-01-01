# Prompt 2 — Email delivery reliability (logging + retries)

## What changed in this patch
- Stores the customer's email on the order (`orders.customer_email`) so admin resend + future features can always find it.
- Adds `email_deliveries` table used to log/send the order confirmation email idempotently.
- Checkout now passes `orderId` into the email sender so delivery status can be tracked.
- Admin resend endpoint now:
  - Uses `orders.customer_email` first (falls back to legacy shippingAddress.email, then user.email)
  - Supports an optional override email in the POST body: `{ "toEmail": "customer@example.com" }`
  - Forces send even if the original delivery was already marked sent.
- Adds a cron endpoint to retry failed deliveries (feature-flagged OFF by default):
  - `GET /api/cron/retry-email-deliveries`

## Required DB change (must be applied before relying on logs/retries)
From `Sticky/next-app`:

1) Ensure `DATABASE_URL` is set (Neon/Vercel connection string)
2) Run:
- `npm run db:push`

This will create:
- `orders.customer_email`
- `email_deliveries` table

## Checklist to test (must pass before moving to Prompt 3)

### A) Build + basic runtime
- [ ] From `Sticky/next-app`: `npm ci`
- [ ] From `Sticky/next-app`: `npm run build` (must succeed)

### B) Checkout safety (DO NOT break cart/checkout)
- [ ] Place a paid test order end-to-end
- [ ] Confirm:
  - [ ] Checkout completes successfully
  - [ ] Cart clears correctly
  - [ ] Customer receives the order confirmation email

### C) Delivery logging (requires DB push from above)
- [ ] In Neon / DB console, verify a row exists:
  - `select * from email_deliveries order by id desc limit 5;`
- [ ] Confirm the newest row has:
  - [ ] `type = 'order_confirmation'`
  - [ ] `status = 'sent'`
  - [ ] `resend_id` populated (if Resend returned an id)

### D) Admin resend
- [ ] In Admin → Orders → open an order → trigger “Resend receipt”
- [ ] Confirm:
  - [ ] Returns success
  - [ ] Customer receives another email
  - [ ] `email_deliveries.attempts` increments and status ends at `sent`

### E) Cron retry endpoint (optional right now; feature-flagged OFF by default)
- [ ] Keep `EMAIL_DELIVERY_QUEUE_ENABLED=false` in production for now (no behavior change).
- [ ] When ready to test:
  - Set `EMAIL_DELIVERY_QUEUE_ENABLED=true`
  - Set `CRON_SECRET` to a random string
  - Call:
    - `curl -H "Authorization: Bearer <CRON_SECRET>" https://<site>/api/cron/retry-email-deliveries`

## Next step (Prompt 3)
Email template customization UX improvements in Admin:
- Preview that matches real inbox rendering (table-based, centered)
- Send test email button (to a chosen address)
- Logo upload (store URL in settings automatically) instead of requiring a raw URL
- Guardrails for non-technical admins (validation + defaults)
