# An Overview of the Triggers and Actions Logic

## Overview

- There are a series of different triggers and actions that are used to orchestrate various workflow situations 
- The specifics of their logic evolved over time as we were completing the initial build, adding in things we overlooked, etc. 
- To properly test, document the logic for each trigger and action; ensure clear understanding of how they create workflow 
- Goal is to help us identify current issues while potentially making the workflow simpler and more efficient 

### Summary of Plan of Attack

  1. Review the very basic needs as outlined in "SITUATIONS" below 
  2. Understand the current state of the workflow as much as possible 
  3. Isolate and review the files and code associated with each workflow aspect 
  5. Using the overhead view, ensure the simplest possible workflow has been implemented, and update if needed 
  5. First run tests, one at a time, starting with any changes to job JSON files and associated triggered workflows  
  6. For each bug encountered, review all logs and expectations to fully understand picture before making a fix 
  7. Ensure simple directions included for User in Terminal App to keep local and remote git repos in sync 
  8. Continue then finish tests for other aspects of the payments website process 

### Plan of Attack Context & Steps 

 * **Problems of our first bug hunt**

  1. It seemed like we were making assumptions that could only have been avoided by fully reviewing the workflow logs in detail 
    + Many times the GitHub actions workflow logs were not thoroughly reviewed 
    + No where did we look into log details for the Stripe API calls, or Vercel function logs 

  2. It was not always clear what *exactly* we should have been looking for regarding file changes 
    + For example, I suspect there are some updates to JSON files after made after a job is added as a product to the Stripe catalog
    + These are specifics that AI likely made as methods for analyzing workflow success or failures 
    + But that were never explicitly documented, or at least not directly communicated, during the build process 

 * **Analysis of our current setup** 

  1. Start with documented detailed specifics of every workflow type 
    + What are the expected actions, including any methods added simply for confirming workflow success or failure 
    + This will help us to identify potential issues and improvements, and I think in the end, a simplification of all necessary workflows 

  2. Review the logic for each trigger and action 
    + What is the trigger 
    + What are the actions 
    + What is the situational intention or purpose of this workflow 
    + What edge cases are being handled 
    + What is the expected outcome of this workflow 

  3. Identify potential issues and improvements 
    + Find the code and files that are associated with making all of these workflows happen 
    + Review those files and their placement in the project directory structure 
    + Create diagrams of each workflow type; the theory being that these should be simple and if they aren't something is wrong 

 * **Adapting our approach this time** 

  1. Look at our current testing setup 
    + Review and understand the current testing setup 
    + After any adjustments, we should be able to use this same setup 
  
  2. Run the tests, together, one at a time 
    + Previously there was no formal process and we sort of fell into testing after accidentally pushing all new test jobs 
    + This time we need to make sure we're pragmatic and paced, fixing things along the way 

  3. Proper and comprehensive bug encounter log reviews 
    + There are a number of actions triggered in GitHub, the detailed logs should be reviewed for each 
    + Any updates or adaptations made should include things like user-friendly browser console logs 
    + Check all locations, not just GitHub logs, but also Stripe and Vercel logs 

### Current Issues (Not Comprehensive)

 * **What we saw so far was only regarding the initial act of pushing various test jobs**

  + Something about the workflow is canceling steps to jump to later steps faster 
  + You can see the manifest.json was updated in the workflow logs, but the JSON file was not updated in the repo 
  + Duplicate products are being created in the Stripe catalog 
  + Removal of JSON files from the `assets/jobs/` directory is not triggering the removal of the corresponding Stripe products 

 * **Move forward when adding, editing, and removing JSON files from the `assets/jobs/` directory works as expected** 

  + Why are these locations different? 

`/Users/seanivore/Development/freelance-payments/.github/scripts/process_stripe_products.py`
`/Users/seanivore/Development/freelance-payments/generate_manifest.py` 

  + Here is the GitHub Actions Workflow to review based on understanding of the logic below 

`/Users/seanivore/Development/freelance-payments/.github/workflows/process-job.yml` 

### Next Steps

  1. Manipulation of JSON files in `assets/jobs/` all works as expected; we can move forward 
  2. User login pulls up proper job details 
  3. Dynamic population of the contract is accurate from start to end 
  4. User can easily download the contract as a PDF that is properly formatted and styled 
  5. User can easily download the invoice as a PDF that is properly formatted and styled 
  6. User can easily sign the contract while on the website 
  7. If user leaves website, they can return with state saved and next step identified  
  8. User is moved to proper payment page after signing contract 
  9. Stripe test card payment works as expected 
  10. Returning user is directed to make their final payment 

