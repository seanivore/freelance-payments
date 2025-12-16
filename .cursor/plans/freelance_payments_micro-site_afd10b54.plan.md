---
name: Freelance Payments Micro-Site
overview: Build a reusable payment micro-site at payments.august.style using JSON-based architecture (like portfolio). HTML pages dynamically populate from JSON, clients view contracts/invoices online and download PDFs on-demand. State machine routes users through contract signing → payment flow. Stripe Payment Element handles payments. GitHub Actions automates Stripe product creation.
todos:
  - id: create-contract-template
    content: Create contract-template.html by analyzing all provided examples, combining best elements (Plain Contract base + essential protections), removing corporate bloat, testing with real project scope data. HTML format with CSS styling for professional typography.
    status: pending
  - id: create-invoice-template
    content: Create invoice-template.html matching contract styling, including all payment details and professional layout. Print-optimized CSS for PDF generation.
    status: pending
  - id: test-templates-with-real-data
    content: Manually fill HTML templates using draft_long_PROJECT_SCOPE.md to identify missing fields, overly complex sections, and exact JSON requirements. Test browser print-to-PDF quality.
    status: pending
  - id: create-json-schema
    content: Create _job_template.json with complete structure based on template testing results. Include contract.signed fields, payment status tracking, due_type/due_term fields, project_keyword for lookup. Include both project_scope_summary (for contract) and project_scope_full (detailed, separate).
    status: pending
  - id: build-lookup-page
    content: Build index.html payment lookup form with last name + project keyword inputs. Implement lookup logic to find JSON file from manifest.
    status: pending
  - id: build-payment-router
    content: "Create payment-router.js state machine to determine user routing based on contract.signed and payment status. Handles all scenarios: first visit, return visits, partial payments, completed payments."
    status: pending
  - id: build-contract-page
    content: Build contract.html dynamic page that populates from JSON. Include signature fields (typed name + date), sign button that updates JSON, download PDF button, navigation links.
    status: pending
  - id: build-invoice-page
    content: Build invoice.html dynamic page that shows specific payment details. Display payment number, amount, due date/term, status. Download PDF button, navigation to contract/checkout.
    status: pending
  - id: build-checkout-page
    content: Build checkout.html with Stripe Payment Element integration. On payment success, update JSON payment status, commit to repo, route to next payment or completion.
    status: pending
  - id: create-manifest-script
    content: "Create generate_manifest.py script to scan jobs directory and create manifest.json mapping. Lookup key format: last_name-project_keyword (lowercase, hyphenated)."
    status: pending
  - id: payment-intent-workflow
    content: Create GitHub Actions workflow to handle PaymentIntent creation via API endpoint. Triggered from serverless function (Vercel/Netlify) for security.
    status: pending
  - id: job-processing-workflow
    content: ""
    status: pending
  - id: test-payment-flow
    content: ""
    status: pending
---

# Freelance Payments Micro-Site Implementation Plan

## Quick Start (For New Contributors)

**What This Is**: A reusable payment micro-site at `payments.august.style` that automates contract generation, invoice creation, and payment collection for freelance projects.

**How It Works**:

1. You create a JSON file per client project in `assets/jobs/`
2. GitHub Actions processes the JSON → Creates Stripe products, generates HTML pages
3. Client visits site → Enters last name + project keyword → Views contract → Signs → Pays
4. HTML pages dynamically populate from JSON (like portfolio architecture)
5. PDFs generated on-demand via browser print-to-PDF

**Key Files**:

- `index.html` - Client lookup form
- `contract.html` - Dynamic contract page (like portfolio entry.html)
- `invoice.html` - Dynamic invoice page (like portfolio entry.html)
- `checkout.html` - Stripe payment
- `assets/jobs/*.json` - One JSON file per client project
- `assets/js/payment-router.js` - State machine for routing logic
- `generate_manifest.py` - Creates lookup manifest (adapt from portfolio example)
- `404.html` - SPA routing helper (adapt from portfolio example)

