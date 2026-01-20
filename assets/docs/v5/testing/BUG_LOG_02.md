BUG_02_001 — First user session, Completion1 button doesn't move user forward 

TEST FILE: uid-qee-576.json
LOGIN KEYS: Miller -- last-resort 
TEST STATE: Completely new job file setup accurately 

1. Login as a first time visiting user 
2. Sign contract, view invoice, make payment_1 
3. Click continue to payment_2 on Completion1 page 

EXPECTED: Clicking button to continue should have loaded the Balance PDF allowing user to download/view, then proceed to make payment_2 

ACTUAL: Clicking the continue to make payment_2 button on Completion1 shows the contract load in the background but the Completion1 view continues to appear

RESOURCES: 

See "BUG_01_016 - User Exit Events Workflow Issues & Return User State Placement" on `assets/docs/v5/testing/LOG_01.md` 

Vercel logs can be found here -- assets/docs/v5/testing/BUG_02_001-vercel-logs.json

--Stripe logs pasted below-- 

200 OK
GET
/v1/checkout/sessions/cs_test_a1FqWycDA7Bjmv2Kbqkgi8mVOEA3pEhQNoQ198qmth7orUHVw2O88QxIFi
10:45:08 PM
200 OK
POST
/v1/payment_methods
10:45:04 PM
200 OK
POST
/v1/checkout/sessions
10:44:55 PM
200 OK
POST
/v1/coupons
10:37:08 PM
404 ERR
GET
/v1/coupons/cou-qee-576
10:37:08 PM
200 OK
POST
/v1/prices
10:37:07 PM
200 OK
POST
/v1/prices
10:37:07 PM
200 OK
POST
/v1/customers
10:37:07 PM
200 OK
POST
/v1/products
10:37:07 PM
200 OK
GET
/v1/products/uid-bnp-832
10:37:07 PM


--Console during session pasted below--

  GET https://payments.august.style/uid-qee-576?session_id=cs_test_a1FqWycDA7Bjmv2Kbqkgi8mVOEA3pEhQNoQ198qmth7orUHVw2O88QxIFi 404 (Not Found)
(anonymous) @ js.stripe.com/clover/stripe.js:1
job-BIx_agM0.js:50 Vite: job.tsx loaded
job-BIx_agM0.js:50 Detected session_id: cs_test_a1FqWycDA7Bjmv2Kbqkgi8mVOEA3pEhQNoQ198qmth7orUHVw2O88QxIFi (from URL)
job-BIx_agM0.js:1 ✅ Loaded job data for uid-qee-576: {logged_in: null, contract_signed: null, invoice: null, payment_1: null, balance: null, …}
job-BIx_agM0.js:50 🔍 State Management Debug: {sessionId: 'cs_test_a1FqWycDA7Bjmv2Kbqkgi8mVOEA3pEhQNoQ198qmth7orUHVw2O88QxIFi', client_status: {…}}
job-BIx_agM0.js:50 📍 Routing: no progress detected → contract (default)
job-BIx_agM0.js:50 ✅ Final routing decision: contract
job-BIx_agM0.js:50 Event: contract_loaded {page: 1, totalPages: 8}
job-BIx_agM0.js:50 📋 Session status: complete {status: 'complete', payment_status: 'paid', payment_intent_id: 'pi_3SrRC19fljwH26CP08CTfpvO', payment_intent_status: 'succeeded', amount_total: 5388000, …}
job-BIx_agM0.js:50 ✅ Payment 1 completed - adding to event buffer
job-BIx_agM0.js:50 📤 Flushing payment event immediately...
job-BIx_agM0.js:50 🔍 State Management Debug: {sessionId: 'cs_test_a1FqWycDA7Bjmv2Kbqkgi8mVOEA3pEhQNoQ198qmth7orUHVw2O88QxIFi', client_status: {…}}
job-BIx_agM0.js:50 📍 Routing: Session complete, payment_1 → completion1
job-BIx_agM0.js:50 ✅ Final routing decision: completion1
job-BIx_agM0.js:50 ⏭️  Session already processed, skipping...
job-BIx_agM0.js:50 ✅ Flushed 3 event(s) to API
job-BIx_agM0.js:50 🔍 State Management Debug: {sessionId: 'cs_test_a1FqWycDA7Bjmv2Kbqkgi8mVOEA3pEhQNoQ198qmth7orUHVw2O88QxIFi', client_status: {…}}
job-BIx_agM0.js:50 📍 Routing: Forced section → balance
job-BIx_agM0.js:50 ✅ Final routing decision: balance
job-BIx_agM0.js:50 🔍 State Management Debug: {sessionId: 'cs_test_a1FqWycDA7Bjmv2Kbqkgi8mVOEA3pEhQNoQ198qmth7orUHVw2O88QxIFi', client_status: {…}}
job-BIx_agM0.js:50 📍 Routing: Session complete, payment_1 → completion1
job-BIx_agM0.js:50 ✅ Final routing decision: completion1
job-BIx_agM0.js:50 🔍 State Management Debug: {sessionId: 'cs_test_a1FqWycDA7Bjmv2Kbqkgi8mVOEA3pEhQNoQ198qmth7orUHVw2O88QxIFi', client_status: {…}}
job-BIx_agM0.js:50 📍 Routing: Forced section → balance
job-BIx_agM0.js:50 ✅ Final routing decision: balance
job-BIx_agM0.js:50 Event: contract_loaded {page: 1, totalPages: 1}
job-BIx_agM0.js:50 🔍 State Management Debug: {sessionId: 'cs_test_a1FqWycDA7Bjmv2Kbqkgi8mVOEA3pEhQNoQ198qmth7orUHVw2O88QxIFi', client_status: {…}}
job-BIx_agM0.js:50 📍 Routing: Session complete, payment_1 → completion1
job-BIx_agM0.js:50 ✅ Final routing decision: completion1
job-BIx_agM0.js:49 Only 0 of 1 canvases ready after 20 retries
job-BIx_agM0.js:49 renderAllPages: Starting render for 1 pages
job-BIx_agM0.js:49 Canvas for page 1 not ready yet {exists: false, connected: undefined}