## Situation & Associated Workflow Logic 

### TRIGGER: Admin Manipulates JSON Files in `assets/jobs/` Directory & Then Pushes to GitHub
  + Overwrite new `assets/js/manifest.json` file with the contents of the `assets/jobs/` directory 
  + Sync Stripe Product Catalog with the contents of the `assets/js/manifest.json` file 

  * **POSSIBLE TRIGGER SPECIFICS** 

  1. New job JSON added to directory 
  2. Existing job JSON edited while in directory 
    - Finer details about the job are updated over time, reflecting potential changes 
    - The final payment price and adjusted because user wanted to give client a discount, or other adjustment were made 
    - There was an error in name, address, or other details that had to be corrected 
  3. Existing job JSON removed from directory 

  * **ACTION: Project directory file `assets/js/manifest.json` overwritten**

  + Regardless of the type of changes to the JSON files 
    - Overwrite and create a new `assets/js/manifest.json` file 
    - This file should always mirror the contents of the `assets/jobs/` directory 
 
  * **ACTION: Stripe Product Catalog Synchronization** 

  + The realization for the need to do this occurred in the middle of development 
    - As such, I'm not 100% sure we went about things the best way possible or if it was more of a band-aid fix
    - Lets make sure we're using the most minimal possible workflow to mirror the Catalog and Directory contents 
    - Ensure any values fed into the Catalog are already on the JSON objects in the directory 

  + In looking at the logs from earlier testing, I'd like to understand why we need to create a product first and then create prices separately

  + Note that we don't want to archive products 
    - When a job or Product is paid of, it is naturally "archived" in it's own way and this is enough for our purposes 
    - This way, if a JSON is deleted from the directory, the corresponding Product and Prices are also deleted from the Catalog 
    - This ensures no conflicts 

 * **CONSIDER FLOW SEQUENCE, POTENTIALLY TAKE ALL FLOWS AND CREATE A SINGLE FLOW THAT DOES IT ALL**

  + In testing previously I was sold that workflows could run asynchronously, which didn't make logical sense to me
  + But I do know that if it was just one workflow, it would not matter either way 

  + Considering the above needs, consider our `manifest.json` file 
    - Is there any way to adjust what information is added to the manifest that would help Product Catalog Sync? 
    - Perhaps the metadata that can be used to search catalogs 

  + There are many other events that could be sent to the Webhook endpoint 
    - This could be used to create a secondary "manifest" or just "catalog" file 
    - It would have the latest information from the Catalog 
    - Then the manifest and this catalog file could be compared to determine what changes need to be made 
    - This might be a more robust way to handle changes that is more efficient than whatever the current method is 

 * **ACTION: Newly updated `manifest.json` file pushed to GitHub** 
 * **ACTION: THEN the GitHub Pages can rebuild and redeploy** 

### TRIGGER: User Behavior When Signing Contract 
  + Associated job JSON file is updated to maintain state of the user's progress 

  * **ACTION: Job JSON File Updates**

  + State management is added to the job's JSON file 

  * **ACTION: Updated Files Pushed to GitHub** 
  * **ACTION: THEN the GitHub Pages can rebuild and redeploy** 

### TRIGGER: User Behavior When Paying 
  + Associated job JSON file is updated to maintain state of the user's progress 

  * **ACTION: Job JSON File Updates**

  + State management is added to the job's JSON file 

  * **ACTION: Updated Files Pushed to GitHub** 
  * **ACTION: THEN the GitHub Pages can rebuild and redeploy** 

## Testing Documents to Review and Simplify 

  * **A few essentials that we will still need and should understand** 

    1. Stripe API Requirements should be understood for operational purposes 
    `/Users/seanivore/Development/freelance-payments/assets/docs/STRIPE_API_REQUIREMENTS.md` 

    2. The `assets/jobs/README_TEMPLATE_VALUES.md` and `_job_template.json` files should be understood for operational purposes 
    `/Users/seanivore/Development/freelance-payments/assets/jobs/_job_template.json`
    `/Users/seanivore/Development/freelance-payments/assets/jobs/README_TEMPLATE_VALUES.md`

  * **To be processed and then anything needed, consolidated, for a new plan**

  + Probably the only proper testing document 
  `/Users/seanivore/Development/freelance-payments/assets/docs/explainers-tasks/TEST_JOBS_README.md` 

  + Initial testing guides when AI started making new guides as we found bugs 
  `/Users/seanivore/Development/freelance-payments/assets/docs/explainers-tasks/TESTING_GUIDE.md`
  `/Users/seanivore/Development/freelance-payments/assets/docs/explainers-tasks/TESTING.md`

