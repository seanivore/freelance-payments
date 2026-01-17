# Testing Log 01 - v5 Development

**Created**: 2026-01-17  
**Last Updated**: 2026-01-17 (all fixes implemented)

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

---

### BUG_01_004 - PDF Generation Type Error: String/Int Arithmetic

**Date**: 2026-01-17  
**Status**: Fixed

**Issue**: PDF generation fails with error: `unsupported operand type(s) for -: 'str' and 'int'` when generating contract, invoice, and balance PDFs.

**Root Cause**: JSON values for `unit_amount` and `amount_off` are sometimes stored as strings instead of integers. Arithmetic operations (`+`, `-`) fail when mixing string and int types.

**Fixes Implemented**:
- Added `safe_int()` helper function to convert string/int/None values to integers safely
- Updated all calculation functions to use `safe_int()`:
  - `calculate_amount_due()`: Converts `unit_amount` values
  - `calculate_subtotal()`: Converts both price amounts
  - `calculate_payment_due()`: Converts `unit_amount` and `amount_off`
  - `generate_invoice_pdf()`: Converts all price/coupon values before arithmetic

**Files Modified**:
- `.github/scripts/orchestration/admin_push.py`: Added `safe_int()` helper and updated all calculation functions

**Test Job**: `uid-tst-002.json`

---

### BUG_01_005 - Stripe Object Creation Fails When Coupon Already Exists

**Date**: 2026-01-17  
**Status**: Fixed

**Issue**: When creating Stripe objects for new job `uid-tst-003`, creation failed with error: "Coupon already exists" for `cou-tst-003`. This caused:
- No Stripe objects created (products_created: 0)
- No PDFs generated (skipped because no new products)
- Manifest updated correctly
- Orphaned product archived correctly

**Root Cause**: `create_stripe_coupon()` function doesn't check if coupon already exists before attempting creation. Unlike `create_stripe_product()` which has error handling, coupon creation fails immediately if ID already exists. When coupon creation throws an exception:
- Exception prevents `create_stripe_objects_for_job()` from returning stats
- Even though product WAS created (happens before coupon), `products_created` stays 0
- PDF generation checks `if products_created > 0`, so it skips
- Manifest update happens regardless (reads JSON files directly)

**Fixes Implemented**:
- Added `check_stripe_coupon_exists()` helper function to check if coupon exists
- Updated `create_stripe_coupon()` to check for existing coupon before creation
- If coupon exists, return existing coupon ID instead of failing
- Added try/except around coupon creation in `create_stripe_objects_for_job()` to make it non-blocking
- Added fallback check in outer exception handler: if product exists in Stripe but stats weren't returned, count it for PDF generation

**Files Modified**:
- `.github/scripts/orchestration/admin_push.py`: 
  - Added `check_stripe_coupon_exists()` helper
  - Made coupon creation non-blocking with try/except
  - Added fallback logic to detect partially created jobs

**Test Job**: `uid-tst-003.json`

---

## Test Job: `uid-ngq-236.json`

### BUG_01_009 - Return URL Redirects to Contract Instead of Completion Page

**Date**: 2026-01-17  
**Status**: Fixed

