# v4 Schema Migration - Implementation Status

**Date**: 2026-01-28  
**Status**: ✅ **Implementation Complete - Ready for Testing**

## ✅ Completed Phases

### Phase 1: PDF Generation Script ✅
- Created `.github/scripts/pdf/generate_pdfs.py` with OAuth authentication (primary) and Service Account fallback
- Implements Google Docs template copying, placeholder replacement, PDF export, SHA256 calculation
- Saves PDFs to `assets/pdf/contract/` and `assets/pdf/invoice/`
- Updates job JSON with `docs.contract` and `docs.invoice` metadata
- **Status**: Ready for testing with Google API credentials

### Phase 2: Orchestrator Update ✅
- Updated `orchestrate_workflow.py` to call PDF generation after `sync_catalog.py` when new products created
- Updated all docstrings from v3 to v4 schema
- **Status**: Ready for workflow testing

### Phase 3: Python Scripts v4 Migration ✅
- **sync_catalog.py**: Updated all field references (`product_object` → `product`, `state.object` → `state.objects`, `initial_price` → `price_1`, etc.)
- **update_state.py**: Updated `state_management` → `state`, `balance_payment_intent` → `payment_2`, fixed datetime deprecation
- **json_io.py**: Removed all v1/v2 legacy code, updated validation for v4 schema only
- **generate_manifest.py**: Removed metadata nesting, access `product.login_name/login_keyword` directly
- **Status**: All scripts validated, test JSON passes validation

### Phase 4: JavaScript Files v4 Migration ✅
- **payment-router.js**: Updated `stateManagement` → `state`, `balance_payment_intent` → `payment_2`
- **contract-controller.js**: Removed ALL HTML rendering, added PDF embedding, download button, signature modal integration
- **invoice-controller.js**: Removed ALL HTML rendering, added PDF embedding, download button
- **checkout-controller.js**: Updated schema references, fixed `customer.id` → `customer_id`
- **payment-lookup.js**: No changes needed (already compatible)
- **Status**: All JavaScript files compile without errors

### Phase 5: API Endpoints v4 Migration ✅
- **create-checkout-session.js**: Fixed `customer.id` syntax error → `customer_id`
- **sign-contract.js**: Updated comments for v4 schema
- **update-payment.js**: Updated comments for v4 schema
- **track-event.js**: Updated comments for v4 schema
- **webhook.js**: Updated comments for v4 schema
- **google/auth.js**: NEW - OAuth consent URL generator
- **google/callback.js**: NEW - OAuth callback handler for refresh token extraction
- **Status**: All endpoints updated, OAuth endpoints ready for initial setup

### Phase 6: Frontend HTML Updates ✅
- **job.html**: Added PDF viewer containers, download buttons, signature modal
- Added event-tracker.js script loading
- **Status**: HTML structure ready for PDF embedding

### Phase 7: Event Tracking Implementation ✅
- Created `event-tracker.js` with batching (5 minutes inactivity)
- Integrated with contract-controller.js and invoice-controller.js
- Tracks: contract_loaded, contract_scrolled_complete, invoice_viewed, document_downloaded, signed_contract
- **Status**: Event tracking ready for testing

## 🧪 Testing Status

### Schema Migration Testing ✅
- ✅ Python scripts compile without errors
- ✅ JavaScript files compile without errors
- ✅ Test JSON file validates successfully
- ✅ Manifest generation works correctly

### Ready for Integration Testing
- ⏳ **OAuth Initial Setup** (one-time manual step):
  - Visit `/api/google/auth` to get OAuth URL
  - Complete OAuth consent flow
  - Extract refresh token from `/api/google/callback` response
  - Add `GOOGLE_REFRESH_TOKEN` to GitHub Secrets
- ⏳ PDF generation (requires refresh token or Service Account fallback)
- ⏳ Stripe catalog sync (requires Stripe API key)
- ⏳ Full workflow: New job JSON → Stripe objects → PDFs → Manifest
- ⏳ Frontend PDF embedding
- ⏳ Signature modal functionality
- ⏳ Event tracking and batching

## 📋 Next Steps for Testing

1. **Test PDF Generation**:
   - Verify OAuth authentication works (or Service Account fallback)
   - Test placeholder replacement with v4 schema fields
   - Verify PDFs are saved to correct repo locations
   - Verify Google Docs are deleted after export

2. **Test Stripe Integration**:
   - Test sync_catalog.py creates Products, Prices, Customers correctly
   - Verify Stripe IDs are stored in `state.objects`
   - Test archiving flow (set `product.active = false`)

3. **Test Full Workflow**:
   - Add new job JSON → Push to GitHub
   - Verify orchestrator runs: sync_catalog → generate_pdfs → generate_manifest
   - Verify single git commit/push

4. **Test Frontend**:
   - Test PDF embedding displays correctly
   - Test download buttons work
   - Test signature modal opens and submits correctly
   - Test event tracking (loaded, scrolled, downloaded, signed)

5. **Test API Endpoints**:
   - Test create-checkout-session with v4 schema
   - Test sign-contract updates state correctly
   - Test webhook updates payment status correctly

## 🔧 Known Issues / Notes

- **OAuth Authentication**: PDF generation script uses OAuth refresh token as primary (for client compatibility), Service Account as fallback (for GitHub Actions automation)
- **OAuth Initial Setup**: One-time manual step required - visit `/api/google/auth`, complete consent, extract refresh token, add to GitHub Secrets
- **OAuth Scopes**: Using `drive.file` instead of full `drive` scope for narrower access (only app-created/opened files)
- **PDF Generation Timing**: PDFs generated immediately after Stripe objects created (during initial push workflow)
- **No HTML Fallback**: v4 requirement - site shows error if PDF missing, never falls back to HTML rendering
- **Event Batching**: Events batched for 5 minutes of inactivity, flushed on page unload

## 📝 Files Created/Modified

**New Files**:
- `.github/scripts/pdf/generate_pdfs.py`
- `api/google/auth.js` (OAuth consent URL generator)
- `api/google/callback.js` (OAuth callback handler)
- `assets/js/event-tracker.js`
- `assets/docs/v4/FILE_AUDIT.md`
- `assets/docs/v4/IMPLEMENTATION_STATUS.md`
- `assets/jobs/uid-test-v4-001.json` (test file)

**Modified Files**:
- All Python scripts in `.github/scripts/`
- All JavaScript files in `assets/js/`
- All API endpoints in `api/`
- `job.html`
- `.github/workflows/orchestrate.yml` (no changes needed, already compatible)

## 🎯 Ready for Production Testing

All code updates are complete. The system is ready for:
1. End-to-end testing with real Google API credentials
2. Stripe sandbox testing
3. Frontend integration testing
4. Full workflow validation
