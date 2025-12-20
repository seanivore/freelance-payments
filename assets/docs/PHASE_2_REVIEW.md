# Phase 2 Schema Design - Review Checklist

**Created:** 2025-12-20
**Status:** Ready for review

---

## What's Ready

### 1. Documentation Created

✅ **`SCHEMA_TRANSFORMATION.md`** - Complete schema reference
- Side-by-side OLD vs NEW comparison
- Field-by-field mapping table
- Key changes highlighted
- Migration rules
- Validation checklist
- Full migration script outline

✅ **`_job_template_v2.json`** - New schema template
- Shows final structure
- All new fields documented
- Ready to use for new jobs after migration

### 2. Key Design Decisions to Review

#### Decision 1: Product Structure
**Current:** Each payment has its own `stripe_product_id` (BUG!)
**Proposed:** ONE product object, ALL prices reference same ID

```json
{
  "product": {
    "metadata": {"stripe_product_id": "prod_ABC123"}
  },
  "prices": [
    {"product": "prod_ABC123"},  // Same ID
    {"product": "prod_ABC123"}   // Same ID
  ]
}
```

**Question:** Does this match your understanding of how Stripe should work?

#### Decision 2: Field Names
**Renamed fields:**
- `payments[]` → `prices[]` (matches Stripe)
- `status` → `payment_status` (more specific)
- `description` → `nickname` (matches Stripe)
- `amount` → `unit_amount` (matches Stripe)

**Question:** Are these renames clear? Any concerns?

#### Decision 3: Currency Format
**Current:** `"amount": 1250.00` (dollars, float)
**Proposed:** `"unit_amount": 125000` (cents, integer)

**Reason:** Avoids floating-point precision issues, matches Stripe API

**Question:** Frontend can handle converting cents to dollars for display?

#### Decision 4: State Flags
**New flags:**
- `section_updated: true/false` - Triggers Stripe sync
- `active: true/false` - Mirrors Stripe's archiving state

**Question:** Does this state management approach make sense?

#### Decision 5: Removed Fields
**Removed (duplicates):**
- `invoice_number` (same as job_id)
- `stripe_metadata.client_last_name` (in client.last_name)
- `stripe_metadata.project_keyword` (moved to top level)

**Kept (legacy compatibility):**
- All contract fields
- Old signature fields (contractor_signature, etc.)

**Question:** Anything we're removing that you still need?

#### Decision 6: New Signatures Structure
**Added nested structure:**
```json
{
  "contract": {
    "signatures": {
      "contractor": {"name": null, "date": null},
      "client": {"name": null, "date": null}
    },
    "contractor_signature": null,  // Legacy field kept
    "contractor_date": null,       // Legacy field kept
    "client_date": null            // Legacy field kept
  }
}
```

**Question:** Should we populate the new structure from old fields during migration?

---

## Review Questions

### Schema Structure

1. **Does the new schema make sense?**
   - [ ] Product/Price relationship is clear
   - [ ] Field names are intuitive
   - [ ] No critical data is lost

2. **Are the state flags appropriate?**
   - [ ] `section_updated` for sync detection
   - [ ] `active` for Stripe archiving
   - [ ] `payment_status` for payment workflow

3. **Is the metadata organization logical?**
   - [ ] Stripe IDs in metadata objects
   - [ ] job_id at top level (single source of truth)
   - [ ] No unnecessary duplication

### Migration Approach

4. **Do the migration rules make sense?**
   - [ ] All old data preserved
   - [ ] Initial sync flags set correctly
   - [ ] Currency conversion (dollars → cents)
   - [ ] Product ID normalization

5. **Is the validation checklist complete?**
   - [ ] Pre-migration steps
   - [ ] Post-migration verification
   - [ ] Stripe re-sync process
   - [ ] Frontend update requirements

### Implementation

6. **Should we proceed with migration script?**
   - [ ] Script outline looks good
   - [ ] Ready to implement Phase 2
   - [ ] Any changes needed first?

---

## Next Steps (After Review)

### If Approved:
1. Implement migration script (`.github/scripts/migration/migrate_schema.py`)
2. Test on template file
3. Run migration on all jobs
4. Commit migrated files
5. Run Stripe re-sync
6. Update frontend code

### If Changes Needed:
1. Update `SCHEMA_TRANSFORMATION.md`
2. Update `_job_template_v2.json`
3. Re-review before proceeding

---

## Files to Review

**Primary:**
- `assets/docs/SCHEMA_TRANSFORMATION.md` - Complete reference
- `assets/jobs/_job_template_v2.json` - New schema example

**Compare with:**
- `assets/jobs/_job_template.json` - Old schema
- `assets/docs/MODULAR_REFACTOR_WALKTHROUGH.md` - Original plan

---

## Questions for You

1. **Schema structure:** Does the new structure make sense? Any fields you'd change?

2. **Migration approach:** Should we set all `section_updated: true` to force re-sync? Or try to preserve existing Stripe data?

3. **Timing:** Should we migrate all jobs at once? Or test on a few first?

4. **Frontend impact:** Do you know what frontend code needs updating? Or should I scan for it?

5. **Rollback plan:** Keep old template as `_job_template_v1.json` for reference?

---

**Ready to proceed?** Let me know what you think! 🚀
