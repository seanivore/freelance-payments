# User Returning for Second Payment 

  **UPDATES REQUIRED**
  + *Requires update to state management logic schema* 
  + *Introduces new contract/invoice mapped JSON value placeholders* 

## Summary 

User-behavior events trigger updates to a job's JSON values with artifacts in the form of timestamps. Depending on which of these values is present versus which are still 'null', the website is able to place the User at the appropriate stage of the contract and payment process. This means there are certain elements that needs to be shown or hidden based on the state of the job. 

---

## Managing User State 

### State Management Values  

  **By using these records, the User should be able to leave (or loose internet) at any time and return to where they left off**

  1. Each of the values receives an ISO timestamp when the event is triggered 
  2. Each value is in addition to the previous value 
  3. Some frontend user-behavior events are paired with hard "gateways" in the form of action-step buttons 
    - The page has no other buttons available except the action-step button for simple UI 
    - The next section will not load until the action step "gateway" is passed 

### JSON Schema Values 

Basically "downloaded_docs" has been split into two values to account for the two possible instances. While there is some logic built in throughout the system to account for single payment jobs, that is not my main concern and we should focus on getting everything working for the two payment job scenario first and foremost. When the time comes, it should be simple to provide the other logic needed for single payment jobs. I don't want to do it right now because I have a job with two payments on my mind that I'd like to use this for, with makes planning the logic without worrying I'm missing anything much easier. 

 **NEW SCHEMA ADJUSTMENT** 
 - Note the adjustment in order of the values 
 - The order reflects the user journey 

```json
{
    "state": {
        "client_status": {
            "logged_in": null,
            "contract_signed": null,
            "invoice_1": null,
            "payment_1": null,
            "invoice_2": null,
            "payment_2": null
        }
    }
}
```

  **OLD SCHEMA FOR REFERENCE** 

```json
{
    "state": {
        "client_status": {
            "logged_in": null,
            "contract_signed": null,
            "downloaded_docs": null,
            "payment_1": null,
            "payment_2": null
        }
    }
}
```

### Logic for User Placement 

  + `state.client_status.logged_in` has timestamp 
    - User is directed to the **start of the contract** 
    - Timestamp reflects their first login 
    - Action gate is "*SIGN*" button 
    - After signing the appropriate invoice page loads  
  + `state.client_status.contract_signed` also has timestamp 
    - User is directed to the **invoice for payment 1**
    - Timestamp reflects their first contract signature 
    - Action gate is "*Download your documents: Yes | No*" button 
    - After clicking either button, the `checkout_session_1` is initialized and checkout page loads 
  + `state.client_status.invoice_1` also has timestamp 
    - Initialization of `checkout_session_1` and User is **directed to checkout page for payment_1** 
    - Timestamp reflects when user passed invoice_1 and downloaded docs button  
    - Action gate is "*PAY*" button 
    - After paying a **#completion-1** thank you page loads 
    - This is the only time the **#completion-1** page is shown 
    - The **#completion-1** page depicts soft call to action to continue to payment 2 and invoice 2 
      (it isn't something we are requesting they do now, but it should be available if a user wants 
      to make both their payments back to back for whatever reason)
    - Either, after clicking to *continue, OR on the user's next visit* to the site, they are directed to the invoice for payment 2 
  + `state.client_status.payment_1` also has timestamp 
    - User is directed to the **invoice for payment 2**
    - Timestamp reflects their first payment 
    - Action gate is "*Download your documents: Yes | No*" button 
    - After clicking either button, the `checkout_session_2` is initialized and checkout page loads 
  + `state.client_status.invoice_2` also has timestamp 
    - Initialization of `checkout_session_2` and User is **directed to checkout page for payment_2** 
    - Timestamp reflects when user passed invoice_2 and downloaded docs button  
    - Action gate is "*PAY*" button 
    - After paying a **#completion-2** thank you page loads 
    - This is the final page in the flow and will be shown every time they visit in the future 
    - The **#completion-2** thank you page should include hyperlinks to download the contract, invoice 1, and invoice 2 PDFs 
    - End of flow so no action gate
  + `state.client_status.payment_2` also has timestamp 
    - User is directed to the **#completion-2** thank you page again  
    - Timestamp reflects their second payment 
    - There are no further steps for the user to take 

