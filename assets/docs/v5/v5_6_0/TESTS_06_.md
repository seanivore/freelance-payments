# Testing Notes for v5.6.0

+ **Testing Date:** 2026-01-24
+ **Logging:** `LOG_06.md`

## Focus Areas During Testing 

+ **Event delivery and state management** 
  - Trigger one event for each session, then exit the site 
  - One POST API call in Vercel is made for the event 
  - This should trigger single `user-exit-events.yml` workflow run 
  - Each event's workflow edits the JSON file in all appropriate places 
  - New edit to workflow should 'npm run build' after JSON commit push within GH 
  - Next login should route to correct page based on state.client_status
  - After payment_2, no events were dispatched 
+ **Main remaining issues**
  - After INVOICE alone, no events were dispatched 
  - After BALANCE alone, no events were dispatched 
  - Login after PAYMENT_1 and BALANCE needs to route to PAYMENT_2 
  - After PAYMENT_2, no events were dispatched 
+ **Problem areas from previous tests**
  - `assets/docs/v5/v5_5_0/LOG_05.md` of `assets/docs/v5/v5_5_0/TESTS_05_.md` 
  - `assets/docs/v5/v5_4_0/LOG_04.md` 
  - `assets/docs/v5/v5_2_0/testing/LOG_03.md` 
  - OLDER: `assets/docs/v5/v5_1_16/testing/LOG_01.md` and `assets/docs/v5/v5_1_16/testing/LOG_02.md`

### New Test Files 

+ `uid-fuk-259.json` - Keegan; rodent-fight-club
+ `uid-pqu-327.json` - Joan; houseplant-boutique
+ `uid-ugz-557.json` - Kelvin; tokenized-social-media

---

## Login Only 

  + MOBILE: `uid-fuk-259.json`
  + DESKTOP: `uid-pqu-327.json`

### Expected Behavior

+ User logs in and is routed to the contract page 
+ User has no issue entering date and name to sign contract 
+ User cancels signing contract and exits the site 
+ All events are flushed on user exit 
+ Vercel has 1 POST API call for `state.client_status.logged_in` 
+ Workflow runs and updates the JSON file with the timestamp for `state.client_status.logged_in` 
+ NPM RUN BUILD is run after JSON update ensuring next login routes to correct page

### Actual Behavior
