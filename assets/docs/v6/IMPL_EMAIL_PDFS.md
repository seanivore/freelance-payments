# Email PDF Implementation Guide

**Created**: 2026-01-19  
**Updated**: 2026-01-24  
**Status**: Planning Phase  
**Priority**: High (Required for v6)

---

## Executive Summary

This document provides an exclusively executable implementation plan for automated email delivery throughout the payment flow. Emails are triggered by existing events and sent via Gmail API (already have Google OAuth set up).

**Email Types**:
1. **Contract Signed** — Signed PDF to client + freelancer
2. **Invoice Acknowledged** — Invoice PDF to client
3. **Payment 1 Receipt** — Receipt + document links to client
4. **Balance Acknowledged** — Balance PDF to client
5. **Payment 2 Receipt** — Final receipt + all documents attached to client

---

## Current State

### What We Have
- **Google OAuth**: Already configured for Google Docs API (PDF generation)
- **Refresh Token**: Stored in GitHub Secrets (`GOOGLE_CREDENTIALS`)
- **Event System**: All trigger points already exist in `user-exit-events.yml`
- **PDF Files**: Contract, invoice, balance PDFs in `assets/pdf/`
- **Customer Email**: Stored in JSON at `customer.email`

### What We Need
- Add `gmail.send` scope to OAuth
- Create email sending utility
- Create email templates
- Integrate into event processing

---

## Email Specifications

### 1. Contract Signed Email

**Trigger**: `contract_signed` event (after PDF signing completes)

**Recipients**: 
- Client (`customer.email`)
- Freelancer (`sean@august.style`)

**Subject**: `Contract Signed - {{project}} - {{customer.name}}`

**Body**:
```
Hi {{customer.name}},

Thank you for signing the contract for {{project}}.

Your signed contract is attached to this email. Please save it for your records.

Next Steps:
1. Review the attached invoice
2. Make your first payment at: https://payments.august.style
   - Last Name: {{product.login_name}}
   - Keyword: {{product.login_keyword}}

If you have any questions, please reply to this email.

Best regards,
Sean August Horvath
Digital Business Consultant
```

**Attachments**:
- Signed contract PDF (`kon-xxx-xxx-signed.pdf`)

---

### 2. Invoice Acknowledged Email

**Trigger**: `invoice` event

**Recipients**: 
- Client (`customer.email`)

**Subject**: `Invoice - {{project}} - Payment 1 Due`

**Body**:
```
Hi {{customer.name}},

Thank you for reviewing your invoice for {{project}}.

Your invoice is attached to this email. Please save it for your records.

Payment Details:
- Amount Due: {{price1.unit_amount}}
- Due By: {{contract.work_start}}

Make your payment at: https://payments.august.style
- Last Name: {{product.login_name}}
- Keyword: {{product.login_keyword}}

If you have any questions, please reply to this email.

Best regards,
Sean August Horvath
```

**Attachments**:
- Invoice PDF (`inv-xxx-xxx.pdf`)

---

### 3. Payment 1 Receipt Email

**Trigger**: `payment_1` event

**Recipients**: 
- Client (`customer.email`)

**Subject**: `Receipt - {{project}} - Payment 1 Received`

**Body**:
```
Hi {{customer.name}},

Thank you for your payment! This email confirms receipt of Payment 1 for {{project}}.

Payment Details:
- Amount: {{price1.unit_amount}}
- Date: {{state.client_status.payment_1}}
- Project: {{project}}

Your Documents:
- Contract: https://payments.august.style/{{docs.contract.signed_pdf}}
- Invoice: https://payments.august.style/{{docs.invoice.pdf}}

What's Next:
Work begins on {{contract.work_start}}. You'll receive an email when your final payment is due (approximately {{contract.work_end}}).

If you have any questions, please reply to this email.

Best regards,
Sean August Horvath
```

**Attachments**: None (links only — documents still accessible)

---

### 4. Balance Acknowledged Email

**Trigger**: `balance` event

**Recipients**: 
- Client (`customer.email`)

