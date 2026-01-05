# Debug Report: Stripe IDs Not Saving to JSON Files

## Issue Summary
Stripe objects (Products, Prices, Customers) are being created successfully in Stripe catalog, but the Stripe IDs are not being saved back to the JSON files in `state.objects`.

## Investigation Findings

### Code Flow Analysis

1. **sync_catalog.py** (line 529): Calls `sync_job(job_data, ...)` which modifies `job_data` in place
2. **sync_job** (lines 274, 284, 299, 308, 320): Updates `state_objects` dict with Stripe IDs
3. **sync_catalog.py** (line 538): Calls `save_job(job_id, job_data, ...)` to save the modified data
4. **save_job** (json_io.py line 80): Writes JSON file to disk

### Local Testing Results
✅ `save_job` function works correctly locally - test file saved and loaded successfully with Stripe IDs preserved

### Potential Issues Found

#### Issue 1: Path Resolution in GitHub Actions
- `save_job` uses `find_job_file` which resolves paths relative to script location
- In GitHub Actions, working directory might differ, causing path resolution issues
- **Fix**: Ensure `save_job` always uses absolute paths or resolves relative to project root consistently

#### Issue 2: Git Stash/Pop Conflicts
- Orchestrator stashes changes, pulls, then pops stash (line 132-134)
- If stash pop has conflicts, files might be in conflicted state
- Comment says "we'll add the files anyway" but conflicted files might not be added correctly
- **Fix**: Check stash pop result and handle conflicts explicitly

#### Issue 3: Exception Swallowing
- `sync_catalog.py` line 543 catches all exceptions and continues
- If `save_job` raises an exception, it's caught and logged but workflow continues
- **Fix**: Ensure save errors are properly reported and don't silently fail

#### Issue 4: File Write Permissions
- GitHub Actions might have different file permissions
- **Fix**: Ensure directory exists and is writable before saving

## Fixes Applied

### Fix 1: Improved Error Handling in save_job ✅
- Added comprehensive error logging with tracebacks
- Added file existence verification after write
- Added content verification (checks state.objects structure)
- Now catches all exceptions, not just IOError

### Fix 2: Ensure Absolute Paths ✅
- Modified `save_job` to always resolve paths absolutely
- Ensures `job_path` is absolute before writing
- Explicitly creates parent directory if missing
- Logs absolute path for debugging

### Fix 3: Improved Git Stash/Pop Handling ✅
- Added error checking for stash operations
- Better handling of stash pop conflicts
- If stash pop fails, drops stash and relies on files in working directory
- More robust error messages

### Fix 4: Added Save Verification in sync_catalog ✅
- After saving, reloads file to verify Stripe IDs were written correctly
- Compares saved Stripe IDs with expected values
- Raises IOError if save fails (prevents silent failures)
- Logs verification results for debugging

## Testing Recommendations

1. **Monitor workflow logs for:**
   - "Successfully saved and verified job" messages (confirms save + verification worked)
   - "Saved file but Stripe IDs don't match" warnings (indicates save/load mismatch)
   - "Failed to save job" errors (indicates write failure)
   - IOError exceptions (now raised explicitly, will stop workflow)

2. **Verify in GitHub Actions:**
   - Check that absolute paths are logged correctly
   - Confirm files are written to correct location
   - Verify git picks up changes after save

3. **If issues persist:**
   - Check file permissions in GitHub Actions
   - Verify working directory is correct
   - Check for .gitignore rules blocking files
   - Review git stash/pop output for conflicts

## Files Modified

- `.github/scripts/utils/json_io.py`: Enhanced `save_job` with absolute path resolution, verification, and better error handling
- `.github/scripts/orchestration/sync_catalog.py`: Added save verification and explicit error raising
- `.github/scripts/orchestration/orchestrate_workflow.py`: Improved git stash/pop conflict handling
