#!/usr/bin/env python3
"""
PDF Generation Script (v4 schema)
Generates contract and invoice PDFs from Google Docs templates using OAuth authentication.

Process:
1. Authenticate with Google using OAuth (or Service Account fallback)
2. For each job needing PDFs:
   - Copy Google Doc template
   - Replace placeholders using Docs API batchUpdate
   - Export as PDF
   - Calculate SHA256 hash
   - Save PDF to repo (assets/pdf/contract/kon-{job_id}.pdf or assets/pdf/invoice/inv-{job_id}.pdf)
   - Delete temporary Google Doc
   - Update job JSON with docs.contract and docs.invoice fields
3. Return stats

v4 Schema:
- Uses flattened structure: product, customer, price1, price2, coupon
- No metadata nesting
- docs.contract and docs.invoice store PDF metadata

Usage:
    python3 generate_pdfs.py --jobs-dir "assets/jobs"

Returns (stdout):
    {"contracts_generated": 2, "invoices_generated": 2, "errors": []}

Exit codes:
    0 = Success
    1 = Validation error
    2 = Google API error
"""

import sys
import json
import argparse
import os
import hashlib
from pathlib import Path
from datetime import datetime, UTC

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.json_io import list_all_jobs, save_job, find_job_file

# Import Google APIs
try:
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseDownload
    import io
except ImportError:
    print(json.dumps({"error": "Google libraries not installed. Run: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client"}), file=sys.stderr)
    sys.exit(2)


# OAuth scopes required
SCOPES = [
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive'  # Full drive scope needed to access shared template files
]


def authenticate_google():
    """
    Authenticate with Google using OAuth refresh token (OAuth-only authentication).
    
    Returns:
        Authenticated service objects (drive_service, docs_service)
    """
    refresh_token = os.getenv('GOOGLE_REFRESH_TOKEN')
    client_id = os.getenv('GOOGLE_CLIENT_ID')
    client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
    
    if not (refresh_token and client_id and client_secret):
        raise ValueError("GOOGLE_REFRESH_TOKEN, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET environment variables must be set")
    
    try:
        from google.oauth2.credentials import Credentials
        
        # Create credentials from refresh token
        creds = Credentials(
            token=None,  # Will be refreshed automatically
            refresh_token=refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=client_id,
            client_secret=client_secret,
            scopes=SCOPES
        )
        
        # Refresh the access token (required before first use)
        creds.refresh(Request())
        
        drive_service = build('drive', 'v3', credentials=creds)
        docs_service = build('docs', 'v1', credentials=creds)
        print("DEBUG: Using OAuth refresh token authentication", file=sys.stderr)
        return drive_service, docs_service
    except Exception as e:
        raise ValueError(f"OAuth authentication failed: {e}. Ensure refresh token is valid and template files are shared with the OAuth user account.")


def format_address(address: dict) -> str:
    """Format address dict to string: 'line1, city, state postal_code'"""
    parts = []
    if address.get('line1'):
        parts.append(address['line1'])
    if address.get('city'):
        parts.append(address['city'])
    if address.get('state') and address.get('postal_code'):
        parts.append(f"{address['state']} {address['postal_code']}")
    return ', '.join(parts)


def format_date(iso_string: str) -> str:
    """Format ISO date string to 'Month D, YYYY'"""
    if not iso_string:
        return ''
    try:
        dt = datetime.fromisoformat(iso_string.replace('Z', '+00:00'))
        return dt.strftime('%B %d, %Y')
    except:
        return iso_string


def format_currency(cents: int) -> str:
    """Format cents to currency string: '$X,XXX.XX'"""
    if cents is None:
        return '$0.00'
    dollars = cents / 100.0
    return f"${dollars:,.2f}"


def format_payment_terms(job_data: dict) -> str:
    """Format payment terms as multi-line string"""
    lines = []
    price1 = job_data.get('price1', {})
    price2 = job_data.get('price2', {})
    
    if price1.get('unit_amount'):
        pay_by = price1.get('pay_by', 'start of work')
        amount = format_currency(price1['unit_amount'])
        lines.append(f"Payment 1 ({pay_by}): {amount}")
    
    if price2.get('unit_amount'):
        pay_by = price2.get('pay_by', 'before project launch')
        amount = format_currency(price2['unit_amount'])
        days = price2.get('pay_days', 14)
        late_fee = price2.get('late_fee', '$100')
        lines.append(f"Payment 2 ({pay_by}): {amount}")
        lines.append(f"Payment due within {days} days. Late fee: {late_fee}")
    
    return '\n'.join(lines)