**Subject**: `Final Balance - {{project}} - Payment 2 Due`

**Body**:
```
Hi {{customer.name}},

Thank you for reviewing your final balance statement for {{project}}.

Your balance statement is attached to this email.

Payment Details:
- Amount Due: {{price2.unit_amount}}
- Due By: {{price2.pay_days}} days from today

Make your final payment at: https://payments.august.style
- Last Name: {{product.login_name}}
- Keyword: {{product.login_keyword}}

If you have any questions, please reply to this email.

Best regards,
Sean August Horvath
```

**Attachments**:
- Balance PDF (`bal-xxx-xxx.pdf`)

---

### 5. Payment 2 Receipt Email (Final)

**Trigger**: `payment_2` event

**Recipients**: 
- Client (`customer.email`)
- Freelancer (`sean@august.style`)

**Subject**: `Project Complete - {{project}} - All Documents Attached`

**Body**:
```
Hi {{customer.name}},

Congratulations! Your project {{project}} is now complete.

This email confirms receipt of your final payment and includes all your project documents.

Payment Details:
- Amount: {{price2.unit_amount}}
- Date: {{state.client_status.payment_2}}
- Project: {{project}}
- Total Paid: {{total}}

All your documents are attached to this email:
- Signed Contract
- Invoice
- Final Balance Statement

Thank you for working with me! If you need any maintenance or updates during the next {{contract.maintenance_period_months}} months, please reach out.

Best regards,
Sean August Horvath
Digital Business Consultant
sean@august.style
```

**Attachments**:
- Signed contract PDF (`kon-xxx-xxx-signed.pdf`)
- Invoice PDF (`inv-xxx-xxx.pdf`)
- Balance PDF (`bal-xxx-xxx.pdf`)

---

## Technical Implementation

### Step 1: Add Gmail API Scope

**Action**: Re-authorize Google OAuth with additional scope

The current OAuth setup uses:
```javascript
const SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive',
];
```

Need to add:
```javascript
const SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.send',  // NEW
];
```

**File to Update**: `api/google/auth.js`

After updating, you'll need to:
1. Run the OAuth flow again to get a new refresh token
2. Update `GOOGLE_CREDENTIALS` in GitHub Secrets

---

### Step 2: Create Email Utility

**New File**: `.github/scripts/utils/email_sender.py`

