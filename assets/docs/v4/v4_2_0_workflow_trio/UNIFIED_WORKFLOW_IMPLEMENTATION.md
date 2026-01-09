# Unified Workflow Implementation Status

## ✅ Implemented **HAS SINCE BEEN EDITED, USES DIFFERENT SCRIPTS, DIFFERENT LOGIC**

### 1. **Clear Trigger-Based Logging**
- All workflows now log with `[TRIGGER=admin-push]`, `[TRIGGER=user-behavior]`, or `[TRIGGER=payment]`
- Each step is explicitly logged: `Step 1: Comparing JSONs to catalog`, etc.
- Logs clearly show what's happening and why

### 2. **Unified Sync Flow**
- All three triggers run the same sync logic (via `sync_catalog.py`)
- Steps 2-9 handled internally by sync_catalog.py:
  - Step 2: Archive Stripe products
  - Step 3: Delete JSON files for inactive jobs
  - Steps 4-9: Create Stripe objects, generate PDFs, add artifacts

### 3. **Workflow Queuing**
- Added `concurrency` group to `orchestrate.yml`
- Only one workflow runs at a time
- Workflows automatically queue if another is running

### 4. **Pages Build After Orchestrator**
- Pages workflow uses `workflow_run` trigger
- Always builds after orchestrator completes
- Ensures manifest.json is up-to-date

## ⚠️ Pending Implementation

### 1. **Backend Event Queuing (2 min hold)**
**Current**: Events trigger workflows immediately  
**Needed**: Queue events for 2 minutes of inactivity before triggering workflow

**Challenge**: Vercel serverless functions are stateless - can't maintain in-memory queue

**Options**:
- **Option A**: Use Vercel KV or Upstash Redis for event queue
- **Option B**: Reduce frontend batching from 5min to 2min (simpler)
- **Option C**: Add delay in API before triggering workflow (simple but less efficient)

**Recommendation**: Option B (reduce frontend batching) is simplest and works well for your scale.

### 2. **Workflow Running Check**
**Current**: `check_workflow_running()` is a placeholder  
**Status**: GitHub Actions `concurrency` handles this automatically - no code needed!

## Step Numbering

### TRIGGER=admin-push (Steps 1-12)
1. Compare JSONs to catalog
2-9. Sync catalog logic (internal to sync_catalog.py)
10. Create manifest
11. Build pages
12. Deploy

### TRIGGER=payment (Steps 1-14)
1. Webhook event arrives
2. Update payment status in JSON
3. Compare JSONs to catalog
4-11. Sync catalog logic (internal to sync_catalog.py)
12. Create manifest
13. Build pages
14. Deploy

### TRIGGER=user-behavior (Steps 1-16)
1-3. Event queuing (handled in API - needs implementation)
4. Update JSONs with queued events
5. Compare JSONs to catalog
6-13. Sync catalog logic (internal to sync_catalog.py)
14. Create manifest
15. Build pages
16. Deploy

## Why This Solves Archiving Questions

**Before**: 
- Unclear which workflow did what
- Parallel execution caused confusion
- Manifest conflicts

**After**:
- ✅ Clear logs: `[TRIGGER=admin-push] Step 2: Archiving 1 Stripe product(s)`
- ✅ Sequential execution: Workflows wait for each other
- ✅ Unified logic: All triggers use same sync flow
- ✅ Easy to debug: Just read the logs!

## Next Steps

1. **Test the unified flow** with a push
2. **Implement event queuing** (Option B recommended - reduce frontend batch time)
3. **Monitor logs** to verify clear step-by-step execution