**Issue**: After successful payment, Stripe redirects to `return_url` with `session_id`, but the app routes back to contract instead of showing the completion page. This happens because the state management checks `data.state.client_status.payment_1` which is still `null` (workflow hasn't run yet to update the JSON file).

**Expected**: User should see completion1 page immediately after payment, even before workflow updates JSON  
**Actual**: App routes to contract page because `payment_1` is null in JSON

**Root Cause**: 
- Routing logic (`initialSection`) runs synchronously based on `data.state.client_status`
- Optimistic update happens asynchronously in `useEffect` (Effect 2)
- When `sessionId` is detected, routing logic doesn't account for the fact that payment just completed

**Console Log**:
```
Detected session_id: cs_test_a1pcTH9gIc6Pa2hNZNIzR47djNDgMWQJ0fhp1FPFNhB63pYcoHn7EzsWgo (from URL)
Event: contract_loaded
```

**Fixes Implemented** (2026-01-17):
- Updated routing logic in `src/App.tsx` to check for `sessionId` first
- If `sessionId` exists AND `invoice` viewed but `payment_1` not recorded → route to `completion1`
- If `sessionId` exists AND `balance` viewed but `payment_2` not recorded → route to `completion2`
- Added logging to track routing decisions
- Improved Effect 2 logging to show when optimistic updates are applied

**Files Modified**:
- `src/App.tsx`: Updated `initialSection` calculation to account for `sessionId` and payment completion state

**Expected Result**: Return URL should immediately show completion page, even before workflow updates JSON

---

### BUG_01_010 - User Exit Events Workflow Runs Multiple Times, Fails to Process Payment

**Date**: 2026-01-17  
**Status**: Fixed

**Issue**: Workflow attempted to run 3 times for same payment event:
1. **First workflow (#27)**: Cancelled due to `cancel-in-progress: true` setting
2. **Second workflow (#28)**: Failed with merge conflict during git operations
3. **Third workflow (#29)**: Succeeded but reported "No state changes required" - payment_1 was NOT updated

**Expected**: Single workflow run that processes payment_1 event and updates JSON  
**Actual**: Three workflow runs, payment_1 left as `null`, `price1.active` left as `true`

**Root Cause**:
- `cancel-in-progress: true` cancels first workflow when second is queued
- Git operations (`git pull --no-rebase`) cause merge conflicts when multiple workflows run
- Third workflow reads file with conflicts, can't process properly, reports "No changes"

**GitHub Actions Logs**:
- Workflow #27: Cancelled - "Canceling since a higher priority waiting request for user-events-uid-ngq-236 exists"
- Workflow #28: Failed - Merge conflict in `assets/jobs/uid-ngq-236.json`, rebase failed
- Workflow #29: Succeeded - "No state changes required" but payment_1 was never updated

**Actual Result in JSON**:
- `payment_1`: `null` (should be timestamp)
- `price1.active`: `true` (should be `false`)

**Fixes Implemented** (2026-01-17):
- Changed concurrency from `cancel-in-progress: true` to `cancel-in-progress: false` to queue workflows sequentially instead of canceling
- Improved git operations in workflow:
  - Fetch latest before committing
  - Use merge (not rebase) to preserve commit history
  - If merge conflict detected, reset to remote and re-run Python script with latest file state
  - Store `PAYLOAD_JSON` in temp file for re-processing after reset
- Enhanced Python script to detect Git merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
- Exit with code 2 if merge conflict detected, workflow handles by resetting and re-processing

**Files Modified**:
- `.github/workflows/user-exit-events.yml`: Changed concurrency, improved git operations, added conflict resolution
- `.github/scripts/orchestration/user_exit_events.py`: Added merge conflict detection

**Expected Result**: Workflows queue sequentially, git operations handle conflicts gracefully, payment_1 is always recorded

---

### BUG_01_011 - State Management Ignores All Timestamps on Second Login

**Date**: 2026-01-17  
**Status**: Fixed

**Issue**: User logged in again after payment_1 (even though it wasn't recorded due to BUG_01_010). The app should have recognized existing timestamps (`logged_in`, `contract_signed`, `invoice`) and routed to `payment1` to retry payment_1, or to `balance` if payment_1 had been recorded. Instead, it routed to contract as if it was a completely fresh login, ignoring all existing state timestamps.

**Expected**: 
- If `payment_1` not recorded: Route to `payment1` (to retry payment_1)
- If `payment_1` recorded: Route to `balance` (for payment_2)
- Should recognize `logged_in`, `contract_signed`, `invoice` timestamps

**Actual**: Routed to `contract` page, completely ignoring all existing timestamps

**Root Cause**: 
- **JSON Caching**: `fetchJobData()` was fetching JSON without cache busting, so browser/CDN may have served stale cached version without timestamps
- **Routing Logic**: Sequential `if` statements could overwrite each other incorrectly
- **No Debugging**: No logging to verify what state values were actually read

**Console Log**:
```
No session_id found in URL or sessionStorage
Event: contract_loaded
```

**Fixes Implemented** (2026-01-17):
- **Cache Busting**: Added `?t=${Date.now()}` query parameter and explicit cache headers (`cache: 'no-store'`, `Cache-Control: no-cache`) to `fetchJobData()` in `src/lib/data.ts`
- **State Logging**: Added comprehensive logging in `fetchJobData()` to show all timestamp values when data loads
- **Routing Logic**: Refactored routing to use `else if` chain with proper precedence instead of sequential `if` statements that could overwrite
- **Debug Logging**: Added detailed routing decision logging to track which condition matched and why
- **Safety Checks**: Added validation to ensure `client_status` structure exists before routing

**Files Modified**:
- `src/lib/data.ts`: Added cache busting and state logging
- `src/App.tsx`: Refactored routing logic, added comprehensive debug logging, added safety checks

**Expected Result**: 
- Fresh JSON data always loaded (no stale cache)
- Routing correctly recognizes existing timestamps
- Debug logs show exactly what state values are read and which routing decision is made
- User correctly routed based on their progress through the flow

---
