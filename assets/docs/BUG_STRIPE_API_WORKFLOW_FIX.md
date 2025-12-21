# Stripe Catalog Sync Bug Issues 

## Overview 

  1. The cause of Stripe API related workflow failures has almost certainly been identified in one script error 
  2. Based on the behavior we're seeing, there are more than just this script managing Stripe Catalog products 
  3. All issues can be overcome by implementing a grossly simplified workflow logic that handles any Catalog issues 
  4. Simply, we over extremely over engineer right now compared to how the Stripe API and our flag system works 

---

## Current Workflow Discoveries 

### Stripe API Dashboard 

  * **I suspect that the responses we expected to get from Stripe were buried in chaos**

  + Our Post products, prices, and even Get requests were all successful 
    - All of the successful calls did receive response 
    - Simultaneously we had *~20 invalid delete calls every minute* we made a call 

  * **Product are in the catalog currently** 

  + There are 19 product objects and all have associated price objects 
    - Products: `assets/docs/reports/products.csv` 
    - Prices: `assets/docs/reports/prices.csv` 
  + API call logs and responses can't be exported 
    - But we can rest assured that we never hit rate limits even with over 600 calls 
    - Everything appears to have functioned as it should on Stripe 
  + Every DELETE request was for a product 
    - The products had prices and couldn't be deleted 
    - The products *were* objects we added today 
  + "Error 1" 
    - According to our python scripts we have responses of 0, 1, and 2 
    - We got 1 which makes sense because deleting products before prices is a validation error 

  * **Mystery becomes, what in the flow is calling delete_product repeatedly?!**

    - The solution provides a more effective complete workaround from whatever was doing it 
    - And can remove other scripts in question, i.e. the successful catalog objects came from somewhere 
    - We will even eliminate the need for a 'cleanup_orphans.py' script for now 

### GitHub Action Summary 

  * **The "Process Job & Update Stripe Catalog" workflow from `process-job.yml`**

  + There is only one job in the workflow called "process-job" 
  + Commit: 79829df "Test: Trigger workflow to see full Stripe API error details #31" 
    - First half of the job steps run smoothly 
    - Handle 'Contract Signing' and 'Payment Update' are skipped, as they should be 
    - Generate manifest `python3 .github/scripts/generate_manifest.py` runs effectively 

  * **First general problem is "Check for manifest changes" using GIT**

  + We don't want to rely on a product like GIT and planned accordingly 
    - Reason we implemented the sync flag system 
    - Worked in my little portfolio project, but not for this project 
  + How to stop this step and method completely are part of the comprehensive, simple solution 

### Next Step "Process Stripe Products" Massive Errors 

  * **The "Run `python3 .github/scripts/process_stripe_products.py`" command**

  + First clue: "📁 Found 0 active job(s) in folder" 
  + It then makes *~40 Delete calls* to remove Price Objects 
    - This is again because of buggy GIT usage in the script 
    - Somehow it was accruing products and they were stacking up from GIT 
    - Every call fails because "type object 'Price' has no attribute 'delete'"
  + After every failed DELETE call, it tried to delete the associated Product Object 
    - Thankfully we'll be able to eliminate this from the flow logic 
    - It isn't clear how multiple Price Objects for a Product Object could be deleted without an error 
  + These DELETE Product Object calls did go through to Stripe API 
    - There are the HUNDREDS of these failed calls 
    - They must be what bogged down things from communicating the object created details we wanted 
    - They all fails because they had active Price Objects 

  * **No payments found in assets/jobs/test-single-payment-v2.json** 
  
  + Another odd clue it then says: 
    - 📁 Found 1 job file(s)
    - ✅ Processed 0 file(s) with Stripe updates

  * **Again, no clue what in the scripts, other than GIT could be the issue, but it doesn't matter** 

---

## Over Engineering Identified As Primary Culprit 



-----

This makes me suspect that things aren't at all as simple as the logic steps I was asking about at the start. I think that updating our workflows to the following logic might solve a lot of issues. We will be able to use fewer 

the JSON object is organized for a product object then price objects 
if the product object says "sync = true" then it goes through these steps 

I have a suspicion that we're grossly over-engineered. For syncing the catalog it should look for sync = true and NOTHING ELSE. 

      1. `sync` = true, then search for matching stripe_product_id 
      2. No matches? CREATE NEW PRODUCT 
      3. Find match? OVERWRITE ALL PRODUCT FIELDS PROVIDED 
      4. New product, place stripe_product_id on JSON 
      5. New or updated product, change `sync` to FALSE 


The same for prices with sync = true (true, it does need to be synced). We shouldn't use any other values or methods to complicate this. 

      1. `sync` = true, then search for matching stripe_price_id 
      2. No matches? CREATE NEW PRICE OBJECT  
      3. Find match? CHANGE IT TO ACTIVE:FALSE AND CREATE NEW PRICE OBJECT 
      4. New price, place stripe_price_id on JSON 
      5. New or updated product, change `sync` to FALSE 


Equally for the calls and methods for updating things, we should be as simple and true as possible to those steps above. 

Next I think we should address the excess of api call script types. For example 

import stripe
stripe.api_key = "sk_test_..."

price = stripe.Price.modify(
  "price_1MoBy5LkdIwHu7ixZhnattbh",
  metadata={"order_id": "6735"},
)

"Updates the specified price by setting the values of the parameters passed. Any parameters not provided are left unchanged" 

So all we to be able to archive or update *any* field except the amount. 
When the price with a matching stripe_price_id is found, the script could then see if the amount on the JSON is the same or different than the 