===

---
RESULTS: Accurate behavior for user returning later to make payment_2 

TEST FILE: uid-bnp-832.json
LOGIN KEYS: Anderson -- jake-acts 
TEST STATE: Completed through payment_1 with accurate events recorded to JSON 

1. Login as a returning user 
2. Downloaded/viewed balance PDF 
3. Made final payment_2
4. Viewed the Completion2 page 
5. Next local smart-push pulled JSON that was all updated properly and the Product was marked as no longer active, which then archived the product in the actual Stripe catalog 

Expected and Actual behavior are in sync. 

Next test should try using the buttons on Complete2 to download the various files 

--RESOURCES-- 

Vercel log for this workflow: `assets/docs/v5/testing/test-log-01-uid-bnp-832-vercel-log.json` 


--Console from return session--

  GET https://payments.august.style/uid-bnp-832?session_id=cs_test_a1O0DvgqRP9gcu7cjhXBOH0Z74WmjxOHDcLsH4HNORv8q5uP4ly6dW1EsS 404 (Not Found)
(anonymous) @ js.stripe.com/clover/stripe.js:1
o @ js.stripe.com/clover/stripe.js:1
(anonymous) @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
Promise.then
(anonymous) @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
(anonymous) @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
u._fetch @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
u.enqueue @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
u.enqueueOne @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
Ie @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
(anonymous) @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
(anonymous) @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
l @ job-BIx_agM0.js:50
pv @ index-CwGdK3tu.js:8
(anonymous) @ index-CwGdK3tu.js:8
Bi @ index-CwGdK3tu.js:8
Qc @ index-CwGdK3tu.js:8
Pc @ index-CwGdK3tu.js:9
Z1 @ index-CwGdK3tu.js:9
job-BIx_agM0.js:50 Vite: job.tsx loaded
job-BIx_agM0.js:50 Detected session_id: cs_test_a1O0DvgqRP9gcu7cjhXBOH0Z74WmjxOHDcLsH4HNORv8q5uP4ly6dW1EsS (from URL)
job-BIx_agM0.js:1 ✅ Loaded job data for uid-bnp-832: {logged_in: '2026-01-17T21:08:15.848Z', contract_signed: '2026-01-17T21:08:34.711Z', invoice: '2026-01-17T21:08:40.327Z', payment_1: '2026-01-17T21:08:40.328Z', balance: null, …}
job-BIx_agM0.js:50 🔍 State Management Debug: {sessionId: 'cs_test_a1O0DvgqRP9gcu7cjhXBOH0Z74WmjxOHDcLsH4HNORv8q5uP4ly6dW1EsS', client_status: {…}}
job-BIx_agM0.js:50 📍 Routing: payment_1 completed + balance available → balance
job-BIx_agM0.js:50 ✅ Final routing decision: balance
job-BIx_agM0.js:50 Event: contract_loaded {page: 1, totalPages: 1}
job-BIx_agM0.js:49 All 1 canvases ready, starting render...
job-BIx_agM0.js:49 renderAllPages: Starting render for 1 pages
job-BIx_agM0.js:49 Rendering page 1...
job-BIx_agM0.js:49 Page 1 viewport: {width: 612, height: 792, scale: 1}
job-BIx_agM0.js:49 Canvas 1 dimensions: {internal: {…}, display: {…}, outputScale: 2}
job-BIx_agM0.js:49 Starting render for page 1...
job-BIx_agM0.js:49 Page 1 render completed
job-BIx_agM0.js:49 Page 1 rendered successfully
job-BIx_agM0.js:50 📋 Session status: complete {status: 'complete', payment_status: 'paid', payment_intent_id: 'pi_3SrRWy9fljwH26CP0tR1GNs0', payment_intent_status: 'succeeded', amount_total: 260000, …}
job-BIx_agM0.js:50 ✅ Payment 2 completed - adding to event buffer
job-BIx_agM0.js:50 📤 Flushing payment event immediately...
job-BIx_agM0.js:50 🔍 State Management Debug: {sessionId: 'cs_test_a1O0DvgqRP9gcu7cjhXBOH0Z74WmjxOHDcLsH4HNORv8q5uP4ly6dW1EsS', client_status: {…}}
job-BIx_agM0.js:50 📍 Routing: Session complete, payment_2 → completion2
job-BIx_agM0.js:50 ✅ Final routing decision: completion2
job-BIx_agM0.js:50 ⏭️  Session already processed, skipping...
job-BIx_agM0.js:50 ✅ Flushed 2 event(s) to API


