# v4 Update 

## Summary 

**Purpose**: Technical implementation details for integrating Google Docs template-based PDF generation into the freelance payments system.

**Context**: The system is already built and functional. We need to add PDF generation that replaces the current markdown-to-HTML rendering with professional Google Docs-generated PDFs.

### Resources 

  + Drive template update placeholders flow 
    - `https://tomassetti.me/how-to-generate-invoices-using-a-google-doc-template-and-generate-a-pdf-programmatically/`
    - `https://github.com/ftomassetti/DriveInvoicing` 
    - The link guide example above is what I did in the past but with Make dot come 
  + Google API and authorization 
    - I got a basic API key but we probably won't want that 
    - We set up a Service Account and its email already has access to the files and API 
    - I also set up OAuth; they did in example; you can only use Script API with it
  + API turned on 
    - Drive API 
    - Documents API 
    - App Script API (example in link uses)
    - This information from Dia all uses the Support account and so only Drive and Docs API 
  + The Service Account access key is in base64 
    - That was all Vercel would take 
    - Code snippet from Dia below to use in automation 
        ```javascript
        // filename: api/_googleAuth.js
        import { JWT } from 'google-auth-library';

        export function getGoogleAuth() {
          const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64;
          const raw = Buffer.from(b64, 'base64').toString('utf8');
          const key = JSON.parse(raw);

          // Ensure proper PEM newlines
          key.private_key = key.private_key.replace(/\\n/g, '\n');

          return new JWT({
            email: key.client_email,
            key: key.private_key,
            scopes: [
              'https://www.googleapis.com/auth/drive',
              'https://www.googleapis.com/auth/documents',
            ],
          });
        }
        ```
  + Added to `.env`, `.env.local`, GitHub Secrets, and Vercel Environment 
    - `VERCEL_OIDC_TOKEN` 
    - `STRIPE_API_KEY` (this is live don't use yet; change name to secret when ready)
    - `STRIPE_SECRET_KEY` (we call this sandbox for now)
    - `GOOGLE_API_KEY` (possibly not helpful enough) 
    - `GOOGLE_DRIVE_FOLDER_ID` (this folder and ID below are ID pulled form URL)
    - `GOOGLE_TEMPLATE_CONTRACT_ID`, GOOGLE_TEMPLATE_INVOICE_ID
    - `GOOGLE_SERVICE_ACCOUNT_KEY_B64` (Dia plan's method)
    - `GOOGLE_OAUTH_KEY` (should we realize we do need App Script API power)

## Plan Overview 

  1. See new v4 schema and process changelog making code updates
    + New v4 schema blank and with examples 
      - `assets/docs/v4/_blank_job_schema_v4.json` 
      - `assets/docs/v4/_json_value_examples_v4.json` 
    + Change log `assets/docs/v4/_SCHEMA_CHANGELOG.md`  

  2. New job JSON added -> finds matches --> create Stripe objects -> add state.objects and IDs to JSON 

  3. Vercel API `/api/generate-pdf.js`

## Backend Prep: Create PDF & Get JSON Data 

  + Google Service account has access to folder, files, Drive, Docs scope 
  + Steps per `docs.invoice`, `docs.contract` 
    - Copy template (Drive API)
    - Replace placeholders (Docs API batchUpdate replaceAllText)
    - Export Doc to PDF (Drive export, stream → Buffer)
    - Upload PDF to Drive (files.create), set permission `anyone:reader` 
    - Compute SHA256 over Buffer
  + Update job JSON with PDF artifacts 
    - Copy PDF to `assets/pdf/contract` `assets/pdf/invoice` 
    - Add their `inv-xxx-xxx` `kon-xxx-xxx` to `docs.contract/invoice.id`
    - API call gives you the Drive File ID for `drive_id`
    - API call gives you WebViewLink with /preview at end for `url`
    - `sha256` -- **CONFUSED ON THIS LOGIC** front end behavior? 
    - Created timestamp 
    - Delete working Doc 
  + Helper functions 
    - formatAddress(address)
    - formatDate(ISO) → Month D, YYYY
    - formatCurrency(cents) → $X,XXX.XX
    - formatPaymentTerms(jobData) → multi-line string
    - calculateSHA256(buffer)
  + Code should have idempotency or it will create them twice 
    - Use `docs.invoice.id` (or `created` or any of them in `docs`)
    - Skip generation if created has a timestamp for example 


  2. Drive API copy document with filenames made from `product.id` `kon-xxx-xxx` `inv-xxx-xxx` 
  3. Drive API replace text placeholders `batchUpdate.replaceAllText`
  + Invoice template has fixed rows and cells have placeholders
    - Mapping chart could use addition of `formatCurrency(price1.unit_amount` for example 
    - {{subtotal}} → formatCurrency(`price1.unit_amount` + `price2.unit_amount`)  
    - {{discount}} → formatCurrency(coupon.amount_off)  
    - {{total}} → formatCurrency(subtotal - discount)
  + In code, include these replacements in `generateInvoicePDF()` and use `replaceAllText` for each placeholder 
    - No dynamic table operations required
    - start_date: formatDate(contract.work_start) and end_date: formatDate(contract.work_end)
  + Complete prepared Contract and Invoice Google Document drive templates 
  4. Drive API to get a PDF for `assets/pdf/contract` `assets/pdf/invoice`
    + Read export stream into a buffer
    + Compute SHA256 over the full buffer
    + Upload buffer as `application/pdf` to Drive  **DON'T UNDERSTAND THIS STEP**
  5. Add all `docs.contract` and `docs.invoice` values after creation  
    + Store `drive_file_id`, `webViewLink`, `sha256` in job JSON 
    + Drive API to get values  
      - Need contract/invoice `drive_id` added 
      - Get webViewLink for `url` (normal share link but with /preview at end )
      - Add IDs `docs.contract.id.kon-xxx-xxx` `docs.invoice.id.inv-xxx-xxx`
      - `docs.contract.created` and `docs.invoice.created` gets timestamp 
    + Put the path to the local PDF made at `docs.contract.pdf`, `docs.invoice.pdf`



---




## Frontend Prep: Serve PDF Using JSON Data & Get Signed 

  * **Get JSON data on creation** 

  + Dynamic population on page meaning a new page structure with PDF embedded real nice 
    - How do we embed the documents best
    - Nice scrolling, looks like page hovering in panel 
    - shadcn Download and Sign buttons 

  * **Improve design, confirm active state tracking events** 

  + Put the "SIGN" button right on where they sign 
    - Use icon that looks like what the other docusign type companies use 
    - Have a modal pop-up for them to type their name and the date in to sign 
    - The modal will make it feel more legitimate  
    - And in future we add option to write name freehand with mouse on screen
  + New signing UI that is cleaner and uses `sha256` 
    - **CONFUSED** because it has been mentioned like something that runs during backend 
    - But isn't it to be triggered by frontend behavior even when they sign? 
  + Integrate new system into the behavior event triggers 
    - Make sure they still fill out the `state.objects.check_sessions` and `client_status`
    - We never tested these events yet but they are this I think 
    `.github/scripts/state/update_state.py`
  
  * **Embedding frontend PDFs** 

    - Embed drive preview into `docs.contract.url` 
    - `iframe src="<webViewLink with /view replaced by /preview>" width="100%" height="800"`
    - "Show “Download PDF” linking to the same webViewLink"
    - No --> which URL end trigger immediate download? We don't want it to load in another window when they click download which is what would happen with webViewLink --> bad UX 



## Check Out Prep 

  + Stripe webhook `/api/webhook.js`
    - On `payment_intent.payment_failed` and `payment_intent.succeeded`
  + "Resolve job_id from `client_reference_id` or metadata"
    - This one is **CONFUSING** and think we should make it super clear
    - What comes back from webhook? `https://docs.stripe.com/webhooks/handling-payment-events#deploy-endpoint` 
    - Do we need to trigger a listen response after to get certain information 
  + Denote completion of payments 
    - Get earlier webhook setup for `payment_1.intent` and `processing` 
    - Get the `state.objects.checkout_session.payment_1/2` Checkout Session ID 
  + If `state.objects.checkout_session.payment_1/2`
    - Trigger adding the checkout session ID to that value 
    - Update timestamps to `payment_1/2.succeeded` 
    - Then CHANGE PRICE OR PRODUCT ACTIVE=TRUE TO FALSE 
  + If it is `state.objects.checkout_session.payment_2` 
    - And you have `payment_2.succeeded`
    - Change JSONs `product.active" from "true" to "false" 
    - MOVE JSON FILE OUT OF JOBS DIRECTORY AND INTO `assets/records` or some named directory 


5) Frontend embedding




7) Testing checklist

- Templates created with exact placeholders; service account has access

- `/api/generate-pdf` creates and uploads PDFs; placeholders render correctly

- Job JSON updated with:pdf_artifacts: {

  contract_pdf: { drive_file_id, url, sha256, generated_at },

  invoice_pdf:  { drive_file_id, url, sha256, generated_at }

}

- Webhook triggers generation once (idempotent on retries)

- Frontend shows embedded viewer + working download

- Email (optional) delivers links

- Error path sets `state_management.status="pdf_error"` and falls back to HTML

8) Notes

- Normalize amounts/dates to numbers/ISO in code; format at replacement time.

- Consider a human-friendly invoice number generator to avoid product_id collisions.

- For larger archives, prefer object storage or Git LFS to avoid repo bloat.



## Webhook Integration
- On `checkout.session.completed`:
  - Resolve `job_id` from `client_reference_id`.
  - Generate PDFs (`document_type=both`).
  - Update job JSON with artifacts.
  - Emit email with links (client + me).
  - Optionally commit PDF to `assets/completed_docs/{jobId}-{timestamp}-{type}.pdf`.

## Placeholder Normalization
- Currency: format cents to `$X,XXX.XX`.
- Dates: ISO → `Month D, YYYY`.
- Address: `${line1}, ${city}, ${state} ${postal_code}`.
- Payment terms: `"Payment 1: $750.00 — Meow.\nPayment 2: $250.00 — Meow, but a little later than right meow."`

## Frontend
- Embed viewer: replace `/view` with `/preview` in Drive link.
- Track `loaded`, `scrolled`, `downloaded`, `signed` → write to `state_management.events[]`.

## Error Handling
- On any failure, set `state_management.status="pdf_error"` and include `error_code`, `message`.
- Fallback to HTML rendering automatically.

## Acceptance Criteria
- Contract and invoice PDFs generate on webhook, once.
- Placeholders render correctly including totals and discount.
- PDFs viewable via embedded viewer; Download works.
- Job JSON updated with `pdf_artifacts` and signature flow attaches `pdf_sha256`.
- No duplicate PDFs on retry; logs show idempotent skip.






---



### Process 

  1. Template Creation ✅
  - INV --> `docs.google.com/document/d/1BJI1-d1NJu9pgLKI7Z_EHP9Y2rd6bqR57yZVJxwXJB8/template/preview`
  - KON --> `docs.google.com/document/d/1BYf71d5Bryy8SrfnQdxSeIfzQilsvHQ8bqUKTh5QB1c/preview`

  2. File Adaptation 
  + I want to understand and document what exactly changes and in which files; particularly in question are the following 
    - `assets/templates/invoice-template.html` and `contract-template.html`
    - `assets/js/checkout-controller.js` and `contract-controller.js`, `invoice-controller.js`, `payment-lookup.js`, `payment-router.js`, `manifest.json` 
    - `assets/js/components/button.js` and `card.js`, `input.js` 

---

## Docs to PDF Production Details
*Gap Patch Addendum from Dia* 

### Set Up Idempotency for Stripe Retries 

  - Use Stripe `id` as the idempotency key 
  - Before generating, check `docs.contract` and `docs.invoice` in job JSON
  - Skip if present 

### Do Math, Date Consistency 

- I used only currency values that are in the Stripe all seconds, no decimals, format, including the values involved in the MATH values. I am assuming that the MATH will have to happen in a script right before calling the Drive API. When that happens we'll need to first give all values two decimal places 

### Drive & Docs Operations 



---

## Invoice Template 

  + Invoice template is complete 
    - Placed in Google Drive directory /FREELANCE-PAYMENTS/ 
    - Anyone with the link has Edit access 
  + Invoice filename follow `uid-xxx-xxx` pattern 
    - Simply changing the `uid` to `inv` 
    - Example `inv-xxx-xxx`

  + [FREELANCE-PAYMENTS Directory](https://drive.google.com/drive/folders/1cJUCiwrLoWvftdpYaywvZqI7QFTLcIZY?usp=sharing)


### Mapping Placeholder Values 

  * **Almost all placeholders are the same as the JSON mapped value** 

    + Find them in the chart below 
    + Just a handful of address values were shortened 
    + There are two VARIABLE values with the logic provided below 
    + There are two MATH values, with the calculation logic below the chart   

    | Template Placeholder     | Mapped JSON Value              |
    | ------------------------ | ------------------------------ |
    | {{docs.invoice.id}}      | `docs.invoice.id`              |
    | {{docs.invoice.created}} | `docs.invoice.created`         |
    | {{contract.work_start}}  | `contract.work_start`          |
    | {{contract.work_end}}    | `contract.work_end`            |
    | {{project}}              | `project`                      |
    | {{amount_due}}           |  Variable                      |
    | {{customer.business}}    | `customer.business`            |
    | {{customer.name}}        | `customer.name`                |
    | {{customer.title}}       | `customer.title`               |
    | {{address.line1}}        | `customer.address.line1`       |
    | {{city}}                 | `customer.address.city`        |
    | {{state}}                | `customer.address.state`       |
    | {{postal_code}}          | `customer.address.postal_code` |
    | {{customer.email}}       | `customer.email`               |
    | {{customer.phone}}       | `customer.phone`               |
    | {{price1.nickname}}      | `price1.nickname`              |
    | {{price2.nickname}}      | `price2.nickname`              |
    | {{price1.pay_by}}        | `price1.pay_by`                |
    | {{price2.pay_by}}        | `price2.pay_by`                |
    | {{price1.unit_amount}}   | `price1.unit_amount`           |
    | {{price2.unit_amount}}   | `price2.unit_amount`           |
    | {{subtotal}}             |  Math                          |
    | {{amount_off}}           | `coupon.amount_off`            |
    | {{total}}                |  Math                          |
    | {{amount_paid}}          |  Variable                      |

  * **VARIABLE** 

  + {{amount_due}} and {{amount_off}} values change based on `state` payment logic: 

    1. If `state.payment_1.succeeded` null, then {{amount_due}} is `price1.unit_amount` and {{amount_paid}} is zero 

    2. If `state.payment_1.succeeded` contains a timestamp and `product.total_payments` is 1 then {{amount_due}} is zero and {{amount_paid}} is `price1.unit_amount` 

    3. If `state.payment_1.succeeded` contains a timestamp and `product.total_payments` is 2 then {{amount_due}} is `price2.unit_amount` and {{amount_paid}} is `price1.unit_amount`

  * **MATH** 

  + {{subtotal}} and {{total}} values are static, but must be calculated from other unit values: 

    1. Find {{subtotal}} by getting the sum of `price_object.1.unit_amount` and `price_object.2.unit_amount`, except if  `product.total_payments` 1 then {{subtotal}} equals `price_object.1.unit_amount` 

    2. Find {{total}} by taking the calculated {{subtotal}} and subtracting `coupon.amount_off`, except if there is no `coupon` then {{total}} equals the same as {{subtotal}}

### Value Conversion Validation 

  * **Dates** 
    - "2025-12-31"
    - "2026-01-25T10:00:00Z"
    - Probably leave JSON values mixed, and use script to change when needed 
    - Though TBH I don't mind YYYY-MM-DD 
    - I guess for written contract it would be December 31, 2025 
    - Invoice maybe just Dec 31, 2025 or 12/31/2025 

  * **Math** 
    - *NO IDEA*

  * **Currency** 
    - 80000
    - "$800"
    - Here idk because have to keep no decimal for stripe 
    - Meaning will need pennies convert to use anywhere 
    - So even though the nicely written ones aren't used in Stripe maybe be consistent? 


--- 




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

- On job submission, after your API confirms Stripe Product, Price(s), Customer, and Coupon are created and written into state.object and the price objects.

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

- Inputs available: product, initial_price_object, balance_price_object, customer, coupon, project_scope_, contract.

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

- Use JSON-path placeholders in both Docs (e.g., {{customer.business_name}}, {{contract.work_start}}, {{initial_price_object.unit_amount}}).

- For the invoice, keep two fixed rows and fill cell-level placeholders; compute subtotal/discount/total from the JSON.

This keeps your UX tight: users log in, see the real PDFs immediately, sign the contract, view the invoice, and then start checkout—no waiting for webhooks. The front end simply reads pdf_artifacts from the job JSON and renders the viewer/download buttons.