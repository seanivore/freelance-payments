# Test 01 Feedback: Admin-Push of `test_job_golden_v4.json` 

## Workflow `admin-push.yml` 

  - Stripe objects created successfully
    - All artifacts returned accurately on the JSON file 
  - PDFs generated successfully
  - JSON artifact injected successfully

### Workflow Logs Note on JSON Artifact Filename

  + Workflow logs mentioned noticing that the filename of the JSON artifact was not the same as the product.id (or "job id") 
    - This doesn't seem to have effected anything negatively at this point
    - It is notable that the information on `assets/js/manifest.json` might be unexpected compared to what is searched for when dynamically loading the job after login 

### Room for Improvement Update 

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

### Phone Number Formatting 

  + The test JSON provided the phone number "555-0123" 
    - Since this isn't a valid phone number, I don't know that this *specifically* will be an issue (invalid value) 
    - But we should implement formatting for phone numbers pulled from JSON and displayed on the front end, nonetheless 
    - Ideally we just should use a simple 424-744-7687 format, no need for country code or any use of parenthesis 
    - Also ideally the formatting should adjust it for front end, allowing flexibility in filling out the JSON 
    - However this does bring up validation questions to address in the future -- please make a note of this validation aspect of the issue to be handled after we have the workflow functional 

### Scope of Work Formatting 

  + The longer scope provided on the test JSON 
    - "This is a comprehensive test of the v4.4.0 recovery plan.\\n\\n1. Stripe Object Creation\\n2. PDF Generation\\n3. JSON Artifact Injection"
  + Displayed on the front end in contract 
    - This is a comprehensive test of the v4.4.0 recovery plan.\n\n1. Stripe Object Creation\n2. PDF Generation\n3. JSON Artifact Injection
    - It was added just like above with no natural line breaks visually in the contract