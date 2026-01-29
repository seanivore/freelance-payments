# Testing v6.1.0

===

## Testing Notes 
+ **Testing Date:** 2026-01-29
+ **Status:** Testing fixes from `LOG_06_00.md` 
+ **Logging:** `LOG_06_01.md`
+ **Test Files:** 
  - `uid-yae-576.json` - Jameson; yaes-baked-goods
  - `uid-lir-969.json` - Smith; liruns-furniture
  - `uid-dnj-781.json` - Smith; djs-bakery
  - `uid-qdw-666.json` - Wallace; qdw-portfolio
  - `uid-ymf-021.json` - McFarland; ymf-ai-podcast

### Testing Focus 

+ Okay, so now I will check that this flow works, period. I'm not even going to try the PDF download mid-flow on mobile at first. 
+ If PDF download mid-flow is the problematic item, exclusively, then we can remove the download PDF from mid-flow 
  - Could be removed completely, or just on mobile 
  - There are already PDF download buttons available on the Completion1 and Completion2 pages 
+ **Removing the PDF download mid-flow might actually make more sense anyway because in an upcoming update we will need to add functionality so that the client's signature and date of signing are added to the actual PDF before they download it.** 

===

## Test: "uid-yae-576.json"  --- desktop success ✅
+ Jameson, yaes-baked-goods

### Events Needed
+ Session #2
  - API call — `state.client_status.balance` 
  - API call — `state.client_status.payment_2`, `price2.active = "false"`, `product.active = "false"` 

### Environment
+ Mobile, incognito window, Safari, iOS 26.2.1 (literally just updated minutes ago)

### Test
+ Session #2 *without* PDF download behavior; **all behavior was as expected** 

---

## Test: "uid-lir-969.json" --- desktop success ✅
+ Smith, liruns-furniture

### Events Needed
+ Session #2
  - API call — `state.client_status.balance` 
  - API call — `state.client_status.payment_2`, `price2.active = "false"`, `product.active = "false"` 

### Environment
+ Desktop, incognito window, Safari, macOS Tahoe 26.2 

### Test
+ Session #2 *with* PDF download behavior; **all behavior was as expected** 

---

## Test: "uid-dnj-781.json" --- mobile success ✅
+ Smith, djs-bakery

### Events Needed
+ Session #2
  - API call — `state.client_status.balance` 
  - API call — `state.client_status.payment_2`, `price2.active = "false"`, `product.active = "false"` 

### Environment
+ Mobile, incognito window, Google Chrome, iOS 26.2.1

### Test
+ Session #2 *with* PDF download behavior; **all behavior was as expected** 

### Notes 
+ iOS Chrome downloads the PDF without opening a new tab; no need to test again unless there are event separation issues 

---

## Test: "uid-qdw-666.json" --- mobile success ✅
+ Wallace, qdw-portfolio

### Events Needed
+ Session #1
  - API call — `state.client_status.invoice` 
  - API call — `state.client_status.payment_1`, `price1.active = "false"`
+ Session #2
  - API call — `state.client_status.balance` 
  - API call — `state.client_status.payment_2`, `price2.active = "false"`, `product.active = "false"` 

### Environment
+ Mobile, incognito window, Safari, iOS 26.2.1

### Test 

+ Session #2 *without* PDF download behavior; **all behavior was as expected** 
+ Session #2 *with* PDF download behavior; **all behavior was as expected** 

### Notes 

+ I tried to close the PDF tab and discovered that the PDF is opened in the SAME TAB as the app flow, after saving I clicked "BACK" and the app flow resumed. 
+ Follow-up
  - Try the PDF download again in a new end-to-end test 
  - Then if it doesn't work and splits up the events, we could consider adding something to make the PDF open in a new tab (?) 
  - Though doing this might make it function weird in browsers where it *does* download as expected (?) 
  - **Better solution if it is still problematic would probably be to remove the download buttons from in the flow and save them only for Completion1 and Completion2** 

---

## Test: "uid-ymf-021.json" 
+ McFarland, ymf-ai-podcast

### Events Needed
+ Session #1
  - API call — `state.client_status.logged_in`, `state.client_status.invoice`, `state.client_status.contract_signed`, `contract.signatures.client.legal_name`, `contract.signatures.client.date_signed` 
  - API call — `state.client_status.payment_1`, `price1.active = "false"` 
+ Session #2
  - API call — `state.client_status.balance` 
  - API call — `state.client_status.payment_2`, `price2.active = "false"`, `product.active = "false"` 

### Environment
+ Mobile, incognito window, Safari, iOS 26.2.1

### Test 
+ Session #1 *without* PDF download behavior; **all API calls were grouped correctly as expected** 
  **User Exit Events #226**
  - ✓ Updated logged_in: 2026-01-29T14:18:41.860Z
  - ✓ Updated contract_signed: 2026-01-29T14:18:59.737Z
  - ✓ Updated contract signature legal_name: McFarland Test
  - ✓ Updated contract signature signed_date: Jan 29, 2026
  - ✓ Updated invoice: 2026-01-29T14:19:02.393Z
  **User Exit Events #227**
  - ⏭️ Skipping logged_in - already processed at 2026-01-29T14:18:41.860Z -- **WE MUST REMOVE THIS**
  - ✓ Updated payment_1: 2026-01-29T14:19:13.716Z
  - ✓ Deactivated price1
+ Session #2 with PDF download behavior 

### Notes 

+ We should look into the logic of why there is a duplicate logged_in event 
  - The purpose of the FIRST event being "logged_in" is to make sure the client started the process 
  - It is not relevant as an FYI in these later states 
  - Further, if events were skipped, and it logged the logged_in event, then it isn't actually accurate for its purpose 
  - **PLEASE REMOVE: I have asked this of the agent at least the past three sessions in Cursor, and it remains, providing inaccurate information when it shows up like this** 


---

## Test: "uid-qyx-737.json" 
+ Smith, rex-youtube

### Events Needed
+ Session #1
  - API call — `state.client_status.logged_in`, `state.client_status.invoice`, `state.client_status.contract_signed`, `contract.signatures.client.legal_name`, `contract.signatures.client.date_signed` 
  - API call — `state.client_status.payment_1`, `price1.active = "false"`
+ Session #2
  - API call — `state.client_status.balance` 
  - API call — `state.client_status.payment_2`, `price2.active = "false"`, `product.active = "false"` 

### Environment
+ Mobile, incognito window, Safari, iOS 26.2.1

### Test 
+ Session #1 with PDF download behavior 


### Notes 


+ Session #2 


———
Test: "uid-pww-926.json" 
Williams, pww-social-media
Events needed: 
Session #1 - 
API call — state.client_status.logged_in, state.client_status.invoice, state.client_status.contract_signed, contract.signatures.client.legal_name, contract.signatures.client.date_signed 
API call — state.client_status.payment_1, price1.active = "false" 
Session #2 - 
API call — state.client_status.balance 
API call — state.client_status.payment_2, price2.active = "false", product.active = "false" 



———
Test: "uid-egl-627.json" 
Linton, egl-website
Events needed: 
Session #1 - 
API call — state.client_status.logged_in, state.client_status.invoice, state.client_status.contract_signed, contract.signatures.client.legal_name, contract.signatures.client.date_signed 
API call — state.client_status.payment_1, price1.active = "false" 
Session #2 - 
API call — state.client_status.balance 
API call — state.client_status.payment_2, price2.active = "false", product.active = "false" 