===

---
BUG_02_002 — Completed user returning not served Complete2 

Possibly because of it not loading the updated JSON. 

TEST FILE: uid-oac-784.json
LOGIN KEYS: Mobile -- town-seams 
TEST STATE: Completed up through payment_1 with accurate events recorded to JSON 

1. User returns login sends them to view balance then make payment_2 
2. User clicks the download buttons on Completion2 and gets accurate documents 

Expected and actual behavior are in sync for session 1. 

Next test SESSION 2 is to login as this same job and see if Completion2 still loads accurately. 

Note -- the JSON in jobs file in live directory was checked and all updates were added, all timestamps are added and the product has been marked as not active, however it won't be until the next push that these updates will be recognized by Stripe for the actual product to be archived. All of this is expected and should have no unexpected effect on actual behavior. 

1. Testing continued, user login again even though all payments are complete and JSON reflects this 
2. User clicks the download buttons on Completion2 to get accurate documents 

Expected: User is served the Completion2 view because they have made all payments 

Actual: User is sent to "balance" after login and you can see that the console log does not see that the "balance" timestamp does actually exist on the live JSON 

User will repeat for SESSION 3 

Expected: User is served the Completion2 view because they have made all payments

Actual: Same as session 2, the user is still sent to balance as the JSON value on current live JSON is not recognized 

NOTE: AI please review log_1 bug fixes because we had these issues for the user login and their being routed inaccurately to Complete1 instead of accurately sent to balance PDF. This seems similar, but you can see in the logs that, while the previous JSON timestamps are seen, the later updates are not. 

--Console logs--

FIRST SESSION

  GET https://payments.august.style/uid-oac-784?session_id=cs_test_a1cXNvwx7ln8Gzw5gNb8pLC6h6T3F4qsV5ZFKxCMxdo5E8NehxYZAyH42Z 404 (Not Found)