```python
"""
Email Sender Utility

Sends emails via Gmail API using existing Google OAuth credentials.
Supports plain text emails with PDF attachments.
"""

import os
import base64
import json
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build


def get_gmail_service():
    """Get Gmail API service using refresh token from environment."""
    creds_json = os.environ.get('GOOGLE_CREDENTIALS')
    if not creds_json:
        raise ValueError("GOOGLE_CREDENTIALS environment variable not set")
    
    creds_data = json.loads(creds_json)
    creds = Credentials.from_authorized_user_info(creds_data)
    
    # Refresh if expired
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
    
    return build('gmail', 'v1', credentials=creds)


def create_message(
    sender: str,
    to: str,
    subject: str,
    body: str,
    attachments: list = None,
    cc: str = None
) -> dict:
    """
    Create email message with optional attachments.
    
    Args:
        sender: Sender email address
        to: Recipient email address
        subject: Email subject
        body: Plain text email body
        attachments: List of (file_path, filename) tuples
        cc: CC email address (optional)
    
    Returns:
        Gmail API message dict with base64-encoded raw content
    """
    message = MIMEMultipart()
    message['to'] = to
    message['from'] = sender
    message['subject'] = subject
    
    if cc:
        message['cc'] = cc
    
    # Add body
    message.attach(MIMEText(body, 'plain'))
    
    # Add attachments
    if attachments:
        for file_path, filename in attachments:
            if Path(file_path).exists():
                with open(file_path, 'rb') as f:
                    part = MIMEBase('application', 'pdf')
                    part.set_payload(f.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename="{filename}"'
                    )
                    message.attach(part)
            else:
                print(f"⚠️ Attachment not found: {file_path}")
    
    # Encode message
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
    return {'raw': raw}


def send_email(
    to: str,
    subject: str,
    body: str,
    attachments: list = None,
    cc: str = None
) -> dict:
    """
    Send email via Gmail API.
    
    Args:
        to: Recipient email address
        subject: Email subject
        body: Plain text email body
        attachments: List of (file_path, filename) tuples
        cc: CC email address (optional)
    
    Returns:
        Gmail API response
    """
    service = get_gmail_service()
    sender = os.environ.get('GMAIL_SENDER_EMAIL', 'sean@august.style')
    
    message = create_message(sender, to, subject, body, attachments, cc)
    
    try:
        result = service.users().messages().send(
            userId='me',
            body=message
        ).execute()
        print(f"✅ Email sent to {to}: {subject}")
        return result
    except Exception as e:
        print(f"❌ Failed to send email to {to}: {e}")
        raise


def format_currency(cents: int) -> str:
    """Format cents as USD currency string."""
    dollars = cents / 100
    return f"${dollars:,.2f}"


def replace_placeholders(template: str, job_data: dict) -> str:
    """
    Replace {{placeholder}} tokens with values from job_data.
    
    Supports nested paths like {{customer.name}} and {{docs.contract.pdf}}.
    """
    import re
    
    def get_nested_value(data: dict, path: str):
        """Get value from nested dict using dot notation."""
        keys = path.split('.')
        value = data
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return f"{{{{path}}}}"  # Return original if not found
        
        # Format currency values
        if isinstance(value, int) and ('amount' in path or 'fee' in path or 'usd' in path.lower()):
            return format_currency(value)
        
        return str(value) if value else ""
    
    # Find all {{placeholder}} patterns
    pattern = r'\{\{([^}]+)\}\}'
    
    def replacer(match):
        path = match.group(1).strip()
        return get_nested_value(job_data, path)
    
    return re.sub(pattern, replacer, template)
```

---

### Step 3: Create Email Templates Module

**New File**: `.github/scripts/utils/email_templates.py`

```python
"""
Email Templates

Plain text email templates with {{placeholder}} tokens.
Tokens are replaced with values from job JSON data.
"""

CONTRACT_SIGNED_SUBJECT = "Contract Signed - {{project}} - {{customer.name}}"

CONTRACT_SIGNED_BODY = """Hi {{customer.name}},

Thank you for signing the contract for {{project}}.

Your signed contract is attached to this email. Please save it for your records.

Next Steps:
1. Review the attached invoice
2. Make your first payment at: https://payments.august.style
   - Last Name: {{product.login_name}}
   - Keyword: {{product.login_keyword}}

If you have any questions, please reply to this email.

Best regards,
Sean August Horvath
Digital Business Consultant
"""


INVOICE_ACKNOWLEDGED_SUBJECT = "Invoice - {{project}} - Payment 1 Due"

INVOICE_ACKNOWLEDGED_BODY = """Hi {{customer.name}},

Thank you for reviewing your invoice for {{project}}.

Your invoice is attached to this email. Please save it for your records.

Payment Details:
- Amount Due: {{price1.unit_amount}}
- Due By: {{contract.work_start}}

Make your payment at: https://payments.august.style
- Last Name: {{product.login_name}}
- Keyword: {{product.login_keyword}}

If you have any questions, please reply to this email.

Best regards,
Sean August Horvath
"""


PAYMENT_1_RECEIPT_SUBJECT = "Receipt - {{project}} - Payment 1 Received"

PAYMENT_1_RECEIPT_BODY = """Hi {{customer.name}},

Thank you for your payment! This email confirms receipt of Payment 1 for {{project}}.

Payment Details:
- Amount: {{price1.unit_amount}}
- Date: {{state.client_status.payment_1}}
- Project: {{project}}

Your Documents:
- Contract: https://payments.august.style/{{docs.contract.signed_pdf}}
- Invoice: https://payments.august.style/{{docs.invoice.pdf}}

What's Next:
Work begins on {{contract.work_start}}. You'll receive an email when your final payment is due (approximately {{contract.work_end}}).

If you have any questions, please reply to this email.

Best regards,
Sean August Horvath
"""


BALANCE_ACKNOWLEDGED_SUBJECT = "Final Balance - {{project}} - Payment 2 Due"

BALANCE_ACKNOWLEDGED_BODY = """Hi {{customer.name}},

Thank you for reviewing your final balance statement for {{project}}.

Your balance statement is attached to this email.

Payment Details:
- Amount Due: {{price2.unit_amount}}
- Due By: {{price2.pay_days}} days from today

Make your final payment at: https://payments.august.style
- Last Name: {{product.login_name}}
- Keyword: {{product.login_keyword}}

If you have any questions, please reply to this email.

Best regards,
Sean August Horvath
"""


PAYMENT_2_RECEIPT_SUBJECT = "Project Complete - {{project}} - All Documents Attached"

PAYMENT_2_RECEIPT_BODY = """Hi {{customer.name}},

Congratulations! Your project {{project}} is now complete.

This email confirms receipt of your final payment and includes all your project documents.

Payment Details:
- Amount: {{price2.unit_amount}}
- Date: {{state.client_status.payment_2}}
- Project: {{project}}

All your documents are attached to this email:
- Signed Contract
- Invoice
- Final Balance Statement

Thank you for working with me! If you need any maintenance or updates during the next {{contract.maintenance_period_months}} months, please reach out.

Best regards,
Sean August Horvath
Digital Business Consultant
sean@august.style
"""
```