def calculate_amount_due(job_data: dict) -> str:
    """Calculate amount due based on payment state"""
    state = job_data.get('state', {})
    payment_1 = state.get('payment_1', {})
    payment_2 = state.get('payment_2', {})
    product = job_data.get('product', {})
    price1 = job_data.get('price1', {})
    price2 = job_data.get('price2', {})
    
    # If payment_1 not succeeded, amount_due is price1
    if not payment_1.get('succeeded'):
        return format_currency(price1.get('unit_amount', 0))
    
    # If payment_1 succeeded and total_payments is 1, amount_due is 0
    if product.get('total_payments') == 1:
        return '$0.00'
    
    # If payment_1 succeeded and total_payments is 2, amount_due is price2
    if product.get('total_payments') == 2:
        if not payment_2.get('succeeded'):
            return format_currency(price2.get('unit_amount', 0))
        return '$0.00'
    
    return '$0.00'


def calculate_amount_paid(job_data: dict) -> str:
    """Calculate amount paid based on payment state"""
    state = job_data.get('state', {})
    payment_1 = state.get('payment_1', {})
    payment_2 = state.get('payment_2', {})
    price1 = job_data.get('price1', {})
    price2 = job_data.get('price2', {})
    
    total = 0
    if payment_1.get('succeeded'):
        total += price1.get('unit_amount', 0)
    if payment_2.get('succeeded'):
        total += price2.get('unit_amount', 0)
    
    return format_currency(total)


def calculate_sha256(pdf_bytes: bytes) -> str:
    """Calculate SHA256 hash of PDF bytes"""
    return hashlib.sha256(pdf_bytes).hexdigest()


def replace_placeholders(docs_service, document_id: str, replacements: dict):
    """Replace placeholders in Google Doc using batchUpdate"""
    requests = []
    
    for placeholder, value in replacements.items():
        requests.append({
            'replaceAllText': {
                'containsText': {
                    'text': placeholder,
                    'matchCase': False
                },
                'replaceText': str(value) if value is not None else ''
            }
        })
    
    if requests:
        docs_service.documents().batchUpdate(
            documentId=document_id,
            body={'requests': requests}
        ).execute()


