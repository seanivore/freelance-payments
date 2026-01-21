# Testing Notes for v5.4.0

---

**Created:** 2026-01-21 
**Focus:** 
+ Single-batch policy implemented, needs testing 
  - Run a payment flow and confirm exactly **one** `/api/track-event` call per session
  - Confirm a single `user-exit-events.yml` run per session with full timestamps applied
+ Check-up on the contract date selector on iOS 
  - The native iOS date picker was wider than the viewport 
  - A quick web search noted not enough padding around it 
  - iOS 26 is buggy so research fixes if needed before changing to different solution 
**Test Files:** 
+ uid-awe-596.json; JoAnn, breath-work-meditation-retreat
+ uid-gdf-021.json; Paul, science-channel
+ uid-yvc-829.json; Dewey, nerd-dates

---

## New Job JSON Files Added 

+ The `admin-push.yml` workflow ran as expected 

--- 

## First Payment Made

+ Desktop `uid-awe-596.json`; Mobile `uid-gdf-021.json`
  - User logged in 
  - Signed contract 
  - Downloaded contract PDF 
  - Viewed invoice 
  - Downloaded invoice PDF 
  - Made payment_1 
  - Saw Completion1 page and downloaded both PDFs again 
  - Then exited; triggering API calls and `user-exit-events.yml` workflow run 

  - **BUG_04_001** desktop date picker UI issue 
  When signing the contract on desktop, the calendar date picker, though it is already on today's date, clicking the calendar icon *does not* open a calendar to pick a date; clicking has no effect however if needed someone could type in the date manually 

  - **BUG_04_002** mobile iOS date picker UI issue 
  When signing the contract on mobile, the calendar date picker, which is native to iOS, is wider than the viewport 
  `assets/docs/v5/v5_4_0/testing/IMG-BUG_04_002-1.jpg`
  `assets/docs/v5/v5_4_0/testing/IMG-BUG_04_002-2.jpg`

  - **BUG_04_003**: duplicate events triggered by user on mobile iOS making payment_1 
  After making first payment on mobile and exiting, there is the appropriate first API call with 6 events in Vercel logs, but there is then a subsequent API call "✅ Dispatched workflow with 3 event(s) for job uid-gdf-021"; only one deployment is visible in Vercel; there are two GitHub action workflows in those logs, but the first one does have all 6 events and shows the appropriate file updates, and then the following workflow's 3 events are all "skipped" and it links to the same Commit as the first workflow which is accurate. This seems incredibly low priority now that it is logged, but it might be worth adding some kind of time buggering between it picking up duplicate events from the same User; particularly if we are able to make it so it specifically ignores the actual User who just made the previous events. FWIW, I was not on the website long at all after making the payment, I closed the tab almost immediately after Completion1 page loaded. The three events were "logged_in", and then "contract_loaded" and "payment_1". Considering the later two, we should probably investigate why they would trigger a second time so soon. 


### Workflow Logs 

* **Vercel API Calls & Webhooks**

1. `/api/create-checkout-session` 
2. `/api/track-event` ✅ Dispatched workflow with 6 event(s) for job uid-awe-596
3. `/api/session-status`
4. `/api/webhook` ℹ️  Payment event will be included in frontend event batch (not triggering separate workflow)
5. `/api/webhook` ✅ Payment completed: uid-awe-596 - Payment 1

* **Vercel Deployment** 

+ Deployment: CLu7a6QZGzEwgdssBbynAA1MRVGJ
+ Commit e7dbefd: Update user behavior stats 
  - Added `contract.signatures.client.legal_name` and `signed_date` to the JSON file 
  - Added `state.client_status.logged_in`, `contract_signed`, `invoice`, and `payment_1` to the JSON file 

* **GitHub Actions**

+ User Exit Events #137 

```plaintext 
Processing 6 events for uid-awe-596...
  ✓ Updated logged_in: 2026-01-21T11:18:26.581Z
  ℹ️  Skipping contract_loaded - informational event only
  ✓ Updated contract_signed: 2026-01-21T11:18:59.573Z
  ✓ Updated contract signature legal_name: JoAnn Tester
  ✓ Updated contract signature signed_date: 2026-01-21
  ℹ️  Skipping contract_loaded - informational event only
  ✓ Updated invoice: 2026-01-21T11:19:18.190Z
  ✓ Updated payment_1: 2026-01-21T11:19:18.191Z
  ✓ Deactivated price1
✅ Successfully updated assets/jobs/uid-awe-596.json
``` 