---

### Step 4: Create Email Dispatcher

**New File**: `.github/scripts/utils/email_dispatcher.py`

```python
"""
Email Dispatcher

Sends appropriate emails based on event type.
Called from user_exit_events.py after processing each event.
"""

from email_sender import send_email, replace_placeholders
from email_templates import (
    CONTRACT_SIGNED_SUBJECT, CONTRACT_SIGNED_BODY,
    INVOICE_ACKNOWLEDGED_SUBJECT, INVOICE_ACKNOWLEDGED_BODY,
    PAYMENT_1_RECEIPT_SUBJECT, PAYMENT_1_RECEIPT_BODY,
    BALANCE_ACKNOWLEDGED_SUBJECT, BALANCE_ACKNOWLEDGED_BODY,
    PAYMENT_2_RECEIPT_SUBJECT, PAYMENT_2_RECEIPT_BODY,
)

FREELANCER_EMAIL = "sean@august.style"


def send_contract_signed_email(job_data: dict, job_id: str):
    """Send signed contract to client and freelancer."""
    customer_email = job_data.get('customer', {}).get('email')
    if not customer_email:
        print("⚠️ No customer email, skipping contract signed email")
        return
    
    subject = replace_placeholders(CONTRACT_SIGNED_SUBJECT, job_data)
    body = replace_placeholders(CONTRACT_SIGNED_BODY, job_data)
    
    # Get signed PDF path
    signed_pdf = job_data.get('docs', {}).get('contract', {}).get('signed_pdf')
    if not signed_pdf:
        signed_pdf = f"assets/pdf/contract/kon-{job_id.split('-')[1]}-{job_id.split('-')[2]}-signed.pdf"
    
    attachments = [(signed_pdf, f"contract-{job_id}-signed.pdf")]
    
    # Send to client
    send_email(customer_email, subject, body, attachments)
    
    # Send copy to freelancer
    send_email(FREELANCER_EMAIL, f"[Copy] {subject}", body, attachments)


def send_invoice_acknowledged_email(job_data: dict, job_id: str):
    """Send invoice PDF to client."""
    customer_email = job_data.get('customer', {}).get('email')
    if not customer_email:
        print("⚠️ No customer email, skipping invoice email")
        return
    
    subject = replace_placeholders(INVOICE_ACKNOWLEDGED_SUBJECT, job_data)
    body = replace_placeholders(INVOICE_ACKNOWLEDGED_BODY, job_data)
    
    invoice_pdf = job_data.get('docs', {}).get('invoice', {}).get('pdf')
    attachments = [(invoice_pdf, f"invoice-{job_id}.pdf")] if invoice_pdf else []
    
    send_email(customer_email, subject, body, attachments)


def send_payment_1_receipt_email(job_data: dict, job_id: str):
    """Send payment 1 receipt to client (links only, no attachments)."""
    customer_email = job_data.get('customer', {}).get('email')
    if not customer_email:
        print("⚠️ No customer email, skipping payment 1 receipt email")
        return
    
    subject = replace_placeholders(PAYMENT_1_RECEIPT_SUBJECT, job_data)
    body = replace_placeholders(PAYMENT_1_RECEIPT_BODY, job_data)
    
    # No attachments for payment 1 - just links
    send_email(customer_email, subject, body)


def send_balance_acknowledged_email(job_data: dict, job_id: str):
    """Send balance PDF to client."""
    customer_email = job_data.get('customer', {}).get('email')
    if not customer_email:
        print("⚠️ No customer email, skipping balance email")
        return
    
    subject = replace_placeholders(BALANCE_ACKNOWLEDGED_SUBJECT, job_data)
    body = replace_placeholders(BALANCE_ACKNOWLEDGED_BODY, job_data)
    
    balance_pdf = job_data.get('docs', {}).get('balance', {}).get('pdf')
    attachments = [(balance_pdf, f"balance-{job_id}.pdf")] if balance_pdf else []
    
    send_email(customer_email, subject, body, attachments)


def send_payment_2_receipt_email(job_data: dict, job_id: str):
    """Send final receipt with all documents attached."""
    customer_email = job_data.get('customer', {}).get('email')
    if not customer_email:
        print("⚠️ No customer email, skipping payment 2 receipt email")
        return
    
    subject = replace_placeholders(PAYMENT_2_RECEIPT_SUBJECT, job_data)
    body = replace_placeholders(PAYMENT_2_RECEIPT_BODY, job_data)
    
    # Attach all documents
    docs = job_data.get('docs', {})
    attachments = []
    
    # Signed contract
    signed_pdf = docs.get('contract', {}).get('signed_pdf')
    if signed_pdf:
        attachments.append((signed_pdf, f"contract-{job_id}-signed.pdf"))
    
    # Invoice
    invoice_pdf = docs.get('invoice', {}).get('pdf')
    if invoice_pdf:
        attachments.append((invoice_pdf, f"invoice-{job_id}.pdf"))
    
    # Balance
    balance_pdf = docs.get('balance', {}).get('pdf')
    if balance_pdf:
        attachments.append((balance_pdf, f"balance-{job_id}.pdf"))
    
    # Send to client
    send_email(customer_email, subject, body, attachments)
    
    # Send copy to freelancer
    send_email(FREELANCER_EMAIL, f"[Copy] {subject}", body, attachments)


def dispatch_email_for_event(event_type: str, job_data: dict, job_id: str):
    """
    Dispatch appropriate email based on event type.
    
    Called from user_exit_events.py after processing each event.
    """
    try:
        if event_type == 'contract_signed':
            send_contract_signed_email(job_data, job_id)
        elif event_type == 'invoice':
            send_invoice_acknowledged_email(job_data, job_id)
        elif event_type == 'payment_1':
            send_payment_1_receipt_email(job_data, job_id)
        elif event_type == 'balance':
            send_balance_acknowledged_email(job_data, job_id)
        elif event_type == 'payment_2':
            send_payment_2_receipt_email(job_data, job_id)
        else:
            # No email for logged_in or other events
            pass
    except Exception as e:
        # Log error but don't fail the workflow
        print(f"❌ Email dispatch failed for {event_type}: {e}")
```

