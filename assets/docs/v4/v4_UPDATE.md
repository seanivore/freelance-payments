# v4 Update 

## Summary 

The markdown to HTML rendering of our contract looks terrible and would take very long to get the formatting with HTML/CSS designed to look right, and then export properly. We'll shift to a completely integrated PDF production automation instead, giving us more control and simpler development, which is an opportunity to add in security signature features. 

### The Old Plan 

  + Use Markdown to HTML rendering to display contract and invoice to the User 
    - Requires extensive formatting of HTML/CSS design 
    - Essentially designing it to mimic the appearance of a document PDF 
    - User will need to download actual PDF export after signing anyway 

### Our New Plan 

  + Use Google Drive API to complete prepared Contract and Invoice Google Document drive templates
    - Call Drive API to create and deliver PDFs after Stripe Object creation confirmation 
    - Front end displays an embed of the actual PDF 
    - Easy to export for the User and gives us complete typographic design formatting control 

---

## Invoice Template 

  + Template is complete 
    - Placed in Google Drive directory /FREELANCE-PAYMENTS/ 
    - Anyone with the link has Edit access 
  + [FREELANCE-PAYMENTS Directory](https://drive.google.com/drive/folders/1cJUCiwrLoWvftdpYaywvZqI7QFTLcIZY?usp=sharing)

### JSON Schema v4 Updates 

  + To prevent formatting issues due to length of template placeholders, and to improve some logic, I have changed the following job JSON values as mapped to their new value as mapped. 

    - `initial_price_object` --> `price_object_1`
    - `balance_price_object` --> `price_object_2` 
    - `initial_price_object.metadata.payment_number` --> `price_object_1.count`
    - `balance_price_object.metadata.payment_number` --> `price_object_2.count`
    - `initial_price_object.metadata.payment_usd` --> `price_object_1.payment_usd`
    - `initial_price_object.metadata.balance_usd` --> `price_object_1.balance_usd`
    - `initial_price_object.metadata.pay_by` --> `price_object_1.pay_by`
    - `balance_price_object.metadata.payment_usd` --> `price_object_2.payment_usd`
    - `balance_price_object.metadata.balance_usd` --> `price_object_2.balance_usd`
    - `balance_price_object.metadata.pay_by` --> `price_object_2.pay_by`
    - `balance_price_object.metadata.pay_days` --> `price_object_2.pay_days`
    - `balance_price_object.metadata.late_fee` --> `price_object_2.late_fee`
    - `customer_object.description` --> `customer_object.title`
    - `customer_object.individual_name` --> `customer_object.name`
    - `customer_object.business_name` --> `customer_object.business`
    - `state_management.initial_payment_intent` --> `state_management.payment_1`
    - `state_management.initial_payment_intent.created` --> `state_management.payment_1.intent`
    - `state_management.balance_payment_intent` --> `state_management.payment_2`
    - `state_management.balance_payment_intent.created` --> `state_management.payment_2.intent`
    - `state_management.object_id.initial_price` --> `state_management.object_id.price_1`
    - `state_management.object_id.balance_price` --> `state_management.object_id.price_2`
    - `initial_checkout_session` --> `checkout_session_1`
    - `balance_checkout_session` --> `checkout_session_2`
    - `product_object.metadata.login_name` --> `product_object.login_name`
    - `product_object.metadata.login_keyword` --> `product_object.login_keyword`
    - `product_object.metadata.service_usd` --> `product_object.service_usd`
    - `product_object.metadata.total_payments` --> `product_object.total_payments`
    - `product_object.metadata.discount_usd` --> `product_object.discount_usd`
    - `state_management.object_id.checkout_session.initial` --> `state_management.object_id.checkout_session.payment_1`
    - `state_management.object_id.checkout_session.balance` --> `state_management.object_id.checkout_session.payment_2`

### Mapping Placeholder Values   

  * **Almost all placeholders are the same as the JSON mapped value** 

    + Find them in the chart below 
    + Just a handful of address values were shortened 
    + There are two VARIABLE values with the logic provided below 
    + There are two MATH values, with the calculation logic below the chart   

    | Template Placeholder           | Mapped JSON Value                     |
    | ------------------------------ | ------------------------------------- |
    | {{document.invoice.id}}        | `document.invoice.id`                 |
    | {{document.invoice.created}}   | `document.invoice.created`            |
    | {{contract.work_start}}        | `contract.work_start`                 |
    | {{contract.work_end}}          | `contract.work_end`                   |
    | {{project}}                    | `project`                             |
    | {{amount_due}}                 |  Variable                             |
    | {{customer_object.business}}   | `customer_object.business`            |
    | {{customer_object.name}}       | `customer_object.name`                |
    | {{customer_object.title}}      | `customer_object.title`               |
    | {{address.line1}}              | `customer_object.address.line1`       |
    | {{city}}                       | `customer_object.address.city`        |
    | {{state}}                      | `customer_object.address.state`       |
    | {{postal_code}}                | `customer_object.address.postal_code` |
    | {{customer_object.email}}      | `customer_object.email`               |
    | {{customer_object.phone}}      | `customer_object.phone`               |
    | {{price_object_1.nickname}}    | `price_object_1.nickname`             |
    | {{price_object_2.nickname}}    | `price_object_2.nickname`             |
    | {{price_object_1.pay_by}}      | `price_object_1.pay_by`               |
    | {{price_object_2.pay_by}}      | `price_object_2.pay_by`               |
    | {{price_object_1.unit_amount}} | `price_object_1.unit_amount`          |
    | {{price_object_2.unit_amount}} | `price_object_2.unit_amount`          |
    | {{subtotal}}                   |  Math                                 |
    | {{amount_off}}                 | `coupon_object.amount_off`            |
    | {{total}}                      |  Math                                 |
    | {{amount_paid}}                |  Variable                             |

  * **VARIABLE** 

  + {{amount_due}} and {{amount_off}} values change based on `state_management` payment logic: 

    1. If `state_management.payment_1.succeeded` null, then {{amount_due}} is `price_object_1.unit_amount` and {{amount_paid}} is zero 

    2. If `state_management.payment_1.succeeded` contains a timestamp and `product_object.total_payments` is 1 then {{amount_due}} is zero and {{amount_paid}} is `price_object_1.unit_amount` 

    3. If `state_management.payment_1.succeeded` contains a timestamp and `product_object.total_payments` is 2 then {{amount_due}} is `price_object_2.unit_amount` and {{amount_paid}} is `price_object_1.unit_amount`

  * **MATH** 

  + {{subtotal}} and {{total}} values are static, but must be calculated from other unit values: 

    1. Find {{subtotal}} by getting the sum of `price_object.1.unit_amount` and `price_object.2.unit_amount`, except if  `product_object.total_payments` 1 then {{subtotal}} equals `price_object.1.unit_amount` 

    2. Find {{total}} by taking the calculated {{subtotal}} and subtracting `coupon_object.amount_off`, except if there is no `coupon_object` then {{total}} equals the same as {{subtotal}}

--- 

price_object_2.unit_amount

     it easy to export
    - Mirror template placeholders with JSON mapped values 
    - Then call Drive API  
    - Front end will then display embed of the actual PDF making it easy to export 
    - We have completely  
    - Export each Doc to PDF and buffer the stream 
    - Compute sha256 over the PDF buffer
    -  upload PDFs to your Drive folder; set link-sharing if you want simple embedding
On JSON submission, after Stripe Object state_management creation confirmation
 then need to export as a PDF, we will use the , adding the . On job JSON submission, after Strip Objects are created and IDs added to state_management, we'll call the Drive API next, prepare the template and then make another call to get the PDF export. GitHub Actions will add the PDFs to `assets/pdf/contract/uid-xxx-xxx-contract.pdf` and `assets/pdf/invoice/uid-xxx-xxx-invoice.pdf` and add the `generated_at` value as state_management. When the user logs in, the frontend will dynamically display the actual PDF embedded on the page. We'll use `sha256` for integrity and signature audit. And all the new job JSON values are added in a new object so that none of our current JSON schema value names are altered. 

Generate PDFs right after Stripe objects are created (job submission), not after payment; store links + hashes in the job JSON and surface them immediately.

You’re correct—the webhook wording implied “post-payment,” but your flow needs the PDFs available before checkout. Trigger PDF generation when the job is created and the Stripe Product/Prices/Customer/Coupon are confirmed, then use those artifacts through contract → invoice → checkout.

When to generate

- On job submission, after your API confirms Stripe Product, Price(s), Customer, and Coupon are created and written into state_management.object_id and the price objects.

- Skip waiting for checkout.session.completed or payment_intent.succeeded. Webhooks can still be used later for payment receipts or regenerating paid invoices, but initial PDFs should be ready up front.

What to put in the job JSON (exact fields)

- pdf_artifacts.contract_pdf:

 ▫ drive_file_id

 ▫ url (Drive webViewLink)

 ▫ sha256

 ▫ generated_at

 ▫ repo_path (e.g., assets/pdf/contract/uid-sst-846-20251230-contract.pdf)

- pdf_artifacts.invoice_pdf:

 ▫ drive_file_id

 ▫ url

 ▫ sha256

 ▫ generated_at

 ▫ repo_path (e.g., assets/pdf/invoice/uid-sst-846-20251230-invoice.pdf)

Front end reads these to embed the viewer and show “Download.”

How to generate at job submission

- Inputs available: product_object, initial_price_object, balance_price_object, customer_object, coupon_object, project_scope_, contract.

- Steps:

 a. Copy the Doc templates (contract + invoice) via Drive API using your stored template IDs.

 b. Replace placeholders with JSON-path values; format dates to Month D, YYYY and currency from cents to $X,XXX.XX.

 c. Export each Doc to PDF; buffer the stream.

 d. Compute sha256 over the PDF buffer.

 e. Upload PDFs to your Drive folder; set link-sharing if you want simple embedding.

 f. Commit PDFs to repo paths assets/pdf/contract/… and assets/pdf/invoice/… via GitHub API/Actions.

 g. Write pdf_artifacts back to the job JSON and commit.

Idempotency: If pdf_artifacts already exist for the job, skip regeneration on retries.

SHA256, what it is and why

- SHA256 is a cryptographic hash (a unique fingerprint) of the exact PDF bytes.

- Purpose:

 ▫ Integrity: proves the PDF shown or downloaded is exactly the one you generated (detects any change).

 ▫ Signature audit: when the client types their name, store that event alongside pdf_sha256 in contract.signatures.client so you can prove which document was signed.

- It’s not a signature; it’s the immutable identifier you link to a signature event.

Minimal additions needed for the templates

- Use JSON-path placeholders in both Docs (e.g., {{customer_object.business_name}}, {{contract.work_start}}, {{initial_price_object.unit_amount}}).

- For the invoice, keep two fixed rows and fill cell-level placeholders; compute subtotal/discount/total from the JSON.

This keeps your UX tight: users log in, see the real PDFs immediately, sign the contract, view the invoice, and then start checkout—no waiting for webhooks. The front end simply reads pdf_artifacts from the job JSON and renders the viewer/download buttons.