# Job JSON Change Log

## Overview 

This is a list of changes to the job template that are needed for the code migration. 

### Goals 

- Avoiding duplication of fields like "name"
- Using hierarchy instead of duplicating values like "job_id" across sections 
- Grouping according to automation needs (like "product" and "prices")
- Simplifying the structure for easier maintenance 

---

## Changes 

### Top Level 

  * **Created `_metadata` section for metadata related to all fields and values in file**

  + Created `project_name` field; recognizable to client 
  + Moved `project_keyword` here; client uses to log into payment site 
  + Moved `client_last_name` here; client payment portal login
  + Moved `job_id` here; applies to all fields in file 

  * **Kept `client` as next prominent section** 

  + Renamed `client.name` to `business` 
  + Should enforce `phone` entry format 

### Contract Section 

  * **Maintained `contract` section almost as is** 

  + Dynamically fills in the client's contract and invoice during payment 
  + Simplified duplicate fields like "signed_by" and "signed_date" to only occur with signing parties field 
  + Updated fields to `legal_name` and `signed_date` for clarity 
  + Removed duplicate fields like "contractor_signature" and "contractor_date" and "client_date" as it wasn't clear why they were duplicated 

### Product Object Section 

  * **Stripe Product object creation values**

  + Simplified the entire object 
  + All variables and identifies are moved to `metadata`
  + Now `job` instead of just overly general "name" 

### Price Objects Section 

  * **Collection of Stripe Price objects created for each Product**

  + Simplified, again moving variables and identifiers to `metadata`
  + Rearranged other values for comprehension through flow 
  + No over-arching values repeated like `stripe_product_id` which is important because the API call will still ask for them and they should be pulled directly from the product object section 