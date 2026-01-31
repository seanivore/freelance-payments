# Go Live and Development Environment Setup

**Created**: 2026-01-28  
**Status**: Implementation Ready  
**Sequence**: Dev Setup First → Live Transition Second

---

## Executive Summary

This document provides a complete, sequential guide for:
1. Setting up a duplicate development repository with identical deployment pipeline
2. Transitioning the current repository to live production
3. Establishing a repeatable workflow for promoting updates from dev to live

**Why duplicate repos instead of branches?**
- GitHub Pages only serves one site per repo
- The bugs we fixed were specifically about GH Pages ↔ Vercel ↔ Actions interactions
- A branch with different deployment wouldn't catch those issues
- Complete isolation protects real client data

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION ENVIRONMENT                       │
│                                                                 │
│  Repo: freelance-payments                                       │
│  Branch: freelance-payments                                     │
│  Frontend: payments.august.style (GitHub Pages)                 │
│  Backend: freelance-payments-neon.vercel.app (Vercel)           │
│  Stripe: Live keys (sk_live_*, pk_live_*)                       │
│  Data: Real client JSON files                                   │
│                                                                 │
│  ⚠️  ONLY receives tested, stable code                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   DEVELOPMENT ENVIRONMENT                        │
│                                                                  │
│  Repo: freelance-payments-dev                                    │
│  Branch: freelance-payments (intentionally same as prod)         │
│  Frontend: dev.payments.august.style (GitHub Pages)              │
│  Backend: freelance-payments-dev.vercel.app (Vercel)            │
│  Stripe: Test keys (sk_test_*, pk_test_*)                       │
│  Data: Test JSON files only                                      │
│                                                                  │
│  ✅ Where all development and testing happens                    │
└─────────────────────────────────────────────────────────────────┘
```

> **Note on Branch Naming**: Both repos use `freelance-payments` as the main branch name. This is intentional — it minimizes configuration differences and reduces the chance of bugs during updates. This deviates from the typical pattern of matching branch name to repo name.

---

## Quick Reference

### URLs

| Environment | Frontend                          | Backend                                     |
|-------------|-----------------------------------|---------------------------------------------|
| Production  | https://payments.august.style     | https://freelance-payments-neon.vercel.app  |
| Development | https://dev.payments.august.style | https://freelance-payments-dev.vercel.app   |


### Repositories

| Environment | Repository                                          |
|-------------|-----------------------------------------------------|
| Production  | https://github.com/seanivore/freelance-payments     |
| Development | https://github.com/seanivore/freelance-payments-dev |

### Stripe

| Environment | Mode | Dashboard                         |
|-------------|------|-----------------------------------|
| Production  | Live | https://dashboard.stripe.com      |
| Development | Test | https://dashboard.stripe.com/test |

### Test Card (Dev Only)

```
Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

---

# Part 1: Pre-Setup Cleanup -- DONE ✅

+ Removed obsolete files from the current repo. in `assets/js/...` and VSCode backup files.

---

# Part 2: Set Up Development Repository (Do First) -- DONE ✅

Complete this section before transitioning to live production.

## Step 1: Create Development Repository -- DONE ✅

**On GitHub**:
1. Go to https://github.com/new
2. Repository name: `freelance-payments-dev`
3. **Keep it PUBLIC** (required for GitHub Pages on free tier)
4. Don't initialize with README (we'll push existing code)

> ⚠️ **Why public?** GitHub Pages is only available for public repositories on the free tier. Private repos require GitHub Pro or higher. The dev repo won't contain secrets (those go in GitHub Secrets) and test data isn't sensitive.

**Locally**:
```bash
# Verify remote
git remote -v
# origin	https://github.com/seanivore/freelance-payments-dev.git (fetch)
# origin	https://github.com/seanivore/freelance-payments-dev.git (push)
```

---

## Step 2: Update Dev Repo Configuration -- DONE ✅

### 2.1 Update CNAME for Dev Domain -- DONE ✅

**File**: `CNAME`
```
dev.payments.august.style
```

### 2.2 Update Vercel CORS Configuration -- DONE ✅

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
        }
      ]
    }
  ]
}
```

### 2.3 Update API Base URL -- DONE ✅

**File**: `src/lib/api.ts`

```typescript
const getApiBaseUrl = (): string => {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_BASE_URL || 'https://freelance-payments-dev.vercel.app';
  } else {
    return import.meta.env.VITE_API_BASE_URL || 'https://freelance-payments-dev.vercel.app';
  }
};
```

### 2.4 Update Return URLs in Job Template -- DONE ✅

**File**: `assets/docs/uid-xxx-xxx.json`

Search and replace `payments.august.style` → `dev.payments.august.style` in the return URLs.

---

## Step 3: Clean Up Dev Repo -- DONE ✅

### 3.1 Remove Production Client Data -- DONE ✅

```bash
# Remove all job JSON files (we'll create fresh test jobs)
rm assets/jobs/uid-*.json

