# PDF Generation Implementation 

## Summary

We're moving from markdown-to-HTML contract/invoice rendering to **Google Docs template-based PDF generation**. This provides:

  - Professional formatting, consistent typography, no CSS/HTML 
  - Proper PDF exports that are easy and quick to produce 

## Plan Updates, Resources, Notes 

### Alterations From Original Plan 

  * **IMPORTANT** that we confirm our build will reflect the changes to these original plans 

  1. ~~PDFs Generated on Payment Success: Not on contract signing (ensures invoice reflects actual payment)~~ User login -> PDF Contract, must read before signing or paying business partnership, scroll-through tracking, option to continue to view Invoice as planned in Agreement then come back and sign, or sign now -> Signing tracked and Checkout Session build from JSON and loads on the spot 
  + The PDFs are part of the experience and a must have first to be able to pay. When a new job JSON is committed, after the Stripe catalog object build and then the state management details are updated, then the automation continues by kicking into generating PDFs. They will then be stored in repo, the JSON tracking updated, and the frontend page will have a modern PDF view from embed. 

  2. ~~Dual Storage: PDFs in Google Drive (live access) + Repository archive (audit trail)~~ PDF made as part of initial new job JSON addition, after Stripe catalog object creation -> Completed PDFs moved to directory `assets/pdf/contract` and `assets/pdf/invoice` as near-final step -> gDoc version deleted
  + I don't want to be tapping into more APIs for functionality. Given the PDF need to be made at job JSON commit, we should delete the gDoc after keeping the version we'll serve in the repository. The true forever archive is Stripe. 

  3. ~~Backward Compatible: If PDF not generated, fall back to HTML rendering~~ **NO** backward capability wanted or needed and NO falling back to HTML rendering at all to ensure proper design client UX 
  + The v4 schema is already drastically changed and idk if you recall the image of the contract in HTML, but a broken site would be better than presenting something that looks like that to clients coming to me for development and design. Fortunately earlier PDF production also helps these shift make more sense. 

### Implementation Overview **ADDED NOTES AND ALTERATIONS** 

### Phase 1: Template Creation ✅ **DONE** 
+ Create Google Document templates with placeholders; start storing all new important keys and secrets in ENV location including Vercel, GitHub Secrets, and `.env`/`.env.local`. 
### Phase 2: Service Account Setup ✅ **DONE** 
+ Create Google Cloud project where the Docs, Drive, and App Script API are turned on, then give API access key, set up a Service Account, and get OAuth setup with key. Store all credentials in ENV locations. 
### Phase 3: Scripts, Pages, Schema Updates 
+ Organize comprehensive file by file review plan to identify updates, deletions, creations. See new v4 Schema as part of file updates using changelog. Create any other new files not mentioned in upcoming phases. Pause to consider design changes to the HTML templates due to changes to UX and UI presentation of docs.  
### Phase 4: Integration
+ Update `/api/webhook.js` to trigger PDF generation **NOTE ACCURATE: THEY NEED TO BE CREATE AFTER STRIPE OBJECT CREATION**, update frontend controllers to display PDFs, update event triggers on front end for automations test end-to-end flow. Install `googleapis` npm package, implement `/api/generate-pdf.js` (code in v1), test with JSON jobs. 

Implement `/api/generate-pdf.js` with the code structure above, test with sample JSON, then integrate with webhook handler.

### Phase 5: Deployment 
+ Deploy to Vercel, Test with real payment **REAL PAYMENT? missing steps for rest of testing, we have not even tested the user flow after login yet, particularly the event state triggers, then payment loading. Because we had to update everything with the PDFs before being able to continue testing the website** Verify PDFs are generated and accessible 

---

## Updated New Job JSON Added Flow 

  - New job JSON added -> finds matches -> create Stripe objects -> add state.objects and IDs to JSON -> create the contract and invoice PDFs and move them to the repository -> add `docs.invoice`, `docs.contract` details back on the JSON -> push all changes for live site 

---

### Template Placeholder To Mapped JSON Value 

- Formatting: all phone numbers should adjust to 312-123-4231 
  - Might have been entered as +1 (424) 745-7687 or without the country code 
