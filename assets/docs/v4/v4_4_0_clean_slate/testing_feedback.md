# Testing Feedback 

## Test 04 Feedback: Commits 386a023, 8c32f22, 005ac2f ... and more 

  - Commit 386a023 "feat: add test 004 verification job" 
  - Commit 8c32f22 "chore: cleanup test 003 to match new schema" 
  - Commit 005ac2f "Removed extra PDFs, redundant copy of test 003, old copy of json" 

### Event Tracking Mess Clean-up Guide  

  **Viewed `state.client_status...` values updated inaccurately** 

  + Commit 386a023 "feat: add test 004 verification job" = **ALL NEW** 
    - `state.client_status.viewed_contract` is set to 'null' 
    - `state.client_status.viewed_invoice` is set to 'null' 
    - `...downloaded_docs` = 0 
    - `...signed_contract` = null 

  + Commit bf5bea1 "Auto-update: Stripe catalog sync and manifest update" = **UPDATED, NOT ACCURATE**
    - `state.client_status.viewed_contract` is set to 'true' 
    - `state.client_status.viewed_invoice` is set to 'true' 

  **Event triggered and queued, then actual batch update to JSON fulfilled** 

  + First in console **INCOMPLETE, SEE JSON SNIPPET**
    - 📊 Event queued: contract_loaded for job uid-tst-004 (will send after 5min inactivity or on page unload) VM74:63 
    - 📊 Event queued: contract_signed for job uid-tst-004 (will send after 5min inactivity or on page unload) VM74:63 
    - 📊 Event queued: invoice_viewed for job uid-tst-004 (will send after 5min inactivity or on page unload) VM74:63
  + Then in console 
    - 📤 Sending 3 batched event(s) to API... VM74:63 
    - ✅ Event sent: contract_loaded for job uid-tst-004 VM74:63 
    - ✅ Event sent: contract_signed for job uid-tst-004 VM74:63 
    - ✅ Event sent: invoice_viewed for job uid-tst-004 VM74:63 

  **Commit 16b5a21 "Auto-update: Tracking event (?) for uid-tst-004"** 

    - This is always "(?)" 
    - Right now only conveys "contract_signed" updates 
    - Updates `state.client_status.signed_contract` with ISO date 
    - Updates `contract.signatures.contractor.signed_date` and `contract.signatures.client.signed_date` with ISO date 
    - No changes to `contract_loaded` and `invoice_viewed` values, which should probably be ISO timestamps and not true | false anyway because the user might get that far and leave before signing 

  **Afterwards: Commit 8427279 "Auto-update: Tracking event (contract_loaded) for uid-tst-004"** 

    - Immediately follows the above Vercel update 
    - Adds "contract_loaded" value as ISO timestamp to `state.client_status.contract_loaded` 

  **Actual JSON `state.client_status` values** 

  + Every value should just be one ISO timestamp 
    - Downloaded isn't functioning right now but when we fix UI and add it back, we should only add one button to download both the contract and invoice 
    - To "pass" the contract page, User **MUST SIGN** --> takes user to invoice 
    - To "pass" the invoice page, User **MUST CLICK** `download documents: YES | NO` buttons --> takes user to payment_1 

  + Then let's make the events match the goal posts 

    1. `logged_in` event (contract loaded/view is implied, no mention needed) ISO timestamp 
      - Is not triggering or functionality tracking not working 
      - We *know* this means that contract was loaded and do not need another event 
      - DELETE `contract_loaded` and `contract_scrolled_complete` for redundancy because scrolled isn't functioning anyway and isn't that helpful, and the set are just redundant; we will create ONE even for each step that they MUST pass 
    2. `contract_signed` event ISO timestamp 
    3. `downloaded_docs` event ISO timestamp (represents passing goalpost with YES or NO)

  **OLD CURRENT JSON** 

```json 
    "client_status": {
        "logged_in": null,
        "contract_loaded": null,
        "contract_scrolled_complete": null,
        "viewed_contract": true,
        "viewed_invoice": true,
        "downloaded_docs": 0,
        "signed_contract": null
    }
```
  **NEW SIMPLE UPDATED** 

```json 
    "client_status": {
        "logged_in": null,
        "contract_signed": null,
        "downloaded_docs": null,
    }
```

  **CURRENTLY FOLLOWED BY** 

