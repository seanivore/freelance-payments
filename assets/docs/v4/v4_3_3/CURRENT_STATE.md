# Current State & Next Steps

**Version:** v4.3.3  
**Date:** 2026-01-05  
**Status:** Testing & Refinement Phase

## What's Working ✅


## Known Issues 🔧

### Vercel Rate Limits
- **Issue:** Vercel deployment rate limits (currently 3 hours)
- **Impact:** Blocks testing when multiple workflows run quickly
- **Workaround:** Wait for rate limit to expire before next test
- **Future:** May need to batch deployments or use different deployment strategy

### Manifest Conflict Markers
- **Issue:** Git conflict markers can appear in manifest.json during rebase
- **Impact:** JSON parse errors prevent workflow from checking Stripe catalog
- **Fix:** `git smart-push` should handle this, but manual cleanup may be needed
- **Status:** Fixed in recent update (checks rebase commit for deletions)

### Workflow Logic Edge Cases
- **Issue:** When JSON deleted but Stripe product exists, workflow should archive it
- **Status:** Logic exists (Step 4: orphaned products), but needs verification
- **Test:** `uid-test-archive-001.json` will be deleted to test this

## Current Test Files 📝

### 1. `uid-test-archive-001.json`
- **Purpose:** Test archiving workflow
- **Plan:** 
  1. Push this file (creates Stripe objects)
  2. Wait for workflow to complete
  3. Delete the JSON file locally
  4. Push deletion (should archive Stripe product)
  5. Verify product archived in Stripe dashboard

### 2. `uid-test-payment-001.json`
- **Purpose:** Full payment flow test
- **Plan:**
  1. Push this file (creates Stripe objects + PDFs)
  2. Log in with: Last Name: `TestClient`, Keyword: `payment-test`
  3. Sign contract (triggers user-behavior workflow)
  4. View invoice
  5. Complete Payment 1 (triggers payment workflow)
  6. Complete Payment 2 (triggers payment workflow + archiving)
  7. Verify all states updated correctly

## Technical Details 🔧

### Workflow Steps (admin-push)
1. Compare JSONs to catalog
2. Unmatched: JSON active=true → create Stripe objects
3. Unmatched: JSON active=false → delete JSON
4. Unmatched: Catalog active=true → archive product
5. Unmatched: Catalog active=false → ignore
6. Matched: Catalog inactive, JSON active → delete JSON
7. Matched: Both inactive → delete JSON
8. Matched: Catalog active, JSON inactive → archive + delete
9. Matched: Both active → ignore
10. Generate manifest
11. Build Pages
12. Deploy

### Stripe API Version
- **Required:** `2025-03-31.basil` (for `ui_mode: custom`)
- **Used in:** `checkout-controller.js` (Stripe.js script URL)

### Concurrency Groups
- **All workflows:** `freelance-payments-workflows-${{ github.ref }}`
- **Cancel in progress:** `false` (protects running workflows)
- **Note:** Pending runs may still be canceled by GitHub Actions (intended behavior)

## Next Steps 🎯

### Immediate (After Vercel Rate Limit Expires)
1. **Test archiving:** Push `uid-test-archive-001.json`, then delete it
2. **Test payment flow:** Push `uid-test-payment-001.json`, walk through full flow
3. **Verify Stripe objects:** Check dashboard for correct product/price IDs
4. **Verify manifest:** Ensure manifest.json updates correctly

### Short-term
1. **Fix event tracking:** Prevent early triggers (contract_scrolled_complete firing before scroll)
2. **Improve completion messaging:** Better differentiation between payment 1 and final payment
3. **Test multi-payment flow:** Ensure Payment 2 routing works correctly
4. **Document Stripe webhook setup:** Ensure payment workflow triggers correctly

### Long-term
1. **Optimize deployment strategy:** Reduce Vercel rate limit issues
2. **Add error recovery:** Better handling of workflow failures
3. **Improve logging:** More detailed error messages for debugging
4. **Add monitoring:** Track workflow success/failure rates

## Key Files 📁

### Workflows
- `.github/workflows/admin-push.yml` - Admin-initiated pushes
- `.github/workflows/user-behavior.yml` - User events (contract signing, etc.)
- `.github/workflows/payment.yml` - Payment completion webhooks

### Scripts
- `.github/scripts/orchestration/admin_push.py` - Admin workflow logic
- `.github/scripts/orchestration/user_behavior.py` - User behavior workflow logic
- `.github/scripts/orchestration/payments.py` - Payment workflow logic

### Frontend
- `assets/js/checkout-controller.js` - Stripe Elements integration
- `assets/js/contract-controller.js` - Contract signing
- `assets/js/event-tracker.js` - Event tracking
- `assets/js/completion-controller.js` - Post-payment messaging

### Utilities
- `.github/scripts/utils/json_io.py` - JSON file operations
- `.gitconfig-smart-push.sh` - Git conflict resolution script

## Testing Checklist ✅

- [ ] Archive workflow (delete JSON → archive Stripe product)
- [ ] Payment flow (contract → invoice → checkout → payment)
- [ ] Multi-payment jobs (Payment 1 → Payment 2 → archive)
- [ ] Manifest updates correctly
- [ ] PDF generation works
- [ ] Event tracking accurate
- [ ] Completion page messaging correct
- [ ] Git workflow handles conflicts properly

## Notes 📝

- **Stripe Products:** Always use job ID as product ID (e.g., `uid-test-001`)
- **Manifest:** Auto-generated, don't edit manually
- **Git:** Use `git smart-push` for all pushes (handles conflicts automatically)
- **Workflows:** Wait for each to complete before pushing again (or accept that pending runs may be canceled)
