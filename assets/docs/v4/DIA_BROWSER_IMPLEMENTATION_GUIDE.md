# Google Docs → PDF Implementation Guide for Dia Browser



---

## What We Need

1. **How to save/create Google Doc templates** (step-by-step)
2. **API code snippets** for Google Drive/Docs API integration
3. **Vercel serverless function** implementation (`/api/generate-pdf`)
4. **Placeholder mapping** from JSON fields to template placeholders
5. **PDF storage and access** strategy

---

## Step 1: Create Google Docs Templates

### Contract Template (`Freelance Contract v1`)

**Process**:
1. Open Google Docs
2. Create new document
3. Design your contract layout (use Google Docs formatting - fonts, spacing, headers, etc.)
4. Insert placeholders using double-brace syntax: `{{placeholder_name}}`

**Required Placeholders**:
```
{{client_name}}          → customer_object.individual_name or customer_object.business_name
{{client_address}}       → Formatted address from customer_object.address
{{project_title}}        → product_object.name
{{deliverables}}         → project_scope_summary or project_scope_full
{{start_date}}           → contract.work_start (format: "December 30, 2026")
{{end_date}}             → contract.work_end (format: "December 31, 2026")
{{total_amount}}         → Sum of initial_price_object.unit_amount + balance_price_object.unit_amount (format: "$1,250.00")
{{payment_terms}}        → initial_price_object.metadata.pay_by + balance_price_object.metadata.pay_by
{{jurisdiction}}         → contract.legal_jurisdiction
{{contractor_name}}      → "Sean August Horvath"
{{contractor_address}}   → "102 Lunenburg Ave, West Townsend, MA 01474"
{{contractor_phone}}     → "+1 424-744-7687"
{{contractor_email}}     → "sean@august.style"
{{contractor_website}}   → "https://august.style"
{{maintenance_period}}   → contract.maintenance_period_months + " months"
{{maintenance_fee}}      → contract.maintenance_monthly_fee
```

**Example Contract Section**:
```
FREELANCE CONTRACTOR AGREEMENT

This agreement is between {{client_name}} (the "Client") and {{contractor_name}} (the "Contractor").

PROJECT DETAILS
Project Title: {{project_title}}
Deliverables: {{deliverables}}
Start Date: {{start_date}}
End Date: {{end_date}}

PAYMENT TERMS
Total Amount: {{total_amount}}
Payment Schedule: {{payment_terms}}

LEGAL JURISDICTION
This agreement is governed by the laws of {{jurisdiction}}.

CONTRACTOR INFORMATION
Name: {{contractor_name}}
Address: {{contractor_address}}
Phone: {{contractor_phone}}
Email: {{contractor_email}}
Website: {{contractor_website}}
```

**Save Template**:
1. Click "File" → "Make a copy" → Name it "Freelance Contract v1"
2. Get the template ID from URL: `https://docs.google.com/document/d/{TEMPLATE_ID}/edit`
3. Store `TEMPLATE_ID` in Vercel env as `GOOGLE_TEMPLATE_CONTRACT_ID`

### Invoice Template (`Invoice v1`)

**Process**: Same as contract template

**Required Placeholders**:
```
{{invoice_number}}       → product_object.id (e.g., "uid-sst-846")
{{invoice_date}}         → Current date (format: "December 30, 2025")
{{bill_to_name}}         → customer_object.business_name or customer_object.individual_name
{{bill_to_address}}      → Formatted address from customer_object.address
{{item_rows}}            → **DYNAMIC TABLE** (see below)
{{subtotal}}             → Sum of all line items (format: "$1,250.00")
{{discount}}             → coupon_object.amount_off / 100 (format: "$250.00" or "N/A")
{{tax}}                  → "N/A" (or calculate if tax enabled)
{{total}}                → subtotal - discount (format: "$1,000.00")
{{due_date}}             → balance_price_object.metadata.pay_by
{{contractor_name}}      → "Sean August Horvath"
{{contractor_address}}   → "102 Lunenburg Ave, West Townsend, MA 01474"
{{contractor_email}}     → "sean@august.style"
```