```json 
        "payment_1": {
            "intent": null,
            "processing": null,
            "succeeded": null
        },
        "payment_2": {
            "intent": null,
            "processing": null,
            "succeeded": null
        }
```

  **SHOULD BE SIMPLIFIED BY INTEGRATING** 

  - Just simple ISO timestamp for all values 
  - "Intent" and "processing" are not being tracked currently anyway 
  - Simplifies STATE MANAGEMENT logic for UX 

```json 
    "client_status": {
        "logged_in": null,
        "contract_signed": null,
        "downloaded_docs": null,
        "payment_1": null, 
        "payment_2": null
    }
```

  **SIMPLIFIED STATE MANAGEMENT UX PLACEMENT** 

  1. All null -> show contract 
  2. logged in ISO timestamp, nothing else -> show contract 
  3. logged in, contract signed ISO timestamp, nothing else -> show invoice 
  4. logged in, contract signed, downloaded docs ISO timestamps -> jump to payment_1 (download docs button provided; possibly back button but only download really necessary at this point) 
  5. all ISO timestamped except payment_2 -> jump to payment_2 **IF** if `product.total_payments` >= 2; if `product.total_payments` = 1, jump to PAYMENTS COMPLETE screen 

  **After logic and SCHEMA is simplified, then fix all events** 

  + No need to define what events in commit message 
    - "Auto-update: Tracking event (?) for uid-tst-004" 
    - "Auto-update: Tracking state management batch update for uid-tst-004" 
  + We should then make sure there need only be one of these (two currently) **BECAUSE** 
    - Inactivity of 5 minutes activates batch JSON updates 
    - PAYMENT either 1 or 2 indicates end of current cycle 
    - If user is INACTIVE for > 5 minutes (event batch update triggered) they should be automatically logged out 
    - Then their next session would automatically route them to their relevant payment 
  + **NOTE:** 'logged_in' looks like it might be updated more than once, but for this state management flow, it needs to only be updated once to tell us that the user did indeed use the payments center successfully and just haven't made any moves yet 

  **IMPORTANT** all of these updates are ESSENTIAL because I stopped the flow, all details shared above, before signing the contract, and yet the events as they currently track and batch update showed that I "signed contract" but I did not. The script for these must be completely rewritten to eliminate prior bugs and clear the way to implement new simplicity. Also must find which script is used to load the user according to state management so that the logic there can also be simplified. 

  **IMPORTANT** because of EVENTS = GATES we no longer need any header where it currently says "Contract Invoice Payments" 

### Check Out "Success" But Not Entirely 

  - Note, again at the end "contract_signed" event was sent instead of "payment_1" completion 
  - Commit 38a4f23 "Auto-update: Tracking event (?) for uid-tst-004" triggered a second time but in the update, nothing changed other than the timestamp at the bottom of manifest.json 
  - Commit 0e396f0 "Auto-update: Tracking event (contract_signed) for uid-tst-004" 
    - Then runs but just updates the "contract_signed" ISO timestamp a second time, nothing to do with actual payment completion state management 
    - This represents the very last note from console below... inaccurate but nothing came through afterwards, even after waiting > 5 mintues 
  - The "Payment confirmed, redirecting..." note did nothing but load to a page that says "Payment not found. Please contact support." 
  - Reload of page triggers "contract_loaded" event again and "Completion: Reloaded fresh payment status from server (checking payment_1/payment_2 state)" -- however the same "Payment not found. Please contact support" page is showing, nothing else. 
  - I logged out and logged back in and I am directed straight to the invoice, but it shows the amount for the FIRST PAYMENT still and the errors showed it was trying to re-initialize the first payment and use the same coupon 

  **IMPORTANT** the PDF production needs to create TWO invoices 
    - The first one shows the amount due for start of work 
    - Then, with the UX state management user placement fixed, to show payment 2 after payment 1 is complete, the final invoice should be shown on that next login with the final balance payment due invoice 

Here are the console output of everything after what was relevant to the above: 

