# Testing Continued

## Objective 

  * **Adding and removing a single JSON file in the directory to test all workflows** 
  
  + First, the workflow always compares JSON object filenames to Manifest and follows logic. 
  
    1. Active JSON but no matching entry on the manifest = create new Product and other necessary objects in Stripe catalog, 
    2. Active JSON with matching Product Object ID or Job ID, same as JSON filename can be ignored as already synced, 
    3. Matching JSON and manifest entry with the JSON's `product_object.active= false` means that the payment process is complete so archive the Stripe catalog Product Object
    4. Product listed on the manifest that has no matching JSON object means it was removed and the associated Project Object should be modified in the catalog archive the object by changing active= true to false. 

  + For adding a new JSON needing creation of product in the Stripe Catalog 
    - When product is created, it has all necessary associated objects 
    - The created product's Price Object API response confirming creation has a Price Object ID to be copied over to the JSON file 
    - Then the manifest is updated to reflect the addition 

### Issue Logs 

  1. Product created accurately in the Stripe catalog with all associated objects  
  2. **ERROR** the JSON object was not updated with the Stripe Price Object ID after creation 
  3. The manifest was updated accurately 

  The un-updated file indicates the "orchestrate" workflow with the "Run Orchestrator" step had an error. Here are those logs. This is the first I've seen it mention missing variable "coupon_id". This job `assets/jobs/uid-test-001.json` does not have any coupon; the entire coupon object says "null" though if there was one, it would have an ID we created at `coupon_object.id`; regardless the coupon should be an optional field. 

  Regardless it is not clear to me where in here the step for updating JSON files after creating objects should actually happen. I believe when we did the simplified flow update it was said to be in the sync_catalog.py but it doesn't seem clear in the documented update: `assets/docs/planning-resources/feedback_during_reviews/SIMPLIFIED_FLOW.md` — this is confusing because we discussed specifically that we would not be batching the updates and would instead be making updates to JSON files directly after creating objects. I was confused because I thought we were planning on batching and wanted to confirm, and it was said to be confirmed, but if so, which file handles those updates? Where are they defined? Confirmation of this plan is found at the bottom of this document: `assets/docs/planning-resources/feedback_during_reviews/BATCHING_RESPONSE.md` 

  I think we should probably look back at the workflow cycle mapped at the bottom of this document below "## Comprehensive Flow Breakdown" heading: `assets/docs/planning-resources/feedback_during_reviews/BUG_WORKFLOW_FIX.md` — I do see that we have a `update_state.py` file created for front end behavior, though I don't see where in the orchestration that is located either. I'm not sure if there should be a separate file for updating JSON files after object creation, but think it was supposed to be located in the `sync_catalog.py` file, however that file ends with "Step 4: Create Stripe objects for new jobs". All so confusing because specifically, for `price_object.id`, we also specifically went through to make sure it would update in all the right places of the JSON.

  In fixing for this bug, we should confirm exactly what file and where in the orchestration of the mapped cycles each update type is located. As we continue through these bugs, it is appearing more nad more like there are features just completely not implemented, and it is increasingly difficult to track things down when we do not have documented anywhere where exactly each thing should be happening. 

  I think this will also require documenting what exactly we should expect from each type of object update. This much is at least simple, for each object created has a space in the JSON's `state_management` section where we are to place the Object's ID as confirmation for creation of that ID, if applicable. This includes `state_management.object_ID.product`, `state_management.object_ID.initial_price`, `state_management.object_ID.balance_price`, `state_management.object_ID.customer`, `state_management.object_ID.coupon`, and eventually, `state_management.object_ID.checkout_session.initial` and `state_management.object_ID.checkout_session.balance`. 

  Please note that in making these notes clear, I updated `state_management.object` to instead be `state_management.object_ID` to make it clear what is expected in those values after creation of objects. I also separated the `state_management.object_ID.price:[]` into `state_management.object_ID.initial_price` and `state_management.object_ID.balance_price` and did the same for `state_management.object_ID.checkout_session:[]` to reflect open values for both `state_management.object_ID.checkout_session.initial` and `state_management.object_ID.checkout_session.balance`. The final change I made was to add `state_management.object_ID.customer` into that section because it was missing. 

  After any object is created, the automation needs to directly update that JSON's state_management section with the object ID's directly from the API call's confirmation response. While setting up / confirming / debugging this, please also make sure that we have `update_state.py` set up the same way. Those events just come from a different place rather than Stripe API responses. 

  After this is sorted I'm going to simply remove the JSON file from the directory and ensure that our fix, made directly before this test, is effective and the Stripe catalog object is archived. 