**Reference Files Available** (from portfolio):
- `assets/docs/planning-resources/generate_manifest_example.py` - Portfolio manifest generator (adapt for payment lookup)
- `assets/docs/planning-resources/manifest_example.yml` - GitHub Actions workflow (adapt branch/paths)
- `assets/docs/planning-resources/404_example.html` - Portfolio 404 routing (simplify for payment pages)

**Additional Portfolio Files Available** (copied as examples):
- `assets/docs/planning-resources/entry-controller_example.js` - Shows how to load JSON and populate HTML dynamically (perfect reference for contract.html/invoice.html)
- `assets/docs/planning-resources/data-loader_example.js` - JSON loading utilities (normalizeForURL function, manifest loading) - adapt for payment lookup

**Other Files That Could Help** (if needed):
- `entry.html` - Template structure for dynamic pages (reference for contract.html/invoice.html)
- `index.html` - Homepage structure (reference for payment lookup form layout)

**Files Less Critical** (portfolio-specific):
- `section-controller.js`, `homepage-controller.js`, `tile-renderer.js`, `filter-controller.js` - Portfolio-specific, not needed for payments site
- `section.html` - Portfolio-specific section pages, not applicable

**Payment Flow**:

- Contract not signed → Contract page
- Contract signed + Payment pending → Invoice page → Checkout
- All payments complete → Completion page

**Architecture**: JSON-based (like portfolio), GitHub Pages hosting, GitHub Actions automation, Stripe Payment Element

---

## Architecture Overview

This micro-site follows the same JSON-based architecture as the portfolio (`august.style`), adapted for freelance payment processing. The system uses:

- **JSON files** in `assets/jobs/` directory (one per client project)
- **Manifest.json** mapping client lookup (last name + project keyword) to JSON files
- **HTML pages** that dynamically populate from JSON (contract.html, invoice.html)
- **State machine logic** determines user routing based on contract/payment status
- **GitHub Actions** + **Claude Code headless** for automation
- **Stripe Payment Element** (embedded components) for custom checkout
- **Serverless backend** via GitHub Actions for secure Stripe API calls

**Key Innovation**: HTML-first documents with on-demand PDF generation (browser print-to-PDF) - simpler, faster, better UX than pre-generating PDFs.

## File Structure

```
freelance-payments/
├── index.html                    # Payment lookup form page
├── contract.html                 # Dynamic contract page (populates from JSON)
├── invoice.html                  # Dynamic invoice page (populates from JSON)
├── checkout.html                 # Payment Element checkout page
├── 404.html                     # SPA routing helper (see example: assets/docs/planning-resources/404_example.html)
├── generate_manifest.py          # Manifest generator (see example: assets/docs/planning-resources/generate_manifest_example.py)
├── assets/
│   ├── js/
│   │   ├── manifest.json        # Maps invoice#-payment# to JSON files
│   │   ├── payment-lookup.js    # Form handling & JSON lookup
│   │   ├── contract-controller.js # Contract page controller (like entry-controller.js)
│   │   ├── invoice-controller.js  # Invoice page controller
│   │   └── checkout-controller.js # Payment Element integration
│   ├── jobs/                     # Client project JSON files
│   │   └── uid-*.json           # One per client project
│   └── templates/
│       ├── contract-template.html # HTML contract template with placeholders
│       └── invoice-template.html  # HTML invoice template with placeholders
├── .github/
│   └── workflows/
│       ├── process-job.yml       # Triggered on new/updated job JSON
│       └── generate-manifest.yml # Updates manifest.json
└── _config.yml                   # GitHub Pages config
```

## JSON Schema for Job Files

Each job JSON file (`assets/jobs/uid-xxx.json`) contains:

