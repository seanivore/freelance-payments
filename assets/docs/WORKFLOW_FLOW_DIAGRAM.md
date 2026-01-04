# Workflow Flow Diagram - Understanding the 3 Systems

## The Three Systems

### 1. **Vercel** (Not a GitHub Action)
- **Type**: External service, connected to your GitHub repo
- **Triggers**: Auto-deploys on EVERY push to `freelance-payments` branch
- **What it does**: Deploys API endpoints (`/api/*` serverless functions)
- **Visible in**: GitHub commit checks (shows as "Vercel - Deployment")
- **NOT visible in**: GitHub Actions tab (it's external)

### 2. **GitHub Pages Build** (GitHub Action)
- **Type**: GitHub Actions workflow
- **Triggers**: 
  - `on: push` (every push)
  - `on: workflow_run` (after Orchestrate Workflow completes)
- **What it does**: Builds static site (HTML, CSS, JS, manifest.json) → deploys to GitHub Pages
- **Visible in**: GitHub Actions tab AND commit checks

### 3. **Orchestrate Workflow** (GitHub Action)
- **Type**: GitHub Actions workflow  
- **Triggers**: 
  - `on: push` (when JSON files change)
  - `on: workflow_dispatch` (manual/API trigger)
- **What it does**: Syncs Stripe catalog, generates PDFs, updates manifest.json, commits changes
- **Visible in**: GitHub Actions tab AND commit checks
- **Can commit**: Yes (author: "GitHub Action" or "actions-user")

## The Flow Problem (Current State)

### When You Push a JSON File:

```
Your Push (author: seanivore)
  │
  ├─→ Vercel: Auto-deploys API ✅ (always runs, external)
  │
  ├─→ Pages Build: Starts building immediately ⚠️ (builds OLD manifest)
  │   └─→ Deploys stale manifest.json
  │
  └─→ Orchestrator: Starts running
      ├─→ Syncs Stripe catalog
      ├─→ Generates PDFs
      ├─→ Updates manifest.json ✅
      └─→ Commits (author: "GitHub Action")
           │
           └─→ This commit triggers ANOTHER push event
                │
                ├─→ Vercel: Auto-deploys again ✅
                │
                ├─→ Pages Build: SKIPS (author is "GitHub Action") ❌
                │   └─→ Never rebuilds with NEW manifest!
                │
                └─→ Orchestrator: SKIPS (no JSON changes) ✅
```

## The Manifest Conflict Risk

**YES, there IS a conflict risk:**

1. **Pages builds first** → Reads OLD manifest.json → Deploys it
2. **Orchestrator runs** → Updates manifest.json → Commits it
3. **Pages never rebuilds** → Live site has OLD manifest ❌

**Result**: Login fails because manifest is stale!

## Why Number of Workflows Changes

### Scenario A: You push CSS/HTML (no JSON)
```
1. Vercel deploys ✅
2. Pages builds ✅
3. Orchestrator: SKIPS (no JSON changes)
```
**Total: 2 workflows**

### Scenario B: You push JSON file
```
1. Vercel deploys ✅
2. Pages builds ✅ (but with old manifest)
3. Orchestrator runs ✅
   └─→ Commits → triggers another push
        ├─→ Vercel deploys again ✅
        └─→ Pages: SKIPS ❌
```
**Total: 3-4 workflow runs** (but Pages only builds once, with wrong manifest)

### Scenario C: Orchestrator commits (from previous run)
```
1. Vercel deploys ✅
2. Pages: SKIPS (author is "GitHub Action") ❌
3. Orchestrator: SKIPS (no JSON changes)
```
**Total: 1 workflow** (just Vercel)

## The "Third One That Isn't in Actions"

That's **Vercel**! It's:
- ✅ Connected to your GitHub repo
- ✅ Shows up in commit checks
- ❌ NOT a GitHub Action (it's external)
- ❌ NOT visible in Actions tab

## The Solution (What We Just Changed)

We updated `pages-build.yml` to use `workflow_run`:

```yaml
on:
  push:
    branches: [freelance-payments]
  workflow_run:
    workflows: ["Orchestrate Workflow"]
    types: [completed]
```

**New Flow:**
```
Your Push
  ├─→ Vercel: Deploys ✅
  ├─→ Pages: Waits... ⏸️
  └─→ Orchestrator: Runs
      └─→ Updates manifest → Commits
          │
          ├─→ Vercel: Deploys again ✅
          │
          └─→ Pages: Triggers AFTER orchestrator finishes ✅
              └─→ Builds with NEW manifest ✅
```

**Result**: Pages always builds AFTER manifest is updated!

## Optimization Opportunities

### Option 1: Current Fix (workflow_run)
- ✅ Pages waits for orchestrator
- ✅ Always builds with fresh manifest
- ⚠️ Still builds twice sometimes (your push + orchestrator commit)

### Option 2: Remove Skip Entirely
- ✅ Simpler logic
- ✅ Always builds (even if duplicate)
- ⚠️ Wastes resources on duplicate builds

### Option 3: Only Build After Orchestrator
- ✅ Most efficient
- ✅ Only builds when manifest changes
- ⚠️ Doesn't build for CSS/HTML-only changes

### Option 4: Conditional Build
- ✅ Builds immediately for non-JSON changes
- ✅ Waits for orchestrator for JSON changes
- ⚠️ More complex logic

## Recommendation

**Keep the `workflow_run` approach** - it ensures Pages always has the latest manifest while still building for non-orchestrator changes.


---

I wish that they all just said what they were doing 

Like this isn't even as simple as it seems like it could be but why not just: 

## Three Trigger Categories

### 1. **TRIGGER=admin-push** (Admin Started)
**When**: Admin pushes JSON files to repo  
**Behavior**: Starts immediately when admin pushes

**Flow:**
1. Compare JSONs to catalog
2. Unmatched: JSON but no catalog, if `json.active=true` → create catalog object
   - (2a) Add all artifacts to JSON from new objects
   - (2b) Create and move PDF for these new active JSON with objects
   - (2c) Add all artifacts to JSON from new PDFs
3. Unmatched: JSON but no catalog, if `json.active=false` → delete JSON
4. Unmatched: Catalog but no JSON, if `catalog.active=true` → modify catalog `active=false`
5. Unmatched: Catalog but no JSON, if `catalog.active=false` → ignore
6. Matched: `catalog.active=false`, `json.active=true` → delete JSON
7. Matched: `catalog.active=false`, `json.active=false` → delete JSON
8. Matched: `catalog.active=true`, `json.active=false` → modify catalog to `active=false`, delete JSON
9. Matched: `catalog.active=true`, `json.active=true` → ignore
10. Create new manifest that reflects resulting JSON directory
11. Build pages
12. Deploy

### 2. **TRIGGER=user-behavior** (Non-Payment Events)
**When**: User behavior events (contract loaded, scrolled, signed, etc.)  
**Behavior**: Waits for 2 minutes of inactivity, then processes

**Flow:**
1. Events arrive from frontend (already batched client-side: 5 min OR page unload)
2. Queue events in backend
3. Wait 2 minutes of no new events
4. After inactivity period → update JSONs with all queued events
5. Compare JSONs to catalog
6. Unmatched: JSON but no catalog, if `json.active=true` → create catalog object
   - (6a) Add all artifacts to JSON from new objects
   - (6b) Create and move PDF for these new active JSON with objects
   - (6c) Add all artifacts to JSON from new PDFs
7. Unmatched: JSON but no catalog, if `json.active=false` → delete JSON
8. Unmatched: Catalog but no JSON, if `catalog.active=true` → modify catalog `active=false`
9. Unmatched: Catalog but no JSON, if `catalog.active=false` → ignore
10. Matched: `catalog.active=false`, `json.active=true` → delete JSON
11. Matched: `catalog.active=false`, `json.active=false` → delete JSON
12. Matched: `catalog.active=true`, `json.active=false` → modify catalog to `active=false`, delete JSON
13. Matched: `catalog.active=true`, `json.active=true` → ignore
14. Create new manifest that reflects resulting JSON directory
15. Build pages
16. Deploy

### 3. **TRIGGER=payment** (Stripe Webhook)
**When**: Payment completes (Stripe webhook)  
**Behavior**: Processes within 1 minute (doesn't need to interrupt, but fast)

**Flow:**
1. Webhook event arrives (payment succeeded)
2. Update payment status in JSON immediately
3. Compare JSONs to catalog
4. Unmatched: JSON but no catalog, if `json.active=true` → create catalog object
   - (4a) Add all artifacts to JSON from new objects
   - (4b) Create and move PDF for these new active JSON with objects
   - (4c) Add all artifacts to JSON from new PDFs
5. Unmatched: JSON but no catalog, if `json.active=false` → delete JSON
6. Unmatched: Catalog but no JSON, if `catalog.active=true` → modify catalog `active=false`
7. Unmatched: Catalog but no JSON, if `catalog.active=false` → ignore
8. Matched: `catalog.active=false`, `json.active=true` → delete JSON
9. Matched: `catalog.active=false`, `json.active=false` → delete JSON
10. Matched: `catalog.active=true`, `json.active=false` → modify catalog to `active=false`, delete JSON
11. Matched: `catalog.active=true`, `json.active=true` → ignore
12. Create new manifest that reflects resulting JSON directory
13. Build pages
14. Deploy

**Why payment doesn't need to interrupt:**
- If something was about to be updated as missing, it will happen regardless
- Sync flow compares changes → handles conflicts automatically
- No win/fail scenario - just ensures cleanup happens

## Concurrency Rules

**All three categories:**
- ✅ Wait for each other (no parallel execution)
- ✅ Never run over each other
- ✅ Queue if another workflow is running
- ✅ Process queue when current workflow finishes

**Why this works:**
- Sync flow compares changes → handles conflicts automatically
- Payment doesn't need to interrupt → if something was about to be updated, it will happen anyway
- Both user-behavior and payment can trigger the same cleanup flow (admin-push logic)

## Why This Design Works

**Yes, it really works!** Here's why:

1. **Sync flow compares current state** → No conflicts because it reads what's actually there
2. **Sequential execution** → No race conditions, each workflow sees the final state from the previous one
3. **Same logic for all triggers** → Consistency, easier to debug, clear logs
4. **Payment doesn't interrupt** → If something was about to be updated, the sync will catch it anyway

**The key insight:** The sync flow doesn't care *how* the JSON got updated - it just compares what exists now vs what should exist. So whether admin pushed, user signed contract, or payment completed - the sync handles it the same way.

## Logging Clarity

**This is the best part!** Each workflow will clearly log:

```
[TRIGGER=admin-push] Starting sync flow...
[TRIGGER=admin-push] Step 1: Comparing JSONs to catalog
[TRIGGER=admin-push] Step 2: Creating catalog objects for new active JSONs
[TRIGGER=admin-push] Step 10: Generating manifest
[TRIGGER=admin-push] Step 11: Building pages
[TRIGGER=admin-push] Step 12: Deploying
```

vs

```
[TRIGGER=user-behavior] Step 1: Events arrived from frontend
[TRIGGER=user-behavior] Step 2: Queuing events in backend
[TRIGGER=user-behavior] Step 3: Waiting 2 minutes for inactivity...
[TRIGGER=user-behavior] Step 4: Updating JSONs with queued events
[TRIGGER=user-behavior] Step 5: Comparing JSONs to catalog
...
```

**Every log line tells you exactly what's happening and why!** No more guessing which workflow did what.

## Implementation Status

- ✅ **Frontend batching**: Already exists (5 min inactivity OR page unload)
- ⚠️ **Backend queuing**: Needs implementation (2 min hold for user-behavior)
- ⚠️ **Workflow queuing**: Needs implementation (wait if another workflow running)
- ✅ **Unified sync flow**: All three triggers use the same logic (steps 1-12), just with different entry points 