(anonymous) @ js.stripe.com/clover/stripe.js:1
o @ js.stripe.com/clover/stripe.js:1
(anonymous) @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
Promise.then
(anonymous) @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
(anonymous) @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
u._fetch @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
u.enqueue @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
u.enqueueOne @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
Ie @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
(anonymous) @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
(anonymous) @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
l @ job-BIx_agM0.js:50
pv @ index-CwGdK3tu.js:8
(anonymous) @ index-CwGdK3tu.js:8
Bi @ index-CwGdK3tu.js:8
Qc @ index-CwGdK3tu.js:8
Pc @ index-CwGdK3tu.js:9
Z1 @ index-CwGdK3tu.js:9
job-BIx_agM0.js:50 Vite: job.tsx loaded
job-BIx_agM0.js:50 Detected session_id: cs_test_a1cXNvwx7ln8Gzw5gNb8pLC6h6T3F4qsV5ZFKxCMxdo5E8NehxYZAyH42Z (from URL)
job-BIx_agM0.js:1 ✅ Loaded job data for uid-oac-784: {logged_in: '2026-01-17T21:34:02.864Z', contract_signed: '2026-01-17T21:34:21.037Z', invoice: '2026-01-17T21:34:26.267Z', payment_1: '2026-01-17T21:34:26.268Z', balance: null, …}
job-BIx_agM0.js:50 🔍 State Management Debug: {sessionId: 'cs_test_a1cXNvwx7ln8Gzw5gNb8pLC6h6T3F4qsV5ZFKxCMxdo5E8NehxYZAyH42Z', client_status: {…}}
job-BIx_agM0.js:50 📍 Routing: payment_1 completed + balance available → balance
job-BIx_agM0.js:50 ✅ Final routing decision: balance
job-BIx_agM0.js:50 Event: contract_loaded {page: 1, totalPages: 1}
job-BIx_agM0.js:49 All 1 canvases ready, starting render...
job-BIx_agM0.js:49 renderAllPages: Starting render for 1 pages
job-BIx_agM0.js:49 Rendering page 1...
job-BIx_agM0.js:49 Page 1 viewport: {width: 612, height: 792, scale: 1}
job-BIx_agM0.js:49 Canvas 1 dimensions: {internal: {…}, display: {…}, outputScale: 2}
job-BIx_agM0.js:49 Starting render for page 1...
job-BIx_agM0.js:49 Page 1 render completed
job-BIx_agM0.js:49 Page 1 rendered successfully
job-BIx_agM0.js:50 📋 Session status: complete {status: 'complete', payment_status: 'paid', payment_intent_id: 'pi_3SrRm59fljwH26CP1JHLs8Zk', payment_intent_status: 'succeeded', amount_total: 392500, …}
job-BIx_agM0.js:50 ✅ Payment 2 completed - adding to event buffer
job-BIx_agM0.js:50 📤 Flushing payment event immediately...
job-BIx_agM0.js:50 🔍 State Management Debug: {sessionId: 'cs_test_a1cXNvwx7ln8Gzw5gNb8pLC6h6T3F4qsV5ZFKxCMxdo5E8NehxYZAyH42Z', client_status: {…}}
job-BIx_agM0.js:50 📍 Routing: Session complete, payment_2 → completion2
job-BIx_agM0.js:50 ✅ Final routing decision: completion2
job-BIx_agM0.js:50 ⏭️  Session already processed, skipping...
job-BIx_agM0.js:50 ✅ Flushed 2 event(s) to API


SESSION 2 

  GET https://payments.august.style/uid-oac-784 404 (Not Found)