```
VM74:63 Checkout section 1 already initializing, skipping...
VM74:63 Stripe publishable key received from API
VM74:63 Mounting Stripe Checkout with fetchClientSecret pattern...
VM74:63 Creating new Stripe.js script with URL: https://js.stripe.com/basil/stripe.js
VM74:63 ✅ Stripe.js script loaded successfully from: https://js.stripe.com/basil/stripe.js
VM74:63 Initializing Stripe Checkout with fetchClientSecret function...
VM74:63 Stripe object: object initCheckout type: function
VM74:63 initCheckout options: {fetchClientSecret: '[Function]', elementsOptions: {…}}
VM74:63 🔄 fetchClientSecret called by Stripe.js, creating checkout session...
VM74:63 ✅ Stripe Checkout initialized
VM74:63 Checkout object type: object Is Promise? true
VM74:63 ⏳ Checkout is a Promise, awaiting resolution...
VM74:63 Stripe publishable key stored from fetchClientSecret
VM74:63 ✅ Client secret fetched: cs_test_a1CFoXGGIiXR...
VM74:63 ✅ Checkout Promise resolved
VM74:63 Checkout object methods: (10) ['_sdkVersion', 'session', 'on', 'applyPromotionCode', 'removePromotionCode', 'updateShippingAddress', 'updateBillingAddress', 'updatePhoneNumber', 'updateEmail', 'updateLineItemQuantity']
VM74:63 ⏳ Waiting for fetchClientSecret to complete...
VM74:63 ✅ fetchClientSecret completed, checkout is ready
VM74:63 Getting session data...
VM74:63 ✅ Session retrieved: Proxy(Object) {_sdkVersion: 'v1', billingAddress: null, businessName: 'Sean August Horvath sandbox', canConfirm: false, currency: 'usd', …}
VM74:63 ✅ Checkout event listener registered
VM74:63 Preparing form HTML...
VM74:63 Creating Payment Element...
VM74:63 Mounting Payment Element...
VM74:63 ✅ Payment Element mounted
VM74:63 Creating Billing Address Element...
VM74:63 Mounting Billing Address Element...
VM74:63 ✅ Billing Address Element mounted
VM74:63 ✅ Stripe Checkout mounted successfully with custom UI mode
VM74:63 ✅ mountStripeElements completed successfully
VM6:63 [Stripe.js] The following payment method types are not activated:

- klarna

They will be displayed in test mode, but hidden in live mode. Please activate the payment method types in your dashboard (https://dashboard.stripe.com/settings/payment_methods) and ensure your account is enabled for any preview features that you are trying to use.
console.<computed> @ VM6:63
warn @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
(anonymous) @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
vv @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
(anonymous) @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
VM6:63 [Stripe.js] You have not registered or verified the domain, so the following payment methods are not enabled in the Payment Element: 

- apple_pay

Please follow https://stripe.com/docs/payments/payment-methods/pmd-registration to register and verify the domain.
console.<computed> @ VM6:63
warn @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
warn @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
value @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
value @ shared-84b71071e498e…695f6227ff4516.js:1
d._sendControllerMessage @ shared-84b71071e498e…695f6227ff4516.js:1
d.warn @ shared-84b71071e498e…695f6227ff4516.js:1
(anonymous) @ elements-inner-payme…8cb6c5d36a3fea.js:4
la @ elements-inner-payme…8cb6c5d36a3fea.js:1
Ha @ elements-inner-payme…8cb6c5d36a3fea.js:1
n.unstable_runWithPriority @ elements-inner-payme…8cb6c5d36a3fea.js:1
wn @ elements-inner-payme…8cb6c5d36a3fea.js:1
Va @ elements-inner-payme…8cb6c5d36a3fea.js:1
Sa @ elements-inner-payme…8cb6c5d36a3fea.js:1
(anonymous) @ elements-inner-payme…8cb6c5d36a3fea.js:1
n.unstable_runWithPriority @ elements-inner-payme…8cb6c5d36a3fea.js:1
wn @ elements-inner-payme…8cb6c5d36a3fea.js:1
Ln @ elements-inner-payme…8cb6c5d36a3fea.js:1
In @ elements-inner-payme…8cb6c5d36a3fea.js:1
Aa @ elements-inner-payme…8cb6c5d36a3fea.js:1
(anonymous) @ elements-inner-payme…8cb6c5d36a3fea.js:1
(anonymous) @ shared-84b71071e498e…695f6227ff4516.js:1
setTimeout
(anonymous) @ shared-84b71071e498e…695f6227ff4516.js:1
(anonymous) @ elements-inner-payme…8cb6c5d36a3fea.js:1
(anonymous) @ elements-inner-payme…8cb6c5d36a3fea.js:1
(anonymous) @ shared-84b71071e498e…695f6227ff4516.js:1
r.test._emit @ shared-84b71071e498e…695f6227ff4516.js:1
value @ shared-84b71071e498e…695f6227ff4516.js:1
value @ shared-84b71071e498e…695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498e…695f6227ff4516.js:1
value @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
(anonymous) @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
value @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
(anonymous) @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
n @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
a @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
i @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
Promise.then
a @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
i @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
(anonymous) @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
(anonymous) @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
dispatch @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
(anonymous) @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
n @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
a @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
i @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
Promise.then
a @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
i @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
(anonymous) @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
(anonymous) @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
(anonymous) @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
(anonymous) @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
(anonymous) @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
n @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
a @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
i @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
Promise.then
a @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
i @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498ee7d3f695f6227ff4516.js:1
(anonymous) @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
(anonymous) @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
(anonymous) @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
value @ controller-with-preconnect-bb2b45bdf15c85c225cbceba35ca4675.js:1
(anonymous) @ shared-84b71071e498e…695f6227ff4516.js:1
n @ shared-84b71071e498e…695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498e…695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498e…695f6227ff4516.js:1
a @ shared-84b71071e498e…695f6227ff4516.js:1
i @ shared-84b71071e498e…695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498e…695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498e…695f6227ff4516.js:1
d.innerAction @ shared-84b71071e498e…695f6227ff4516.js:1
r.dispatchAction @ elements-inner-payme…8cb6c5d36a3fea.js:4
(anonymous) @ elements-inner-payme…8cb6c5d36a3fea.js:1
(anonymous) @ elements-inner-payme…8cb6c5d36a3fea.js:1
n @ shared-84b71071e498e…695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498e…695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498e…695f6227ff4516.js:1
a @ shared-84b71071e498e…695f6227ff4516.js:1
i @ shared-84b71071e498e…695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498e…695f6227ff4516.js:1
(anonymous) @ shared-84b71071e498e…695f6227ff4516.js:1
(anonymous) @ elements-inner-payme…8cb6c5d36a3fea.js:1
(anonymous) @ elements-inner-payme…8cb6c5d36a3fea.js:1
la @ elements-inner-payme…8cb6c5d36a3fea.js:1
Ha @ elements-inner-payme…8cb6c5d36a3fea.js:1
n.unstable_runWithPriority @ elements-inner-payme…8cb6c5d36a3fea.js:1
wn @ elements-inner-payme…8cb6c5d36a3fea.js:1
Va @ elements-inner-payme…8cb6c5d36a3fea.js:1
(anonymous) @ elements-inner-payme…8cb6c5d36a3fea.js:1
c @ elements-inner-payme…8cb6c5d36a3fea.js:1
P.port1.onmessage @ elements-inner-payme…8cb6c5d36a3fea.js:1
VM74:63 Checkout state changed: Proxy(Object) {_sdkVersion: 'v1', billingAddress: null, businessName: 'Sean August Horvath sandbox', canConfirm: false, currency: 'usd', …}
VM74:63 Checkout state changed: Proxy(Object) {_sdkVersion: 'v1', billingAddress: null, businessName: 'Sean August Horvath sandbox', canConfirm: true, currency: 'usd', …}
VM74:63 Checkout state changed: Proxy(Object) {_sdkVersion: 'v1', billingAddress: null, businessName: 'Sean August Horvath sandbox', canConfirm: false, currency: 'usd', …}
VM74:63 ✅ Completion: Reloaded fresh payment status from server (checking payment_1/payment_2 state)
VM74:63 Checkout state changed: Proxy(Object) {_sdkVersion: 'v1', billingAddress: {…}, businessName: 'Sean August Horvath sandbox', canConfirm: true, currency: 'usd', …}[[Handler]]: Object[[Target]]: ObjectbillingAddress: {name: 'TestFour', address: {…}}businessName: "Sean August Horvath sandbox"canConfirm: truecurrency: "usd"currencyOptions: nulldiscountAmounts: [{…}]email: "john@goldstest.com"id: "cs_test_a1CFoXGGIiXRTLwVzdN1CEtUzcBQC0Uwo6Q8FGT3euvRqkvgF864HOzuJB"lastPaymentError: nulllineItems: [{…}]livemode: falseminorUnitsAmountDivisor: 100phoneNumber: "+555555555555"recurring: nullsavedPaymentMethods: nullshipping: nullshippingAddress: nullshippingOptions: []status: {type: 'complete', paymentStatus: 'paid'}tax: {status: 'ready'}taxAmounts: []taxIdInfo: nulltotal: {subtotal: {…}, taxExclusive: {…}, taxInclusive: {…}, shippingRate: {…}, discount: {…}, …}_sdkVersion: "v1"[[Prototype]]: Object[[IsRevoked]]: false
VM74:63 Payment confirmed, redirecting...
VM74:63 📤 Sending 1 batched event(s) to API...
VM74:63 ✅ Event sent: contract_signed for job uid-tst-004
```