---

### Step 5: Integrate into User Exit Events

**File**: `.github/scripts/orchestration/user_exit_events.py`

Add email dispatch after processing each event:

```python
# At the top, add import
import sys
sys.path.append('.github/scripts/utils')
from email_dispatcher import dispatch_email_for_event

# After processing each event and updating JSON:
for event in events:
    event_type = event.get('type')
    
    # ... existing event processing code ...
    
    # NEW: Send email for this event
    dispatch_email_for_event(event_type, job_data, job_id)
```

---

### Step 6: Update Workflow Dependencies

**File**: `.github/workflows/user-exit-events.yml`

```yaml
- name: Install dependencies
  run: |
    pip install stripe pypdf reportlab google-api-python-client google-auth-httplib2 google-auth-oauthlib

- name: Process events
  env:
    JOB_ID: ${{ github.event.inputs.job_id }}
    PAYLOAD_JSON: ${{ github.event.inputs.payload_json }}
    STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
    GOOGLE_CREDENTIALS: ${{ secrets.GOOGLE_CREDENTIALS }}
    GMAIL_SENDER_EMAIL: sean@august.style
  run: |
    python .github/scripts/orchestration/user_exit_events.py
```

---

## OAuth Re-authorization

### Steps to Add Gmail Scope

1. **Update `api/google/auth.js`** to include `gmail.send` scope
2. **Run OAuth flow locally**:
   ```bash
   npm run dev
   # Visit http://localhost:5173/api/google/auth
   # Complete OAuth consent
   ```
