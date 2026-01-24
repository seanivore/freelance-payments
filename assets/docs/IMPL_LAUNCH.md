# Launch Implementation Guide

**Created**: 2026-01-24  
**Status**: Pre-Launch  
**Current Branch**: `freelance-payments` (test/dev)  
**Target Branch**: `main` (production)

---

## Executive Summary

This document outlines the steps to take the payments platform from test mode to production. The platform is currently running on the `freelance-payments` branch with Stripe test keys. Going live requires switching to Stripe live keys and ensuring all configurations point to production.

---

## Pre-Launch Checklist

### 1. Final Testing with Friends

**Test Card**: `4242 4242 4242 4242` (any future expiry, any CVC)

**Create Test Jobs**:
- [ ] Create 2-3 test jobs for friends
- [ ] Provide them login credentials and test card
- [ ] Have them complete full flow (contract → invoice → payment1 → balance → payment2)
- [ ] Collect feedback on UX issues

**Self-Testing**:
- [ ] Complete full flow on mobile (record screen)
- [ ] Complete full flow on desktop (record screen)
- [ ] Save recordings for portfolio/documentation

**Verify**:
- [ ] All events trigger correctly
- [ ] JSON updates properly
- [ ] Routing works at each step
- [ ] PDFs display correctly
- [ ] Stripe checkout works smoothly

---

### 2. Stripe Configuration

#### Current (Test Mode)
- `STRIPE_SECRET_KEY`: `sk_test_...`
- `VITE_STRIPE_PUBLISHABLE_KEY`: `pk_test_...`
- Webhook endpoint: Test mode

#### Production (Live Mode)
- [ ] Get live keys from Stripe Dashboard → Developers → API Keys
- [ ] `STRIPE_SECRET_KEY`: `sk_live_...`
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY`: `pk_live_...`

#### Webhook Setup
- [ ] Create new webhook endpoint in Stripe Dashboard (Live mode)
- [ ] Endpoint URL: `https://freelance-payments-neon.vercel.app/api/webhook`
- [ ] Events to listen for: `checkout.session.completed`
- [ ] Get new webhook signing secret: `whsec_...`
- [ ] Update `STRIPE_WEBHOOK_SECRET` in Vercel

---

### 3. Environment Variables

#### Vercel Dashboard Updates

**Navigate to**: Vercel → Project → Settings → Environment Variables

| Variable | Test Value | Production Value |
|----------|------------|------------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_test_...` | `whsec_live_...` |
| `GITHUB_TOKEN` | (same) | (same) |
| `GOOGLE_CREDENTIALS` | (same) | (same) |

**Important**: Set production variables for "Production" environment only, keep test variables for "Preview" and "Development".

---

### 4. Domain Configuration

#### Current Setup
- **Frontend (GitHub Pages)**: `payments.august.style` → CNAME points to GitHub Pages
- **Backend (Vercel)**: `freelance-payments-neon.vercel.app` → API endpoints

#### Verify DNS
- [ ] `payments.august.style` resolves to GitHub Pages
- [ ] HTTPS certificate is valid
- [ ] API calls from frontend reach Vercel backend

#### CORS Configuration
**File**: `vercel.json`

Currently allows:
```json
"Access-Control-Allow-Origin": "https://payments.august.style"
```

This is correct for production. No changes needed.

---

### 5. Branch Strategy for Launch

#### Option A: Keep Current Branch (Simpler)
- Keep `freelance-payments` as the main branch
- Just update environment variables
- No code changes needed

#### Option B: Merge to `main` (Cleaner)
- Create PR from `freelance-payments` → `main`
- Update workflow files to use `main` branch
- Update Vercel to deploy from `main`

**Recommendation**: Option A for now. The branch name doesn't affect functionality.

---

### 6. Files That Reference Branch Name

If you decide to rename/change branches, update these files:

| File | Line | Current Value |
|------|------|---------------|
| `.github/workflows/admin-push.yml` | 15 | `- freelance-payments` |
| `.github/workflows/admin-push.yml` | 19 | `freelance-payments-workflows-${{ github.ref }}` |
| `.github/workflows/user-exit-events.yml` | 39 | `ref: freelance-payments` |
| `.github/workflows/user-exit-events.yml` | 72-76 | Multiple references |
| `.github/workflows/user-exit-events.yml` | 105 | `git push origin freelance-payments` |

---

### 7. Go-Live Steps

#### Day Before Launch
1. [ ] Complete all friend testing
2. [ ] Fix any issues found
3. [ ] Create final test job for yourself
4. [ ] Run through complete flow one more time

#### Launch Day
1. [ ] **Stripe**: Switch to live mode in Stripe Dashboard
2. [ ] **Vercel**: Update environment variables to live keys
3. [ ] **Webhook**: Create live webhook, update secret in Vercel
4. [ ] **Redeploy**: Trigger a new deployment in Vercel
5. [ ] **Test**: Create a real job, make a small real payment ($1 test)
6. [ ] **Verify**: Check Stripe Dashboard for live payment
7. [ ] **Refund**: Refund test payment if needed

#### Post-Launch
1. [ ] Monitor first real client payment
2. [ ] Check workflow runs complete successfully
3. [ ] Verify emails send (when implemented)
4. [ ] Archive test jobs (delete JSON files)

---

### 8. Rollback Plan

If something goes wrong:

1. **Stripe**: Switch back to test mode in Dashboard
2. **Vercel**: Revert environment variables to test keys
3. **Redeploy**: Trigger new deployment
4. **Investigate**: Check logs, fix issue
5. **Retry**: Go through launch steps again

---

### 9. Test Jobs to Archive

Before going live, delete or archive these test job files:

```
assets/jobs/uid-yvc-829.json  (Dewey - nerd-dates)
assets/jobs/uid-fuk-259.json  (Keegan - rodent-fight-club)
assets/jobs/uid-pqu-327.json  (Elsworth - houseplant-boutique)
assets/jobs/uid-ugz-557.json  (if test)
```

Also clean up test PDFs in:
```
assets/pdf/contract/
assets/pdf/invoice/
assets/pdf/balance/
```

---

### 10. First Real Client

For your actual client:

1. [ ] Create real job JSON with accurate data
2. [ ] Push to trigger `admin-push.yml`
3. [ ] Verify Stripe products created (live mode)
4. [ ] Verify PDFs generated
5. [ ] Send client login credentials
6. [ ] Monitor their progress through the flow

---

## Quick Reference

### Stripe Test Card
```
Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### Key URLs
- **Frontend**: https://payments.august.style
- **Backend API**: https://freelance-payments-neon.vercel.app
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Vercel Dashboard**: https://vercel.com/seanivores-projects/freelance-payments
- **GitHub Repo**: https://github.com/seanivore/freelance-payments

### Environment Variable Locations
- **Vercel**: Project Settings → Environment Variables
- **GitHub**: Repository Settings → Secrets and Variables → Actions

---

_This document will be updated as launch preparations progress._
