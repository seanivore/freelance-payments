# Testing Notes for v5.4.0

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

## New Job JSON Files Added 

+ The `admin-push.yml` workflow ran as expected 