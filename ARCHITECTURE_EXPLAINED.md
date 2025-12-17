# Architecture Explained 🏗️

## Two Different Hosts, Two Different Purposes

### 1. GitHub Pages (`payments.august.style`) - FRONTEND
**What it hosts:**
- All your HTML files (`index.html`, `contract.html`, `invoice.html`, `checkout.html`)
- All your JavaScript (`assets/js/*.js`)
- All your CSS (`assets/css/styles.css`)
- All your static assets (images, fonts, etc.)

**What users see:**
- Users visit `payments.august.style`
- They see the lookup form, contract, invoice, checkout page
- This is the **public-facing website**

### 2. Vercel (`freelance-payments-neon.vercel.app`) - BACKEND API
**What it hosts:**
- Serverless functions in `api/` directory:
  - `/api/create-payment-intent` - Creates Stripe PaymentIntent
  - `/api/sign-contract` - Updates contract signed status
  - `/api/update-payment` - Updates payment status
  - `/api/webhook` - Receives Stripe webhooks

**What it does:**
- Handles secure operations (can't expose Stripe secret keys)
- Processes payments
- Updates JSON files via GitHub Actions
- Receives webhooks from Stripe

**Users DON'T visit this directly** - it's an API backend

---

## How They Work Together

```
User visits: payments.august.style
     ↓
Frontend (GitHub Pages) loads HTML/JS
     ↓
User fills out lookup form
     ↓
Frontend calls: freelance-payments-neon.vercel.app/api/create-payment-intent
     ↓
Vercel function creates PaymentIntent
     ↓
Returns client_secret to frontend
     ↓
Frontend shows Stripe Payment Element
     ↓
User completes payment
     ↓
Stripe sends webhook to: freelance-payments-neon.vercel.app/api/webhook
     ↓
Vercel function updates JSON via GitHub Actions
```

---

## What You Need to Do

### 1. Set Up GitHub Pages ✅ (Do This First!)

1. Go to: https://github.com/seanivore/freelance-payments/settings/pages
2. Under "Source":
   - Select branch: `freelance-payments`
   - Select folder: `/ (root)`
3. Click "Save"
4. Wait a few minutes for GitHub Pages to build
5. Your site will be at: `https://seanivore.github.io/freelance-payments/`
6. Then add custom domain: `payments.august.style` (in same settings page)

### 2. Update Frontend to Point to Vercel API

The frontend needs to know where the API is. Update `checkout-controller.js`:

**Current (line ~57):**
```javascript
const serverlessEndpoint = '/api/create-payment-intent';
```

**Change to:**
```javascript
const serverlessEndpoint = 'https://freelance-payments-neon.vercel.app/api/create-payment-intent';
```

**Also update in:**
- `contract-controller.js` - if it calls `/api/sign-contract`
- Any other places that call API endpoints

### 3. Webhook URL

The webhook URL (`https://freelance-payments-neon.vercel.app/api/webhook`) is correct - this is where Stripe sends events. Users never see this URL.

---

## Summary

| Component       | Host         | URL                                              | Purpose                             |
|-----------------|--------------|--------------------------------------------------|-------------------------------------|
| **Frontend**    | GitHub Pages | `payments.august.style`                          | What users see and interact with    |
| **Backend API** | Vercel       | `freelance-payments-neon.vercel.app`             | Handles secure operations, payments |
| **Webhook**     | Vercel       | `freelance-payments-neon.vercel.app/api/webhook` | Receives Stripe events              |

**Users only visit:** `payments.august.style`  
**Frontend calls:** `freelance-payments-neon.vercel.app/api/*`  
**Stripe calls:** `freelance-payments-neon.vercel.app/api/webhook`

---

## Next Steps

1. ✅ Set up GitHub Pages (enable it in repo settings)
2. ✅ Update frontend API endpoints to point to Vercel URL
3. ✅ Add Stripe publishable key to frontend
4. ✅ Test the full flow

The Vercel URL is your backend - users never see it, but your frontend needs to call it!