```plaintext 
  3s
Run if [ "push" == "push" ]; then
  if [ "push" == "push" ]; then
    python3 .github/scripts/orchestration/orchestrate_workflow.py \
      --trigger push
  else
    python3 .github/scripts/orchestration/orchestrate_workflow.py \
      --trigger workflow_dispatch \
      --action "" \
      --job-id "" \
      --payload ''
  fi
  shell: /usr/bin/bash -e {0}
  env:
    pythonLocation: /opt/hostedtoolcache/Python/3.14.2/x64
    PKG_CONFIG_PATH: /opt/hostedtoolcache/Python/3.14.2/x64/lib/pkgconfig
    Python_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
    Python2_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
    Python3_ROOT_DIR: /opt/hostedtoolcache/Python/3.14.2/x64
    LD_LIBRARY_PATH: /opt/hostedtoolcache/Python/3.14.2/x64/lib
    STRIPE_SECRET_KEY: ***
DEBUG: sync_catalog stats: {
  "jobs_processed": 0,
  "products_created": 0,
  "products_modified": 0,
  "prices_created": 0,
  "customers_created": 0,
  "coupons_created": 0,
  "products_archived": 0,
  "_stderr": "DEBUG: Looking for jobs in: /home/runner/work/freelance-payments/freelance-payments/assets/jobs\nDEBUG: Found 2 JSON file(s) in /home/runner/work/freelance-payments/freelance-payments/assets/jobs\nDEBUG: Loaded job from uid-test-001.json\nDEBUG: Skipping template file: _job_template_v3.json\nDEBUG: Returning 1 job(s)\nDEBUG: Found 1 job file(s) in assets/jobs\nDEBUG: Found 0 job_id(s) in manifest\nDEBUG: Job uid-test-001 is new - will create Stripe objects\nDEBUG: Creating Stripe objects for job uid-test-001\n/home/runner/work/freelance-payments/freelance-payments/.github/scripts/orchestration/sync_catalog.py:261: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).\n  state_obj['created'] = datetime.utcnow().isoformat() + 'Z'\nError syncing job uid-test-001: cannot access local variable 'coupon_id' where it is not associated with a value\nTraceback: Traceback (most recent call last):\n  File \"/home/runner/work/freelance-payments/freelance-payments/.github/scripts/orchestration/sync_catalog.py\", line 495, in sync_catalog\n    stats = sync_job(job_data, manifest_job_ids, should_create=True)\n  File \"/home/runner/work/freelance-payments/freelance-payments/.github/scripts/orchestration/sync_catalog.py\", line 330, in sync_job\n    if coupon_id and 'discounts' in initial_checkout_session and initial_checkout_session['discounts']:\n       ^^^^^^^^^\nUnboundLocalError: cannot access local variable 'coupon_id' where it is not associated with a value\n\n"
}
DEBUG: sync_catalog stderr output:
DEBUG: Looking for jobs in: /home/runner/work/freelance-payments/freelance-payments/assets/jobs
DEBUG: Found 2 JSON file(s) in /home/runner/work/freelance-payments/freelance-payments/assets/jobs
DEBUG: Loaded job from uid-test-001.json
DEBUG: Skipping template file: _job_template_v3.json
DEBUG: Returning 1 job(s)
DEBUG: Found 1 job file(s) in assets/jobs
DEBUG: Found 0 job_id(s) in manifest
DEBUG: Job uid-test-001 is new - will create Stripe objects
DEBUG: Creating Stripe objects for job uid-test-001
/home/runner/work/freelance-payments/freelance-payments/.github/scripts/orchestration/sync_catalog.py:261: DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC).
  state_obj['created'] = datetime.utcnow().isoformat() + 'Z'
Error syncing job uid-test-001: cannot access local variable 'coupon_id' where it is not associated with a value
Traceback: Traceback (most recent call last):
  File "/home/runner/work/freelance-payments/freelance-payments/.github/scripts/orchestration/sync_catalog.py", line 495, in sync_catalog
    stats = sync_job(job_data, manifest_job_ids, should_create=True)
  File "/home/runner/work/freelance-payments/freelance-payments/.github/scripts/orchestration/sync_catalog.py", line 330, in sync_job
    if coupon_id and 'discounts' in initial_checkout_session and initial_checkout_session['discounts']:
       ^^^^^^^^^
UnboundLocalError: cannot access local variable 'coupon_id' where it is not associated with a value


DEBUG: sync_catalog made no changes - all files match manifest and are active
Saved working directory and index state WIP on freelance-payments: 81bb49b Debugging, Re: Archiving orphans changed pushed. Manually deleted Stripe catalog Product Object. Confirming the manifest is empty which is accurate. Placed uid-test-101 into assets/jobs/... and now pushed that.
[freelance-payments ca0de79] 🤖 Auto-update: Manifest update
 1 file changed, 9 insertions(+), 2 deletions(-)
To https://github.com/seanivore/freelance-payments
   81bb49b..ca0de79  freelance-payments -> freelance-payments
{
  "trigger": "push",
  "action": null,
  "steps_run": [
    "sync_catalog",
    "generate_manifest"
  ],
  "errors": [
    "sync_catalog errors: Traceback: Traceback (most recent call last): UnboundLocalError: cannot access local variable 'coupon_id' where it is not associated with a value"
  ],
  "committed": true,
  "pushed": true
}
Error: Process completed with exit code 1.
```