j @ assets/main-ERqGnDh0.js:1
await in j
pv @ index-CwGdK3tu.js:8
(anonymous) @ index-CwGdK3tu.js:8
Bi @ index-CwGdK3tu.js:8
Qc @ index-CwGdK3tu.js:8
Pc @ index-CwGdK3tu.js:9
Z1 @ index-CwGdK3tu.js:9
job-BIx_agM0.js:50 Vite: job.tsx loaded
job-BIx_agM0.js:50 No session_id found in URL or sessionStorage
job-BIx_agM0.js:1 ✅ Loaded job data for uid-oac-784: {logged_in: '2026-01-17T21:34:02.864Z', contract_signed: '2026-01-17T21:34:21.037Z', invoice: '2026-01-17T21:34:26.267Z', payment_1: '2026-01-17T21:34:26.268Z', balance: null, …}
job-BIx_agM0.js:50 🔍 State Management Debug: {sessionId: 'none', client_status: {…}}
job-BIx_agM0.js:50 📍 Routing: payment_1 completed + balance available → balance
job-BIx_agM0.js:50 ✅ Final routing decision: balance
job-BIx_agM0.js:50 Event: contract_loaded {page: 1, totalPages: 1}
job-BIx_agM0.js:49 All 1 canvases ready, starting render...
job-BIx_agM0.js:49 renderAllPages: Starting render for 1 pages
job-BIx_agM0.js:49 Rendering page 1...
job-BIx_agM0.js:49 Page 1 viewport: {width: 612, height: 792, scale: 1}
job-BIx_agM0.js:49 Canvas 1 dimensions: {internal: {…}, display: {…}, outputScale: 2}
job-BIx_agM0.js:49 Starting render for page 1...
job-BIx_agM0.js:49 Page 1 render completed
job-BIx_agM0.js:49 Page 1 rendered successfully

SESSION 3 

  GET https://payments.august.style/uid-oac-784 404 (Not Found)
j @ assets/main-ERqGnDh0.js:1
await in j
pv @ index-CwGdK3tu.js:8
(anonymous) @ index-CwGdK3tu.js:8
Bi @ index-CwGdK3tu.js:8
Qc @ index-CwGdK3tu.js:8
Pc @ index-CwGdK3tu.js:9
Z1 @ index-CwGdK3tu.js:9
job-BIx_agM0.js:50 Vite: job.tsx loaded
job-BIx_agM0.js:50 No session_id found in URL or sessionStorage
job-BIx_agM0.js:1 ✅ Loaded job data for uid-oac-784: {logged_in: '2026-01-17T21:34:02.864Z', contract_signed: '2026-01-17T21:34:21.037Z', invoice: '2026-01-17T21:34:26.267Z', payment_1: '2026-01-17T21:34:26.268Z', balance: null, …}
job-BIx_agM0.js:50 🔍 State Management Debug: {sessionId: 'none', client_status: {…}}
job-BIx_agM0.js:50 📍 Routing: payment_1 completed + balance available → balance
job-BIx_agM0.js:50 ✅ Final routing decision: balance
job-BIx_agM0.js:50 Event: contract_loaded {page: 1, totalPages: 1}
job-BIx_agM0.js:49 All 1 canvases ready, starting render...
job-BIx_agM0.js:49 renderAllPages: Starting render for 1 pages
job-BIx_agM0.js:49 Rendering page 1...
job-BIx_agM0.js:49 Page 1 viewport: {width: 612, height: 792, scale: 1}
job-BIx_agM0.js:49 Canvas 1 dimensions: {internal: {…}, display: {…}, outputScale: 2}
job-BIx_agM0.js:49 Starting render for page 1...
job-BIx_agM0.js:49 Page 1 render completed
job-BIx_agM0.js:49 Page 1 rendered successfully

===

This time, the difference will be that the local repo was updated and so needed to be pushed from local. 

Note before pushing, on GitHub repo is shown with the previous test that was marked Product active = false, for which the Stripe catalog product was archived on the next push, the JSON file for that job was deleted from the directory as expected. This was "uid-bnp-832.json". These changes haven't been pulled to local yet. 

The JSON uid-oac-784.json was also updated to Product active = false, however because there were no events or other workflow push made since those JSON changes were made live, the Stripe catalog product was not archived yet. These changes haven't been pulled to local yet. This also means that the uid-oac-784.json still exists locally as that is not deleted until two pushes after the update because the JSON file is updated when the system recognizes that there is no matching Stripe catalog product and the JSON is marked not active. This is all expected and accurate behavior. 

Now that these details have been recorded and this file saved to the repo locally, I will push these changes. 

---

Pleasantly surprised to see that in the same push the JSON marked "inactive" because of payment completion had the Stripe catalog product archived and then the JSON job was also deleted from the directory. All changes were pulled locally. 

This means that the attempt to login for TEST JOB uid-oac-784.json was no longer possible. 

Because of this expected behavior, there doesn't seem to be reason to overemphasize the need for a user login after making all payments to be redirected to the Completion2 page again, because after one push following the event tracking updates of a user making final payments, the JSON for that job will no longer be available and login no longer possible. 

