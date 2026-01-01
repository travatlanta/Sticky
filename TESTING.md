# Prompt 1 — Safety scaffolding (feature flags + email logger)

## What changed
- Added server-only feature flag helper:
  - `next-app/lib/featureFlags.ts`
- Added server-only email logging helper with basic redaction:
  - `next-app/lib/email/emailLogger.ts`
- Documented rollout flags:
  - `next-app/.env.example`

## Checklist to test before moving on
1) In `next-app/`:
   - install deps (if needed)
   - run `npm run build`
2) Place a test order using the existing checkout flow and confirm:
   - checkout completes
   - order confirmation email still sends (unchanged)
3) Confirm that no new admin UI or API endpoints are exposed yet.

## Next step
Run **Prompt 2 — Email delivery reliability (backend only)**.
