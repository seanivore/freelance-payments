# Environment Variables Clarification

## Stripe Keys

### ✅ STRIPE_SECRET_KEY (Correct)
- **GitHub Actions**: Uses `secrets.STRIPE_SECRET_KEY` (from GitHub Secrets)
- **Vercel**: Uses `STRIPE_SECRET_KEY` (from Vercel Environment Variables)
- **Same key** for both - your Stripe secret key (`sk_test_...` for testing, `sk_live_...` for production)

**Note**: You mentioned using `STRIPE_API_KEY` and `STRIPE_SANDBOX_SECRET` before. `STRIPE_SECRET_KEY` is the standard name Stripe uses. When switching to live mode, just replace the test key with the live key using the same variable name.

---

## GitHub Tokens (Two Different Things!)

### 1. `secrets.GITHUB_TOKEN` (GitHub Actions - Automatic)
- **Location**: GitHub Actions workflow (`.github/workflows/process-job.yml`)
- **What it is**: Built-in secret that GitHub provides automatically
- **No setup needed**: GitHub creates this automatically for every workflow
- **Permissions**: Automatically scoped to the repository
- **Used for**: Committing/pushing changes from GitHub Actions

**Example in workflow:**
```yaml
- uses: actions/checkout@v4
  with:
    token: ${{ secrets.GITHUB_TOKEN }}  # ← This is automatic!
```

### 2. `GITHUB_TOKEN` (Vercel - Manual PAT)
- **Location**: Vercel Environment Variables
- **What it is**: Personal Access Token (PAT) you create manually
- **Setup needed**: Create in GitHub Settings → Developer settings → Personal access tokens
- **Required permissions**: 
  - ✅ `repo` (Full control of private repositories)
  - ✅ `workflow` (Update GitHub Action workflows)
- **Used for**: Serverless functions calling GitHub Actions API

**How to create:**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name: `freelance-payments-vercel`
4. Select scopes:
   - ✅ `repo` (Full control)
   - ✅ `workflow` (Update workflows)
5. Click "Generate token"
6. **Copy immediately** (you won't see it again!)
7. Add to Vercel as `GITHUB_TOKEN`

**Why we need both:**
- GitHub Actions uses built-in `GITHUB_TOKEN` to commit changes
- Vercel serverless functions need a PAT to trigger GitHub Actions workflows

---

## Vercel Environment Variables Summary

Add these in Vercel Dashboard:

| Variable | Value | Where to Get |
|----------|-------|--------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | Stripe Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe Dashboard → Webhooks (after creating endpoint) |
| `GITHUB_TOKEN` | `ghp_...` | GitHub Settings → Personal Access Tokens |
| `GITHUB_REPO_OWNER` | `seanivore` | Your GitHub username |
| `GITHUB_REPO_NAME` | `freelance-payments` | Repository name |

---

## GitHub Secrets (for GitHub Actions)

Add in: `https://github.com/seanivore/freelance-payments/settings/secrets/actions`

| Secret | Value | Where to Get |
|--------|-------|--------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | Stripe Dashboard → API Keys (same as Vercel) |

**Note**: `GITHUB_TOKEN` is automatic - don't add it manually!

---

## npm Warning About path-match

**Question**: Is the `npm warn deprecated path-match@1.2.4` warning related to `npm i -g vercel`?

**Answer**: Yes, but it's harmless! ✅

- This is a deprecation warning from a dependency of the Vercel CLI
- The Vercel CLI still works perfectly fine
- It's just a transitive dependency that's deprecated
- You can safely ignore it and proceed with `vercel link`

**What to do**: Nothing! Just continue with step 2 (Link Project to Vercel).

---

## Quick Checklist

- [x] Updated `.env` to use `STRIPE_SECRET_KEY` (test key)
- [x] Branch name is `freelance-payments` ✅
- [x] Created `GITHUB_TOKEN` PAT for Vercel
- [x] npm warning is harmless - proceed ✅
- [ ] Add `STRIPE_SECRET_KEY` to GitHub Secrets
- [ ] Add all env vars to Vercel
- [ ] Deploy to Vercel
- [ ] Set up Stripe webhook

---

## When Switching to Production

1. **Stripe**: Replace test key (`sk_test_...`) with live key (`sk_live_...`) in:
   - GitHub Secrets
   - Vercel Environment Variables
   - Update publishable key in frontend (`pk_live_...`)

2. **Webhook**: Create new webhook endpoint in Stripe (live mode) and update Vercel env var

3. **Test**: Use live mode test cards (Stripe provides these)

That's it! Same variable names, just swap the keys.
