# Development Environment Implementation Guide

**Created**: 2026-01-24  
**Updated**: 2026-01-24  
**Status**: Planning  

---

## Executive Summary

This document outlines how to set up a completely separate development environment using a duplicate repository. This approach ensures the dev environment has the **exact same deployment pipeline** as production (GitHub Pages + Vercel + GitHub Actions), eliminating "works on my branch" surprises.

**Why duplicate repos instead of branches?**
- GitHub Pages only serves one site per repo
- The bugs we fixed were specifically about GH Pages ↔ Vercel ↔ Actions interactions
- A branch with different deployment wouldn't catch those issues
- Complete isolation protects real client data

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION ENVIRONMENT                        │
│                                                                  │
│  Repo: freelance-payments                                        │
│  Frontend: payments.august.style (GitHub Pages)                  │
│  Backend: freelance-payments-neon.vercel.app (Vercel)           │
│  Stripe: Live keys (sk_live_*, pk_live_*)                       │
│  Data: Real client JSON files                                    │
│                                                                  │
│  ⚠️  ONLY receives tested, stable code                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   DEVELOPMENT ENVIRONMENT                        │
│                                                                  │
│  Repo: freelance-payments-dev                                    │
│  Frontend: dev.payments.august.style (GitHub Pages)              │
│  Backend: freelance-payments-dev.vercel.app (Vercel)            │
│  Stripe: Test keys (sk_test_*, pk_test_*)                       │
│  Data: Test JSON files only                                      │
│                                                                  │
│  ✅ Where all development and testing happens                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Initial Setup (One Time)

### Step 1: Create Development Repository

**On GitHub**:
1. Go to https://github.com/new
2. Repository name: `freelance-payments-dev`
3. Keep it private (test data, but no secrets)
4. Don't initialize with README (we'll push existing code)

**Locally**:
```bash
# Navigate to parent directory
cd ~/Development

# Clone production repo as starting point
git clone https://github.com/seanivore/freelance-payments.git freelance-payments-dev
cd freelance-payments-dev

# Change remote to new dev repo
git remote set-url origin https://github.com/seanivore/freelance-payments-dev.git

# Verify remote
git remote -v
# Should show: origin  https://github.com/seanivore/freelance-payments-dev.git
```

---

### Step 2: Update Dev Repo Configuration

#### 2.1 Update CNAME for Dev Domain

**File**: `CNAME`
```
dev.payments.august.style
```

#### 2.2 Update Vercel CORS Configuration

**File**: `vercel.json`

Change the CORS origin to dev domain:
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://dev.payments.august.style"
        },
        ...
      ]
    }
  ]
}
```

#### 2.3 Update Return URLs in Templates/Code

Search and replace `payments.august.style` → `dev.payments.august.style` in:
- Email templates (if any)
- Any hardcoded URLs in documentation

**Note**: The JSON files have return URLs, but those are generated per-job by `admin-push.yml`, so they'll automatically use whatever domain is configured.

#### 2.4 Update API Base URL

**File**: `src/lib/api.ts`

Update to point to dev Vercel:
```typescript
const getApiBaseUrl = (): string => {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_BASE_URL || 'https://freelance-payments-dev.vercel.app';
  } else {
    return import.meta.env.VITE_API_BASE_URL || 'https://freelance-payments-dev.vercel.app';
  }
};
```

---

### Step 3: Clean Up Dev Repo

#### 3.1 Remove Production Client Data

```bash
# Remove real client JSON files
rm assets/jobs/uid-*.json

