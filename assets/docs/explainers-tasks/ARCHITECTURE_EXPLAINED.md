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

### 1. Set Up GitHub Pages **DONE** ✅ 
  - Site at: `https://seanivore.github.io/freelance-payments/`
  - Has custom domain: `https://payments.august.style`

### 2. Update Frontend to Point to Vercel API **DONE** ✅
  - Line 59 in `checkout-controller.js` updated to: 
  `const serverlessEndpoint = 'https://freelance-payments-neon.vercel.app/api/create-payment-intent';`
  - Line 215 in `checkout-controller.js` updated to:
  `const response = await fetch('https://freelance-payments-neon.vercel.app/api/sign-contract', {`

### 3. Webhook URL **DONE** ✅
  - The webhook URL (`https://freelance-payments-neon.vercel.app/api/webhook`) is correct 
  This is where Stripe sends events. Users never see this URL.

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

## Completed Steps

1. ✅ Set up GitHub Pages (enable it in repo settings) **DONE** ✅
2. ✅ Update frontend API endpoints to point to Vercel URL **DONE** ✅
3. ✅ Webhook URL **DONE** ✅
