# Archiving Behavior Documentation

## Overview

This document explains how product archiving works in the freelance-payments system, including when products are archived, how the matching logic works, and common edge cases.

## Current Matching Logic

**Important**: We currently use **manifest.json** as the intermediary between JSON directory and Stripe catalog, not direct Stripe API queries.

### Why Manifest Instead of Direct Stripe Catalog Query?

**Previous Approach** (what you're asking about):
- Compare JSON directory directly to Stripe catalog by querying Stripe API
- **Pros**: Single source of truth (Stripe), no intermediary
- **Cons**: Requires API calls for every product, slower, rate limits, more complex

**Current Approach** (what we're using now):
- Use `manifest.json` as a cache/index of "previously synced jobs"
- Compare JSON directory to manifest, then sync differences to Stripe
- **Pros**: Fast, no API calls needed for comparison, lighter weight, simpler logic
- **Cons**: Manifest can get out of sync if workflow fails mid-process (rare)

**Key Point**: We're NOT directly comparing JSON directory to Stripe catalog. We're comparing:
- **JSON directory** (current state) vs **manifest.json** (previously synced state)
- Then syncing differences TO Stripe catalog

### Matching Flow

1. **Load Sources**:
   - Load `manifest.json` → Extract `job_id`s (represents "previously synced jobs")
   - Scan `assets/jobs/` directory → Extract `job_id`s from JSON filenames (represents "current jobs")

2. **Compare Sets**:
   - `manifest_job_ids` = Set of job_ids from manifest entries
   - `json_job_ids` = Set of job_ids from JSON filenames

3. **Decision Logic** (in order):

   **First Pass: Handle Inactive/Complete Jobs**
   - For each JSON file:
     - If `product.active = false` OR all payments complete → Check if Stripe product exists
     - If Stripe product exists → Archive Stripe product + Delete JSON file
     - If no Stripe product → Delete JSON file only

   **Second Pass: Handle Active Jobs**
   - For each JSON file with `product.active = true`:
     - If `job_id` in manifest → Skip (already synced)
     - If `job_id` NOT in manifest → Create Stripe objects (new job)

   **Third Pass: Handle Orphaned Products**
   - Find `manifest_job_ids - json_job_ids` (in manifest but no JSON file)
   - For each orphaned job_id → Archive Stripe product

## Why Manifest Instead of Direct Stripe Query?

**Previous Approach**: Compare JSON directory directly to Stripe catalog
- **Pros**: Single source of truth (Stripe)
- **Cons**: Requires API calls for every product, slower, rate limits

**Current Approach**: Use manifest.json as cache
- **Pros**: Fast, no API calls needed for comparison, lighter weight
- **Cons**: Manifest can get out of sync if workflow fails mid-process

## Archiving Triggers

Products are archived in these scenarios:

1. **All Payments Complete**: 
   - `payment_1.succeeded` and `payment_2.succeeded` both have timestamps
   - `completed_payment_count >= product.total_payments`
   - → Archive Stripe product + Delete JSON file

2. **Manual Deactivation**:
   - `product.active = false` in JSON
   - → Archive Stripe product + Delete JSON file (if Stripe product exists)

3. **Orphaned Products**:
   - Job ID exists in manifest but JSON file deleted
   - → Archive Stripe product (JSON already gone)

## Common Edge Cases

### Case 1: Vercel Rate Limits
- **Symptom**: Workflow runs but gets rate-limited mid-process
- **Impact**: Manifest might not update, archiving might not complete
- **Solution**: Wait for rate limit reset, re-run workflow

### Case 2: Overlapping Automations
- **Symptom**: Multiple workflows running simultaneously
- **Impact**: Race conditions, manifest conflicts
- **Solution**: Orchestrator handles single `git push` to prevent conflicts

### Case 3: Stripe Product Exists But Not in Manifest
- **Symptom**: Product archived in Stripe but still in manifest
- **Impact**: Next sync will try to archive again (harmless, but noisy)
- **Solution**: `check_stripe_product_exists()` handles already-archived products gracefully

### Case 4: JSON Deleted But Product Still Active in Stripe
- **Symptom**: File deleted manually, product still active
- **Impact**: Orphaned product detection should catch this
- **Solution**: Ensure manifest includes the job_id before deletion

## Manual Archiving Process

For testing cleanup or manual deactivation:

1. **Option A: Set `product.active = false`**:
   ```json
   {
     "product": {
       "id": "uid-test-001",
       "active": false
     }
   }
   ```
   - Push changes
   - Workflow will archive Stripe product + delete JSON

2. **Option B: Delete JSON File**:
   - Delete `assets/jobs/uid-test-001.json`
   - Ensure job_id is in manifest
   - Push changes
   - Workflow will detect orphaned product and archive it

3. **Option C: Archive in Stripe Dashboard**:
   - Manually archive product in Stripe
   - Delete JSON file
   - Update manifest (or let workflow regenerate it)

## Debugging Archiving Issues

Check workflow logs for these DEBUG messages:

- `DEBUG: Job {job_id} marked for archiving Stripe product and deleting JSON`
- `DEBUG: Job {job_id} is orphaned (in manifest but no JSON file) - will archive`
- `DEBUG: Archived product {product_id} (job_id: {job_id})`

If archiving doesn't happen:
1. Check if `check_stripe_product_exists()` returns `True`
2. Verify manifest includes the job_id
3. Check for Vercel rate limits
4. Verify workflow completed successfully

## Future Considerations

**Potential Improvement**: Direct Stripe Catalog Comparison
- Query Stripe for all products with `lookup_key` pattern (`uid-*`)
- Compare directly to JSON directory
- Eliminates manifest as intermediary
- Trade-off: More API calls, but single source of truth

**Current Status**: Manifest-based approach works well for most cases. Edge cases are rare and usually resolve on next workflow run.