# Remove generated PDFs
rm -rf assets/pdf/contract/*
rm -rf assets/pdf/invoice/*
rm -rf assets/pdf/balance/*

# Remove manifest (will be regenerated)
rm assets/js/manifest.json
```

#### 3.2 Create Fresh Test JSON Files

Create new test jobs for development. You can copy the template structure from `assets/docs/uid-xxx-xxx.json` or use one of the test files as a starting point.

---

### Step 4: Set Up DNS for Dev Domain

**At your domain registrar** (wherever august.style DNS is managed):

```
Type: CNAME
Name: dev.payments
Value: seanivore.github.io
TTL: 3600 (or default)
```

**Verify** (after DNS propagates, ~15 min to 24 hours):
```bash
dig dev.payments.august.style
# Should show CNAME to seanivore.github.io
```

---

### Step 5: Set Up GitHub Pages for Dev Repo

1. Go to: https://github.com/seanivore/freelance-payments-dev/settings/pages
2. Source: Deploy from a branch
3. Branch: `freelance-payments` (or `main` if you rename it)
4. Folder: `/ (root)`
5. Custom domain: `dev.payments.august.style`
6. Enforce HTTPS: ✅

---

### Step 6: Create Vercel Project for Dev

1. Go to: https://vercel.com/new
2. Import `freelance-payments-dev` repository
3. Project name: `freelance-payments-dev`
4. Framework: Vite
5. Build command: `npm run build`
6. Output directory: `.` (root)

**Environment Variables** (Settings → Environment Variables):

| Variable | Value | Environment |
|----------|-------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | All |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | All |
| `STRIPE_WEBHOOK_SECRET` | `whsec_test_...` | All |
| `GITHUB_TOKEN` | (your PAT) | All |
| `GOOGLE_CREDENTIALS` | (same as prod) | All |

---

### Step 7: Create Stripe Webhook for Dev

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Add endpoint
3. Endpoint URL: `https://freelance-payments-dev.vercel.app/api/webhook`
4. Events: `checkout.session.completed`
5. Copy signing secret → Add to Vercel as `STRIPE_WEBHOOK_SECRET`

---

### Step 8: Add GitHub Secrets for Dev Repo

Go to: https://github.com/seanivore/freelance-payments-dev/settings/secrets/actions

Add the same secrets as production, but with test values:

| Secret | Value |
|--------|-------|
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `GOOGLE_CREDENTIALS` | (same JSON as prod) |
| `GOOGLE_DRIVE_FOLDER_ID` | (same as prod, or create test folder) |

---

### Step 9: Push and Verify

```bash
cd ~/Development/freelance-payments-dev

# Commit all changes
git add .
git commit -m "Configure for dev environment"

# Push to dev repo
git push -u origin freelance-payments

# Or if using main branch:
# git branch -M main
# git push -u origin main
```

**Verify**:
- [ ] GitHub Pages deploys to `dev.payments.august.style`
- [ ] Vercel deploys to `freelance-payments-dev.vercel.app`
- [ ] Create a test job, push, verify `admin-push.yml` runs
- [ ] Login to test job, verify full flow works

---

## Development Workflow

### Daily Development

```bash
cd ~/Development/freelance-payments-dev

# Make changes
# ... edit files ...

# Test locally
npm run dev

# Push to dev
git add .
git commit -m "Add feature X"
git push

# Test on dev.payments.august.style
# Verify workflows run correctly
# Test full user flow
```

### When Feature is Ready for Production

See "Promoting to Production" section below.

---

## Promoting to Production

This is NOT a git merge. It's a **controlled file copy** that preserves production client data.

### Pre-Promotion Checklist

- [ ] Feature fully tested on dev environment
- [ ] All workflows run successfully
- [ ] Full user flow tested (login → contract → invoice → payment1 → balance → payment2)
- [ ] No console errors
- [ ] Mobile and desktop tested

### Promotion Process

#### Step 1: Prepare Production Repo

```bash
cd ~/Development/freelance-payments

# Make sure we're up to date
git pull origin freelance-payments

# Create backup branch (just in case)
git checkout -b backup-before-v6-$(date +%Y%m%d)
git push origin backup-before-v6-$(date +%Y%m%d)

# Return to main branch
git checkout freelance-payments
```

#### Step 2: Copy Code Files from Dev

```bash
# From production repo directory
cd ~/Development/freelance-payments

# Remove old code files (NOT data files)
rm -rf src/
rm -rf api/
rm -rf .github/

# Copy new code from dev
cp -r ../freelance-payments-dev/src ./
cp -r ../freelance-payments-dev/api ./
cp -r ../freelance-payments-dev/.github ./

# Copy updated config files
cp ../freelance-payments-dev/package.json ./
cp ../freelance-payments-dev/package-lock.json ./
cp ../freelance-payments-dev/vite.config.ts ./
cp ../freelance-payments-dev/tsconfig.json ./
cp ../freelance-payments-dev/tsconfig.node.json ./
cp ../freelance-payments-dev/tailwind.config.js ./
cp ../freelance-payments-dev/postcss.config.js ./

# Copy updated templates (if changed)
cp -r ../freelance-payments-dev/assets/templates ./assets/

# Copy updated docs (optional, for reference)
cp -r ../freelance-payments-dev/assets/docs ./assets/
```

#### Step 3: Restore Production-Specific Files

```bash
# These should NOT have been overwritten, but verify:

# CNAME should still be production domain
cat CNAME
# Should show: payments.august.style

# If overwritten, fix it:
echo "payments.august.style" > CNAME
```

#### Step 4: Update Production-Specific Configuration

**File**: `vercel.json` — Verify CORS is production domain:
```json
"Access-Control-Allow-Origin": "https://payments.august.style"
```

**File**: `src/lib/api.ts` — Verify API URL is production:
```typescript
return 'https://freelance-payments-neon.vercel.app';
```

#### Step 5: Install Dependencies and Test Build

```bash
# Install any new dependencies
npm install

# Test build locally
npm run build

# If build fails, fix issues before pushing
```

#### Step 6: Commit and Push

```bash
git add .
git commit -m "Promote v6.x.x from dev - [feature description]"
git push origin freelance-payments
```

#### Step 7: Verify Production Deployment

- [ ] GitHub Actions `admin-push.yml` runs successfully
- [ ] GitHub Pages deploys
- [ ] Vercel deploys
- [ ] Test with existing client job (just login, don't make changes)
- [ ] Verify no console errors

---

## Files Reference

### Files to COPY (Dev → Prod)

These are code/config files that should be identical:

```
src/                      # All frontend code
api/                      # All backend code
.github/                  # Workflows and scripts
assets/templates/         # PDF templates
assets/docs/              # Documentation (optional)
package.json              # Dependencies
package-lock.json         # Dependency lock
vite.config.ts            # Vite config
tsconfig.json             # TypeScript config
tsconfig.node.json        # TypeScript node config
tailwind.config.js        # Tailwind config
postcss.config.js         # PostCSS config
index.html                # Entry HTML
job.html                  # Job page HTML
404.html                  # SPA routing HTML
```

### Files to NEVER COPY (Keep Production Versions)

These are environment-specific or contain real data:

```
CNAME                     # Different domain per environment
vercel.json               # Different CORS per environment (verify after copy)
src/lib/api.ts            # Different API URL per environment (verify after copy)
.env                      # Local env (not committed anyway)
.env.local                # Local env (not committed anyway)
assets/jobs/*.json        # Real client data in prod, test data in dev
assets/pdf/**             # Generated PDFs (client-specific)
assets/js/manifest.json   # Auto-generated from jobs
```

### Files That Need Manual Verification After Copy

```
vercel.json               # Check CORS origin is correct for environment
src/lib/api.ts            # Check API base URL is correct for environment
```

---

## Rollback Procedure

If something goes wrong after promoting to production:

```bash
cd ~/Development/freelance-payments

# Find your backup branch
git branch -a | grep backup

# Reset to backup
git checkout freelance-payments
git reset --hard backup-before-v6-YYYYMMDD

# Force push (careful!)
git push --force origin freelance-payments
```

**Or** if you didn't create a backup branch:

```bash
# Find the commit before the promotion
git log --oneline

# Reset to that commit
git reset --hard <commit-hash>

# Force push
git push --force origin freelance-payments
```

---

## Maintenance

### Keeping Dev in Sync

After promoting to production, dev should start from the same state:

```bash
cd ~/Development/freelance-payments-dev

# Pull any hotfixes that went directly to prod (rare)
# Or just continue developing from where you left off

# If you need to reset dev to match prod:
rm -rf src/ api/ .github/
cp -r ../freelance-payments/src ./
cp -r ../freelance-payments/api ./
cp -r ../freelance-payments/.github ./
# Then restore dev-specific config (CNAME, vercel.json CORS, api.ts URL)
```

### Test Data Management

Periodically clean up old test jobs in dev:

```bash
cd ~/Development/freelance-payments-dev

# List test jobs
ls assets/jobs/

# Remove completed test jobs
rm assets/jobs/uid-old-test.json
rm assets/pdf/contract/kon-old-test.pdf
# etc.

# Commit cleanup
git add .
git commit -m "Clean up old test data"
git push
```

---

## Quick Reference

### URLs

| Environment | Frontend | Backend |
|-------------|----------|---------|
| Production | https://payments.august.style | https://freelance-payments-neon.vercel.app |
| Development | https://dev.payments.august.style | https://freelance-payments-dev.vercel.app |

### Repos

| Environment | Repository |
|-------------|------------|
| Production | https://github.com/seanivore/freelance-payments |
| Development | https://github.com/seanivore/freelance-payments-dev |

### Stripe

| Environment | Mode | Dashboard |
|-------------|------|-----------|
| Production | Live | https://dashboard.stripe.com |
| Development | Test | https://dashboard.stripe.com/test |

### Test Card

```
Number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

---

## Checklist: Initial Dev Setup

- [ ] Create `freelance-payments-dev` repo on GitHub
- [ ] Clone production repo locally as `freelance-payments-dev`
- [ ] Change git remote to dev repo
- [ ] Update `CNAME` to `dev.payments.august.style`
- [ ] Update `vercel.json` CORS to dev domain
- [ ] Update `src/lib/api.ts` to dev Vercel URL
- [ ] Remove production JSON files and PDFs
- [ ] Create test JSON files
- [ ] Set up DNS for `dev.payments.august.style`
- [ ] Enable GitHub Pages for dev repo
- [ ] Create Vercel project for dev repo
- [ ] Add environment variables to Vercel
- [ ] Create Stripe test webhook
- [ ] Add GitHub secrets to dev repo
- [ ] Push and verify full deployment
- [ ] Test complete user flow on dev

---

_This document ensures development happens in a fully isolated environment that mirrors production exactly, eliminating deployment-related bugs before they reach real clients._
