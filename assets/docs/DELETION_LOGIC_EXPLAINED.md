# Deletion Logic Explained

## How It Works

### Loading Deleted Files from Git History

When you delete or move a file, git keeps the file content in its history. The script uses:

```bash
git show HEAD:{file_path}        # Current commit
git show HEAD~1:{file_path}     # Previous commit
git show HEAD~2:{file_path}     # 2 commits ago
# ... up to 5 commits back
```

This lets us read the JSON file that was deleted to get the `job_id`, even though the file no longer exists in the working directory.

### Your Workflow: Drag & Drop ✅

**Scenario 1: Drag file out of `assets/jobs/` → `assets/docs/`**

Git sees this as:
- **Delete**: `assets/jobs/test-file.json` 
- **Add**: `assets/docs/test-file.json`

The script detects the deletion from `assets/jobs/` and deletes the Stripe products. Perfect! ✅

**Scenario 2: Delete file completely**

Git sees this as:
- **Delete**: `assets/jobs/test-file.json`

Script detects deletion and removes Stripe products. ✅

**Scenario 3: Edit file while it's in `docs/`, then drag back**

1. File in `docs/` → No Stripe products (not in `jobs/`)
2. Drag back to `jobs/` → Git sees as "add" → Creates Stripe products ✅

All your workflows work perfectly!

---

## Archive vs Delete

I changed it to **DELETE** instead of archive because:

### Your Use Case:
- **Accidental adds**: "Whoops, that wasn't ready" → Should be GONE, not hidden
- **Old projects**: Keep JSON files for records, but don't need Stripe products cluttering catalog
- **Clean catalog**: Only active jobs should have products

### Delete vs Archive:

| Action | What Happens | Use Case |
|--------|--------------|----------|
| **Delete** | Product completely removed from Stripe | ✅ Your use case - clean catalog |
| **Archive** | Product hidden but still exists | E-commerce "sold out" items |

**For freelance payments**: DELETE makes more sense. If you need records, keep the JSON files. Stripe products are just for active payments.

---

## What Gets Deleted

When a JSON file is removed from `assets/jobs/`:

1. Script detects deletion via `git diff`
2. Loads deleted file from git history
3. Extracts `job_id` from the JSON
4. Finds ALL Stripe products with that `job_id` in metadata
5. Deletes ALL of them (handles multi-payment jobs)

**Example:**
- Job `uid-test-002` has 3 payments → 3 Stripe products
- Delete `uid-test-002.json`
- All 3 products get deleted ✅

---

## Edge Cases Handled

✅ **File never committed**: Uses filename as `job_id` fallback  
✅ **File moved to other folder**: Detects as deletion from `jobs/`  
✅ **Multiple payments**: Deletes all products for that job  
✅ **Git history deep**: Searches up to 5 commits back  
✅ **Template files**: Skips `_job_template.json`  

---

## Testing Your Workflow

1. **Drag test file out** → `assets/jobs/test-single-payment.json` → `assets/docs/`
2. **Commit and push**
3. **Check Stripe Dashboard** → Product should be deleted
4. **Drag it back** → `assets/docs/` → `assets/jobs/`
5. **Commit and push**
6. **Check Stripe Dashboard** → Product should be recreated

This matches exactly how you'd use it! 🎯