### Placement Field Added to Contract 

  + Added `{{contract.signatures.contractor.signed_date}}` to the contract which maps from the JSON value `contract.signatures.contractor.signed_date`
    - This simply added the ISO value to the date below my signature 
    - It needs whatever dateFormatting method is used for other dates in the contract or invoice 
    - The same could be added to for the client date as well, or we will need to make sure these are hard-added after the client actually signs on the front end (which seems to make more sense)
  + **NOTE:** for now I replaced it with {{today}} 
    - This could work as well, because it is used and working elsewhere on the contract 
    - However, seems like we still want the other placeholder to function as mapped to the JSON value as well, please 

### Currency Calculation Issues; Confirming Mapping, Then Math 

  + ALTERATIONS 
    - {{total}} --> formatCurrency(`product.service_usd`)
    - `product.service_usd` is in pennies so it just needs the same currency formatting as every other currency 
    - However "formatCurrency(`{{subtotal}}`–`{{discount}}`)" should still be accurate; I'm noticing the errors I'm seeing are because I left the discount out of `price1.unit_amount` 

  + CLARIFICATIONS 
    - When filling out the job JSON, `price1.unit_amount` *must include discount* 
    - Not sure if this is the first time I've seen the mistake because it is the first job JSON I filled out recently, or if we just haven't been using coupons enough to notice 
    - But in test 004, all math works out, I just inadvertently left the discount out of `price1.unit_amount`

