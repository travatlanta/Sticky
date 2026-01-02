# Prompt 3 — Email layout correctness (inbox rendering)

## What changed
- Updated the HTML email layout in `next-app/lib/email/sendOrderConfirmationEmail.ts` to use a more email-client-safe centering pattern:
  - `<center>` wrapper
  - 100% width wrapper table
  - centered 600px container table (with MSO/IE conditional wrapper)
  - inline styles + Outlook-friendly table resets
- Added hidden preheader text (improves inbox preview text).
- Improved logo `<img>` inline styles for consistent rendering.

## Test checklist (must pass before Prompt 4)
1) Build:
   - In `next-app/`: `npm run build`

2) Customer email render:
   - Place a test order (paid or $0) and open the email in at least:
     - Yahoo (your current client)
     - Gmail (web)
   - Confirm:
     - Email is centered (not hard-left)
     - No horizontal overflow on mobile/narrow window
     - Logo renders with no odd spacing

3) Admin resend:
   - Admin → Orders → Resend Receipt
   - Confirm it delivers and renders the same.

4) Check logs:
   - Confirm no new 500 errors in Vercel logs for `/api/checkout/create-payment`.

## Next step
Prompt 4 — True preview upgrade (server-generated HTML preview rendered in an iframe in the receipt settings page).
