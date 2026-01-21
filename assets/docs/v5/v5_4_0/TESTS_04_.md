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

  - **BUG_04_001** 
  When signing the contract on desktop, the calendar date picker, though it is already on today's date, clicking the calendar icon *does not* open a calendar to pick a date; clicking has no effect however if needed someone could type in the date manually 

  - **BUG_04_002** 
  When signing the contract on mobile, the calendar date picker, which is native to iOS, is wider than the viewport 
  `assets/docs/v5/v5_4_0/testing/IMG-BUG_04_002-1.jpg`
  `assets/docs/v5/v5_4_0/testing/IMG-BUG_04_002-2.jpg`

  - **BUG_04_003** 
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

## Second Payment Made 

+ Desktop `uid-awe-596.json`
  - User logged in 
  - Viewed balance 
  - Made payment_2 
  - Saw Completion2 page and downloaded both PDFs again 
  - Then exited; triggering API calls and `user-exit-events.yml` workflow run 