- All dates should adjust to Month DD, YYYY 
  - Most are either '2026-01-04T05:52:05.840413Z' or '2026-01-02' 
- All currency should format to $100.00 
  - Most is 10000 


| Template Placeholder            | Mapped JSON Value                                         |
| ------------------------------- | --------------------------------------------------------- |
| {{docs.invoice.id}}             | `docs.invoice.id`                                         |
| {{docs.invoice.created}}        | `docs.invoice.created`                                    |
| {{contract.work_start}}         | formatDate(`contract.work_start`)                         |
| {{contract.work_end}}           | formatDate(`contract.work_end`)                           |
| {{contract.legal_jurisdiction}} | `contract.legal_jurisdiction`                             |
| {{project}}                     | `project`                                                 |
| {{amount_due}}                  |  Variable                                                 |
| {{customer.business}}           | `customer.business`                                       |
| {{customer.name}}               | `customer.name`                                           |
| {{customer.title}}              | `customer.title`                                          |
| {{address.line1}}               | `customer.address.line1`                                  |
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
| {{subtotal}}                    | formatCurrency(`price1.unit_amount`+`price2.unit_amount`) |
| {{amount_off}}                  | formatCurrency(`coupon.amount_off`)                       |
| {{total}}                       | formatCurrency(`{{subtotal}}`–`{{discount}}`)             |
| {{amount_paid}}                 | Variable                                                  |
| {{today}}                       | formatDate(day-of-creating-invoice)                       |

  * **VARIABLE** 

  + {{amount_due}} and {{amount_off}} values change based on `state` payment logic: 

    1. If `state.payment_1.succeeded` null, then {{amount_due}} is `price1.unit_amount` and {{amount_paid}} is zero 

    2. If `state.payment_1.succeeded` contains a timestamp and `product.total_payments` is 1 then {{amount_due}} is zero and {{amount_paid}} is `price1.unit_amount` 

    3. If `state.payment_1.succeeded` contains a timestamp and `product.total_payments` is 2 then {{amount_due}} is `price2.unit_amount` and {{amount_paid}} is `price1.unit_amount`

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
  + Integrate new system into the behavior event triggers 
    - Make sure they still fill out the `state.objects.check_sessions` and `client_status`
    - We never tested these events yet but they are this I think 
    `.github/scripts/state/update_state.py`
  +  Track `loaded`, `scrolled`, `downloaded`, `signed` → write to `state_management.events[]`.

  
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










---

## API Implementation 


### Vercel Serverless Function: `/api/generate-pdf.js`

**Location**: `/api/generate-pdf.js` (project root)

**Dependencies**: 
- `googleapis` npm package
- `@google-cloud/docs` (if needed)

**Install**:
```bash
npm install googleapis
```

**Code Structure**:

```javascript
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { job_id, document_type } = req.body;

  try {
    // 1. Authenticate with service account
    const auth = await authenticateGoogle();

    // 2. Load job JSON (from GitHub or pass in request)
    const jobData = await loadJobJSON(job_id);

    // 3. Generate PDFs based on document_type
    const results = {};

    if (document_type === 'contract' || document_type === 'both') {
      results.contract_pdf = await generateContractPDF(auth, jobData);
    }

    if (document_type === 'invoice' || document_type === 'both') {
      results.invoice_pdf = await generateInvoicePDF(auth, jobData);
    }

    // 4. Update job JSON with PDF artifacts
    await updateJobJSON(job_id, results);
```

**IN THE REST OF THE CODE, AS FOLLOWS HERE, IT IS INACCURATE GIVEN OUR CHANGES IN PROCESS AND ARCHITECTURE OF THE DESIGN SYSTEM -- DO NOT USE DIRECTLY**