def generate_contract_pdf(drive_service, docs_service, job_data: dict, template_id: str) -> dict:
    """Generate contract PDF from template"""
    job_id = job_data.get('product', {}).get('id', 'unknown')
    
    # Debug: Log template access attempt
    print(f"DEBUG: Attempting to copy template {template_id[:10]}...{template_id[-10:] if len(template_id) > 20 else template_id}", file=sys.stderr)
    
    # Copy template (supportsAllDrives=true for shared drives)
    try:
        copy_response = drive_service.files().copy(
            fileId=template_id,
            body={'name': f'Contract-{job_id}-{int(datetime.now(UTC).timestamp())}'},
            supportsAllDrives=True  # Required for shared drives/files
        ).execute()
        new_doc_id = copy_response['id']
        print(f"DEBUG: Successfully copied template, new doc ID: {new_doc_id}", file=sys.stderr)
    except Exception as e:
        print(f"DEBUG: Copy failed for template {template_id[:10]}...{template_id[-10:] if len(template_id) > 20 else template_id}: {type(e).__name__}: {str(e)}", file=sys.stderr)
        raise
    
    try:
        # Prepare placeholder replacements (v4 schema)
        product = job_data.get('product', {})
        customer = job_data.get('customer', {})
        contract = job_data.get('contract', {})
        price1 = job_data.get('price1', {})
        price2 = job_data.get('price2', {})
        
        replacements = {
            '{{docs.contract.id}}': f'kon-{job_id}',
            '{{docs.contract.created}}': datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
            '{{contract.work_start}}': format_date(contract.get('work_start')),
            '{{contract.work_end}}': format_date(contract.get('work_end')),
            '{{project}}': job_data.get('project', ''),
            '{{customer.business}}': customer.get('business', ''),
            '{{customer.name}}': customer.get('name', ''),
            '{{customer.title}}': customer.get('title', ''),
            '{{address.line1}}': customer.get('address', {}).get('line1', ''),
            '{{city}}': customer.get('address', {}).get('city', ''),
            '{{state}}': customer.get('address', {}).get('state', ''),
            '{{postal_code}}': customer.get('address', {}).get('postal_code', ''),
            '{{customer.email}}': customer.get('email', ''),
            '{{customer.phone}}': customer.get('phone', ''),
            '{{price1.nickname}}': price1.get('nickname', 'Initial Payment'),
            '{{price2.nickname}}': price2.get('nickname', 'Final Payment'),
            '{{price1.pay_by}}': price1.get('pay_by', 'start of work'),
            '{{price2.pay_by}}': price2.get('pay_by', 'before project launch'),
            '{{price1.unit_amount}}': format_currency(price1.get('unit_amount', 0)),
            '{{price2.unit_amount}}': format_currency(price2.get('unit_amount', 0)),
            '{{subtotal}}': format_currency((price1.get('unit_amount', 0) + price2.get('unit_amount', 0))),
            '{{amount_off}}': format_currency(job_data.get('coupon', {}).get('amount_off', 0)),
            '{{total}}': format_currency((price1.get('unit_amount', 0) + price2.get('unit_amount', 0)) - job_data.get('coupon', {}).get('amount_off', 0)),
            '{{amount_due}}': calculate_amount_due(job_data),
            '{{amount_paid}}': calculate_amount_paid(job_data),
            '{{contract.legal_jurisdiction}}': contract.get('legal_jurisdiction', ''),
            '{{contract.maintenance_period_months}}': str(contract.get('maintenance_period_months', 3)),
            '{{contract.maintenance_monthly_fee}}': format_currency(contract.get('maintenance_monthly_fee', 0)),
            '{{project_scope_summary}}': job_data.get('project_scope_summary', ''),
            '{{project_scope_full}}': job_data.get('project_scope_full', '')
        }
        
        # Replace placeholders
        replace_placeholders(docs_service, new_doc_id, replacements)
        
        # Export as PDF
        pdf_response = drive_service.files().export_media(
            fileId=new_doc_id,
            mimeType='application/pdf'
        )
        
        pdf_bytes = io.BytesIO()
        downloader = MediaIoBaseDownload(pdf_bytes, pdf_response)
        done = False
        while not done:
            status, done = downloader.next_chunk()
        
        pdf_bytes.seek(0)
        pdf_content = pdf_bytes.read()
        
        # Calculate SHA256
        sha256 = calculate_sha256(pdf_content)
        
        return {
            'pdf_bytes': pdf_content,
            'sha256': sha256,
            'doc_id': new_doc_id
        }
    finally:
        # Delete temporary Google Doc
        try:
            drive_service.files().delete(fileId=new_doc_id).execute()
        except:
            pass  # Ignore deletion errors