**Dynamic Table for `{{item_rows}}`**:
- Create a table in Google Docs with headers: "Description", "Quantity", "Unit Price", "Total"
- Insert ONE sample row with placeholders: `{{item_description}}`, `{{item_quantity}}`, `{{item_unit_price}}`, `{{item_total}}`
- Mark this row for script replacement
- The script will:
  1. Find the table
  2. Delete the sample row
  3. Insert rows for each price object:
     - Row 1: `initial_price_object.nickname`, `1`, `$750.00`, `$750.00`
     - Row 2: `balance_price_object.nickname`, `1`, `$250.00`, `$250.00`

**Example Invoice Section**:
```
INVOICE

Invoice Number: {{invoice_number}}
Date: {{invoice_date}}

BILL TO:
{{bill_to_name}}
{{bill_to_address}}

FROM:
{{contractor_name}}
{{contractor_address}}
{{contractor_email}}

ITEMS:
[Table with {{item_rows}}]

SUBTOTAL: {{subtotal}}
DISCOUNT: {{discount}}
TAX: {{tax}}
TOTAL: {{total}}

DUE DATE: {{due_date}}
```

**Save Template**:
1. Click "File" → "Make a copy" → Name it "Invoice v1"
2. Get template ID from URL
3. Store in Vercel env as `GOOGLE_TEMPLATE_INVOICE_ID`

---

## Step 2: Set Up Google Service Account

### Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable "Google Drive API" and "Google Docs API"
4. Go to "IAM & Admin" → "Service Accounts"
5. Click "Create Service Account"
6. Name: "freelance-payments-pdf-generator"
7. Grant role: "Editor" (or custom role with Drive + Docs permissions)
8. Click "Create Key" → JSON
9. Download JSON key file

### Grant Template Access

1. Open each template Google Doc
2. Click "Share" button
3. Add service account email (from JSON key: `client_email`)
4. Grant "Viewer" access (service account only needs to read templates)

### Store Credentials

1. Copy entire JSON key file contents
2. Add to Vercel env: `GOOGLE_SERVICE_ACCOUNT_KEY` (paste full JSON as string)
3. Or store as base64-encoded string if needed

---

## Step 3: API Implementation

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

---

## Step 4: Webhook Integration

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

---

## Step 5: Frontend Integration

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

### Update `invoice-controller.js`

**Similar**: Embed PDF viewer if PDF exists

---

## Step 6: Environment Variables

Add to Vercel:

```bash
# Google Drive API
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
GOOGLE_TEMPLATE_CONTRACT_ID=1a2b3c4d5e6f7g8h9i0j
GOOGLE_TEMPLATE_INVOICE_ID=9z8y7x6w5v4u3t2s1r0q
GOOGLE_DRIVE_FOLDER_ID=folder123...  # Optional: specific folder for PDFs
```

---

## Step 7: Testing

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

## Key Implementation Notes

1. **Placeholder Syntax**: Use `{{placeholder_name}}` (double braces)
2. **Dynamic Tables**: Invoice table rows require special handling (find table, delete sample row, insert new rows)
3. **PDF Storage**: Store in Google Drive with "anyone with link" access OR serve via authenticated proxy
4. **Error Handling**: If PDF generation fails, fall back to HTML rendering
5. **Backward Compatibility**: System should work with or without PDFs (graceful degradation)

---

## Resources

- [Google Drive API Node.js Quickstart](https://developers.google.com/drive/api/quickstart/nodejs)
- [Google Docs API Documentation](https://developers.google.com/docs/api)
- [Replace Text in Google Docs](https://developers.google.com/docs/api/how-tos/merge)
- [Export Google Doc as PDF](https://developers.google.com/drive/api/v3/manage-downloads)

---

**Next Steps**: Implement `/api/generate-pdf.js` with the code structure above, test with sample JSON, then integrate with webhook handler.
