# Simplified Flow Implementation

**Date:** 2025-12-27

## Overview

Simplified the workflow to always run `sync_catalog.py` and let it determine if changes are needed. This eliminates the need for pre-checking and makes the system more robust.

## How It Works

### Previous Flow (Complex)
```
Push → Check if sync needed → Run sync_catalog → Commit → Push
```

### New Flow (Simple)
```
Push → Always run sync_catalog → Check stats → git_commit_and_push (checks for actual changes)
```

## Key Changes

### 1. orchestrate_workflow.py
- **Always runs `sync_catalog.py`** on push (no pre-checking)
- Checks stats to see if catalog changes were made
- Always calls `git_commit_and_push()` - but it checks for actual changes
- If no changes → git returns False → no commit → no second Pages build ✅

### 2. sync_catalog.py
- Already had the logic to check if changes are needed
- Compares JSON files to manifest
- Checks `product_object.active` status
- Only creates/archives when needed
- Returns stats (all zeros if nothing changed)

### 3. git_commit_and_push()
- Already checks `git status --porcelain` before committing
- Returns False if no changes detected
- Prevents unnecessary commits

### 4. pages-build.yml
- Simplified - removed skip conditions
- With simplified flow, only runs once per push anyway:
  - If sync_catalog makes no changes → no commit → Pages builds from initial push ✅
  - If sync_catalog makes changes → one commit → Pages builds from that commit ✅

## Benefits

1. **Simpler Logic** - No need to detect if sync is needed beforehand
2. **More Reliable** - sync_catalog.py already does all the checking
3. **Fewer Git Commits** - Only commits when there are actual changes
4. **Better for Frequent Updates** - Works well even with many updates
5. **Natural Double-Build Prevention** - No commits = no second Pages build

## Flow Examples

### Example 1: No Changes Needed
```
1. Push with JSON files
2. sync_catalog.py runs
3. Compares files to manifest → all match
4. Checks active status → all active=true
5. Returns stats: all zeros
6. git_commit_and_push() checks git status → no changes
7. Returns False → no commit
8. Pages builds once (from initial push) ✅
```

### Example 2: New File Added
```
1. Push with new JSON file
2. sync_catalog.py runs
3. Compares files to manifest → new file found
4. Creates Stripe objects → updates JSON file
5. Returns stats: products_created=1, prices_created=2, etc.
6. generate_manifest.py runs → updates manifest.json
7. git_commit_and_push() checks git status → changes found
8. Commits and pushes
9. Pages builds once (from commit) ✅
```

### Example 3: File Removed
```
1. Push with JSON file removed
2. sync_catalog.py runs
3. Compares files to manifest → orphaned entry found
4. Archives Stripe product
5. Returns stats: products_archived=1
6. generate_manifest.py runs → updates manifest.json
7. git_commit_and_push() checks git status → changes found
8. Commits and pushes
9. Pages builds once (from commit) ✅
```

## Pages Source Setting

**Keep Pages source set to "GitHub Actions"** - The simplified flow naturally prevents double builds, so the custom workflow will work perfectly.

## Testing

After this update, test:
1. ✅ Push with no JSON changes → Should see no commit, Pages builds once
2. ✅ Push with new JSON file → Should create objects, commit, Pages builds once
3. ✅ Push with removed JSON file → Should archive, commit, Pages builds once
4. ✅ Monitor GitHub Actions → Should see clean, single builds