def generate_invoice_pdf(drive_service, docs_service, job_data: dict, template_id: str) -> dict:
    """Generate invoice PDF from template (similar to contract)"""
    job_id = job_data.get('product', {}).get('id', 'unknown')
    
    # Debug: Log template access attempt
    print(f"DEBUG: Attempting to copy template {template_id[:10]}...{template_id[-10:] if len(template_id) > 20 else template_id}", file=sys.stderr)
    
    # Copy template (supportsAllDrives=true for shared drives)
    try:
        copy_response = drive_service.files().copy(
            fileId=template_id,
            body={'name': f'Invoice-{job_id}-{int(datetime.now(UTC).timestamp())}'},
            supportsAllDrives=True  # Required for shared drives/files
        ).execute()
        new_doc_id = copy_response['id']
        print(f"DEBUG: Successfully copied template, new doc ID: {new_doc_id}", file=sys.stderr)
    except Exception as e:
        print(f"DEBUG: Copy failed for template {template_id[:10]}...{template_id[-10:] if len(template_id) > 20 else template_id}: {type(e).__name__}: {str(e)}", file=sys.stderr)
        raise
    
    try:
        # Prepare placeholder replacements (v4 schema)
        product = job_data.get('product', {})
        customer = job_data.get('customer', {})
        price1 = job_data.get('price1', {})
        price2 = job_data.get('price2', {})
        
        replacements = {
            '{{docs.invoice.id}}': f'inv-{job_id}',
            '{{docs.invoice.created}}': datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
            '{{contract.work_start}}': format_date(job_data.get('contract', {}).get('work_start')),
            '{{contract.work_end}}': format_date(job_data.get('contract', {}).get('work_end')),
            '{{project}}': job_data.get('project', ''),
            '{{amount_due}}': calculate_amount_due(job_data),
            '{{customer.business}}': customer.get('business', ''),
            '{{customer.name}}': customer.get('name', ''),
            '{{customer.title}}': customer.get('title', ''),
            '{{address.line1}}': customer.get('address', {}).get('line1', ''),
            '{{city}}': customer.get('address', {}).get('city', ''),
            '{{state}}': customer.get('address', {}).get('state', ''),
            '{{postal_code}}': customer.get('address', {}).get('postal_code', ''),
            '{{customer.email}}': customer.get('email', ''),
            '{{customer.phone}}': customer.get('phone', ''),
            '{{price1.nickname}}': price1.get('nickname', 'Initial Payment'),
            '{{price2.nickname}}': price2.get('nickname', 'Final Payment'),
            '{{price1.pay_by}}': price1.get('pay_by', 'start of work'),
            '{{price2.pay_by}}': price2.get('pay_by', 'before project launch'),
            '{{price1.unit_amount}}': format_currency(price1.get('unit_amount', 0)),
            '{{price2.unit_amount}}': format_currency(price2.get('unit_amount', 0)),
            '{{subtotal}}': format_currency((price1.get('unit_amount', 0) + price2.get('unit_amount', 0))),
            '{{amount_off}}': format_currency(job_data.get('coupon', {}).get('amount_off', 0)),
            '{{total}}': format_currency((price1.get('unit_amount', 0) + price2.get('unit_amount', 0)) - job_data.get('coupon', {}).get('amount_off', 0)),
            '{{amount_paid}}': calculate_amount_paid(job_data)
        }
        
        # Replace placeholders
        replace_placeholders(docs_service, new_doc_id, replacements)
        
        # Export as PDF
        pdf_response = drive_service.files().export_media(
            fileId=new_doc_id,
            mimeType='application/pdf'
        )
        
        pdf_bytes = io.BytesIO()
        downloader = MediaIoBaseDownload(pdf_bytes, pdf_response)
        done = False
        while not done:
            status, done = downloader.next_chunk()
        
        pdf_bytes.seek(0)
        pdf_content = pdf_bytes.read()
        
        # Calculate SHA256
        sha256 = calculate_sha256(pdf_content)
        
        return {
            'pdf_bytes': pdf_content,
            'sha256': sha256,
            'doc_id': new_doc_id
        }
    finally:
        # Delete temporary Google Doc
        try:
            drive_service.files().delete(fileId=new_doc_id).execute()
        except:
            pass  # Ignore deletion errors


