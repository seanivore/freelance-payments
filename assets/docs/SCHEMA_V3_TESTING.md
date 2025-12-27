# Testing Feedback 

## Summary 

Feedback from testing after we made the most recent updates to accommodate the v3 schema `assets/jobs/_job_template_v3.json` and altered the workflow planning according the the details in our `assets/docs/BUG_WORKFLOW_FIX.md` plan. 

### Actions Thus Far To Test 

  1. A `git add .` push committed all 8 of our `assets/jobs/uid-test-xxx.json...` files at once 

### Providing Unique ID Failure for Price Objects 

Stripe API isn't accepting the provided Price ID (uid-xxx-xxx-1, etc.). Providing the Product ID and Customer ID is working fine. The API calls were 'smart' in that they created another call immediately and got the Price Object created, tied to the appropriate Product Object, allowing Stripe to create a random scring of text for the Price Object ID. 

I suppose this is fine. We'll just want to make sure that when the Price Object is created, we then use the API response to get the Price Object ID so we can save it in that job's JSON file, once the batch of JSON file updates are processed following the creation of all the JSON files in the queue's varous  objects. 