```json
{
  "job_id": "uid-abc-123",
  "client": {
    "name": "Client Business Name",
    "last_name": "Smith",  // For lookup form
    "project_keyword": "art-website",  // For lookup form (e.g., "art-website", "logo-design")
    "contact": {
      "email": "client@example.com",
      "phone": "+1-555-0123"
    },
    "address": {
      "street": "123 Main St",
      "city": "Boston",
      "state": "MA",
      "zip": "02101"
    }
  },
  "contract": {
    "invoice_number": "11011",
    "date": "2025-01-15",
    "start_date": "2025-01-20",
    "end_date": "2025-03-15",
    "deliverables": "Complete website redesign...",
    "rate_type": "Flat Rate",
    "total_fee": 5000.00,
    "deposit_percent": 25,
    "invoice_days": 30,
    "late_fee": 100.00,
    "hourly_fee": 150.00,
    "location": "Massachusetts"
  },
  "payments": [
    {
      "payment_number": 1,
      "amount": 1250.00,
      "description": "Deposit (25%)",
      "due_type": "date",  // "date" or "term" (e.g., "before launch")
      "due_date": "2025-01-20",  // Optional if due_type is "date"
      "due_term": null,  // Optional if due_type is "term" (e.g., "before launch")
      "status": "pending",  // "pending", "paid", "overdue"
      "paid_date": null,  // Set when payment completes
      "stripe_product_id": "prod_xxx",  // Created by automation
      "stripe_price_id": "price_xxx"     // Created by automation
    },
    {
      "payment_number": 2,
      "amount": 3750.00,
      "description": "Final payment before launch",
      "due_type": "term",
      "due_date": null,
      "due_term": "before launch",
      "status": "pending",
      "paid_date": null,
      "stripe_product_id": "prod_yyy",
      "stripe_price_id": "price_yyy"
    }
  ],
  "contract": {
    "signed": false,  // Track if contract has been signed
    "signed_date": null,  // When contract was signed
    "signed_by": null  // Client name who signed
  },
  "project_scope_summary": "2-3 paragraph summary for contract insertion",
  "project_scope_full": "Full detailed scope (stored separately, referenced in contract)"
}
```

## Implementation Phases

### Phase 0: Contract & Invoice Template Creation (PREREQUISITE)

**Why This Comes First:** Creating the templates before the JSON schema ensures we identify exactly what fields are needed. Testing with real project scope data validates completeness.

**Expert Analysis of Contract Examples:**

After reviewing all contract templates, here's what I found:

**What Works Well:**

- **The Plain Contract** (CONTRACT_TEMPLATE.md): Clean, simple, covers essentials without bloat
- **ClickUp Template**: Comprehensive but too verbose for most freelance work
- **CONTRACTOR_AGREEMENT.md**: Over-engineered with insurance clauses unnecessary for solo freelancers
- **Consulting Agreement**: Corporate-heavy, assumes large company structure

**What's Missing from Simple Templates:**

- Clear IP ownership transfer language
- Portfolio/attribution rights (critical for designers)
- Scope change process
- Payment milestone clarity

**What's Overkill:**

