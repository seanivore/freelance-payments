# Vercel Setup Guide

DATED - COMPLETE. 

## 1. Install Vercel CLI (if not already installed)

```bash
npm i -g vercel
```

## 2. Link Project to Vercel

```bash
cd /Users/seanivore/Development/freelance-payments

# If logged in with wrong account, logout first:
vercel logout

# Login with correct account (the one connected to GitHub)
vercel login

# Link project
vercel link
```

Follow prompts:
- **Set up this directory?** → `yes`
- **Which scope?** → Select your account/team
- **Link to existing project?** → `no` (create new)
- **Project name?** → `freelance-payments`
- **Code directory?** → `./` (current directory)
- **Auto-detected Jekyll settings?** → **`yes` (modify them!)**

**Important**: Vercel will detect Jekyll (because of `_config.yml`), but this is NOT a Jekyll site!

**When asked to modify settings:**

1. **Select which settings to overwrite**: 
   - Press `<space>` to select each one:
     - ✅ **Build Command** (select this)
     - ✅ **Development Command** (select this)
     - ✅ **Output Directory** (select this)
   - Press `<enter>` to proceed

2. **Then enter new values when prompted:**
   - **Build Command**: `npm run build` → press enter
   - **Development Command**: (press enter to leave empty, or type `npm run dev`) → press enter
   - **Output Directory**: `.` (just a dot) → press enter
   - **Change additional project settings?** → `yes` (to set Install Command)
   - **Install Command**: (press enter to leave empty, or type `npm install`) → press enter

## 3. Set Environment Variables

### Via Vercel Dashboard:
1. Go to your project settings: https://vercel.com/seanivore/freelance-payments/settings/environment-variables
2. Add these variables:

**Required:**
- `STRIPE_SECRET_KEY` - Your Stripe secret key (from Stripe Dashboard)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (from Stripe Dashboard, after creating webhook)
- `GITHUB_TOKEN` - Personal access token with `repo` and `workflow` permissions
- `GITHUB_REPO_OWNER` - Your GitHub username (default: `seanivore`)
- `GITHUB_REPO_NAME` - Repository name (default: `freelance-payments`)

**Optional:**
- `SITE_URL` - Your site URL (for webhook callbacks)

### Via CLI:
```bash
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add GITHUB_TOKEN
vercel env add GITHUB_REPO_OWNER
vercel env add GITHUB_REPO_NAME
```

## 4. Deploy

```bash
vercel --prod
```

## 5. Get Webhook Endpoint URL

After deployment, your webhook endpoint will be:
```
https://your-project.vercel.app/api/webhook
```

**Copy this URL** - you'll need it for Stripe webhook configuration.

## 6. Configure Stripe Webhook

1. Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter endpoint URL: `https://your-project.vercel.app/api/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed` (optional)
5. Click "Add endpoint"
6. **Copy the "Signing secret"** - this is your `STRIPE_WEBHOOK_SECRET`
7. Add it to Vercel environment variables (step 3)

## 7. Update Frontend Code

Update `assets/js/checkout-controller.js` to use your Vercel URL:

```javascript
const serverlessEndpoint = 'https://your-project.vercel.app/api/create-payment-intent';
```

Or use relative path (if same domain):
```javascript
const serverlessEndpoint = '/api/create-payment-intent';
```

## 8. GitHub Secrets

Add to GitHub repository secrets (Settings → Secrets and variables → Actions):

- `STRIPE_SECRET_KEY` - Same as Vercel (for GitHub Actions workflow)

## 9. Test

1. Create a test job JSON file
2. Push to GitHub
3. Check GitHub Actions workflow runs
4. Test payment flow with Stripe test cards

---

## Troubleshooting

**Webhook not receiving events:**
- Check webhook URL is correct
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check Vercel function logs: `vercel logs`

**GitHub Actions not triggering:**
- Verify `GITHUB_TOKEN` has `workflow` permission
- Check workflow file path matches: `.github/workflows/process-job.yml`
- Verify branch name in workflow matches your branch

**Payment Intent creation fails:**
- Check Stripe secret key is correct
- Verify `price_id` exists in Stripe
- Check Vercel function logs for errors
