# Stripe Catalog Sync Bug Issues 

## Overview 

  1. The cause of Stripe API related workflow failures has almost certainly been identified in one script error 
  2. Based on the behavior we're seeing, there are more than just this script managing Stripe Catalog products 
  3. All issues can be overcome by implementing a grossly simplified workflow logic that handles any Catalog issues 
  4. Simply, we over extremely over engineer right now compared to how the Stripe API and our flag system works 

## Current Workflow Discoveries 

### Stripe API Dashboard 

  * **I suspect that the responses we expected to get from Stripe were buried in chaos**

  - Our Post products, prices, and even Get requests were all successful 
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

### GitHub Action Summary 

  * **The "Process Job & Update Stripe Catalog" workflow from `process-job.yml`**

  + There is only one job in the workflow called "process-job" 
    - First half is smooth 
    - Handle 'Contract Signing' and 'Payment Update' are skipped, as they should be 




So the first question I have is what in the flow is calling delete_product repeatedly. We should also make sure the "cleanup orphans" makes sense. It says it does prices first -- if it really does then we know it wasn't caused by that. 

Now, in GitHub looking at the "process job" from "Process Job & Update Stripe Catalog - Test: Trigger workflow to see full Stripe API error details #31"

I see that, at least one of the scripts has a place where it uses a git command to look for changes -- in this case check for manifest changes. This is problematic and we implimented the sync flags to create a method that completely avoided using something like GIT at all. It worked in my little portfolio project, but we don't want to rely on a product like that for this wtuff. 

OH HERE WE GO ---  then in that flow it goes to "Process Stripe Products" 

Run python3 .github/scripts/process_stripe_products.py
  python3 .github/scripts/process_stripe_products.py
  shell: /usr/bin/bash -e {0}
  env:
    pythonLocation: /opt/hostedtoolcache/Python/3.14.2/x64
    PKG_CONFIG_PATH: /opt/hostedtoolcache/Python/3.14.2/x64/lib/pkgconfig
    Python_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
    Python2_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
    Python3_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
    LD_LIBRARY_PATH: /opt/hostedtoolcache/Python/3.14.2/x64/lib
    STRIPE_SECRET_KEY: ***
📁 Found 0 active job(s) in folder

it found zero active jobs in the folder !! 

THEN it tries to use a delete call for the objects -- SO MANY in the list -- and it fails for all of them because "type object 'Price' has no attribute 'delete'" and after every one of those fails, it tries to make a call to delete the product which does go through but obviously fails. 

After all of those, of which there are many, it says: 

📁 Found 1 job file(s)
No payments found in assets/jobs/test-single-payment-v2.json

✅ Processed 0 file(s) with Stripe updates

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