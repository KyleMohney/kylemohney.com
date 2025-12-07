/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: EDGE_FUNCTIONS_DEPLOYMENT_GUIDE.md                          ║
║  Purpose: Instructions for deploying Stripe edge functions         ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

# Stripe Edge Functions - Deployment Guide

## Overview
5 Edge Functions for Stripe membership integration. All written in TypeScript/Deno.

## Files Created

```
/functions/stripe/
├── create-checkout-session.ts    - Create Stripe checkout
├── cancel-subscription.ts         - Cancel membership
├── update-payment-method.ts       - Billing portal session
├── get-invoices.ts               - Fetch payment history
└── stripe-webhook.ts             - Receive Stripe webhooks
```

## Deployment Methods

### Option A: Supabase Dashboard (Recommended - No CLI Required)

**Best for:** Teams with network/auth restrictions, no CLI setup needed

#### Step 1: Set Environment Variables First

In [Supabase Dashboard](https://supabase.com/dashboard):
1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Add the following secrets:
   - `STRIPE_SECRET_KEY` = `sk_test_xxxxx` (test) or `sk_live_xxxxx` (prod)
   - `STRIPE_WEBHOOK_SECRET` = `whsec_xxxxx` (from Stripe dashboard)

#### Step 2: Deploy Each Function

1. Go to **Project Settings** → **Edge Functions**
2. Click **Create a New Function**
3. Name it: `stripe/create-checkout-session`
4. Choose TypeScript as language
5. Delete the example code and copy-paste entire contents from `/functions/stripe/create-checkout-session.ts`
6. Click **Deploy**
7. Repeat for remaining 4 functions:
   - `stripe/cancel-subscription`
   - `stripe/update-payment-method`
   - `stripe/get-invoices`
   - `stripe/stripe-webhook`

#### Step 3: Get Function URLs

After deployment, navigate to each function in Supabase Dashboard. URLs will be:
```
https://<project-ref>.supabase.co/functions/v1/stripe/create-checkout-session
https://<project-ref>.supabase.co/functions/v1/stripe/cancel-subscription
https://<project-ref>.supabase.co/functions/v1/stripe/update-payment-method
https://<project-ref>.supabase.co/functions/v1/stripe/get-invoices
https://<project-ref>.supabase.co/functions/v1/stripe/stripe-webhook
```

---

### Option B: Supabase CLI (If npm Works)

**Best for:** CI/CD pipelines, automation, local development

#### Step 1: Navigate to Project Directory
```bash
cd C:\Users\Blackthorn\Desktop\kylemohney.com\rooted-vitality
```

#### Step 2: Authenticate to Your Project
```bash
npx @supabase/cli login
```

#### Step 3: Link Your Project
```bash
npx @supabase/cli link --project-ref <your-project-ref>
```

#### Step 4: Set Environment Variables

In Supabase Dashboard → Project Settings → Edge Functions Secrets, add:
```
STRIPE_SECRET_KEY = sk_test_xxxxx (test) or sk_live_xxxxx (prod)
STRIPE_WEBHOOK_SECRET = whsec_xxxxx (from Stripe dashboard)
```

#### Step 5: Deploy Functions

Deploy all at once:
```bash
npx @supabase/cli functions deploy stripe/create-checkout-session
npx @supabase/cli functions deploy stripe/cancel-subscription
npx @supabase/cli functions deploy stripe/update-payment-method
npx @supabase/cli functions deploy stripe/get-invoices
npx @supabase/cli functions deploy stripe/stripe-webhook
```

#### Step 6: Test Functions

```bash
npx @supabase/cli functions invoke stripe/create-checkout-session --body '{"practitioner_id":"test-uuid"}'
```

---

## Configure Stripe Webhook (Both Methods)

In [Stripe Dashboard](https://dashboard.stripe.com) → Webhooks:

1. Click **Add Endpoint**
2. Paste webhook URL:
   ```
   https://<project-ref>.supabase.co/functions/v1/stripe/stripe-webhook
   ```
3. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Click **Add Endpoint**
5. Copy the **Signing Secret** (starts with `whsec_`)
6. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
7. Update/add `STRIPE_WEBHOOK_SECRET` with the signing secret from Stripe

## Final Step: Add Stripe Secrets and Activate

THIS IS WHERE WE LEFT OFF!!!!

**When you receive Stripe account access:**

1. In [Stripe Dashboard](https://dashboard.stripe.com):
   - Go to **Developers** → **API Keys**
   - Copy your **Secret Key** (starts with `sk_test_` for testing or `sk_live_` for production)
   - Go to **Webhooks** and add endpoint pointing to: `https://<project-ref>.supabase.co/functions/v1/stripe/stripe-webhook`
   - Select the 5 events listed above
   - Copy the **Signing Secret** (starts with `whsec_`)

2. In [Supabase Dashboard](https://supabase.com/dashboard):
   - Go to **Project Settings** → **Edge Functions** → **Secrets**
   - Add/update these two secrets:
     - `STRIPE_SECRET_KEY` = `sk_test_xxxxx` (from Stripe API Keys)
     - `STRIPE_WEBHOOK_SECRET` = `whsec_xxxxx` (from Stripe Webhooks)
   - Click **Save**

3. Test the integration:
   - Go to your practitioner dashboard → Settings → Memberships
   - Click **Activate Membership**
   - You should be redirected to Stripe checkout
   - Use test card: `4242 4242 4242 4242` | Any future date | Any CVC
   - Complete checkout
   - Verify subscription created in Supabase: `SELECT * FROM memberships WHERE stripe_customer_id IS NOT NULL`

4. Verify webhook is firing:
   - In Stripe Dashboard → Webhooks → Your endpoint
   - Click **Events** tab
   - Should see recent events (subscription.created, etc.)
   - Each should show "success" status

## Environment Variables Reference

| Variable | Source | Format |
|----------|--------|--------|
| STRIPE_SECRET_KEY | Stripe Dashboard → API Keys | `sk_test_xxxxx` or `sk_live_xxxxx` |
| STRIPE_WEBHOOK_SECRET | Stripe Dashboard → Webhooks | `whsec_xxxxx` |
| SUPABASE_URL | Project Settings → Configuration | `https://xxxxx.supabase.co` |
| SUPABASE_SERVICE_ROLE_KEY | Project Settings → API Keys | Service role key (auto-injected) |

## Troubleshooting

### Functions not deploying
- **Dashboard method:** Check function was created (shows in Edge Functions list)
- **CLI method:** Check Supabase CLI is authenticated: `npx @supabase/cli status`
- Ensure you're in the correct project directory (rooted-vitality/)
- Check for TypeScript errors in the function files
- Ensure Node.js v18+ is installed: `node --version`

### Webhooks not firing
- Verify webhook URL is correct and accessible
- Check webhook signature secret matches in Stripe dashboard and Supabase
- Look at Stripe dashboard → Webhooks → Event log for failed requests
- Check Supabase function logs for errors

### Tests failing
- Ensure STRIPE_SECRET_KEY is set (TEST key for development)
- Verify Supabase Service Role Key has permissions
- Check function logs: `npx @supabase/cli functions logs stripe/function-name`

## Local Testing

**Dashboard method:** Functions are live immediately after deployment. Test via cURL or browser.

**CLI method:** Run functions locally before deploying:
```bash
npx @supabase/cli start
npx @supabase/cli functions serve
```

Then test with:
```bash
curl -i --request POST 'http://localhost:54321/functions/v1/stripe/create-checkout-session' \
  --header 'Authorization: Bearer TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"practitioner_id":"test-uuid"}'
```

## Security Notes

- Never commit Stripe keys to git
- Always use environment variables (set in Supabase dashboard, not in code)
- Webhook signing verifies requests come from Stripe
- Edge Functions run with Service Role permissions (verify practitioner_id matches auth)
- All functions validate input before processing

## Monitoring

Monitor function performance in Supabase Dashboard:
- Edge Functions → Function Metrics
- View logs, execution time, errors
- Set up alerts for high error rates

## Next Steps

**Before Stripe Account Access:**
1. All 5 functions are deployed and live
2. Database schema updated with stripe columns
3. Frontend UI ready in settings page
4. Awaiting Stripe API credentials

**After Stripe Account Access:**
1. Follow "Final Step: Add Stripe Secrets and Activate" above
2. Test end-to-end with test Stripe keys
3. Verify webhooks firing and database updating
4. When ready for production: Switch to live Stripe keys (no redeployment needed)
