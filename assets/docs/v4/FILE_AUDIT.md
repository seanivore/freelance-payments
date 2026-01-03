# v4 Schema Migration - File Audit

**Generated**: 2025-01-28  
**Status**: In Progress

## File Categories

- ✅ **updated** - Already updated for v4 schema
- 🔄 **needs_update** - Requires v4 schema updates
- ❌ **delete** - Should be removed (legacy/unused)
- ✅ **good_as_is** - No changes needed

---

## Python Scripts (`.github/scripts/`)

### Orchestration
- 🔄 `.github/scripts/orchestration/orchestrate_workflow.py` - **needs_update**
  - Update docstring from "v3 schema" to "v4 schema"
  - Add PDF generation step after `sync_catalog.py`
  - Update all schema references in comments

- 🔄 `.github/scripts/orchestration/sync_catalog.py` - **needs_update**
  - Update all field references: `product_object` → `product`, `customer_object` → `customer`, etc.
  - Fix `state_management.object_id` → `state.objects`
  - Fix `initial_price_object` → `price1`, `balance_price_object` → `price2`
  - Remove all `metadata` nesting checks
  - Fix variable naming: `product_obj` → `product`, `customer_obj` → `customer`
  - Remove old v1/v2 references (`_metadata`, `stripe_product_id`, `sync` flags)
  - Update checkout session references: `initial_checkout_session` → `checkout_session_1`

### State Management
- 🔄 `.github/scripts/state/update_state.py` - **needs_update**
  - Update all `state_management` → `state` references
  - Update `initial_payment_intent` → `payment_1`, `balance_payment_intent` → `payment_2`
  - Update field paths: `state.client_status.*`

### Utilities
- 🔄 `.github/scripts/utils/json_io.py` - **needs_update**
  - Update `find_job_file()` to check `product.id` instead of `product_object.id`
  - **CRITICAL**: Remove all v1/v2 validation code (lines 231-246 checking for `_metadata`, `stripe_product_id`, `sync` flags)
  - Remove old schema compatibility checks
  - Update validation logic for v4 schema only
  - Remove references to `price[]` array (v4 uses `price1` and `price2` objects)

### Manifest Generation
- 🔄 `.github/scripts/generate_manifest.py` - **needs_update**
  - Update field paths: `product.login_name`, `product.login_keyword` (no `metadata` nesting)
  - Update `product.id` access (not `product_object.id`)
  - Fix `datetime.utcnow()` deprecation → `datetime.now(UTC)`

### PDF Generation (NEW)
- ⭐ `.github/scripts/pdf/generate_pdfs.py` - **NEW FILE**
  - Create new script with OAuth authentication
  - Implement placeholder replacement using Docs API
  - Export PDFs, calculate SHA256, save to repo
  - Update job JSON with `docs.contract` and `docs.invoice` fields

---

## JavaScript Files (`assets/js/`)

- 🔄 `assets/js/payment-lookup.js` - **needs_update**
  - Update manifest entry structure access (if manifest format changed)

- 🔄 `assets/js/payment-router.js` - **needs_update**
  - Update `state_management` → `state`
  - Update `initial_price_object` → `price1`, `balance_price_object` → `price2`
  - Update `initial_payment_intent` → `payment_1`, `balance_payment_intent` → `payment_2`

- 🔄 `assets/js/contract-controller.js` - **needs_update**
  - Update all field path references (see schema changelog)
  - **CRITICAL**: Add PDF embedding logic (iframe/embed)
  - **CRITICAL**: Remove ALL HTML fallback rendering
  - Add download button for PDF
  - Add signature modal trigger

- 🔄 `assets/js/invoice-controller.js` - **needs_update**
  - Update all field path references
  - **CRITICAL**: Add PDF embedding logic
  - **CRITICAL**: Remove ALL HTML rendering code
  - Calculate `amount_due` and `amount_paid` based on payment state logic

- 🔄 `assets/js/checkout-controller.js` - **needs_update**
  - Update `initial_price_object` → `price1`, `balance_price_object` → `price2`
  - Update `customer_object.id` → `customer.id`
  - Update `coupon_object` → `coupon`
  - Update `product_object.id` → `product.id`
  - Update payment status checks: `state.payment_1.succeeded`

---

## API Endpoints (`api/`)

- 🔄 `api/create-checkout-session.js` - **needs_update**
  - Fix `customer.id` reference (syntax error: should access `jobData.customer.id`)

- 🔄 `api/sign-contract.js` - **needs_update**
  - Update state management paths: `state.client_status.signed_contract`

- 🔄 `api/update-payment.js` - **needs_update**
  - Update payment intent paths: `state.payment_1.succeeded`, `state.payment_2.succeeded`
  - Update checkout session references

- 🔄 `api/track-event.js` - **needs_update**
  - Update `state.client_status` paths

- 🔄 `api/webhook.js` - **needs_update**
  - Update payment status updates for v4 schema
  - Update `state.payment_1` and `state.payment_2` based on payment completed

---

## HTML Templates

- 🔄 `job.html` - **needs_update**
  - Add PDF viewer container with styling (paper-like appearance, shadow)
  - Add signature modal component (shadcn UI)
  - Add download buttons for contract and invoice PDFs
  - Update contract and invoice sections to use PDF embedding

- ✅ `index.html` - **good_as_is**
  - No schema dependencies

- ✅ `404.html` - **good_as_is**
  - SPA routing handler, no schema dependencies

---

## Workflows (`.github/workflows/`)

- ✅ `.github/workflows/orchestrate.yml` - **good_as_is**
  - No schema-specific logic

- ✅ `.github/workflows/pages-build.yml` - **good_as_is**
  - Static site build, no schema dependencies

---

## Documentation

- 🔄 `assets/docs/v4/v4_UPDATE.md` - **needs_update**
  - Complete and finalize
  - Update authentication section to reflect OAuth as primary
  - Remove outdated code snippets

- ⭐ `assets/docs/v4/AI_CONTEXT_PRIMER.md` - **NEW/UPDATE**
  - Create/update with v4 schema documentation
  - Add PDF generation workflow (OAuth authentication)
  - Update architecture diagrams

---

## Summary

- **Total Files**: 20+
- **Needs Update**: 18 files
- **New Files**: 2 files (`generate_pdfs.py`, `AI_CONTEXT_PRIMER.md`)
- **Delete**: 0 files (no legacy files identified yet)
- **Good As Is**: 3 files

---

## Implementation Priority

1. **Phase 1**: Create PDF generation script (foundation)
2. **Phase 2**: Update Python scripts (backend logic)
3. **Phase 3**: Update JavaScript files (frontend)
4. **Phase 4**: Update API endpoints (serverless functions)
5. **Phase 5**: Update HTML templates (UI)
6. **Phase 6**: Update documentation (reference)
