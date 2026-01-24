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
## First Payment Made
+ Desktop `uid-awe-596.json`; Mobile `uid-gdf-021.json`
  - **BUG_04_001** desktop date picker UI issue 
  - **BUG_04_002** mobile iOS date picker UI issue 
  - **BUG_04_003**: duplicate events triggered 
## User Pushes To Save This Document 
  - **BUG_04_004** conflict using smart-push 

---

## Second Payment Made (Desktop)

+ Desktop `uid-awe-596.json`
  - User logged in 
  - Viewed balance 
  - Made payment_2 
  - Saw Completion2 page and downloaded both PDFs again 
  - Then exited; triggering API calls and `user-exit-events.yml` workflow run 

### Workflow Logs 

* **Vercel API Calls & Webhooks**

1. `/api/create-checkout-session`
2. `/api/session-status`
3. `/api/track-event` ✅ Dispatched workflow with 3 event(s) for job uid-awe-596
4. `/api/webhook` ℹ️  Payment event will be included in frontend event batch (not triggering separate workflow)
5. `/api/webhook` ✅ Payment completed: uid-awe-596 - Payment 2 
6. `/api/track-event` ✅ Dispatched workflow with 2 event(s) for job uid-awe-596

* **Vercel Deployment** 

+ Deployment: 9ypMJnQmpUYLoLt3R2YJuSbSN38V
+ Commit 01ee1ab: Update user behavior stats 
  - Added `state.client_status.balance` to the JSON file 
  - Added `state.client_status.payment_2` to the JSON file 
  - Changed `price2.active` to `false` 
  - Changed `product.active` to `false` 

* **GitHub Actions**

+ User Exit Events #140 
  - Process exit events 

```plaintext 
Processing 3 events for uid-awe-596...
  ℹ️  Skipping contract_loaded - informational event only
  ✓ Updated balance: 2026-01-21T13:00:20.133Z
  ✓ Updated payment_2: 2026-01-21T13:00:20.133Z
  ✓ Deactivated price2
  ✓ Deactivated product
✅ Successfully updated assets/jobs/uid-awe-596.json
``` 

  - Commit Changes 

```plaintext 
Run git config --global user.name 'github-actions[bot]'
[freelance-payments 01ee1ab] Update user behavior stats
 1 file changed, 4 insertions(+), 4 deletions(-)
To https://github.com/seanivore/freelance-payments
   061e428..01ee1ab  freelance-payments -> freelance-payments
✅ Successfully pushed changes
```

+ User Exit Events #141
  - Process exit events 

```plaintext 
Processing 2 events for uid-awe-596...
  ℹ️  Skipping contract_loaded - informational event only
  ⏭️  Skipping payment_2 - already processed at 2026-01-21T13:00:20.133Z
ℹ️  No state changes required.
```

  - Commit Changes 

```plaintext 
Run git config --global user.name 'github-actions[bot]'
ℹ️  No local changes to commit
```

---

## Second Payment Made (Mobile)

+ Mobile `uid-gdf-021.json`
  - User logged in 
  - Viewed balance 
  - Made payment_2 
  - Saw Completion2 page and downloaded both PDFs again 
  - Then exited; triggering API calls and `user-exit-events.yml` workflow run 

### Workflow Logs 

* **Vercel API Calls & Webhooks**

1. `/api/create-checkout-session`
2. `/api/webhook` ℹ️  Payment event will be included in frontend event batch (not triggering separate workflow)
3. `/api/webhook` ✅ Payment completed: uid-gdf-021 - Payment 2
4. `/api/session-status`
5. `/api/track-event` ✅ Dispatched workflow with 3 event(s) for job uid-gdf-021
6. `/api/track-event` ✅ Dispatched workflow with 2 event(s) for job uid-gdf-021

* **Vercel Deployment** 