```javascript 
    // 5. Archive PDFs to repository (optional, via GitHub API)

    return res.status(200).json({
      success: true,
      job_id,
      ...results
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Authenticate with Google using service account
async function authenticateGoogle() {
  const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  
  const auth = new JWT({
    email: serviceAccountKey.client_email,
    key: serviceAccountKey.private_key,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/documents'
    ]
  });

  return auth;
}

// Generate Contract PDF
async function generateContractPDF(auth, jobData) {
  const drive = google.drive({ version: 'v3', auth });
  const docs = google.docs({ version: 'v1', auth });

  const templateId = process.env.GOOGLE_TEMPLATE_CONTRACT_ID;

  // 1. Copy template
  const copyResponse = await drive.files.copy({
    fileId: templateId,
    requestBody: {
      name: `Contract-${jobData.product_object.id}-${Date.now()}`
    }
  });

  const newDocId = copyResponse.data.id;

  // 2. Prepare placeholder replacements
  const replacements = {
    '{{client_name}}': jobData.customer_object.business_name || jobData.customer_object.individual_name,
    '{{client_address}}': formatAddress(jobData.customer_object.address),
    '{{project_title}}': jobData.product_object.name,
    '{{deliverables}}': jobData.project_scope_summary || jobData.project_scope_full,
    '{{start_date}}': formatDate(jobData.contract.work_start),
    '{{end_date}}': formatDate(jobData.contract.work_end),
    '{{total_amount}}': formatCurrency(
      (jobData.initial_price_object.unit_amount || 0) + 
      (jobData.balance_price_object?.unit_amount || 0)
    ),
    '{{payment_terms}}': formatPaymentTerms(jobData),
    '{{jurisdiction}}': jobData.contract.legal_jurisdiction,
    '{{contractor_name}}': 'Sean August Horvath',
    '{{contractor_address}}': '102 Lunenburg Ave, West Townsend, MA 01474',
    '{{contractor_phone}}': '+1 424-744-7687',
    '{{contractor_email}}': 'sean@august.style',
    '{{contractor_website}}': 'https://august.style',
    '{{maintenance_period}}': `${jobData.contract.maintenance_period_months} months`,
    '{{maintenance_fee}}': jobData.contract.maintenance_monthly_fee
  };

  // 3. Replace placeholders in document
  await replacePlaceholders(docs, newDocId, replacements);

  // 4. Export as PDF
  const pdfResponse = await drive.files.export({
    fileId: newDocId,
    mimeType: 'application/pdf'
  }, {
    responseType: 'stream'
  });

  // 5. Upload PDF to Drive
  const pdfMetadata = {
    name: `Contract-${jobData.product_object.id}-${Date.now()}.pdf`,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] // Optional: specific folder
  };

  const pdfFile = await drive.files.create({
    requestBody: pdfMetadata,
    media: {
      mimeType: 'application/pdf',
      body: pdfResponse.data
    },
    fields: 'id, webViewLink'
  });

  // 6. Set PDF permissions (anyone with link)
  await drive.permissions.create({
    fileId: pdfFile.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    }
  });

  // 7. Calculate SHA256 hash (for signature verification)
  const sha256 = await calculateSHA256(pdfResponse.data);

  // 8. Clean up temporary doc
  await drive.files.delete({ fileId: newDocId });

  return {
    drive_file_id: pdfFile.data.id,
    url: pdfFile.data.webViewLink,
    sha256: sha256,
    generated_at: new Date().toISOString()
  };
}

// Generate Invoice PDF (similar structure)
async function generateInvoicePDF(auth, jobData) {
  // Similar to generateContractPDF, but:
  // - Use GOOGLE_TEMPLATE_INVOICE_ID
  // - Handle dynamic table for {{item_rows}}
  // - Map invoice-specific placeholders
}

// Replace placeholders in Google Doc
async function replacePlaceholders(docs, documentId, replacements) {
  const requests = [];

  for (const [placeholder, value] of Object.entries(replacements)) {
    // Find and replace each placeholder
    requests.push({
      replaceAllText: {
        containsText: {
          text: placeholder,
          matchCase: true
        },
        replaceText: value
      }
    });
  }

  await docs.documents.batchUpdate({
    documentId: documentId,
    requestBody: {
      requests: requests
    }
  });
}

// Handle dynamic table rows for invoice
async function replaceInvoiceTable(docs, documentId, jobData) {
  // 1. Find table in document
  // 2. Delete sample row
  // 3. Insert rows for each price object
  // This is more complex - may need to use Apps Script or manual table manipulation
}

// Helper functions
function formatAddress(address) {
  return `${address.line1}, ${address.city}, ${address.state} ${address.postal_code}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatCurrency(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatPaymentTerms(jobData) {
  const terms = [];
  if (jobData.initial_price_object) {
    terms.push(`Payment 1: ${formatCurrency(jobData.initial_price_object.unit_amount)} - ${jobData.initial_price_object.metadata.pay_by}`);
  }
  if (jobData.balance_price_object) {
    terms.push(`Payment 2: ${formatCurrency(jobData.balance_price_object.unit_amount)} - ${jobData.balance_price_object.metadata.pay_by}`);
  }
  return terms.join('\n');
}

async function calculateSHA256(buffer) {
  // Use crypto library to calculate SHA256 hash
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function loadJobJSON(jobId) {
  // Load from GitHub repository or pass in request body
  // For now, assume it's passed in request or fetch from GitHub API
}

async function updateJobJSON(jobId, pdfArtifacts) {
  // Update job JSON with PDF artifacts
  // Trigger GitHub Actions to commit changes
}
```

## Webhook Integration 

### Update `/api/webhook.js`

**Current**: Handles `checkout.session.completed` webhook

**Add**: Call PDF generation after payment succeeds

```javascript
// In webhook handler, after validating payment:
if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  const jobId = session.client_reference_id; // e.g., "uid-sst-846-client"
  
  // Extract actual job_id (remove "-client" suffix if present)
  const actualJobId = jobId.replace(/-client$/, '');
  
  // Generate PDFs
  await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/generate-pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}` // Optional: secure internal calls
    },
    body: JSON.stringify({
      job_id: actualJobId,
      document_type: 'both' // Generate both contract and invoice
    })
  });
}
```

## Frontend Integration 


### Update `contract-controller.js`

**Current**: Renders HTML from JSON

**New**: Embed PDF viewer if PDF exists, fallback to HTML

```javascript
async function loadContract(jobId) {
  const jobData = await fetchJobJSON(jobId);
  
  // Check if PDF exists
  if (jobData.pdf_artifacts?.contract_pdf?.url) {
    // Embed Google Drive PDF viewer
    const pdfUrl = jobData.pdf_artifacts.contract_pdf.url;
    const viewerUrl = pdfUrl.replace('/view', '/preview');
    
    document.getElementById('contract-content').innerHTML = `
      <iframe 
        src="${viewerUrl}" 
        width="100%" 
        height="800px" 
        frameborder="0">
      </iframe>
      <a href="${pdfUrl}" download class="download-button">
        Download Contract PDF
      </a>
    `;
  } else {
    // Fallback to HTML rendering (current method)
    renderContractHTML(jobData);
  }
}
```

---

## Testing 

1. **Test Template Creation**:
   - Create templates with placeholders
   - Verify template IDs are correct

2. **Test Service Account**:
   - Authenticate and list Drive files
   - Verify template access

3. **Test PDF Generation**:
   - Call `/api/generate-pdf` with test job JSON
   - Verify PDFs are created
   - Verify placeholders are replaced correctly

4. **Test Webhook Flow**:
   - Complete test payment
   - Verify webhook triggers PDF generation
   - Verify PDFs are stored and accessible

5. **Test Frontend**:
   - Verify PDF viewer displays correctly
   - Verify download button works
   - Verify fallback to HTML if PDF not generated

---

## Resources 

+ Step-by-step example of exact same use-case 
`https://tomassetti.me/how-to-generate-invoices-using-a-google-doc-template-and-generate-a-pdf-programmatically/`

+ Google Drive API Node.js Quickstart
`https://developers.google.com/drive/api/quickstart/nodejs`

+ Google Docs API Documentation
`https://developers.google.com/docs/api`

+ Replace Text in Google Docs
`https://developers.google.com/docs/api/how-tos/merge`

+ Export Google Doc as PDF
`https://developers.google.com/drive/api/v3/manage-downloads`