- Insurance requirements (solo freelancers typically don't need)
- Extensive indemnification clauses (unnecessary for most design/dev work)
- Non-compete clauses (rarely enforceable for freelancers)
- Multiple approval layers (assumes corporate structure)

**Recommended Approach:**

Create a **hybrid template** that:

1. Uses The Plain Contract as the base (clean, simple structure)
2. Adds essential protections from detailed templates (IP, portfolio rights)
3. Removes corporate bloat (insurance, extensive indemnification)
4. Includes clear scope section placeholder (will be filled from project scope)
5. Matches your actual needs: design/dev/marketing freelance work

**0.1 Contract Template Creation**

- Review all contract examples provided
- Create `assets/templates/contract-template.md` with:
  - Essential sections only (Deliverables, Payment, Ownership, Termination)
  - Portfolio/attribution rights (you need this!)
  - Clear placeholders: `[[CLIENT NAME]]`, `[[DATE]]`, `[[PROJECT SCOPE]]`, etc.
  - Professional but not excessive legal language
  - Based on Massachusetts law (your location)

**0.2 Invoice Template Creation**

- Create `assets/templates/invoice-template.md` matching contract styling
- Include:
  - Your business info (hardcoded)
  - Client info placeholders
  - Payment details (amount, description, due date)
  - Invoice number format
  - Professional layout

**0.3 Template Testing**

- Use real project scope document (`draft_long_PROJECT_SCOPE.md`) as test data
- Fill templates manually to identify:
  - Missing fields
  - Overly complex sections
  - What can be simplified
  - Exact JSON schema requirements

**0.4 JSON Schema Definition**

- Based on template testing, create final JSON schema
- Document all required fields
- Identify optional vs required fields
- Create `_job_template.json` with complete structure

**Expert Feedback on Approach:**

✅ **Smart Strategy**: Creating templates first is the right call. You'll catch missing fields early rather than discovering gaps during automation.

⚠️ **Scope Section**: The project scope document is VERY detailed (280 lines). For contract insertion, we'll need a condensed version. Consider:

- Full scope stays in separate document (reference in contract)
- Contract gets 2-3 paragraph summary
- Or: Contract has "See attached Project Scope Document" clause

💡 **Recommendation**: Create TWO scope fields in JSON:

- `project_scope_summary` (2-3 paragraphs for contract)
- `project_scope_full` (full detailed scope, stored separately)

This keeps contracts readable while preserving detail.

### Phase 1: Core Site Structure

**1.1 Payment Lookup Page (`index.html`)**

- Simple form: **Last Name** + **Project Name/Keyword**
- Client-side validation
- JavaScript looks up JSON file from manifest.json (searches by client last_name + project keyword)
- **State Machine Logic** determines where to route user:
  - Contract not signed → Route to `contract.html`
  - Contract signed + Payment 1 not paid → Route to `invoice.html?payment=1`
  - Contract signed + Payment 1 paid + Payment 2 not paid → Route to `invoice.html?payment=2`
  - All payments complete → Show completion page
- Query params: `?job=uid-xxx` (payment number determined by state logic)

**1.2 Contract Page (`contract.html`)**

- Loads job JSON based on query params (`?job=uid-xxx`)
- Dynamically populates HTML template with contract data
- Professional CSS styling (print-optimized)
- "Download PDF" button (triggers browser print-to-PDF)
- **Signature section** at bottom:
  - Client name field (typed)
  - Date field
  - "I agree to the terms" checkbox
  - "Sign Contract" button
- **On signature**: Updates JSON `contract.signed = true`, `contract.signed_date`, `contract.signed_by`
- **Navigation**: 
  - "Back to Home" link
  - After signing → Auto-redirect to first invoice (`invoice.html?job=uid-xxx&payment=1`)
  - "View Contract Again" button (always available)

**1.3 Invoice Page (`invoice.html`)**

- Loads job JSON based on query params (`?job=uid-xxx&payment=1`)
- Shows **specific payment** details dynamically:
  - Payment number and description
  - Amount
  - Due date or due term (e.g., "before launch")
  - Payment status
- "Download PDF" button (print-optimized styling)
- **Navigation**:
  - "Back to Contract" link (always available)
  - "View All Payments" link (shows payment history)
  - "Pay Now" button → Routes to `checkout.html?job=uid-xxx&payment=1`
- **State-aware**: If payment already paid, shows receipt instead of payment button

**1.4 Checkout Page (`checkout.html`)**

- Loads job JSON based on query params (`?job=uid-xxx&payment=1`)
- Displays **specific payment** details (amount, description, due date/term)
- Integrates Stripe Payment Element
- Creates PaymentIntent via GitHub Actions API endpoint
- **On successful payment**:
  - Updates JSON: `payments[payment_number-1].status = "paid"`, `payments[payment_number-1].paid_date = today`
  - Commits updated JSON to repo (via GitHub Actions)
  - Shows success page with receipt
  - **Auto-routes**: If more payments pending → Next invoice, else → Completion page
- **Navigation**: "Back to Invoice" link

**1.5 Manifest Generation**

- Python script: `generate_manifest.py` (see example: `assets/docs/planning-resources/generate_manifest_example.py`)
- Scans `assets/jobs/*.json`
- Creates mapping for lookup:
  ```json
  {
    "lookups": {
      "smith-art-website": "assets/jobs/uid-abc-123.json"  // last_name-project_keyword
    }
  }
  ```
- Lookup key format: `{last_name}-{project_keyword}` (lowercase, hyphenated)
- GitHub Action auto-runs on JSON file changes (see example: `assets/docs/planning-resources/manifest_example.yml`)
- **Reference**: Portfolio uses similar pattern - adapt for payment lookup instead of project URLs

**1.6 State Management & Routing Logic**

**Payment State Machine** (in `assets/js/payment-router.js`):

```javascript
function determineRoute(jobData) {
  // Contract not signed → Contract page
  if (!jobData.contract.signed) {
    return '/contract.html?job=' + jobData.job_id;
  }
  
  // Find next unpaid payment
  const nextPayment = jobData.payments.find(p => p.status === 'pending');
  
  if (!nextPayment) {
    return '/complete.html';  // All payments done
  }
  
  // Route to invoice for next payment
  return '/invoice.html?job=' + jobData.job_id + '&payment=' + nextPayment.payment_number;
}
```

**Lookup Logic**:

- User enters: Last Name + Project Keyword
- Search manifest.json for matching entry
- Load job JSON
- Apply state machine to determine route
- Redirect user to appropriate page

### Phase 2: GitHub Actions Backend

**2.1 PaymentIntent Creation Endpoint**

- GitHub Actions workflow: `.github/workflows/create-payment-intent.yml`
- Triggered via `workflow_dispatch` with inputs (job_id, payment_number, amount)
- Uses Stripe API to create PaymentIntent
- Returns `client_secret` to frontend
- Stores secret key in GitHub Secrets: `STRIPE_SECRET_KEY`

**2.2 Job Processing Workflow** (`.github/workflows/process-job.yml`)

- Triggered on: push to `assets/jobs/**/*.json`
- Steps:

  1. Read new/updated JSON file
  2. Extract contract and payment details
  3. Create Stripe Products/Prices via API for each payment
  4. Update JSON file with Stripe IDs
  5. Commit updated JSON
  6. Trigger manifest regeneration

**Note**: No PDF generation needed! HTML pages populate dynamically from JSON. PDFs generated on-demand via browser print-to-PDF.

**2.3 Stripe Product Creation**

- For each payment in JSON:
  - Product name: `"{invoice_number}-{payment_number}"` (e.g., "11011-1")
  - Metadata: `client_last_name`, `invoice_number`, `payment_number`
  - Price: amount from JSON
  - Store `product_id` and `price_id` back in JSON

### Phase 3: HTML-First Document System (REVISED APPROACH)

**Why This Is Better:**

Your insight is spot-on! Instead of pre-generating PDFs, we'll create **HTML pages that dynamically populate from JSON**, then convert to PDF on-demand. This approach:

- ✅ **Simpler**: HTML templates easier to maintain than PDF templates
- ✅ **Better UX**: Clients view documents in browser, download when needed
- ✅ **Professional**: CSS styling gives full typography control
- ✅ **Flexible**: Update templates without regenerating all PDFs
- ✅ **Less Storage**: No pre-generated PDFs cluttering repo
- ✅ **Modern**: Like government sites - view online, download PDF

**3.1 Contract Page** (`contract.html`)

- Dynamic HTML page (like portfolio's entry.html)
- Populates from JSON based on invoice number + last name lookup
- Professional CSS styling (match portfolio aesthetic)
- "Download PDF" button triggers HTML → PDF conversion
- Client can view, download, or email to themselves

**3.2 Invoice Page** (`invoice.html`)

- Same approach as contract
- Shows payment details dynamically
- Download PDF button
- Links to payment checkout after viewing

**3.3 HTML Templates**

- `assets/templates/contract-template.html` - HTML with placeholders
- `assets/templates/invoice-template.html` - HTML with placeholders
- Use CSS for professional typography (not markdown)
- Placeholders: `{{CLIENT_NAME}}`, `{{DATE}}`, `{{PROJECT_SCOPE}}`, etc.

**3.4 On-Demand PDF Generation**

**Client-Side Approach (Simplest):**

- Use browser's print-to-PDF functionality
- CSS `@media print` styles for PDF formatting
- "Download PDF" button triggers `window.print()`
- ✅ No server-side processing needed
- ✅ Instant conversion
- ✅ Works on GitHub Pages (static hosting)

**Server-Side Approach (If Needed):**

- GitHub Actions workflow triggered on-demand
- Uses Puppeteer/Playwright to convert HTML → PDF
- Returns PDF as download
- ⚠️ Adds latency (~30s) but better control

**Recommendation**: Start with **client-side print-to-PDF**. It's simpler, instant, and works perfectly for contracts/invoices. Only add server-side if you need advanced PDF features.

**3.5 Digital Signatures (Optional Future Enhancement)**

**Your Insight About Signatures:**

- Typed name + date is often sufficient (like government sites)
- More formal than needed for most freelance contracts
- Can add DocuSeal-style signing later if needed

**DocuSeal Integration (If Desired):**

- Open source, can self-host (free!)
- Embedded signing widget
- Could integrate into contract.html page
- Not necessary for MVP - typed signatures work fine

**Current Approach**: Simple typed signature fields on HTML page

- Client types full name + date
- You add your signature after (typed or scanned)
- Download as PDF with signatures included
- ✅ Simple, works for freelance contracts
- ✅ No third-party service needed

### Phase 4: Stripe Payment Element Integration

**4.1 Frontend Integration** (`assets/js/checkout-controller.js`)

- Load Stripe.js: `https://js.stripe.com/v3/`
- Initialize Payment Element with appearance API
- Create PaymentIntent via GitHub Actions API call
- Handle payment confirmation
- Redirect to success page

**4.2 Payment Flow**

1. User enters: last name, invoice number, payment number
2. Frontend finds JSON file via manifest
3. Frontend calls GitHub Actions API to create PaymentIntent
4. GitHub Action creates PaymentIntent with correct amount
5. Frontend receives `client_secret`
6. Payment Element confirms payment
7. Success page shows receipt

**4.3 GitHub Actions API Endpoint**

- Workflow: `.github/workflows/api-payment-intent.yml`
- Accepts POST requests (via GitHub API or webhook)
- Validates job_id and payment_number
- Creates Stripe PaymentIntent
- Returns JSON: `{ client_secret: "pi_xxx_secret_yyy" }`

### Phase 5: Payment Status Updates & Email Reminders (Future Enhancement)

**5.1 Payment Status Updates**

- Stripe webhook → GitHub Actions
- Updates payment status in JSON automatically
- Commits updated JSON to repo

**5.2 Email Reminders (Optional)**

- GitHub Actions workflow checks for payments with `due_date` approaching
- Sends reminder email via Claude hook or email service
- **Note**: "Before launch" payments require manual follow-up (no fixed date)
- **MVP**: Skip email reminders, add later if needed

## Technical Decisions

### Backend Approach: GitHub Actions

- ✅ No separate hosting needed
- ✅ Secure secret management
- ✅ Free for public repos
- ⚠️ Requires GitHub API calls (rate limits)
- ⚠️ Cold start latency (~30s)

### Product Lookup: Hybrid Approach

- **Step 1**: Client-side JSON lookup (fast, no API call)
- **Step 2**: Use Stripe Product ID from JSON (already created)
- **Step 3**: Create PaymentIntent with Price ID
- This avoids searching Stripe metadata (not supported)

### PDF Generation: Research Required

**Expert Thoughts:**

- Markdown → PDF typically looks unprofessional (you've experienced this)
- Claude Code skills: Need to test if they can produce quality PDFs
- **Best Option**: Use a PDF template filling service (doqs.dev, PDFtk, or similar)
  - Create professional PDF templates once
  - Fill programmatically with JSON data
  - Much better typography and layout control
- **Alternative**: Generate HTML from markdown, then use headless browser (Puppeteer) to create PDF
  - More control over styling
  - Can use CSS for professional layout
  - Requires more setup but better results

**Recommendation**: Start with Claude Code skills test. If quality is poor, use HTML → PDF approach (better than markdown → PDF).

### Payment Element vs Checkout

- Using **Payment Element** (embedded) for custom UX
- More control over styling and flow
- Better for client projects later

## Security Considerations

1. **Stripe Keys**: Store in GitHub Secrets
2. **API Endpoints**: Validate inputs, rate limit
3. **Client-side**: Never expose secret keys
4. **JSON Files**: No sensitive data (only invoice numbers, amounts)

## Testing Strategy

1. **Local Testing**: Use URL params like portfolio (`?job=uid-xxx&payment=1`)
2. **Stripe Test Mode**: Use test keys for development
3. **Test JSON**: Create sample job file with test data
4. **Payment Flow**: Test with Stripe test cards

## Next Steps

**Priority Order (Based on Dependencies):**

1. **Phase 0 - Templates First** (Critical Foundation):

   - Create contract template (hybrid approach)
   - Create invoice template
   - Test with real project scope data
   - Define final JSON schema

2. **Research PDF Generation** (Parallel to template creation):

   - Test Claude Code skills
   - Evaluate HTML → PDF approach
   - Choose best quality option

3. **Build Core Pages** (After JSON schema defined):

   - index.html (lookup form with last name + project keyword)
   - contract.html (dynamic contract with signature)
   - invoice.html (dynamic invoice per payment)
   - checkout.html (Payment Element)

4. **Implement State Management**:

   - payment-router.js (state machine logic)
   - Contract signing updates JSON
   - Payment completion updates JSON

5. **Implement GitHub Actions** (Backend):

   - PaymentIntent creation workflow
   - Job processing workflow (Stripe product creation - no PDF generation needed!)

6. **Test End-to-End**:

   - Complete payment flow with Stripe test mode
   - Test state machine routing (all scenarios)
   - Test contract signing updates JSON
   - Test payment completion updates JSON
   - Validate browser print-to-PDF quality
   - Test automation triggers

## Files to Create/Modify

### New Files

- `index.html` - Payment lookup form
- `contract.html` - Dynamic contract page (like portfolio entry.html)
- `invoice.html` - Dynamic invoice page
- `checkout.html` - Payment Element page
- `assets/js/payment-lookup.js` - Form handling & lookup logic
- `assets/js/payment-router.js` - State machine for routing decisions
- `assets/js/contract-controller.js` - Contract page controller (handles signing)
- `assets/js/invoice-controller.js` - Invoice page controller
- `assets/js/checkout-controller.js` - Stripe integration & payment status updates
- `assets/jobs/_job_template.json` - JSON schema template
- `assets/templates/contract-template.html` - HTML contract template
- `assets/templates/invoice-template.html` - HTML invoice template
- `generate_manifest.py` - Manifest generator script (adapt from `assets/docs/planning-resources/generate_manifest_example.py`)
- `.github/workflows/process-job.yml` - Job processing automation
- `.github/workflows/create-payment-intent.yml` - PaymentIntent API
- `.github/workflows/generate-manifest.yml` - Manifest regeneration (adapt from `assets/docs/planning-resources/manifest_example.yml`)
- `404.html` - SPA routing helper (adapt from `assets/docs/planning-resources/404_example.html`)

### Modified Files

- `_config.yml` - GitHub Pages config (already exists)
- `.example.env` - Add Stripe keys documentation
- `README.md` - Usage instructions

## Questions to Resolve

1. **PDF Generation**: Which method produces best-looking PDFs?

   - Test Claude Code skills first
   - Compare with doqs.dev API
   - Consider LaTeX if quality is critical

2. **GitHub Actions API Access**: How to call from frontend?

**Expert Analysis:**

   - **Option A (GitHub API with PAT)**: ⚠️ Risky - PAT tokens shouldn't be in client-side code
   - **Option B (Webhook proxy)**: ✅ Good middle ground - services like Zapier, n8n, or custom proxy
   - **Option C (Separate serverless)**: ✅ Best security - Vercel/Netlify function, but adds complexity

**Recommended Approach**: Use **GitHub Actions with `workflow_dispatch`** triggered via:

   - GitHub API from a simple serverless function (Vercel/Netlify)
   - Or: Use GitHub's `repository_dispatch` webhook pattern
   - Frontend calls your serverless endpoint → serverless calls GitHub API
   - Keeps secrets server-side, minimal infrastructure

3. **Payment Success Handling**: Where to redirect after payment?

   - Success page on micro-site
   - Email confirmation
   - Update JSON with payment status

## Success Criteria

- ✅ Client can find their project by entering last name + project keyword
- ✅ State machine correctly routes users based on contract/payment status
- ✅ Contract page allows digital signing (typed name + date)
- ✅ Invoice pages show correct payment details dynamically
- ✅ Payment Element displays correct amount and description
- ✅ Payment processes successfully through Stripe
- ✅ Payment status updates in JSON automatically
- ✅ Contract and invoice HTML pages dynamically populate from JSON
- ✅ Clients can view online and download PDFs on-demand (browser print-to-PDF)
- ✅ Stripe products created with proper metadata
- ✅ All automation runs via GitHub Actions
- ✅ Site works on GitHub Pages (static hosting)

## Overall Expert Assessment & Recommendations

**What You're Building is Smart:**

- ✅ JSON-based architecture matches your portfolio (consistency is good)
- ✅ GitHub Actions backend avoids hosting costs (excellent for solo freelancer)
- ✅ Reusable system for all clients (scales well)
- ✅ Payment Element gives you custom UX (valuable for client projects later)

**Potential Challenges & Solutions:**

1. **GitHub Actions Latency**: ~30s cold start might feel slow for payment flow

   - **Solution**: Pre-create PaymentIntents during job processing, store in JSON
   - Frontend retrieves existing PaymentIntent (instant)

2. **PDF Quality**: Markdown → PDF looks unprofessional

   - **Solution**: HTML pages with CSS styling, browser print-to-PDF (professional, instant, no server processing)

3. **Stripe Product Lookup**: Can't search by metadata efficiently

   - **Solution**: Store Product IDs in JSON (already planned - good!)

4. **Scope Document Length**: 280 lines is too long for contract insertion

   - **Solution**: Two-tier approach - summary in contract, full scope separate

**Why This Approach Works:**

- You're solving real problems (contract generation, payment collection)
- Architecture is maintainable (JSON files, clear structure)
- Automation reduces manual work (exactly what you need)
- Reusable across clients (scales with your business)

**Final Thought:**

This is a solid plan. The Phase 0 approach (templates first) is exactly right - it'll save you from discovering missing fields later. The hybrid contract template approach balances professionalism with practicality. You're not over-engineering, and you're not under-protecting yourself. Good balance.

**REVISED APPROACH - HTML-First Documents:**

Your insight about HTML pages with on-demand PDF generation is **brilliant** and actually **simpler** than the original plan:

**Why HTML-First Is Better:**

- ✅ **Simpler**: No pre-generating PDFs, no server-side processing needed
- ✅ **Better UX**: Clients view documents in browser (like modern government sites)
- ✅ **Professional**: CSS gives full typography control (better than markdown → PDF)
- ✅ **Flexible**: Update HTML templates without regenerating PDFs
- ✅ **Instant**: Browser print-to-PDF is immediate (no 30s GitHub Actions delay)
- ✅ **Less Storage**: No PDF files cluttering the repo
- ✅ **Modern**: Matches how modern web apps work

**Digital Signatures:**

- Typed name + date is sufficient (like government sites)
- More formal than needed for freelance contracts
- DocuSeal integration possible later if needed (open source, free to self-host)
- For MVP: Simple signature fields on HTML page work perfectly

**This Isn't Overcomplicating - It's Simplifying!**

- Removes PDF generation complexity
- Uses familiar portfolio architecture pattern
- Better user experience
- Easier to maintain

**Ready to Execute?**

Once templates are created and tested, the rest flows naturally. The HTML-first approach actually makes the implementation easier than originally planned. The JSON schema will be clear, automation will be straightforward, and you'll have a modern, maintainable system that works for years to come.