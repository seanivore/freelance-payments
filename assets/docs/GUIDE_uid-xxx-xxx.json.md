# Blank JSON Schema Value Guide
*Updated 2026-01-13 for v5 schema*

## Summary

  **When creating a new JSON file to add a new freelance job to the platform, fill out the schema values in the JSON according to the comments below** 

## Overview 

  + New jobs
    - Make a copy of `assets/docs/uid-xxx-xxx.json` template 
    - Fill out value according to guide below 
    - Place the finished JSON file with unique ID in `assets/jobs/...` 
  + Template values 
    - Values present below represent values on copied template
    - Comments define expected values when creating new job file
    - `required` = must be admin created before submission
    - `artifact` = values provided by automation 
    - `"",` = values provided by automation 
    - `provided` = value to leave as is for submission
  + Updates 
    - The schema below must represent the current `assets/docs/uid-xxx-xxx.json`
    - Backwards compatibility is not our preferred solution to updates
    - Record major schema changes `assets/docs/**version**/CHANGELOG_schema-xxx-xxx.json.md`
    - Keep this file current, located at `assets/docs/GUIDE_uid-xxx-xxx.json.md`

## Schema v5 With Comments 

```JSON
{
    "project": null, // required, customer-facing project name
    "contract": {
        "work_start": null, // required, "YYYY-MM-DD"
        "work_end": null, // required, "YYYY-MM-DD"
        "legal_jurisdiction": "Massachusetts", // provided
        "maintenance_period_months": 3, // provided
        "maintenance_monthly_fee": 150, // provided
        "signatures": {
            "contractor": {
                "legal_name": "Sean August Horvath", // provided
                "signed_date": null // artifact, ISO timestamped confirmation
            },
            "client": {
                "legal_name": null, // artifact, contract-signed confirmation
                "signed_date": null // artifact, ISO timestamped confirmation
            }
        }
    },
    "docs": {  // artifacts confirm creation of PDFs that facilitate frontend
        "contract": {
            "id": null, // artifact, 'kon-xxx-xxx'
            "pdf": null, // artifact, 'assets/pdf/contract/kon-xxx-xxx.pdf'
            "file_id": null, // artifact, 'random character string' from process
            "url": null, // artifact, 'payments.august.style' PDF location
            "sha256": null, // artifact, 'random character string' from process
            "created": null // artifact, ISO timestamp confirmation
        },
        "invoice": { // mirror 'contract' artifact definitions 
            "id": null, // artifact, 'inv-xxx-xxx'
            "pdf": null, // artifact, 'assets/pdf/contract/inv-xxx-xxx.pdf'
            "file_id": null,
            "url": null,
            "sha256": null,
            "created": null
        },
        "balance": { // mirror 'contract' artifact definitions
            "id": null, // artifact, 'bal-xxx-xxx'
            "pdf": null, // artifact, 'assets/pdf/contract/bal-xxx-xxx.pdf'
            "file_id": null,
            "url": null,
            "sha256": null,
            "created": null
        }
    },
    "state": {
        "objects": { // artifacts Stripe object creation confirmations
            "created": null, // artifact, ISO timestamp confirmation
            "product": null, // artifact, product.id as confirmation
            "price_1": null, // artifact, price object id as confirmation
            "price_2": null, // artifact, price object id as confirmation
            "customer": null, // artifact, customer.id as confirmation
            "coupon": null // artifact, coupon.id as confirmation
        },
        "client_status": { // ISO timestamp artifact confirming user event
            "logged_in": null, // artifact, ISO timestamp confirmed first login
            "contract_signed": null, // artifact, ISO timestamp confirmation
            "invoice": null, // artifact, ISO timestamp confirmation
            "payment_1": null, // artifact, ISO timestamp confirmation
            "balance": null, // artifact, ISO timestamp confirmation
            "payment_2": null // artifact, ISO timestamp confirmation
        }
    },
    "product": { // creates main Stripe product object for job
        "name": null, // required, line-item visible deliverable name
        "active": true, // provided
        "description": null, // required, define deliverable for docs 
        "id": null, // required, uid-xxx-xxx admin bash command 'uid' created
        "login_name": null, // required, client last name for client login
        "login_keyword": null, // required, keyword for client login
        "service_usd": null, // required, total service deliverable cost in pennies
        "total_payments": 2, // provided
        "discount_usd": null, // required, discount in pennies or 0 if none
        "type": "service", // provided
        "unit_label": "Payment" // provided
    },
    "customer": { // create Stripe customer object for job
        "name": null, // required, client's full name for docs
        "business": null, // required, client's legal taxable entity
        "title": null, // required, client's business role
        "email": null, // required, client's email contact
        "phone": null, // required, 123-456-7890 business's legal phone number 
        "id": null, // required, cus-xxx-xxx admin provided 'cus' prefix product.id
        "address": { // client's legal business address in values below
            "city": null, // required
            "line1": null, // required
            "state": null, // required, 2-character abbreviation
            "postal_code": null, // required, 5-digits
            "country": "US" // provided
        }
    },
    "coupon": { // create Stripe coupon object, leave as-is for $0 discount
        "amount_off": 0, // required, discount in pennies
        "applies_to": {
            "products": [
                null // required, uid-xxx-xxx matching product.id
            ]
        },
        "currency": "usd", // provided
        "duration": "once", // provided
        "id": null, // required, cou-xxx-xxx admin provided 'cou' prefix product.id
        "max_redemptions": 1, // provided
        "name": null // required, line-item visible discount name, ALL CAPS
    },
    "price1": { // creates Stripe price object for initial payment
        "count": 1, // provided
        "currency": "usd", // provided
        "unit_amount": null, // full initial payment, before discount, in pennies
        "active": true, // provided
        "billing_scheme": "per_unit", // provided
        "pay_by": "start of work", // provided
        "nickname": "Initial Payment", // provided
        "product": {
            "products": [
                null // required, uid-xxx-xxx matching product.id
            ]
        },
        "id": "" // artifact, price object id confirms Stripe catalog creation
    },
    "price2": { // creates Stripe price object for final payment
        "count": 2, // provided
        "currency": "usd", // provided
        "unit_amount": null, // balance payment, before discount, in pennies
        "active": true, // provided
        "billing_scheme": "per_unit", // provided
        "pay_by": "before project launch", // provided
        "pay_days": 14, // provided
        "late_fee": 10000, // provided
        "nickname": "Final Payment", // provided
        "product": {
            "products": [
                null // required, uid-xxx-xxx matching product.id
            ]
        },
        "id": "" // artifact, price object id confirms Stripe catalog creation
    },
    "checkout_session_1": { // facilitates on-demand price1 checkout session initialization
        "discounts": [
            {
                "coupon": null // required, cou-xxx-xxx if discount exists
            }
        ],
        "line_items": [
            {
                "price": "", // artifact, Stripe catalog price1 object id created
                "quantity": 1 // provided
            }
        ],
        "mode": "payment", // provided
        "return_url": "https://payments.august.style/[uid-xxx-xxx]#completion-1", // required, update [uid-xxx-xxx] with actual product.id
        "ui_mode": "custom" // provided
    },
    "checkout_session_2": { // facilitates on-demand price2 checkout session initialization
        "discounts": [
            {
                "coupon": null // provided, checkout_session_1 gets discounts only
            }
        ],
        "line_items": [
            {
                "price": "", // artifact, Stripe catalog price2 object id created
                "quantity": 1 // provided
            }
        ],
        "mode": "payment", // provided
        "return_url": "https://payments.august.style/[uid-xxx-xxx]#completion-2", // required, update [uid-xxx-xxx] with actual product.id
        "ui_mode": "custom" // provided
    },
    "project_scope_summary": null, // required, summary of deliverable
    "project_scope_full": null // required, detailed deliverable specifics for job
}
```

---
*Update reviewed 2026-01-13 by Sean August Horvath*