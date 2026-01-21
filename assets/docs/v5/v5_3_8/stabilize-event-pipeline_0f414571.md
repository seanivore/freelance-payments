---
name: stabilize-event-pipeline
overview: Stabilize event processing by consolidating workflow triggers to a single endpoint, simplifying GitHub Actions commit logic, removing unused endpoints/scripts, and ensuring deploy happens only after JSON updates are finalized.
todos:
  - id: consolidate-events
    content: Consolidate dispatch to track-event only
    status: completed
  - id: remove-legacy
    content: Remove sign-contract + user_behavior artifacts
    status: completed
  - id: simplify-git
    content: Simplify user-exit-events git flow
    status: completed
  - id: deploy-order
    content: Gate deploy after successful commit
    status: completed
  - id: update-docs
    content: Update PAYMENTS_PLATFORM.md for new flow
    status: completed
---

# Stabilize Event Pipeline

## Key observations

- `api/track-event.js` already batches events and dispatches `user-exit-events.yml`, but other endpoints still exist and can confuse the flow. See [api/track-event.js](/Users/seanivore/Development/freelance-payments/api/track-event.js).
- `api/sign-contract.js` dispatches `user-behavior.yml`, which does not exist in `.github/workflows` and appears legacy; `user_behavior.py` is also legacy. See [api/sign-contract.js](/Users/seanivore/Development/freelance-payments/api/sign-contract.js) and [.github/scripts/orchestration/user_behavior.py](/Users/seanivore/Development/freelance-payments/.github/scripts/orchestration/user_behavior.py).
- `user-exit-events.yml` contains complex git merge/rebase/reset logic that can mask provenance and create confusing logs. See [.github/workflows/user-exit-events.yml](/Users/seanivore/Development/freelance-payments/.github/workflows/user-exit-events.yml).

## Plan

1) **Consolidate workflow triggers to a single endpoint**

- Make `api/track-event.js` the only dispatcher to `user-exit-events.yml` and explicitly document this in code comments and log output. Keep batch handling only.
- Update frontend event emission to always send a single batched payload for a session (verify where batching happens in `src/App.tsx` and ensure all gate events flow into one batch).
- Ensure `api/webhook.js` remains non-dispatching (log only), and `api/session-status.js` is read-only for UI state (no workflow triggers).

2) **Remove legacy endpoints and scripts now (per your preference)**

- Remove `api/sign-contract.js` (dispatches a non-existent workflow) and any other unused endpoints tied to the old `user-behavior` flow.
- Remove `.github/scripts/orchestration/user_behavior.py` if no workflow references it.
- Scan for any references to `user-behavior.yml`/`user_behavior.py` and delete or update those references to the consolidated flow.

3) **Simplify `user-exit-events.yml` git logic and commit flow**

- Replace the current merge/reset/reprocess block with a deterministic, linear flow:
- `git fetch origin freelance-payments`
- `git checkout freelance-payments` (ensure branch)
- `git pull --rebase origin freelance-payments`
- run `user_exit_events.py` once with the payload
- `git add assets/jobs/*.json`
- commit only if staged changes exist
- `git push origin freelance-payments`
- Add clearer logging: print the payload event count, job_id, and a hash of the payload for traceability.

4) **Deploy ordering: only after JSON updates are committed**

- Ensure `Trigger Vercel Deploy` only runs after a successful commit/push step with changes. Keep the `NEEDS_DEPLOY` gating.
- If the Vercel deploy hook is removed, explicitly log that deploy is expected from push so the workflow output is unambiguous.

5) **Clean up docs to match the new single-dispatch architecture**

- Update [assets/docs/PAYMENTS_PLATFORM.md](/Users/seanivore/Development/freelance-payments/assets/docs/PAYMENTS_PLATFORM.md) to reflect:
- single workflow trigger (`/api/track-event` only)
- `api/webhook.js` is log-only
- `api/session-status.js` is UI feedback only
- removed endpoints/scripts

## Tests / Verification

- Manual: run a single full flow with a fresh job, confirm:
- only one workflow run per batched event submission
- JSON file updated with all timestamps
- login after payment_1 routes to balance
- Vercel deploy linked to the commit that contains the JSON update
- Logs: capture the workflow logs showing payload count and commit SHA from `user-exit-events.yml`.