3. **Copy new refresh token** from callback
4. **Update GitHub Secret** `GOOGLE_CREDENTIALS` with new token

### Gmail API Consent Screen Notes

- Gmail API requires OAuth consent screen verification for sending to external users
- For low volume (< 100 emails/day), can use "Testing" mode initially
- May need to verify app if sending to many external addresses

---

## Testing Checklist

### Email Sending
- [ ] Gmail API credentials work with new scope
- [ ] `send_email()` successfully sends test email
- [ ] Attachments are included correctly
- [ ] CC works for freelancer copies

### Template Rendering
- [ ] `replace_placeholders()` handles all token types
- [ ] Currency formatting works correctly
- [ ] Missing values don't break templates

### Event Integration
- [ ] `contract_signed` triggers email with signed PDF
- [ ] `invoice` triggers email with invoice PDF
- [ ] `payment_1` triggers receipt email (no attachments)
- [ ] `balance` triggers email with balance PDF
- [ ] `payment_2` triggers email with all PDFs

### Error Handling
- [ ] Missing customer email handled gracefully
- [ ] Missing PDF files don't crash workflow
- [ ] Email failures logged but don't fail workflow

---

## File Changes Summary

| File | Change |
|------|--------|
| `api/google/auth.js` | Add `gmail.send` scope |
| `.github/workflows/user-exit-events.yml` | Add Google API dependencies, env vars |
| `.github/scripts/utils/email_sender.py` | NEW: Gmail API email utility |
| `.github/scripts/utils/email_templates.py` | NEW: Email templates |
| `.github/scripts/utils/email_dispatcher.py` | NEW: Event-to-email dispatcher |
| `.github/scripts/orchestration/user_exit_events.py` | Import and call email dispatcher |

---

## Dependencies

### Python (GitHub Actions)
```
google-api-python-client>=2.0.0
google-auth-httplib2>=0.1.0
google-auth-oauthlib>=1.0.0
```

---

## Security Considerations

### Email Address Validation
- Only send to addresses from job JSON (trusted source)
- Log all email sends for audit trail

### Attachment Security
- Only attach PDFs from known paths in repo
- Validate file exists before attaching

### API Keys
- `GOOGLE_CREDENTIALS` stored in GitHub Secrets
- Never logged or exposed in workflow output

---

## Next Steps

1. **Update OAuth** — Add `gmail.send` scope, re-authorize
2. **Create utility files** — `email_sender.py`, `email_templates.py`, `email_dispatcher.py`
3. **Update workflow** — Add dependencies and env vars
4. **Integrate** — Add email dispatch to `user_exit_events.py`
5. **Test** — Send test emails, verify attachments
6. **Deploy** — Push changes, monitor email delivery

---

_This document provides a complete implementation plan for automated email delivery. Emails are sent via Gmail API using existing Google OAuth credentials, triggered by the same events that update JSON state._