+ Deployment: 3x76V1sNn3mV7cczL9XBrpmUgFF7
+ Commit 1924083: Update user behavior stats 
  - Added `state.client_status.balance` to the JSON file 
  - Added `state.client_status.payment_2` to the JSON file 
  - Changed `price2.active` to `false` 
  - Changed `product.active` to `false` 

* **GitHub Actions**

+ User Exit Events #142
  - Process exit events 

```plaintext 
Processing 3 events for uid-gdf-021...
  ℹ️  Skipping contract_loaded - informational event only
  ✓ Updated balance: 2026-01-21T13:09:50.767Z
  ✓ Updated payment_2: 2026-01-21T13:09:50.768Z
  ✓ Deactivated price2
  ✓ Deactivated product
✅ Successfully updated assets/jobs/uid-gdf-021.json
``` 

  - Commit Changes 

```plaintext 
Run git config --global user.name 'github-actions[bot]'
[freelance-payments 1924083] Update user behavior stats
 1 file changed, 4 insertions(+), 4 deletions(-)
To https://github.com/seanivore/freelance-payments
   01ee1ab..1924083  freelance-payments -> freelance-payments
✅ Successfully pushed changes
```

+ User Exit Events #143
  - Process exit events 

```plaintext 
Processing 2 events for uid-gdf-021...
  ℹ️  Skipping contract_loaded - informational event only
  ⏭️  Skipping payment_2 - already processed at 2026-01-21T13:09:50.768Z
ℹ️  No state changes required.
```

  - Commit Changes 

```plaintext 
Run git config --global user.name 'github-actions[bot]'
ℹ️  No local changes to commit
```

---

## Mobile View Contract & Cancel; Test file: `uid-yvc-829.json`

  + User will log in on mobile and test the calendar date picker on the contract signature modal 
  + User will cancel instead of signing the contract 
  + User will exit; triggering API calls and `user-exit-events.yml` workflow run 

### Workflow Logs 

* **Vercel API Calls & Webhooks**

1. `/api/track-event` ✅ Dispatched workflow with 2 event(s) for job uid-yvc-829

* **Vercel Deployment** 

+ Deployment: 3cRM976WLGfcB3iqcnmvo8DZ3ZFC
+ Commit 1fa6311: Update user behavior stats 
  - Added `state.client_status.logged_in` to the JSON file 

* **GitHub Actions**

+ User Exit Events #144
  - Process exit events 

```plaintext 
Processing 2 events for uid-yvc-829...
  ✓ Updated logged_in: 2026-01-21T13:18:44.844Z
  ℹ️  Skipping contract_loaded - informational event only
✅ Successfully updated assets/jobs/uid-yvc-829.json
```

  - Commit Changes 

```plaintext 
Run git config --global user.name 'github-actions[bot]'
[freelance-payments 1fa6311] Update user behavior stats
 1 file changed, 163 insertions(+), 163 deletions(-)
To https://github.com/seanivore/freelance-payments
   1924083..1fa6311  freelance-payments -> freelance-payments
✅ Successfully pushed changes
```

  - **BUG_04_005**: calendar date picker on mobile iOS is wider than the viewport (again)

  - `assets/docs/v5/v5_4_0/testing/IMG-BUG_04_005-1.PNG` 
  - `assets/docs/v5/v5_4_0/testing/IMG-BUG_04_005-2.PNG` 

  - **BUG_04_006**: two API event calls, two workflows triggered, one Vercel build 

  + These two events really don't even need to be events at all 
    - Feels like one of those things where we should always be simplifying unnecessary complexity 
    - They triggered an actual API call to `/api/track-event` 
  + ✅ Dispatched workflow with 2 event(s) for job uid-xxx-xxx
    - Skipping contract_loaded - informational event only **this works and has worked since fix, no longer need this event**
    - ⏭️  Skipping payment_2 - already processed at 2026-01-21T13:00:20.133Z **I'm not sure what the purpose of this event is; remove if possible** 
  + This occurred on both desktop and mobile for two different test jobs 
    - They were both wrapping up their end-to-end test flows 
    - Is it possible that it is related to the Completion2 page? 

  - **BUG_04_007** desktop date picker update results are not as expected 

    - The drawer model is now left alignment on page 
    - There are two calendar icons on the button (for which you can click anywhere on the button to open the date picker) 
    - `assets/docs/v5/v5_4_0/testing/IMG-BUG_04_007-1.png`
    - `assets/docs/v5/v5_4_0/testing/IMG-BUG_04_007-2.png`

