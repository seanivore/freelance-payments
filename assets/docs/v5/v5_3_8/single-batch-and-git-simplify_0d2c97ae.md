---
name: single-batch-and-git-simplify
overview: Switch event dispatch to single-batch on unload/inactivity only, and simplify both admin-push git logic and local smart-push script to a consistent pull→apply→commit→push flow.
todos:
  - id: single-batch-events
    content: Remove payment-time flush; unload/inactivity only
    status: completed
  - id: admin-push-git
    content: Simplify admin_push.py git commit/push flow
    status: completed
  - id: smart-push
    content: Simplify .gitconfig-smart-push.sh flow
    status: completed
  - id: verify
    content: Verify single-batch and admin-push behavior
    status: completed
---

# Single-Batch Events + Git Simplification

## Scope and intent

- Enforce **single workflow dispatch per session** by removing payment-time flush and relying on inactivity/unload only in the frontend event buffer.
- Simplify git logic in **admin-push** and **smart-push** to match the linear, predictable flow used in `user-exit-events.yml`.

## Plan

1) **Frontend: enforce single-batch dispatch**

- Remove `flushOnPayment()` and any payment-time calls to it in [src/App.tsx](/Users/seanivore/Development/freelance-payments/src/App.tsx).
- Keep only inactivity and unload/pagehide/visibility flush paths.
- Add a brief comment explaining single-batch policy to avoid reintroducing payment flush.

2) **Admin-push: simplify git flow in script**

- Replace `git_commit_and_push()` in [admin_push.py](/Users/seanivore/Development/freelance-payments/.github/scripts/orchestration/admin_push.py) with a linear sequence:
- `git fetch origin freelance-payments`
- `git checkout freelance-payments` (ensure branch)
- `git pull --rebase origin freelance-payments`
- stage changes, commit if staged, push
- Remove stash/pop logic and conflict-avoidance heuristics that are no longer needed under sequential workflow execution.

3) **Local smart-push: simplify workflow**

- Replace conflict-heavy logic in [.gitconfig-smart-push.sh](/Users/seanivore/Development/freelance-payments/.gitconfig-smart-push.sh) with a streamlined version:
- detect staged/unstaged changes
- `git pull --rebase`
- apply local changes (if any), stage, commit, push
- Keep minimal safety checks and clear logging, but remove special-casing of `assets/jobs/*.json` and `manifest.json`.

4) **Verification checklist**

- Run a payment flow and confirm exactly **one** `/api/track-event` call per session.
- Confirm a single `user-exit-events.yml` run per session with full timestamps applied.
- Confirm admin-push still commits/pushes manifests and artifacts as expected.

## Notes

- This trades faster persistence for deterministic single-batch updates, matching your preference.
- If needed later, we can reintroduce payment-time persistence via a guarded cooldown approach.