# Remove generated PDFs
rm -rf assets/pdf/contract/*.pdf
rm -rf assets/pdf/invoice/*.pdf
rm -rf assets/pdf/balance/*.pdf

# Remove manifest (will be regenerated)
rm assets/js/manifest.json
```

### 3.2 Set Up `test-job` Terminal Command -- DONE ✅

The existing `job` command is symlinked to the **live repo** and will always create jobs there. We need a separate `test-job` command for the dev repo.

**Create the symlink**:
```bash
ln -s ~/Development/freelance-payments-dev/assets/scripts/job.sh ~/bin/test-job
```

**Verify it works**:
```bash
which test-job
# Should show: /Users/seanivore/bin/test-job

test-job --help
# Should show the job creation options
```

> **How it works**: The `job.sh` script uses relative paths from its own location. So `job` (symlinked to live repo) creates jobs in the live repo, and `test-job` (symlinked to dev repo) creates jobs in the dev repo. Same script, different contexts.

### 3.3 Create Fresh Test JSON Files -- DONE ✅

Use the new `test-job` command to create test jobs in the dev repo:

```bash
test-job -p "Test Project" -nme "Test Client" -c 500.00 -d 50.00
```

Or copy the template manually from `assets/docs/uid-xxx-xxx.json`.

---

## Step 4: DNS for Dev Domain -- DONE ✅

**Status**: Already configured in Cloudflare

The DNS record should point:
```
Type: CNAME
Name: dev.payments
Value: seanivore.github.io
TTL: Auto
```

**Verify** (after DNS propagates):
```bash
dig dev.payments.august.style
# Should show CNAME to seanivore.github.io
```

---

## Step 5: Set Up GitHub Pages for Dev Repo -- DONE ✅

1. Go to: https://github.com/seanivore/freelance-payments-dev/settings/pages
2. **Source: GitHub Actions** (NOT "Deploy from a branch")
3. Custom domain: `dev.payments.august.style`
4. Enforce HTTPS: ✅

> ⚠️ **Why GitHub Actions?** The production repo uses `actions/upload-pages-artifact` and `actions/deploy-pages` in the workflows. This is the "GitHub Actions" source option, not branch-based deployment. Using the same method ensures identical behavior.

---

## Step 6: Create Vercel Project for Dev -- DONE ✅

1. Go to: https://vercel.com/new
2. Import `freelance-payments-dev` repository
3. Project name: `freelance-payments-dev`
4. Framework: Vite
5. Build command: `npm run build`
6. Output directory: `.` (root)

**Environment Variables** (Settings → Environment Variables):

| Variable                      | Value            | Environment |
|-------------------------------|------------------|-------------|
| `STRIPE_SECRET_KEY`           | `sk_test_...`    | All         |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...`    | All         |
| `STRIPE_WEBHOOK_SECRET`       | `whsec_test_...` | All         |
| `GITHUB_TOKEN`                | (your PAT)       | All         |
| `GOOGLE_CREDENTIALS`          | (same as prod)   | All         |

---

## Step 7: Create Stripe Webhook for Dev -- DONE ✅

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Add endpoint
3. Endpoint URL: `https://freelance-payments-dev.vercel.app/api/webhook`
4. Events: `checkout.session.completed`
5. Copy signing secret → Add to Vercel as `STRIPE_WEBHOOK_SECRET`

---

## Step 8: Add GitHub Secrets for Dev Repo -- DONE ✅

Go to: https://github.com/seanivore/freelance-payments-dev/settings/secrets/actions

| Secret                   | Value               |
|--------------------------|---------------------|
| `STRIPE_SECRET_KEY`      | `sk_test_...`       |
| `GOOGLE_CREDENTIALS`     | (same JSON as prod) |
| `GOOGLE_DRIVE_FOLDER_ID` | (same as prod)      |

---

## Step 9: Push and Verify -- DONE ✅

```bash
cd ~/Development/freelance-payments-dev

# Commit all changes
git add .
git commit -m "Configure for dev environment"

# Push to dev repo (using same branch name as prod)
git push -u origin freelance-payments
```

**Verification Checklist**:
- [x] GitHub Pages deploys to `dev.payments.august.style`
- [x] Vercel deploys to `freelance-payments-dev.vercel.app`
- [x] Create a test job, push, verify `admin-push.yml` runs
- [x] Login to test job, verify full flow works 
- [x] Complete payment with test card `4242 4242 4242 4242`

---

# Part 3: Transition to Live Production

Complete this AFTER the dev environment is fully working.

## Pre-Launch Testing -- DONE ✅

### Friend Testing
- [x] Create 2-3 test jobs for friends
- [x] Provide login credentials and test card
- [x] Have them complete full flow (contract → invoice → payment1 → balance → payment2)
- [x] Collect feedback on UX issues

### Self-Testing
- [x] Complete full flow on mobile (record screen)
- [x] Complete full flow on desktop (record screen)
- [x] Save recordings for portfolio/documentation

### Verify
- [x] All events trigger correctly
- [x] JSON updates properly
- [x] Routing works at each step
- [x] PDFs display correctly
- [x] Stripe checkout works smoothly

---

## Step 1: Switch Stripe to Live Mode -- DONE ✅

### Get Live Keys
1. Go to: https://dashboard.stripe.com/apikeys
2. Switch to Live mode (toggle at top)
3. Copy `Publishable key` (pk_live_...)
4. Reveal and copy `Secret key` (sk_live_...)

### Create Live Webhook
1. Go to: https://dashboard.stripe.com/webhooks (Live mode)
2. Add endpoint
3. Endpoint URL: `https://freelance-payments-neon.vercel.app/api/webhook`
4. Events: `checkout.session.completed`
5. Copy signing secret (whsec_...)

---

## Step 2: Update Vercel Environment Variables -- DONE ✅

**Navigate to**: Vercel → freelance-payments → Settings → Environment Variables

| Variable                      | Old (Test)       | New (Live)       |
|-------------------------------|------------------|------------------|
| `STRIPE_SECRET_KEY`           | `sk_test_...`    | `sk_live_...`    |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...`    | `pk_live_...`    |
| `STRIPE_WEBHOOK_SECRET`       | `whsec_test_...` | `whsec_live_...` |

**Important**: For the live repo, set these for ALL environments (Production, Preview, Development).

---

## Step 3: Clean Up Test Data from Live Repo -- DONE ✅

### Delete Test Jobs
```bash
cd ~/Development/freelance-payments

# Delete test job file
rm assets/jobs/uid-aqi-031.json

# Delete ALL test PDFs
rm assets/pdf/contract/*.pdf
rm assets/pdf/invoice/*.pdf
rm assets/pdf/balance/*.pdf

# Keep the .gitkeep files
touch assets/pdf/contract/.gitkeep
touch assets/pdf/invoice/.gitkeep
touch assets/pdf/balance/.gitkeep

# Reset manifest
echo '{"jobs":[]}' > assets/js/manifest.json
```

### Delete Version History (Live Repo Only) -- DONE ✅

These directories should only exist in the dev repo:

```bash
# Remove version history
rm -rf assets/docs/v1/
rm -rf assets/docs/v2/
rm -rf assets/docs/v3/
rm -rf assets/docs/v4/
rm -rf assets/docs/v5/
rm -rf assets/docs/RESOURCES/

# Remove implementation planning docs (keep only in dev)
rm assets/docs/IMPL_DEV_BRANCH.md
rm assets/docs/IMPL_LAUNCH.md
rm assets/docs/v6/IMPL_EMAIL_PDFS.md
rm assets/docs/v6/IMPL_SIGNED_PDF.md
rm assets/docs/v6/PAYMENTS_LOGIN_SPEC.md
```

### Keep These Files (Required)
- `assets/docs/PAYMENTS_PLATFORM.md` — System documentation
- `assets/docs/uid-xxx-xxx.json` — Job template (used by `job` command)
- `assets/docs/GUIDE_uid-xxx-xxx.json.md` — Admin guide for creating jobs
- `assets/docs/v6/GO_LIVE_SETUP_DEV.md` — This document

---

## Step 4: Verify Configuration -- DONE ✅

**File**: `CNAME`
```
payments.august.style
```

**File**: `vercel.json` — Verify CORS is production domain:
```json
"Access-Control-Allow-Origin": "https://payments.august.style"
```

**File**: `src/lib/api.ts` — Verify API URL is production:
```typescript
return 'https://freelance-payments-neon.vercel.app';
```

---

## Step 5: Commit and Deploy -- DONE ✅

```bash
cd ~/Development/freelance-payments

git add .
git commit -m "Go live: Switch to production Stripe keys, clean up test data"
git push origin freelance-payments
```

---

## Step 6: Post-Launch Verification

- [x] GitHub Actions `admin-push.yml` runs successfully
- [x] GitHub Pages deploys to `payments.august.style`
- [x] Vercel deploys API endpoints
- [x] HTTPS certificate is valid
- [x] Create first real client job
- [x] Verify Stripe products created in Live mode
- [ ] Monitor first real payment

---

## Rollback Plan

If something goes wrong:

1. **Stripe**: Switch back to test mode in Dashboard
2. **Vercel**: Revert environment variables to test keys
3. **Redeploy**: Trigger new Vercel deployment
4. **Investigate**: Check logs, fix issue
5. **Retry**: Go through launch steps again

---

# Part 4: Files Reference

## Files to Keep in BOTH Repos

These are essential for the `job` command and system operation:

| File                                    | Purpose                                              |
|-----------------------------------------|------------------------------------------------------|
| `assets/docs/uid-xxx-xxx.json`          | Template for `job` command (line 97 of `new_job.py`) |
| `assets/docs/GUIDE_uid-xxx-xxx.json.md` | Admin guide for creating jobs                        |
| `assets/scripts/new_job.py`             | Job creation script                                  |
| `assets/scripts/job.sh`                 | Shell wrapper for job creation                       |
| `assets/scripts/workflow_id.py`         | UID generation utility                               |
| `assets/docs/PAYMENTS_PLATFORM.md`      | System documentation                                 |

## Files to Keep ONLY in Dev Repo

| Directory/File                              | Purpose                         |
|---------------------------------------------|---------------------------------|
| `assets/docs/v1/` through `assets/docs/v5/` | Version history                 |
| `assets/docs/v6/IMPL_*.md`                  | Implementation planning docs    |
| `assets/docs/RESOURCES/`                    | Reference materials             |
| `CHANGELOG.md`                              | Change tracking (create in dev) |

## Files That Differ Per Environment

| File               | Production Value                     | Development Value                   |
|--------------------|--------------------------------------|-------------------------------------|
| `CNAME`            | `payments.august.style`              | `dev.payments.august.style`         |
| `vercel.json` CORS | `https://payments.august.style`      | `https://dev.payments.august.style` |
| `src/lib/api.ts`   | `freelance-payments-neon.vercel.app` | `freelance-payments-dev.vercel.app` |
| `README.md`        | Marketing-focused                    | Includes update workflow            |

---

# Part 5: Update Workflow (Dev → Live)

When a feature is ready to promote from dev to production.

## Pre-Promotion Checklist

- [ ] Feature fully tested on dev environment
- [ ] All workflows run successfully
- [ ] Full user flow tested (login → contract → invoice → payment1 → balance → payment2)
- [ ] No console errors
- [ ] Mobile and desktop tested
- [ ] Changelog updated with all changes

---

## Promotion Process

### Step 1: Prepare Production Repo

```bash
cd ~/Development/freelance-payments

# Make sure we're up to date
git pull origin freelance-payments

# Create backup branch (just in case)
git checkout -b backup-$(date +%Y%m%d)
git push origin backup-$(date +%Y%m%d)

# Return to main branch
git checkout freelance-payments
```

### Step 2: Overwrite Code Directories

```bash
# From production repo directory
cd ~/Development/freelance-payments

# Remove old code directories
rm -rf src/
rm -rf api/
rm -rf .github/

# Copy new code from dev
cp -r ../freelance-payments-dev/src ./
cp -r ../freelance-payments-dev/api ./
cp -r ../freelance-payments-dev/.github ./

# Copy updated templates (if changed)
cp -r ../freelance-payments-dev/assets/templates ./assets/
```

### Step 3: Copy Config Files

```bash
# Copy config files
cp ../freelance-payments-dev/package.json ./
cp ../freelance-payments-dev/package-lock.json ./
cp ../freelance-payments-dev/vite.config.ts ./
cp ../freelance-payments-dev/tsconfig.json ./
cp ../freelance-payments-dev/tsconfig.node.json ./
cp ../freelance-payments-dev/tailwind.config.js ./
cp ../freelance-payments-dev/postcss.config.js ./
cp ../freelance-payments-dev/index.html ./
cp ../freelance-payments-dev/job.html ./
cp ../freelance-payments-dev/404.html ./

# Copy job creation resources
cp ../freelance-payments-dev/assets/docs/uid-xxx-xxx.json ./assets/docs/
cp ../freelance-payments-dev/assets/docs/GUIDE_uid-xxx-xxx.json.md ./assets/docs/
cp -r ../freelance-payments-dev/assets/scripts ./assets/
```

### Step 4: Restore Production-Specific Files

```bash
# Restore CNAME (should not have been overwritten, but verify)
echo "payments.august.style" > CNAME
```

**File**: `vercel.json` — Verify CORS is production domain:
```json
"Access-Control-Allow-Origin": "https://payments.august.style"
```

**File**: `src/lib/api.ts` — Restore production API URL:
```typescript
return 'https://freelance-payments-neon.vercel.app';
```

### Step 5: Install and Build

```bash
# Install any new dependencies
npm install

# Test build locally
npm run build

# If build fails, fix issues before pushing
```

### Step 6: Commit and Push

```bash
git add .
git commit -m "Promote from dev: [feature description]"
git push origin freelance-payments
```

### Step 7: Verify Production Deployment

- [ ] GitHub Actions `admin-push.yml` runs successfully
- [ ] GitHub Pages deploys
- [ ] Vercel deploys
- [ ] Test with existing client job (just login, don't make changes)
- [ ] Verify no console errors

---

## Rollback Procedure

If something goes wrong:

```bash
cd ~/Development/freelance-payments

# Find your backup branch
git branch -a | grep backup

# Reset to backup
git checkout freelance-payments
git reset --hard backup-YYYYMMDD

# Force push (careful!)
git push --force origin freelance-payments
```

---

# Part 6: Changelog Protocol

Maintain detailed changelogs to ensure nothing is missed during updates.

## Changelog Categories

| Tag          | Description                                       |
|--------------|---------------------------------------------------|
| `[CODE]`     | Changes to `src/`, `api/`, `.github/`             |
| `[CONFIG]`   | Changes to `package.json`, `vite.config.ts`, etc. |
| `[SCHEMA]`   | Changes to JSON schema structure                  |
| `[TEMPLATE]` | Changes to `assets/templates/`                    |
| `[DOCS]`     | Documentation updates                             |

## Changelog Format

Create `CHANGELOG.md` in the dev repo:

```markdown
# Changelog

## [Unreleased]

### [CODE] Component Updates
- Updated SignatureModal to fix iOS keyboard issues
- Added popstate listener for back-button event handling

### [SCHEMA] JSON Schema Changes
- Added `docs.contract.signed_pdf` field
- Added `docs.contract.signed_url` field

### [CONFIG] Dependency Updates
- Added `pypdf` and `reportlab` to workflow dependencies

## [v6.1.0] - 2026-02-XX

### [CODE] Email PDF Implementation
- Added email_sender.py utility
- Added email_templates.py
- Integrated email dispatch into user_exit_events.py
```

## Pre-Promotion Review

Before each promotion:
1. Review `CHANGELOG.md` for all changes since last promotion
2. Verify all `[SCHEMA]` changes are reflected in `assets/docs/uid-xxx-xxx.json`
3. Mark changelog items as promoted after successful deployment

---

# Checklists

## Initial Dev Setup Checklist

- [x] Create `freelance-payments-dev` repo on GitHub (PUBLIC)
- [x] Clone production repo locally as `freelance-payments-dev`
- [x] Change git remote to dev repo
- [x] Update `CNAME` to `dev.payments.august.style`
- [x] Update `vercel.json` CORS to dev domain
- [x] Update `src/lib/api.ts` to dev Vercel URL
- [x] Remove production JSON files and PDFs
- [x] Create test JSON files using `job` command
- [x] Verify DNS for `dev.payments.august.style` (already configured)
- [x] Enable GitHub Pages for dev repo (Source: GitHub Actions)
- [x] Create Vercel project for dev repo
- [x] Add environment variables to Vercel (test keys)
- [x] Create Stripe test webhook
- [x] Add GitHub secrets to dev repo
- [x] Push and verify full deployment
- [x] Test complete user flow on dev

## Go-Live Checklist

- [x] Complete all friend testing on dev
- [x] Record screen captures (mobile + desktop)
- [x] Get Stripe live keys
- [x] Create live webhook in Stripe
- [x] Update Vercel environment variables to live keys
- [x] Clean up test data from live repo
- [x] Delete version history from live repo
- [x] Verify production configuration
- [x] Commit and push
- [x] Create first real client job
- [ ] Monitor first real payment

## Promotion Checklist (Recurring)

- [ ] All tests pass on dev
- [ ] Changelog updated
- [ ] Create backup branch on prod
- [ ] Copy code directories
- [ ] Copy config files
- [ ] Restore production-specific files
- [ ] npm install && npm run build
- [ ] Commit and push
- [ ] Verify deployment
- [ ] Mark changelog items as promoted

---