---

## User Pushes To Save This Document 

* **BUG_04_004** conflict using smart-push 

+ I did a smart-push to save this document and got the error below 
  - This was after the previous payment workflows were complete for about 20 minutes 
  - I used ^x to exit 
  - Since the conflict is with a JSON file coming from remote, it can **ALWAYS** supersede any local changes
  - Is this a conflict with local? Or is it two different remote commits? The second deployment might have done more than the commit in the Actions log let on...? (It just said 'nothing to commit') 

```zsh
  File: /Users/seanivore/Development/freelance-payments/.git/COMMIT_EDITMSG     

Saving the bug log

# Conflicts:
#       assets/jobs/uid-awe-596.json

# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
#
# interactive rebase in progress; onto 1a6f894
# Last command done (1 command done):
#    pick 107addd # Saving the bug log
# No commands remaining.
# You are currently rebasing branch 'freelance-payments' on '1a6f894'.
#
# Changes to be committed:
#       modified:   assets/docs/v5/v5_4_0/TESTS_04_.md
#
```

+ Here are the full details in the terminal after I exited and it pushed the commit 
  - I worry about it saying detached head 
  - I worry about "Your intentional changes preserved" because if the conflict was a JSON file, and it wasn't new, then there is **ZERO** possibility that there were or will ever be intentional changes to a live JSON file. We **ONLY** archive JSON and then add new JSON with new IDs if we need to make changes to a job because that is the only way to make sure we have accurate Stripe objects and PDFs. 
  - If this error shows up again, what should I have done? 

```zsh 
> ~/Development/freelance-payments > git smart-push                        6:57
🔄 git smart-push: Intelligent push workflow

📋 Step 1: Identifying your intentionally changed files...
   Your files (will be preserved in conflicts):
     - assets/docs/v5/v5_4_0/TESTS_04_.md
     - assets/jobs/uid-awe-596.json

💾 Step 2: Stashing unstaged changes...
   ✓ No unstaged changes to stash

⬇️  Step 3: Pulling remote changes (including auto-generated files like manifest.json)...
remote: Enumerating objects: 22, done.
remote: Counting objects: 100% (22/22), done.
remote: Compressing objects: 100% (6/6), done.
remote: Total 15 (delta 12), reused 12 (delta 9), pack-reused 0 (from 0)
Unpacking objects: 100% (15/15), 2.80 KiB | 151.00 KiB/s, done.
From github.com:seanivore/freelance-payments
   8a12e8b..1a6f894  freelance-payments -> origin/freelance-payments
Auto-merging assets/jobs/uid-awe-596.json
CONFLICT (content): Merge conflict in assets/jobs/uid-awe-596.json
error: could not apply 107addd... Saving the bug log
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
hint: You can instead skip this commit: run "git rebase --skip".
hint: To abort and get back to the state before "git rebase", run "git rebase --abort".
hint: Disable this message with "git config set advice.mergeConflict false"
Could not apply 107addd... # Saving the bug log

⚠️  Step 4: Resolving conflicts intelligently...
   ✓ Keeping YOUR version: assets/jobs/uid-awe-596.json (you intentionally changed this)
Updated 1 path from the index
   ✓ Continuing rebase...
[detached HEAD bf22ce2] Saving the bug log
 1 file changed, 110 insertions(+), 1 deletion(-)
Successfully rebased and updated refs/heads/freelance-payments.

⬆️  Step 6: Pushing your changes...
Enumerating objects: 13, done.
Counting objects: 100% (13/13), done.
Delta compression using up to 10 threads
Compressing objects: 100% (7/7), done.
Writing objects: 100% (7/7), 2.44 KiB | 2.44 MiB/s, done.
Total 7 (delta 4), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (4/4), completed with 4 local objects.
To github.com:seanivore/freelance-payments.git
   1a6f894..bf22ce2  freelance-payments -> freelance-payments

✅ git smart-push completed successfully!
   - Remote changes pulled (including manifest.json updates)
   - Your intentional changes preserved
   - Conflicts resolved intelligently
```

---

## Second Payment Made 

+ Desktop `uid-awe-596.json`
  - User logged in 
  - Viewed balance 
  - Made payment_2 
  - Saw Completion2 page and downloaded both PDFs again 
  - Then exited; triggering API calls and `user-exit-events.yml` workflow run 