**In the end, nothing below changed except we should add that {{contract.signatures.contractor.signed_date}} placeholder maps to the JSON value `contract.signatures.contractor.signed_date`** 

| Template Placeholder            | Mapped JSON Value                                         |
| ------------------------------- | --------------------------------------------------------- |
| {{docs.invoice.id}}             | `docs.invoice.id`                                         |
| {{docs.invoice.created}}        | `docs.invoice.created`                                    |
| {{contract.work_start}}         | formatDate(`contract.work_start`)                         |
| {{contract.work_end}}           | formatDate(`contract.work_end`)                           |
| {{contract.legal_jurisdiction}} | `contract.legal_jurisdiction`                             |
| {{project}}                     | `project`                                                 |
| {{amount_due}}                  |  Variable                                                 |
| {{customer.business}}           | `customer.business`                                       |
| {{customer.name}}               | `customer.name`                                           |
| {{customer.title}}              | `customer.title`                                          |
| {{customer.address.line1}}      | `customer.address.line1`                                  |
| {{city}}                        | `customer.address.city`                                   |
| {{state}}                       | `customer.address.state`                                  |
| {{postal_code}}                 | `customer.address.postal_code`                            |
| {{country}}                     | `customer.address.country`                                |
| {{customer.email}}              | `customer.email`                                          |
| {{customer.phone}}              | `customer.phone`                                          |
| {{product.login_name}}          | `product.login_name`                                      |
| {{product.login_keyword}}       | `product.login_keyword`                                   |
| {{price1.nickname}}             | `price1.nickname`                                         |
| {{price2.nickname}}             | `price2.nickname`                                         |
| {{price2.pay_days}}             | `price2.pay_days`                                         |
| {{price2.late_fee}}             | `price2.late_fee`                                         |
| {{price1.pay_by}}               | `price1.pay_by`                                           |
| {{price2.pay_by}}               | `price2.pay_by`                                           |
| {{price1.unit_amount}}          | `price1.unit_amount`                                      |
| {{price2.unit_amount}}          | `price2.unit_amount`                                      |
| {{project_scope_summary}}       | `project_scope_summary`                                   |
| {{project_scope_full}}          | `project_scope_full`                                      |
| {{subtotal}}                    | formatCurrency(`price1.unit_amount`+`price2.unit_amount`) |
| {{amount_off}}                  | formatCurrency(`coupon.amount_off`)                       |
| {{total}}                       | formatCurrency(`{{subtotal}}`–`{{discount}}`)             |
| {{amount_paid}}                 | Variable                                                  |
| {{today}}                       | formatDate(day-invoice-is-created)                        |