def generate_pdfs(jobs_dir: str = "assets/jobs") -> dict:
    """
    Generate PDFs for all jobs that need them.
    
    Args:
        jobs_dir: Directory containing job JSON files
    
    Returns:
        Dictionary with generation stats
    """
    # Authenticate with Google
    try:
        drive_service, docs_service = authenticate_google()
    except Exception as e:
        return {
            "contracts_generated": 0,
            "invoices_generated": 0,
            "errors": [f"Authentication failed: {str(e)}"]
        }
    
    # Get template IDs from environment
    contract_template_id = os.getenv('GOOGLE_TEMPLATE_CONTRACT_ID', '').strip()
    invoice_template_id = os.getenv('GOOGLE_TEMPLATE_INVOICE_ID', '').strip()
    
    if not contract_template_id or not invoice_template_id:
        return {
            "contracts_generated": 0,
            "invoices_generated": 0,
            "errors": ["GOOGLE_TEMPLATE_CONTRACT_ID or GOOGLE_TEMPLATE_INVOICE_ID not set"]
        }
    
    # Debug: Log template IDs (first/last few chars only for security)
    print(f"DEBUG: Contract template ID: {contract_template_id[:10]}...{contract_template_id[-10:] if len(contract_template_id) > 20 else contract_template_id}", file=sys.stderr)
    print(f"DEBUG: Invoice template ID: {invoice_template_id[:10]}...{invoice_template_id[-10:] if len(invoice_template_id) > 20 else invoice_template_id}", file=sys.stderr)
    
    # Get project root for resolving paths
    utils_dir = Path(__file__).parent.parent  # .github/scripts
    github_dir = utils_dir.parent  # .github
    project_root = github_dir.parent  # project root
    
    # Create PDF directories
    contract_dir = project_root / 'assets' / 'pdf' / 'contract'
    invoice_dir = project_root / 'assets' / 'pdf' / 'invoice'
    contract_dir.mkdir(parents=True, exist_ok=True)
    invoice_dir.mkdir(parents=True, exist_ok=True)
    
    # Load all jobs
    jobs = list_all_jobs(jobs_dir)
    
    stats = {
        "contracts_generated": 0,
        "invoices_generated": 0,
        "errors": []
    }
    
    for job_data in jobs:
        job_id = job_data.get('product', {}).get('id')
        if not job_id:
            stats['errors'].append(f"Job missing product.id")
            continue
        
        # Initialize docs if missing
        if 'docs' not in job_data:
            job_data['docs'] = {}
        if 'contract' not in job_data['docs']:
            job_data['docs']['contract'] = {}
        if 'invoice' not in job_data['docs']:
            job_data['docs']['invoice'] = {}
        
        # Generate contract PDF (only called for new jobs, so no idempotency check needed)
        # Simple file existence check to avoid overwriting if script retries
        pdf_filename = f'kon-{job_id}.pdf'
        pdf_path = contract_dir / pdf_filename
        if not pdf_path.exists():
            try:
                result = generate_contract_pdf(drive_service, docs_service, job_data, contract_template_id)
                
                # Save PDF to repo
                with open(pdf_path, 'wb') as f:
                    f.write(result['pdf_bytes'])
                
                # Update job JSON
                job_data['docs']['contract'] = {
                    'id': f'kon-{job_id}',
                    'pdf': f'assets/pdf/contract/{pdf_filename}',
                    'file_id': result['doc_id'],
                    'url': f'https://payments.august.style/assets/pdf/contract/{pdf_filename}',
                    'sha256': result['sha256'],
                    'created': datetime.now(UTC).isoformat().replace('+00:00', 'Z')
                }
                
                stats['contracts_generated'] += 1
            except Exception as e:
                stats['errors'].append(f"Contract PDF generation failed for {job_id}: {str(e)}")
        
        # Generate invoice PDF (only called for new jobs, so no idempotency check needed)
        # Simple file existence check to avoid overwriting if script retries
        pdf_filename = f'inv-{job_id}.pdf'
        pdf_path = invoice_dir / pdf_filename
        if not pdf_path.exists():
            try:
                result = generate_invoice_pdf(drive_service, docs_service, job_data, invoice_template_id)
                
                # Save PDF to repo
                with open(pdf_path, 'wb') as f:
                    f.write(result['pdf_bytes'])
                
                # Update job JSON
                job_data['docs']['invoice'] = {
                    'id': f'inv-{job_id}',
                    'pdf': f'assets/pdf/invoice/{pdf_filename}',
                    'file_id': result['doc_id'],
                    'url': f'https://payments.august.style/assets/pdf/invoice/{pdf_filename}',
                    'sha256': result['sha256'],
                    'created': datetime.now(UTC).isoformat().replace('+00:00', 'Z')
                }
                
                stats['invoices_generated'] += 1
            except Exception as e:
                stats['errors'].append(f"Invoice PDF generation failed for {job_id}: {str(e)}")
        
        # Save updated job JSON
        try:
            save_job(job_id, job_data, jobs_dir)
        except Exception as e:
            stats['errors'].append(f"Failed to save job JSON for {job_id}: {str(e)}")
    
    return stats


def main():
    """Main execution"""
    parser = argparse.ArgumentParser(description="Generate PDFs from Google Docs templates")
    parser.add_argument('--jobs-dir', default='assets/jobs', help='Directory containing job JSON files')
    
    args = parser.parse_args()
    
    try:
        stats = generate_pdfs(args.jobs_dir)
        print(json.dumps(stats, indent=2))
        
        if stats['errors']:
            sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    main()