===

TEST FILE: uid-qee-576.json
LOGIN KEYS: Miller -- last-resort 
TEST STATE: Completed through payment_1 with accurate events recorded to JSON 

1. User logged in and went to make payment_2
2. User was routed to balance accurately then made payment_2
3. User used card that was declined accurately and new card allowed payment to process 
4. User was redirected to Completion2 accurately 

--console logs from session--

  GET https://payments.august.style/uid-qee-576?session_id=cs_test_a1yWJBrlegr7kEXpvYZH3meNRCca7J3ZBRa3ujVMcwg20puHZHjiuEBx68 404 (Not Found)
(anonymous) @ js.stripe.com/clover/stripe.js:1
o @ js.stripe.com/clover/stripe.js:1
(anonymous) @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
Promise.then
(anonymous) @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
(anonymous) @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
u._fetch @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
u.enqueue @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
u.enqueueOne @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
Ie @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
(anonymous) @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
(anonymous) @ js.stripe.com/v3/fin…a9cf67e9caca22.js:1
l @ job-BIx_agM0.js:50
pv @ index-CwGdK3tu.js:8
(anonymous) @ index-CwGdK3tu.js:8
Bi @ index-CwGdK3tu.js:8
Qc @ index-CwGdK3tu.js:8
Pc @ index-CwGdK3tu.js:9
Z1 @ index-CwGdK3tu.js:9
job-BIx_agM0.js:50 Vite: job.tsx loaded
job-BIx_agM0.js:50 Detected session_id: cs_test_a1yWJBrlegr7kEXpvYZH3meNRCca7J3ZBRa3ujVMcwg20puHZHjiuEBx68 (from URL)
job-BIx_agM0.js:1 ✅ Loaded job data for uid-qee-576: {logged_in: '2026-01-19T22:44:33.081Z', contract_signed: '2026-01-19T22:44:49.200Z', invoice: '2026-01-19T22:44:54.091Z', payment_1: '2026-01-19T22:44:54.091Z', balance: null, …}
job-BIx_agM0.js:50 🔍 State Management Debug: {sessionId: 'cs_test_a1yWJBrlegr7kEXpvYZH3meNRCca7J3ZBRa3ujVMcwg20puHZHjiuEBx68', client_status: {…}}
job-BIx_agM0.js:50 📍 Routing: payment_1 completed + balance available → balance
job-BIx_agM0.js:50 ✅ Final routing decision: balance
job-BIx_agM0.js:50 Event: contract_loaded {page: 1, totalPages: 1}
job-BIx_agM0.js:49 All 1 canvases ready, starting render...
job-BIx_agM0.js:49 renderAllPages: Starting render for 1 pages
job-BIx_agM0.js:49 Rendering page 1...
job-BIx_agM0.js:49 Page 1 viewport: {width: 612, height: 792, scale: 1}
job-BIx_agM0.js:49 Canvas 1 dimensions: {internal: {…}, display: {…}, outputScale: 2}
job-BIx_agM0.js:49 Starting render for page 1...
job-BIx_agM0.js:49 Page 1 render completed
job-BIx_agM0.js:49 Page 1 rendered successfully
job-BIx_agM0.js:50 📋 Session status: complete {status: 'complete', payment_status: 'paid', payment_intent_id: 'pi_3SrSNW9fljwH26CP1EN0SCc3', payment_intent_status: 'succeeded', amount_total: 5400000, …}
job-BIx_agM0.js:50 ✅ Payment 2 completed - adding to event buffer
job-BIx_agM0.js:50 📤 Flushing payment event immediately...
job-BIx_agM0.js:50 🔍 State Management Debug: {sessionId: 'cs_test_a1yWJBrlegr7kEXpvYZH3meNRCca7J3ZBRa3ujVMcwg20puHZHjiuEBx68', client_status: {…}}
job-BIx_agM0.js:50 📍 Routing: Session complete, payment_2 → completion2
job-BIx_agM0.js:50 ✅ Final routing decision: completion2
job-BIx_agM0.js:50 ⏭️  Session already processed, skipping...
job-BIx_agM0.js:50 ✅ Flushed 2 event(s) to API