---

## Test 03 Feedback: Commit "Adding uid-tst-003 JSON file for next test"

### Filling Out JSON Simplification 

  + I wonder if we can put "TK" instead of leaving `null` for the fields that we expect to be filled out from artifact injection 
    - It would be nice just to have a reminder as to where you *should* add a UID and where you should *NOT* because it will be added via artifact injection 

### Payments Issue 

#### (FIXED) Stripe 500 Error: "You may only specify one of these parameters: customer, customer_creation"
- **Issue**: Clicking "Pay" resulted in a 500 error.
- **Cause**: Our job JSON templates include `customer_creation: "always"` by default. However, our automation also populates the `customer` field with a Stripe ID (`cus_...`). The Stripe API rejects requests that contain *both* parameters.
- **Resolution**: Updated `api/create-checkout-session.js` to detect if a `customer` ID is present. If it is, the code programmatically removes the `customer_creation` parameter from the request, prioritizing the existing customer record.
- **Action**: Applied fix in commit (pending).
- **Next Steps**: Retest with `uid-tst-004`.

---

## Test 02 Feedback: Commit "Deleted JSON test 002" 2166de3

### Workflow `admin-push.yml` 

  + Only change to be found by the workflow was a mismatch: 
    - No JSON file 
    - Stripe catalog product ID exists with active=true 
    --> Stripe catalog product ID was archived (changed to active=false) which is the appropriate action 

---

## Test 01 Feedback: Admin-Push of `test_job_golden_v4.json` 

### Workflow `admin-push.yml` 

  - Stripe objects created successfully
    - All artifacts returned accurately on the JSON file 
  - PDFs generated successfully
  - JSON artifact injected successfully

#### Workflow Logs Note on JSON Artifact Filename

  + Workflow logs mentioned noticing that the filename of the JSON artifact was not the same as the product.id (or "job id") 
    - This doesn't seem to have effected anything negatively at this point
    - It is notable that the information on `assets/js/manifest.json` might be unexpected compared to what is searched for when dynamically loading the job after login 

#### Room for Improvement Update 

  + Providing actual "Signed date" on the Contract under my signature 
    - The timestamp for `contract.signatures.contractor.signed_date` can be added as created date ISO 
    - This would be the same as `docs.contract.created` and `docs.invoice.created` 
    - In the case of `contract.signatures.client.signed_date` this timestamp is an actual artifact 
    - But since my signature is provided on the document as PNG already, we might as well use the contractor field as a way to provide a constantly accurate "signed date" 

  + **NOTE:** on formatting for displaying under signatures 
    - I'm not sure what the method for formatting dates from ISO to display them on the contract front end but it should be a simple matter of using the same method used for `docs.contract.created` and `docs.invoice.created`, or whatever looks best at the end of the contract under two signatures 
    - When the client signs they will be prompted to download the PDF of the contract for themselves and their signed date under their signature should look the same 

  + Final thought 
    - Just want to be 100% sure that these artifacts, including this one, are added to the JSON before PDF creation 
    - I'm almost 100% sure they are, but mentioning to be sure 

#### Phone Number Formatting 

  + The test JSON provided the phone number "555-0123" 
    - Since this isn't a valid phone number, I don't know that this *specifically* will be an issue (invalid value) 
    - But we should implement formatting for phone numbers pulled from JSON and displayed on the front end, nonetheless 
    - Ideally we just should use a simple 424-744-7687 format, no need for country code or any use of parenthesis 
    - Also ideally the formatting should adjust it for front end, allowing flexibility in filling out the JSON 
    - However this does bring up validation questions to address in the future -- please make a note of this validation aspect of the issue to be handled after we have the workflow functional 

#### Scope of Work Formatting 

  + The longer scope provided on the test JSON 
    - "This is a comprehensive test of the v4.4.0 recovery plan.\\n\\n1. Stripe Object Creation\\n2. PDF Generation\\n3. JSON Artifact Injection"
  + Displayed on the front end in contract 
    - This is a comprehensive test of the v4.4.0 recovery plan.\n\n1. Stripe Object Creation\n2. PDF Generation\n3. JSON Artifact Injection
    - It was added just like above with no natural line breaks visually in the contract

