# Phase 2 Setup Complete! 🎉

All code is ready. Here's what you need to do to get it running:

## ✅ What's Been Created

### GitHub Actions
- ✅ `.github/workflows/process-job.yml` - Main workflow
- ✅ `.github/scripts/process_stripe_products.py` - Stripe catalog updater

### Vercel Serverless Functions
- ✅ `api/create-payment-intent.js` - Creates PaymentIntent
- ✅ `api/sign-contract.js` - Updates contract signed status
- ✅ `api/update-payment.js` - Updates payment status
- ✅ `api/webhook.js` - Stripe webhook handler
- ✅ `vercel.json` - Vercel configuration

### Test Files
- ✅ 8 test JSON files covering edge cases
- ✅ `TEST_JOBS_README.md` - Test documentation

### Documentation
- ✅ `VERCEL_SETUP.md` - Complete Vercel setup guide
- ✅ `WORKFLOW_ARCHITECTURE.md` - Full workflow explanation

---

## 🚀 Setup Steps

### 1. GitHub Secrets

Go to: `https://github.com/seanivore/freelance-payments/settings/secrets/actions`

Add:
- `STRIPE_SECRET_KEY` - Your Stripe secret key (test mode: `sk_test_...`)

### 2. Vercel Setup

Follow `VERCEL_SETUP.md` for complete instructions. Quick version:

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
cd /Users/seanivore/Development/freelance-payments
vercel login
vercel link
```

### 3. Vercel Environment Variables

Add these in Vercel Dashboard (or via CLI):

**Required:**
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - (Get after webhook setup)
- `GITHUB_TOKEN` - Personal access token with `repo` + `workflow` permissions
- `GITHUB_REPO_OWNER` - `seanivore`
- `GITHUB_REPO_NAME` - `freelance-payments`

### 4. Deploy to Vercel

```bash
vercel --prod
```

### 5. Get Webhook URL

After deployment, your webhook URL will be:
```
https://your-project.vercel.app/api/webhook
```

### 6. Configure Stripe Webhook

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-project.vercel.app/api/webhook`
4. Select events:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed` (optional)
5. Click "Add endpoint"
6. **Copy the "Signing secret"** (starts with `whsec_...`)
7. Add to Vercel as `STRIPE_WEBHOOK_SECRET`

### 7. Update Frontend Stripe Key

**Option A: Add to checkout page directly** (quick test)
Edit `assets/js/checkout-controller.js`:
```javascript
const publishableKey = 'pk_test_YOUR_ACTUAL_KEY';
```

**Option B: Use environment/config** (production)
Create `assets/js/config.js`:
```javascript
window.STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_ACTUAL_KEY';
```

Then in `checkout.html`:
```html
<script src="/assets/js/config.js"></script>
<script src="/assets/js/checkout-controller.js"></script>
```

### 8. Update Workflow Branch Name

Edit `.github/workflows/process-job.yml`:
- Change `freelance-payments` to your actual branch name (if different)

Also update in:
- `api/sign-contract.js` (line with `ref:`)
- `api/update-payment.js` (line with `ref:`)

---

## 🧪 Testing

### Test 1: Push Test JSON File

1. Push one of the test JSON files to GitHub
2. Check GitHub Actions - should run workflow
3. Check Stripe Dashboard - should see new Products
4. Check JSON file - should have Stripe IDs added

### Test 2: Payment Flow

1. Visit your site: `https://your-project.vercel.app`
2. Enter test lookup: Last Name `Single`, Keyword `single-payment-test`
3. Should route to contract page
4. Sign contract (will call `/api/sign-contract`)
5. Should route to invoice
6. Click "Pay Now" → Stripe checkout
7. Use test card: `4242 4242 4242 4242`
8. Complete payment
9. Webhook should trigger → Update JSON → Route to completion

### Test 3: Edge Cases

Test all 8 test JSON files:
- Single payment
- Multi-payment
- Already signed
- Partially paid
- All paid
- Special characters
- Long descriptions
- Four payments

---

## 🔍 Troubleshooting

### GitHub Actions Not Running
- Check branch name matches workflow
- Verify `STRIPE_SECRET_KEY` secret exists
- Check workflow file path: `.github/workflows/process-job.yml`

### Vercel Functions Not Working
- Check environment variables are set
- Check function logs: `vercel logs`
- Verify Stripe keys are correct

### Webhook Not Receiving Events
- Verify webhook URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Test webhook in Stripe Dashboard → "Send test webhook"

### Payment Intent Creation Fails
- Check Stripe secret key is correct
- Verify `price_id` exists in Stripe
- Check Vercel function logs for errors

---

## 📝 Next Steps After Setup

1. ✅ Test with all 8 test JSON files
2. ✅ Verify Stripe products created correctly
3. ✅ Test payment flow end-to-end
4. ✅ Test contract signing flow
5. ✅ Test webhook updates
6. ✅ Test edge cases (special chars, long descriptions)
7. ✅ Clean up test files before production use

---

## 🎯 Key Files Reference

- **Workflow**: `.github/workflows/process-job.yml`
- **Stripe Script**: `.github/scripts/process_stripe_products.py`
- **Vercel Config**: `vercel.json`
- **Setup Guide**: `VERCEL_SETUP.md`
- **Architecture**: `WORKFLOW_ARCHITECTURE.md`
- **Test Guide**: `TEST_JOBS_README.md`

---

**Status**: All code complete! Ready for deployment and testing. 🚀
