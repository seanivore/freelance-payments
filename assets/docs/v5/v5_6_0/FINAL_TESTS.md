# Final Tests for v5.6.0

## Testing Notes:

+ **Testing Date:** 2026-01-24
+ **Logging:** `LOG_06.md`
+ **Test Files:** 
  - `uid-awi-104.json` - Markham; simple-gardener
  - `uid-ugz-557.json` - Kelvin; tokenized-social-media

---

## Testing Full Flow with Break

### Expected Behavior

+ Payment_1
  - User logs in and is routed to the contract page 
  - User has no issue entering date and name to sign contract 
  - User signs contract and is taken to invoice page 
  - User acknowledges invoice and is taken to payment_1 page 
  - User makes payment_1 and is taken to completion1 page, then exits
  - All events are flushed on user exit 
+ Payment_2
  - User logs in and is routed to the balance page 
  - User has no issue accepting balance and is taken to payment_2 page 
  - User makes payment_2 and is taken to completion2 page, then exits
  - All events are flushed on user exit 

### Actual Behavior - `uid-awi-104.json`

+ **BUG_06_001** - The `signed_contract` and `invoice` events weren't in the API call 
  - User went all the way through to payment_1 and Completion1 page 
  - User noted that there was no EXIT option on the Completion1 page so she went back a bunch of times; while this won't necessarily happen much in real cases, it does make sense to have an exit option on both the Completion1 and Completion2 pages 
  - Not sure why, but there were two API calls and the first was just for `logged_in` 
  - Then there was a second API call for `payment_1` 
  - User was able to go in for payment_2 because it checks for payment_1 completion which was logged 
  - **NEED TO FIND MISSING API CALLS AND SEE IF THEY CAN BE ONE BATCH**

+ **BUG_06_002** - The API events were in two separate API calls for payment_2 flow 
  - User went all the way through to payment_2 and Completion2 page 
  - The first API call had 1 event and the JSON was updated at `state.client_status.balance`
  - The second API call had 1 event and the JSON was updated at `state.client_status.payment_2` and then it changed `price2.active` to `false` and `product.active` to `false`
  - **The second part of payment_2 flow, the 1 event has three updates, which it should, but is that way they're not grouping properly?**  

### Actual Behavior - `uid-ugz-557.json`

+ **BUG_06_003** - The API events were in two separate API calls for payment_1 flow 
  - User went all the way through to payment_1 and Completion1 page 
  - The first API call had 3 events and the JSON was updated at `contract.signatures.client.legal_name` and `contract.signatures.client.signed_date`, `state.client_status.logged_in`, and `state.client_status.invoice` 
  - The second API call had 2 event and the JSON was updated at `state.client_status.payment_1` and then it changed `price1.active` to `false` 
  - **All events counted correctly in API calls, but why are they not ONE BATCH?** 

+ **BUG_06_004** - The API events were in two separate API calls for payment_2 flow 
  - User went all the way through to payment_2 and Completion2 page 
  - The first API call had 1 event and the JSON was updated at `state.client_status.balance`
  - The second API call had 1 event and the JSON was updated at `state.client_status.payment_2` and then it changed `price2.active` to `false` and `product.active` to `false` 
  - **NO IDEA, no reason that it is releasing the first event earlier, if the others are waiting until after exit then they should all come out the same time, but it seems like the last few are waiting for payment completion confirmation, then releasing, that would destroy the logic we created because it is using a release mechanism that is not part of the logic planned; I think we need to just trust the events being triggered and NOT wait for the payment completion confirmation because what if they did all the events in one session? They then should all release at that same time. WE can ONLY USE USER EXIT FLUSHING** 

* **OVERVIEW** 
  - It seems like they are not grouping events in any kind of consistent way 
  - Every time, it is a random number split between two API calls 
  - The biggest issue is obviously the missing API calls and events 
  - But this has been "fixed SO MANY TIMES that it really needs to be SO SUPER THOROUGHLY inspected like reading the entire files for every file related because so often we find that there is code duplicating an action that is lower on the list because when AI updates files it uses GREP and doesn't read entire files 
  - Could that be the case here? 
  - Looks like we need to ONLY USE USER EVENT FLUSHING and nothing else, no payment completion as replacement 