--- 

## Creating Balance or Invoice-2 PDF

### Templates Created & Updated 

  + Filenames 
    - `inv-xxx-xxx-1.pdf`
    - `inv-xxx-xxx-2.pdf`

  + Both to be placed in the same directory at `assets/pdf/invoices/...`

  + Setup 
    - File ID has been added to all necessary environment variables 
    - Payment_1 invoice has been updated as needed 
    - Payment_2 invoice has been created 

### New Placeholders -> Mapped JSON Values 

These placeholders are used to create the the combination of both payment_1 and payment_2 invoice PDFs. 

| Template Placeholder            | Mapped JSON Value                                         |
|---------------------------------|-----------------------------------------------------------|
| {{amount_due}}                  | **DEFUNCT**                                               |
| {{amount_paid}}                 | **DEFUNCT**                                               |
| {{subtotal}}                    | formatCurrency(`price1.unit_amount`+`price2.unit_amount`) |
| {{amount_off}}                  | formatCurrency(`coupon.amount_off`)                       |
| {{total}}                       | formatCurrency(`{{subtotal}}`–`{{amount_off}}`)           |
| {{price1.count}}                | `price1.count`                                            |
| {{price2.count}}                | `price2.count`                                            |
| {{product.total_payments}}      | `product.total_payments`                                  |
| {{payment1_due}}                | formatCurrency(`price1.unit_amount`–`coupon.amount_off`)  |
| {{payment2_due}}                | formatCurrency(`price2.unit_amount`)                      |

### Prior Active Placeholders  

Rest of the placeholders that we are still using. 

| Template Placeholder            | Mapped JSON Value                                         |
| ------------------------------- | --------------------------------------------------------- |
| {{amount_due}}                  | **DEFUNCT**                                               |
| {{amount_paid}}                 | **DEFUNCT**                                               |
| {{docs.invoice.id}}             | `docs.invoice.id`                                         |
| {{docs.invoice.created}}        | `docs.invoice.created`                                    |
| {{contract.work_start}}         | formatDate(`contract.work_start`)                         |
| {{contract.work_end}}           | formatDate(`contract.work_end`)                           |
| {{contract.legal_jurisdiction}} | `contract.legal_jurisdiction`                             |
| {{project}}                     | `project`                                                 |
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
| {{today}}                       | formatDate(day-invoice-is-created)                        |

--- 

## Creating Checkout Completion Pages 

  + As described in the state management's [Logic for User Placement](#logic-for-user-placement) section, we need multiple checkout completion pages to reflect where the user is on the process. 
    - Reflect where the user is in the process 
    - Determines how long, if ever again, the completion page will be shown again 

  + Suggested URLs where "uid-xxx-xxx" is the job's unique ID (product.id) 
    - `checkout_session_1.return_url`: "https://payments.august.style/uid-xxx-xxx#completion-1"
    - `checkout_session_2.return_url`: "https://payments.august.style/uid-xxx-xxx#completion-2"

  + After payment_1 is completed 
    - A **#completion-1** thank you page loads 
    - This is the only time the **#completion-1** page is shown 
    - The **#completion-1** page depicts *soft* call to action to continue to payment 2 and invoice 2 
    - This is because it isn't typical UX flow 
    - They generally won't pay their second payment until it is due
    - But we have everything we need to be able to offer to them to pay it now 
    - Some users might want to pay both back to back  

  + Either, after clicking to *continue* to see the invoice for payment 2 OR, more likely, *on the user's next visit* to the site, they are directed to the invoice for payment 2 

  + After payment_2 is completed 
    - A **#completion-2** thank you page loads 
    - This is the final page in the flow and *will be shown every time they visit in the future* 
    - The **#completion-2** thank you page should include *hyperlinks to download the contract, invoice 1, and invoice 2 PDFs* 