---

## Desktop View Contract & Cancel; Test file: `uid-yvc-829.json`

  + User will log in on desktop and test the calendar date picker on the contract signature modal 
  + User will exit; triggering API calls and `user-exit-events.yml` workflow run 

### Workflow Logs 

* **Vercel API Calls & Webhooks**

1. `/api/track-event` ✅ Dispatched workflow with 2 event(s) for job uid-yvc-829

  + No further deployments or workflows triggered for this API call 
  + If it isn't logged in the JSON and doesn't activate anything, then seems like we don't need an API call 

  - **BUG_04_006** continued ... more unnecessary events that don't need to be an API call; we should simplify and eliminate all of these kind of events 
    **CONFIRM BEHAVIOR IS EXPECTED** 
  + I cannot see what the two events were because this did not trigger a Vercel build or a GitHub Actions workflow run 
  + I suspect that they might be similar to the other bug's events that are not needed 
    - In that case they were "Skipping contract_loaded - informational event only" and "Skipping payment_2" 
    - Other than contract loaded, I cannot be exactly sure which event it was 
    - It was probably "logged_in" and "contract_loaded" but with logged_in marked as skipped or already processed 
    - I know this didn't trigger a build or workflow, but it still seems like we should eliminate all of these events from trigging any API call 
    - This would be simplifying unnecessary complexity and it would be consistent 

---

## Next Fixes: BUG_04_005, BUG_04_006, BUG_04_007

* **Simplifying `user-exit-events.yml` workflow, the `/api/track-event` API call, and subsequent builds and deployments**

+ Last fix we attempted to ensure that the user-behavior that triggers the `user-exit-events.yml` workflow would only trigger once per user session. This was done by removing the logic where events are flushed on user exit **and** on payment, leaving only "on exit" because it covers both cases. 
  - Moral: Simplicity is key, always remove unnecessary complexity. 
  - Fix goal: User session creates ONE API call to `/api/track-event` when the user exits the page, ONE build and deployment, and ONE GitHub actions workflow run. 
+ These test that followed the fix, all detailed above, show that there are still events that trigger a separate API call to `/api/track-event` when the user exits the page. 
  - Upon closer inspect it appears that they are all events that might have had a purpose in earlier testing, but now are reporting information we don't need to know about; these include "informational only" events as "skipped" or "already processed" events 
  - We should audit all events and remove these that are not necessary; fitting the moral of the previous fix 
  - If the "skipped" or "already processed" are part of the same event as when it *isn't* skipped or *is* processed, then ideally we should find a new way to handle these; now that things are working properly, we don't need to know if something was skipped or already processed 

* **Simplifying the calendar date picker on mobile iOS** 

+ History of this UI and bug 
  - Now we've seen the native iOS date picker being wider than viewport error once, then changed to a non-native picker 
  - Didn't like the non-native picker which had some kind of error, and moved back to the native picker and attempted to apply a fix 
  - We saw the fix didn't work, attempted another fix, and we can see now that it still did not work: The calendar picker is still wider than the viewport 
+ Consideration for the next fix 
  - If there is a way to pull out the just this phase of the React build to a separate file that can be tested without our 404-redirect trick, and without needing to run through an entire end-to-end test flow, then we should do that: test this date picker UI issue in isolation 
  - Alternatively, lets pick a more innovative solution. There are other UI flows that apps use for date selection; we should look at those and see what else might work equally as well 
  - Depending on the amount of work to isolate the UI issue for testing, we might want to consider the second option first 

---
