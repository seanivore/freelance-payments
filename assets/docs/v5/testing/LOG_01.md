# Testing Log 01 - v5 Development

**Created**: 2026-01-17  
**Last Updated**: 2026-01-17 (fixes implemented)

## Logging Instructions for AI Agents

This log tracks bugs and fixes during v5 testing. Follow these conventions:

- **File Naming**: `LOG_XX.md` where XX is the log number (01, 02, etc.)
- **Bug Numbering**: `BUG_XX_YYY` where XX matches log number, YYY is sequential bug count across all v5 logs
- **When starting a new log**: User will provide the last bug number from previous log (e.g., "Last bug was BUG_01_015")
- **Grouping**: Use larger headers (##) for test job file names to group related bugs
- **Content**: Keep entries concise - include user's essential details, expected behavior, actual behavior, and fixes implemented
- **Additional Details**: Log any relevant technical details, console errors, workflow runs, commit hashes, or related context

---

## Test Job: `uid-tst-001.json`

### BUG_01_001 - Return URL 404 Redirect Failure

**Date**: 2026-01-17  
**Status**: Open - Fix attempted but still failing

**Issue**: After successful payment, Stripe redirects to `return_url` but gets 404 error. URL format: `https://payments.august.style/uid-tst-001?session_id=cs_test_...`

**Expected**: User should be redirected to completion page showing payment success  
**Actual**: 404 error, fallback "Payment succeeded" page displays instead

**Root Cause**: 
- Vercel rewrites not configured to handle job routes with query parameters
- React `useEffect` checking `session_id` ran before `data` loaded, so session status fetch never executed

**Fixes Attempted** (2026-01-17):
- Added `rewrites` to `vercel.json` to route all non-API routes to `404.html` (preserves query params)
- Split `useEffect` in `src/App.tsx` into two hooks:
  - Effect 1: Detects `session_id` on mount, stores in state
  - Effect 2: Processes session status when both `sessionId` and `data` are available
- Updated `createCheckoutSession` to pass explicit `return_url` with `{CHECKOUT_SESSION_ID}` template

**Test Result**: Fix did not resolve issue - still getting 404 after push and build with new test job (`uid-tst-001.json`)

**Files Modified**:
- `vercel.json`: Added rewrites configuration
- `src/App.tsx`: Fixed `useEffect` dependency arrays and session handling

**Console Error**: `GET https://payments.august.style/uid-tst-001?session_id=cs_test_... 404 (Not Found)`

**Fixes Implemented** (2026-01-17):
- Added `cleanUrls: false` to `vercel.json` to preserve query parameters
- Added script comment in `404.html` to document query param preservation
- Added debug logging in `App.tsx` to track `session_id` detection
- Query params should now be preserved through 404.html → React app transition

**Files Modified**:
- `vercel.json`: Added `cleanUrls: false`
- `404.html`: Added documentation script
- `src/App.tsx`: Added debug logging for session_id detection

**Next Steps**: Test with new job to verify rewrites work correctly

---

### BUG_01_002 - Stripe Custom UI Shows $0.00 Instead of Correct Amount

**Date**: 2026-01-17  
**Status**: Open

**Issue**: Stripe Payment Element displays $0.00 in two locations:
1. Above payment form (invoice total area)
2. On payment button ("Pay $0.00 now")

**Expected**: Should show calculated amount: `price1.unit_amount - coupon.amount_off` (e.g., $4,500.00)  
**Actual**: Both locations show $0.00

**Context**: 
- Payment actually processes correctly ($4,500.00 charged successfully)
- Previously showed "$NaN" on button, fixed to show $0.00 (but still incorrect)
- At least one test in the past showed correct amount

**Stripe Events** (from successful payment):
- `payment_intent.created` for USD 4,500.00
- `charge.succeeded` for USD 4,500.00
- `payment_intent.succeeded` for USD 4,500.00
- `checkout.session.completed` - Webhook sent 200

**Investigation Notes**:
- `CheckoutForm.tsx` has fallback logic to fetch from session-status API if totals missing
- May be related to Stripe Elements loading before session details are available
- Checkout session created correctly (payment processes), so issue is display-only

**Fixes Implemented** (2026-01-17):
- Added `price` and `coupon` props to `CheckoutForm` component
- Implemented multi-strategy fallback:
  1. Use checkout session total if available
  2. Fetch from session-status API if total is 0
  3. Calculate from price data (`price.unit_amount - coupon.amount_off`) as immediate fallback
- Added comprehensive debug logging to track amount resolution
- `PaymentView` now passes price/coupon data to `CheckoutForm`

**Files Modified**:
- `src/components/CheckoutForm.tsx`: Added props, improved fallback logic, added calculated amount fallback
- `src/components/PaymentView.tsx`: Pass price and coupon data to CheckoutForm
- `api/create-checkout-session.js`: Verified line items are created correctly (already correct)

**Expected Result**: Checkout form shows correct calculated amount immediately, with fallback to session-status API if needed

---

### BUG_01_003 - User Exit Events Workflow Runs Twice, Creates Conflicts

**Date**: 2026-01-17  
**Status**: Open

**Issue**: `user-exit-events.yml` workflow triggered twice for same session, creating conflicting commits:
1. Commit `bc2832e`: Updates `contract.signatures.client` and `state.client_status` (many redundant edits)
2. Commit `1bd6d3d`: Updates `price1.active` from `true` to `false`, but expects previous fields to be empty (causes conflicts)

**Expected**: Single workflow run that updates all fields atomically  
**Actual**: Two sequential workflow runs with conflicting edits

**Observations**:
- First commit (`bc2832e`) not shown in GitHub Actions list (only second one visible)
- Second workflow failed with JSON parse error: "Expecting property name enclosed in double quotes: line 15 column 1"
- Both commits show "bot" as author (Vercel builds)
- Line 15 is customer name field (updated during contract signing)

**Root Cause Hypothesis**:
- Multiple triggers: Webhook event + user-exit event both triggering workflow
- Race condition: First workflow commits, second workflow starts before first completes
- JSON corruption: Second workflow reads file while first is writing, gets malformed JSON

**Files Modified** (by workflows):
- `assets/jobs/uid-tst-001.json`: Conflicting edits to `contract.signatures.client`, `state.client_status`, `price1.active`

**GitHub Actions Log Error**:
```
Error reading job file: Expecting property name enclosed in double quotes: line 15 column 1 (char 453)
```

**Fixes Implemented** (2026-01-17):
- Removed duplicate `trackEvent('payment_1')` and `trackEvent('payment_2')` calls from `App.tsx` session completion handler
- Webhook is now single source of truth for payment events
- Updated concurrency to `cancel-in-progress: true` with job-level grouping: `user-events-${{ github.event.inputs.job_id }}`
- Added deduplication checks in `user_exit_events.py` to skip payment events if already processed

**Files Modified**:
- `src/App.tsx`: Removed payment event tracking (webhook handles it)
- `.github/workflows/user-exit-events.yml`: Updated concurrency settings
- `.github/scripts/orchestration/user_exit_events.py`: Added deduplication for payment_1 and payment_2 events

**Expected Result**: Only one workflow run per payment, no conflicts

---

## Related Fixes (This Session)

### Google Refresh Token Expiration
- Added early token validation in `admin_push.py` before Step 1 (Stripe catalog sync)
- Validates token only if new jobs detected (jobs without `state.objects.created`)
- Fails fast with helpful error message including auth URL if token invalid
- Prevents wasted Stripe API calls and partial state updates

### Vite Build - Empty PDF Directories
- Fixed `vite.config.ts` to handle empty `assets/pdf` subdirectories gracefully
- Added conditional check: only copy PDF directories if they contain files
- Created `.gitkeep` files in `assets/pdf/contract/`, `assets/pdf/invoice/`, `assets/pdf/balance/` to maintain repo structure

**Files Modified**:
- `.github/scripts/orchestration/admin_push.py`: Added `validate_google_token()` and pre-check logic
- `vite.config.ts`: Added `hasPdfFiles()` helper and conditional PDF copy targets
- `assets/pdf/*/.gitkeep`: Created placeholder files
