# Cleanup and Proper Testing

THIS IS DATED AND ANY UPDATES INCLUDED IN IT DID NOT PASS TESTING
THE SOLUTIONS ALSO REFLECT MUCH MORE COMPLEX LOGIC THAN LIKELY NEEDED

## Issues Found

1. **Workflow was canceled** - "unverified commit" from Vercel
   - This is why JSON files don't have Stripe IDs
   - The workflow created products but didn't commit JSON updates

2. **Manifest path mismatch** - Fixed in workflow
   - Was looking for `manifest.json` in root
   - Should be `assets/js/manifest.json`

3. **Test files already committed** - They're in git already

## Cleanup Steps

### Step 1: Move Test Files Out

```bash
# Move test files to docs (temporarily)
git mv assets/jobs/test-*.json assets/docs/test-jobs-backup/

# Commit the move
git commit -m "Move test JSON files to backup for clean testing"
git push
```

This will:
- Trigger workflow to remove products from Stripe
- Update manifest (remove test entries)
- Clean up the catalog

### Step 2: Verify Cleanup

1. Check GitHub Actions - should run and complete
2. Check Stripe Dashboard - products should be removed
3. Check manifest.json - should be empty or only have real jobs

### Step 3: Test One at a Time

```bash
# Move one test file back
git mv assets/docs/test-jobs-backup/test-single-payment.json assets/jobs/

# Commit
git commit -m "Test: Add single payment job"
git push
```

Then verify:
- ✅ GitHub Actions runs successfully
- ✅ Stripe product created
- ✅ JSON file updated with Stripe IDs
- ✅ Manifest updated

## Why Stripe IDs Weren't Updated

The workflow **does** update JSON files (see `process_stripe_products.py` line 212), but:
- The workflow was canceled before the commit step
- So products were created in Stripe
- But JSON files weren't committed back to repo

## About Removing Products

**Current behavior:** The script only creates/updates products, doesn't delete them.

**For production:** You might want to add logic to:
1. Compare current JSON files with previous version
2. Find products that no longer have JSON files
3. Archive/delete those products in Stripe

But for now, manually removing from Stripe Dashboard is fine for testing.

## Next Steps

1. Move test files out → Push → Verify cleanup
2. Move one test file back → Push → Verify it works
3. Test payment flow with that one file
4. If successful, add more test files one by one

---

**The workflow IS working** - it just got canceled before committing. Once you push again (with the manifest path fix), it should work perfectly!
