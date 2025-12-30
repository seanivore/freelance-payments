# Fixes Applied - Schema v3 Testing Issues

**Date:** 2025-12-27

## Issue 1: GitHub Pages "Ghost" Workflow ✅ FIXED

### Problem
- Default GitHub Pages build runs automatically on every push ("Triggered via dynamic")
- When JSON files change, this conflicts with orchestrator workflow
- Causes multiple failure/canceled notifications

### Solution
Created `.github/workflows/pages-build.yml` - Custom Pages workflow that:
- **Skips build** when JSON files change (`assets/jobs/*.json`)
- Only builds when other files change (frontend, CSS, etc.)
- Orchestrator workflow handles Pages build after catalog sync

### Note
You may need to **disable automatic Pages builds** in repository settings:
1. Go to Settings → Pages
2. Under "Build and deployment" → Source
3. If set to "GitHub Actions", the custom workflow will be used
4. If set to automatic, you may need to change it

## Issue 2: Price Object ID ✅ FIXED

### Problem
- Stripe Python SDK doesn't allow custom `id` parameter for Price objects
- Only works via bash CLI: `stripe prices create --id="uid-xxx-xxx-1"`
- Causes "unknown parameter: id" error

### Solution
Updated `create_stripe_price()` in `sync_catalog.py`:
- **Uses `lookup_key` instead of `id`** (Stripe's recommended approach)
- `lookup_key` can be your custom identifier (e.g., `uid-xxx-xxx-1`)
- Stripe generates the actual `price_id` (e.g., `price_xyz...`)
- **Stores Stripe-generated `price_id`** in:
  - `state_management.object.price[].initial` or `.balance`
  - `initial_price_object.id` or `balance_price_object.id`

### Example
```python
# Before (didn't work):
price = stripe.Price.create(id="uid-xxx-xxx-1", ...)

# After (works):
price = stripe.Price.create(lookup_key="uid-xxx-xxx-1", ...)
# Returns: price_id = "price_abc123..."
# Store in JSON: initial_price_object.id = "price_abc123..."
```

### Retrieval
To retrieve a price by lookup_key later:
```python
prices = stripe.Price.list(lookup_keys=['uid-xxx-xxx-1'])
```

## Issue 3: sync_catalog.py Logic ✅ FIXED

### Problem
- Script was creating duplicates instead of archiving orphaned products
- Logic didn't properly compare JSON files to manifest entries
- Didn't check `product_object.active` status

### Solution
Completely rewrote `sync_catalog()` function with correct logic:

1. **Gather JSON filenames** → `json_job_ids`
2. **Compare to manifest entries** → `manifest_job_ids`
3. **Categorize jobs:**
   - **Has manifest entry + `product_object.active=false`** → Archive
   - **Has manifest entry + `product_object.active=true`** → Skip (already synced)
   - **Has manifest entry but no JSON file** → Archive (orphaned)
   - **Has JSON file but no manifest entry** → Create all Stripe objects (new)
4. **Archive products** (from categories above)
5. **Create Stripe objects** (only for new jobs)

### Key Changes
- Properly checks `product_object.active` and `balance_price_object.active`
- Archives orphaned products (in manifest but no file)
- Only creates objects for truly new jobs (not in manifest)
- No more duplicate creation!

## Issue 4: Batching Logic ✅ ADDRESSED

### Question
Should we batch JSON updates or update immediately?

### Answer
**Keep immediate updates** (current approach) - See `BATCHING_RESPONSE.md` for details.

**Reasons:**
- Simpler logic (no need to track ID mappings)
- More reliable (partial success is fine)
- Easier debugging
- No performance issues

## Testing Checklist

After these fixes, test:

1. ✅ **Add new JSON file** → Should create all Stripe objects
2. ✅ **Remove JSON file** → Should archive product (not create duplicates)
3. ✅ **Set `product_object.active=false`** → Should archive product
4. ✅ **Push without JSON changes** → Pages build should work normally
5. ✅ **Push with JSON changes** → Pages build should skip, orchestrator handles it
6. ✅ **Price IDs** → Should use Stripe-generated IDs, stored in JSON

## Files Modified

- `.github/workflows/pages-build.yml` (NEW)
- `.github/workflows/skip-pages-build-on-json-changes.yml` (NEW - may not be needed)
- `.github/scripts/orchestration/sync_catalog.py` (MAJOR REWRITE)
- `assets/docs/BATCHING_RESPONSE.md` (NEW)
- `assets/docs/FIXES_APPLIED.md` (THIS FILE)

## Next Steps

1. Test with a single JSON file (add → push → verify) ✅
2. Test removing a JSON file (remove → push → verify archive) ✅
3. Test with `product_object.active=false` (set → push → verify archive) ✅
4. Monitor GitHub Actions for correct workflow behavior ✅
5. Check Stripe dashboard for correct product/price creation ✅
