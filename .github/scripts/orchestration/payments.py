#!/usr/bin/env python3
"""
Payment Workflow - TRIGGER=payment (Steps 1-14)

When: Payment completes (Stripe webhook)
Behavior: Starts immediately when webhook received

Flow:
1. Webhook event arrives (already received by API)
2. Update payment status in JSON
3. Compare JSONs to catalog (8-step matching logic)
4-11. (Handled in 8-step sync)
12. Create manifest
13. Build pages (logged, actual build happens in separate workflow)
14. Deploy (commit and push)

Usage:
    python3 payments.py --job-id "uid-001" --payload '{"payment_number":1,"succeeded":"2026-01-04T..."}'

Exit codes:
    0 = Success
    1 = Validation error
    2 = Git/File error
"""

import sys
import json
import subprocess
import os
import argparse
from pathlib import Path
from datetime import datetime, UTC
from typing import Dict, Optional

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.json_io import list_all_jobs, save_job, delete_job, load_job

# Import Stripe
try:
    import stripe
except ImportError:
    print(json.dumps({"error": "Stripe library not installed. Run: pip install stripe"}), file=sys.stderr)
    sys.exit(2)

# Import Google APIs
try:
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseDownload
    import io
except ImportError:
    print(json.dumps({"error": "Google libraries not installed. Run: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client"}), file=sys.stderr)
    sys.exit(2)


# ============================================================================
# STRIPE HELPER FUNCTIONS
# ============================================================================

def create_stripe_product(product: dict, job_id: str) -> str:
    """Create Stripe Product. Returns product_id."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    if not stripe.api_key:
        raise ValueError("STRIPE_SECRET_KEY environment variable not set")

    product_params = {
        'name': product.get('name', f'Job {job_id}'),
        'active': product.get('active', True),
        'type': product.get('type', 'service'),
        'metadata': {}
    }

    if product.get('description'):
        product_params['description'] = product['description']

    if product.get('unit_label'):
        product_params['unit_label'] = product['unit_label']

    try:
        stripe_product = stripe.Product.create(id=product.get('id'), **product_params)
    except stripe.error.InvalidRequestError:
        stripe_product = stripe.Product.create(**product_params)

    return stripe_product.id


def check_stripe_product_exists(product_id: str) -> bool:
    """Check if a Stripe product exists."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    try:
        product = stripe.Product.retrieve(product_id)
        return product is not None
    except stripe.error.InvalidRequestError:
        return False
    except Exception as e:
        print(f"Warning: Error checking product {product_id}: {e}", file=sys.stderr)
        return False


def get_stripe_product_active(product_id: str) -> bool:
    """Get active status of Stripe product."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    try:
        product = stripe.Product.retrieve(product_id)
        return product.active
    except Exception:
        return False


def archive_stripe_product(product_id: str) -> None:
    """Archive Stripe Product (set active=false)."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    stripe.Product.modify(product_id, active=False)


def create_stripe_price(price_obj: dict, product_id: str) -> str:
    """Create Stripe Price. Returns price_id."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    price_params = {
        'product': product_id,
        'unit_amount': price_obj.get('unit_amount'),
        'currency': price_obj.get('currency', 'usd').lower(),
        'active': price_obj.get('active', True),
        'billing_scheme': price_obj.get('billing_scheme', 'per_unit'),
        'metadata': {}
    }

    if price_obj.get('nickname'):
        price_params['nickname'] = price_obj['nickname']

    if price_obj.get('id'):
        price_params['lookup_key'] = price_obj['id']

    price = stripe.Price.create(**price_params)
    return price.id


def create_stripe_customer(customer: dict) -> str:
    """Create Stripe Customer. Returns customer.id."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    customer_params = {
        'name': customer.get('name') or customer.get('business'),
        'email': customer.get('email'),
        'phone': customer.get('phone'),
        'metadata': {}
    }

    if customer.get('title'):
        customer_params['metadata']['title'] = customer['title']

    if customer.get('address'):
        customer_params['address'] = {
            'line1': customer['address'].get('line1'),
            'city': customer['address'].get('city'),
            'state': customer['address'].get('state'),
            'postal_code': customer['address'].get('postal_code'),
            'country': customer['address'].get('country', 'US')
        }

    customer_id = customer.get('id')
    if customer_id and not customer_id.startswith('cus-'):
        customer_id = f'cus-{customer_id}'
    
    try:
        customer = stripe.Customer.create(id=customer_id, **customer_params)
    except stripe.error.InvalidRequestError:
        customer = stripe.Customer.create(**customer_params)

    return customer.id


def create_stripe_coupon(coupon: dict) -> str:
    """Create Stripe Coupon. Returns coupon_id."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    coupon_id = coupon.get('id')
    if coupon_id and not coupon_id.startswith('cou-'):
        coupon_id = f'cou-{coupon_id}'

    coupon_params = {
        'id': coupon_id,
        'amount_off': coupon.get('amount_off'),
        'currency': coupon.get('currency', 'usd').lower(),
        'duration': coupon.get('duration', 'once'),
        'max_redemptions': coupon.get('max_redemptions', 1)
    }

    if coupon.get('name'):
        coupon_params['name'] = coupon['name']

    if coupon.get('applies_to'):
        coupon_params['applies_to'] = coupon['applies_to']

    coupon = stripe.Coupon.create(**coupon_params)
    return coupon.id


def load_manifest(manifest_path: str) -> dict:
    """Load manifest.json and return jobs dict."""
    manifest_file = Path(manifest_path)
    if not manifest_file.exists():
        return {}
    
    try:
        with open(manifest_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('jobs', {})
    except Exception as e:
        print(f"Warning: Failed to load manifest: {e}", file=sys.stderr)
        return {}


def get_manifest_job_ids(manifest: dict) -> set:
    """Extract job_ids from manifest (handles both old and new formats)."""
    job_ids = set()
    for lookup_key, entry in manifest.items():
        if isinstance(entry, dict):
            job_id = entry.get('job_id')
            if job_id:
                job_ids.add(job_id)
        elif isinstance(entry, str):
            file_path = Path(entry)
            if file_path.suffix == '.json':
                job_id = file_path.stem
                job_ids.add(job_id)
    return job_ids


def create_stripe_objects_for_job(job_data: dict, job_id: str) -> dict:
    """Create all Stripe objects for a new job. Returns stats."""
    stats = {
        'products_created': 0,
        'prices_created': 0,
        'customers_created': 0,
        'coupons_created': 0
    }
    
    product = job_data.get('product', {})
    if 'state' not in job_data:
        job_data['state'] = {}
    if 'objects' not in job_data['state']:
        job_data['state']['objects'] = {}
    
    state_objects = job_data['state']['objects']
    
    # Create product
    product_id = create_stripe_product(product, job_id)
    stats['products_created'] = 1
    state_objects['product'] = product_id
    state_objects['created'] = datetime.now(UTC).isoformat().replace('+00:00', 'Z')
    
    # Create customer
    customer = job_data.get('customer')
    if customer:
        customer_id = create_stripe_customer(customer)
        stats['customers_created'] = 1
        state_objects['customer'] = customer_id
    
    # Create prices
    price1 = job_data.get('price1')
    price2 = job_data.get('price2')
    
    if price1 and price1.get('active', True) and price1.get('unit_amount') is not None:
        price_1_id = create_stripe_price(price1, product_id)
        stats['prices_created'] += 1
        state_objects['price_1'] = price_1_id
        price1['id'] = price_1_id
    
    if price2 and price2.get('active', True) and price2.get('unit_amount') is not None:
        price_2_id = create_stripe_price(price2, product_id)
        stats['prices_created'] += 1
        state_objects['price_2'] = price_2_id
        price2['id'] = price_2_id
    
    # Create coupon
    coupon = job_data.get('coupon')
    if coupon and coupon.get('amount_off', 0) > 0:
        coupon_id = create_stripe_coupon(coupon)
        stats['coupons_created'] = 1
        state_objects['coupon'] = coupon_id
    
    # Update checkout session parameters
    if job_data.get('checkout_session_1') and state_objects.get('price_1'):
        checkout_session_1 = job_data['checkout_session_1']
        if 'line_items' in checkout_session_1 and len(checkout_session_1['line_items']) > 0:
            checkout_session_1['line_items'][0]['price'] = state_objects['price_1']
        if state_objects.get('coupon') and 'discounts' in checkout_session_1 and checkout_session_1['discounts']:
            if len(checkout_session_1['discounts']) > 0:
                checkout_session_1['discounts'][0]['coupon'] = state_objects['coupon']
    
    if job_data.get('checkout_session_2') and state_objects.get('price_2'):
        checkout_session_2 = job_data['checkout_session_2']
        if 'line_items' in checkout_session_2 and len(checkout_session_2['line_items']) > 0:
            checkout_session_2['line_items'][0]['price'] = state_objects['price_2']
    
    return stats


# ============================================================================
# 8-STEP MATCHING LOGIC
# ============================================================================

def execute_8_step_sync(jobs_dir: str, manifest_path: str, trigger_category: str = 'payment') -> dict:
    """Execute the 8-step matching logic inline with explicit step-by-step logging.
    For payment workflow, steps are numbered 3-11 (not 1-9).
    """
    stats = {
        'products_created': 0,
        'products_archived': 0,
        'jobs_deleted': 0
    }
    
    # Step 3: Compare JSONs to catalog
    print(f"[TRIGGER={trigger_category}] Step 3: Comparing JSONs to catalog", file=sys.stderr)
    
    # Load all JSON files from directory (source of truth)
    all_jobs = list_all_jobs(jobs_dir)
    json_job_ids = set()
    jobs_by_id = {}
    for job_data in all_jobs:
        product = job_data.get('product', {})
        job_id = product.get('id')
        if job_id:
            json_job_ids.add(job_id)
            jobs_by_id[job_id] = job_data
    
    print(f"[TRIGGER={trigger_category}] Step 3: Found {len(json_job_ids)} JSON file(s) in directory", file=sys.stderr)
    
    # Get Stripe catalog job_ids (products that exist in Stripe) - direct API check
    stripe_job_ids = set()
    stripe_active_status = {}  # Cache active status to avoid duplicate API calls
    all_potential_job_ids = json_job_ids.copy()
    
    # Also check manifest for any orphaned Stripe products
    manifest = load_manifest(manifest_path)
    manifest_job_ids = get_manifest_job_ids(manifest)
    all_potential_job_ids.update(manifest_job_ids)
    
    print(f"[TRIGGER={trigger_category}] Step 3: Checking Stripe catalog for {len(all_potential_job_ids)} potential product(s)", file=sys.stderr)
    
    for job_id in all_potential_job_ids:
        if check_stripe_product_exists(job_id):
            stripe_job_ids.add(job_id)
            stripe_active_status[job_id] = get_stripe_product_active(job_id)
    
    print(f"[TRIGGER={trigger_category}] Step 3: Found {len(stripe_job_ids)} product(s) in Stripe catalog", file=sys.stderr)
    
    # Initialize action lists
    jobs_to_create = []
    jobs_to_delete_no_stripe = []
    jobs_to_archive_orphaned = []
    jobs_to_delete_mismatch = []
    jobs_to_archive_and_delete = []
    jobs_ignored = []
    
    # Step 4: Unmatched: JSON but no catalog, if json.active=true → create catalog object
    print(f"[TRIGGER={trigger_category}] Step 4: Checking unmatched JSONs (no catalog) with active=true", file=sys.stderr)
    unmatched_json = json_job_ids - stripe_job_ids
    for job_id in unmatched_json:
        job_data = jobs_by_id[job_id]
        product = job_data.get('product', {})
        json_active = product.get('active', True)
        if json_active:
            jobs_to_create.append(job_id)
            print(f"[TRIGGER={trigger_category}] Step 4: Will create Stripe objects for {job_id} (new active job)", file=sys.stderr)
        else:
            print(f"[TRIGGER={trigger_category}] Step 4: Skipping {job_id} (inactive, will be handled in Step 5)", file=sys.stderr)
    
    if not unmatched_json:
        print(f"[TRIGGER={trigger_category}] Step 4: No unmatched JSONs with active=true", file=sys.stderr)
    
    # Step 5: Unmatched: JSON but no catalog, if json.active=false → delete JSON
    print(f"[TRIGGER={trigger_category}] Step 5: Checking unmatched JSONs (no catalog) with active=false", file=sys.stderr)
    for job_id in unmatched_json:
        job_data = jobs_by_id[job_id]
        product = job_data.get('product', {})
        json_active = product.get('active', True)
        if not json_active:
            jobs_to_delete_no_stripe.append(job_id)
            print(f"[TRIGGER={trigger_category}] Step 5: Will delete {job_id} (inactive, no Stripe product)", file=sys.stderr)
    
    if not jobs_to_delete_no_stripe:
        print(f"[TRIGGER={trigger_category}] Step 5: No unmatched inactive JSONs to delete", file=sys.stderr)
    
    # Step 6: Unmatched: Catalog but no JSON, if catalog.active=true → modify catalog active=false
    print(f"[TRIGGER={trigger_category}] Step 6: Checking unmatched catalog products (no JSON) with active=true", file=sys.stderr)
    unmatched_catalog = stripe_job_ids - json_job_ids
    for job_id in unmatched_catalog:
        stripe_active = stripe_active_status.get(job_id, False)
        if stripe_active:
            jobs_to_archive_orphaned.append(job_id)
            print(f"[TRIGGER={trigger_category}] Step 6: Will archive {job_id} (orphaned, active in Stripe)", file=sys.stderr)
    
    if not jobs_to_archive_orphaned:
        print(f"[TRIGGER={trigger_category}] Step 6: No orphaned active products to archive", file=sys.stderr)
    
    # Step 7: Unmatched: Catalog but no JSON, if catalog.active=false → ignore
    print(f"[TRIGGER={trigger_category}] Step 7: Checking unmatched catalog products (no JSON) with active=false", file=sys.stderr)
    for job_id in unmatched_catalog:
        stripe_active = stripe_active_status.get(job_id, False)
        if not stripe_active:
            print(f"[TRIGGER={trigger_category}] Step 7: Ignoring {job_id} (orphaned, already inactive)", file=sys.stderr)
    
    if not unmatched_catalog:
        print(f"[TRIGGER={trigger_category}] Step 7: No orphaned inactive products to check", file=sys.stderr)
    
    # Step 8: Matched: catalog.active=false, json.active=true → delete JSON
    print(f"[TRIGGER={trigger_category}] Step 8: Checking matched products (catalog.active=false, json.active=true)", file=sys.stderr)
    matched_jobs = json_job_ids.intersection(stripe_job_ids)
    for job_id in matched_jobs:
        job_data = jobs_by_id[job_id]
        product = job_data.get('product', {})
        json_active = product.get('active', True)
        stripe_active = stripe_active_status.get(job_id, False)
        if not stripe_active and json_active:
            jobs_to_delete_mismatch.append(job_id)
            print(f"[TRIGGER={trigger_category}] Step 8: Will delete {job_id} (JSON active but Stripe inactive)", file=sys.stderr)
    
    if not jobs_to_delete_mismatch or not any(j in matched_jobs for j in jobs_to_delete_mismatch):
        print(f"[TRIGGER={trigger_category}] Step 8: No matched jobs with catalog.active=false and json.active=true", file=sys.stderr)
    
    # Step 9: Matched: catalog.active=false, json.active=false → delete JSON
    print(f"[TRIGGER={trigger_category}] Step 9: Checking matched products (catalog.active=false, json.active=false)", file=sys.stderr)
    for job_id in matched_jobs:
        if job_id in jobs_to_delete_mismatch:
            continue  # Already handled in Step 8
        job_data = jobs_by_id[job_id]
        product = job_data.get('product', {})
        json_active = product.get('active', True)
        stripe_active = stripe_active_status.get(job_id, False)
        if not stripe_active and not json_active:
            jobs_to_delete_mismatch.append(job_id)
            print(f"[TRIGGER={trigger_category}] Step 9: Will delete {job_id} (both inactive)", file=sys.stderr)
    
    if not any(j in matched_jobs and not stripe_active_status.get(j, False) and not jobs_by_id[j].get('product', {}).get('active', True) for j in matched_jobs if j not in jobs_to_delete_mismatch):
        print(f"[TRIGGER={trigger_category}] Step 9: No matched jobs with both inactive", file=sys.stderr)
    
    # Step 10: Matched: catalog.active=true, json.active=false → modify catalog to active=false, delete JSON
    print(f"[TRIGGER={trigger_category}] Step 10: Checking matched products (catalog.active=true, json.active=false)", file=sys.stderr)
    for job_id in matched_jobs:
        if job_id in jobs_to_delete_mismatch:
            continue  # Already handled
        job_data = jobs_by_id[job_id]
        product = job_data.get('product', {})
        json_active = product.get('active', True)
        stripe_active = stripe_active_status.get(job_id, False)
        if stripe_active and not json_active:
            jobs_to_archive_and_delete.append(job_id)
            print(f"[TRIGGER={trigger_category}] Step 10: Will archive and delete {job_id} (Stripe active but JSON inactive)", file=sys.stderr)
    
    if not jobs_to_archive_and_delete:
        print(f"[TRIGGER={trigger_category}] Step 10: No matched jobs with catalog.active=true and json.active=false", file=sys.stderr)
    
    # Step 11: Matched: catalog.active=true, json.active=true → ignore
    print(f"[TRIGGER={trigger_category}] Step 11: Checking matched products (catalog.active=true, json.active=true)", file=sys.stderr)
    for job_id in matched_jobs:
        if job_id in jobs_to_delete_mismatch or job_id in jobs_to_archive_and_delete:
            continue  # Already handled
        job_data = jobs_by_id[job_id]
        product = job_data.get('product', {})
        json_active = product.get('active', True)
        stripe_active = stripe_active_status.get(job_id, False)
        if stripe_active and json_active:
            jobs_ignored.append(job_id)
            print(f"[TRIGGER={trigger_category}] Step 11: Ignoring {job_id} (both active, already synced)", file=sys.stderr)
    
    if not jobs_ignored:
        print(f"[TRIGGER={trigger_category}] Step 11: No matched jobs with both active (or all handled in previous steps)", file=sys.stderr)
    
    # Execute actions
    
    # Archive orphaned products (Step 6)
    if jobs_to_archive_orphaned:
        print(f"[TRIGGER={trigger_category}] Executing Step 6 actions: Archiving {len(jobs_to_archive_orphaned)} orphaned product(s)", file=sys.stderr)
        for job_id in jobs_to_archive_orphaned:
            try:
                archive_stripe_product(job_id)
                stats['products_archived'] += 1
            except Exception as e:
                print(f"Warning: Failed to archive orphaned product {job_id}: {e}", file=sys.stderr)
    else:
        print(f"[TRIGGER={trigger_category}] Step 6: No actions to execute", file=sys.stderr)
    
    # Archive and delete (Step 10)
    if jobs_to_archive_and_delete:
        print(f"[TRIGGER={trigger_category}] Executing Step 10 actions: Archiving and deleting {len(jobs_to_archive_and_delete)} job(s)", file=sys.stderr)
        for job_id in jobs_to_archive_and_delete:
            try:
                archive_stripe_product(job_id)
                stats['products_archived'] += 1
                if delete_job(job_id, jobs_dir=jobs_dir):
                    stats['jobs_deleted'] += 1
            except Exception as e:
                print(f"Warning: Failed to archive/delete {job_id}: {e}", file=sys.stderr)
    else:
        print(f"[TRIGGER={trigger_category}] Step 10: No actions to execute", file=sys.stderr)
    
    # Delete JSONs (Steps 5, 8, 9)
    all_jobs_to_delete = set(jobs_to_delete_no_stripe + jobs_to_delete_mismatch)
    if all_jobs_to_delete:
        print(f"[TRIGGER={trigger_category}] Executing Steps 5/8/9 actions: Deleting {len(all_jobs_to_delete)} job file(s)", file=sys.stderr)
        for job_id in all_jobs_to_delete:
            try:
                if delete_job(job_id, jobs_dir=jobs_dir):
                    stats['jobs_deleted'] += 1
            except Exception as e:
                print(f"Warning: Failed to delete {job_id}: {e}", file=sys.stderr)
    else:
        print(f"[TRIGGER={trigger_category}] Steps 5/8/9: No actions to execute", file=sys.stderr)
    
    # Create Stripe objects (Step 4)
    if jobs_to_create:
        print(f"[TRIGGER={trigger_category}] Executing Step 4 actions: Creating Stripe objects for {len(jobs_to_create)} job(s)", file=sys.stderr)
        for job_id in jobs_to_create:
            try:
                job_data = jobs_by_id[job_id]
                create_stats = create_stripe_objects_for_job(job_data, job_id)
                stats['products_created'] += create_stats['products_created']
                # Save JSON with updated state.objects
                save_job(job_id, job_data, jobs_dir=jobs_dir)
                print(f"[TRIGGER={trigger_category}] Step 4: Created Stripe objects for {job_id}", file=sys.stderr)
            except Exception as e:
                print(f"Warning: Failed to create Stripe objects for {job_id}: {e}", file=sys.stderr)
    else:
        print(f"[TRIGGER={trigger_category}] Step 4: No actions to execute", file=sys.stderr)
    
    return stats



# ============================================================================
# STATE UPDATE FUNCTIONS
# ============================================================================

def update_contract_signing(job_data: dict, signature_data: dict) -> dict:
    """Update contract signing status (v4 schema)."""
    contract = job_data.get('contract', {})
    
    if 'signatures' not in contract:
        contract['signatures'] = {
            'contractor': {'legal_name': None, 'signed_date': None},
            'client': {'legal_name': None, 'signed_date': None}
        }
    
    if 'signatures' in signature_data:
        sigs = signature_data['signatures']
        
        if 'contractor' in sigs:
            contractor_sig = sigs['contractor']
            contract['signatures']['contractor']['legal_name'] = contractor_sig.get('legal_name')
            contract['signatures']['contractor']['signed_date'] = contractor_sig.get('signed_date')
        
        if 'client' in sigs:
            client_sig = sigs['client']
            contract['signatures']['client']['legal_name'] = client_sig.get('legal_name')
            contract['signatures']['client']['signed_date'] = client_sig.get('signed_date')
    
    job_data['contract'] = contract
    
    if 'state' not in job_data:
        job_data['state'] = {}
    if 'client_status' not in job_data['state']:
        job_data['state']['client_status'] = {}
    
    client_status = job_data['state']['client_status']
    signed_date = contract['signatures']['client'].get('signed_date') or datetime.now(UTC).isoformat().replace('+00:00', 'Z')
    client_status['signed_contract'] = signed_date
    
    return {
        'updated': True,
        'signed': contract['signatures']['client'].get('signed_date') is not None,
        'signed_date': signed_date
    }


def update_tracking_event(job_data: dict, event_data: dict) -> dict:
    """Update tracking event in client_status (v4 schema)."""
    event_type = event_data.get('event_type')
    timestamp = event_data.get('timestamp') or event_data.get('event_data', {}).get('timestamp') or datetime.now(UTC).isoformat().replace('+00:00', 'Z')
    
    if 'state' not in job_data:
        job_data['state'] = {}
    if 'client_status' not in job_data['state']:
        job_data['state']['client_status'] = {}
    
    client_status = job_data['state']['client_status']
    
    if event_type == 'contract_loaded':
        client_status['contract_loaded'] = timestamp
    elif event_type == 'contract_scrolled_complete':
        client_status['contract_scrolled_complete'] = True
    elif event_type == 'invoice_viewed':
        client_status['viewed_invoice'] = True
        if not client_status.get('viewed_contract'):
            client_status['viewed_contract'] = True
    elif event_type == 'document_downloaded':
        current_count = client_status.get('downloaded_docs', 0)
        client_status['downloaded_docs'] = current_count + 1
    elif event_type == 'contract_signed':
        client_status['signed_contract'] = timestamp
    
    return {
        'updated': True,
        'event_type': event_type,
        'timestamp': timestamp
    }



def update_payment_status(job_data: dict, payment_data: dict) -> dict:
    """Update payment status (v4 schema)."""
    payment_number = payment_data.get('payment_number')
    succeeded_timestamp = payment_data.get('succeeded')
    
    if not payment_number or payment_number not in [1, 2]:
        raise ValueError("payment_number must be 1 or 2")
    
    if 'state' not in job_data:
        job_data['state'] = {}
    
    if payment_number == 1:
        if 'payment_1' not in job_data['state']:
            job_data['state']['payment_1'] = {}
        
        payment_intent = job_data['state']['payment_1']
        if not payment_intent.get('intent'):
            payment_intent['intent'] = succeeded_timestamp or datetime.now(UTC).isoformat().replace('+00:00', 'Z')
        payment_intent['succeeded'] = succeeded_timestamp or datetime.now(UTC).isoformat().replace('+00:00', 'Z')
        
    elif payment_number == 2:
        if 'payment_2' not in job_data['state']:
            job_data['state']['payment_2'] = {}
        
        payment_intent = job_data['state']['payment_2']
        if not payment_intent.get('intent'):
            payment_intent['intent'] = succeeded_timestamp or datetime.now(UTC).isoformat().replace('+00:00', 'Z')
        payment_intent['succeeded'] = succeeded_timestamp or datetime.now(UTC).isoformat().replace('+00:00', 'Z')
    
    initial_paid = job_data['state'].get('payment_1', {}).get('succeeded') is not None
    balance_paid = job_data['state'].get('payment_2', {}).get('succeeded') is not None
    
    completed_payment_count = 0
    if initial_paid:
        completed_payment_count += 1
    if balance_paid:
        completed_payment_count += 1
    
    product = job_data.get('product', {})
    total_payments = product.get('total_payments', 2)
    
    all_paid = completed_payment_count >= total_payments
    
    if all_paid and product.get('active', True):
        product['active'] = False
        job_id = product.get('id', 'unknown')
        print(f"DEBUG: All payments complete for job {job_id} (completed: {completed_payment_count}, total: {total_payments}) - setting product.active=false", file=sys.stderr)
    
    return {
        'updated': True,
        'payment_number': payment_number,
        'succeeded': succeeded_timestamp,
        'all_paid': all_paid,
        'completed_payment_count': completed_payment_count,
        'total_payments': total_payments,
        'product_active_updated': all_paid
    }

def update_job_state(job_id: str, action: str, data: dict, jobs_dir: str) -> dict:
    """Update job state based on action type."""
    job_data = load_job(job_id, jobs_dir=jobs_dir)
    if not job_data:
        raise ValueError(f"Job not found: {job_id}")
    
    if action == 'sign-contract':
        result = update_contract_signing(job_data, data)
    elif action == 'update-payment':
        result = update_payment_status(job_data, data)
    elif action == 'track-event':
        result = update_tracking_event(job_data, data)
    else:
        raise ValueError(f"Unknown action: {action}")
    
    if not save_job(job_id, job_data, jobs_dir=jobs_dir):
        raise IOError(f"Failed to save job: {job_id}")
    
    return {
        'job_id': job_id,
        'action': action,
        **result
    }

# ============================================================================
# MANIFEST GENERATION FUNCTIONS
# ============================================================================

def normalize_lookup_key(text: str) -> str:
    """Normalize text for lookup key (lowercase, hyphenated)"""
    return text.lower().replace(' ', '-').replace('_', '-').strip()


def read_job_json(file_path: Path) -> Optional[Dict]:
    """Read a job JSON file and extract lookup data"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'product' not in data:
            print(f"⚠️  Missing 'product' field in {file_path.name}", file=sys.stderr)
            return None
        
        product = data['product']
        if 'login_name' not in product or 'login_keyword' not in product:
            print(f"⚠️  Missing 'login_name' or 'login_keyword' in product for {file_path.name}", file=sys.stderr)
            return None
        
        if 'id' not in product:
            print(f"⚠️  Missing 'id' in product for {file_path.name}", file=sys.stderr)
            return None
        
        return data
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in {file_path.name}: {e}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"❌ Error reading {file_path.name}: {e}", file=sys.stderr)
        return None


def generate_manifest(jobs_dir: str, manifest_path: str) -> dict:
    """Generate manifest mapping lookup keys to job entries"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent  # .github/scripts/orchestration -> .github/scripts -> .github -> project root
    jobs_path = project_root / jobs_dir
    manifest = {}
    
    if not jobs_path.exists():
        print(f"⚠️  Jobs directory not found: {jobs_path}", file=sys.stderr)
        return manifest
    
    json_files = [f for f in jobs_path.glob('*.json') if not f.name.startswith('_job_template')]
    
    if not json_files:
        print("ℹ️  No job JSON files found (excluding template)", file=sys.stderr)
        return manifest
    
    for json_file in sorted(json_files):
        job_data = read_job_json(json_file)
        
        if not job_data:
            continue
        
        product = job_data['product']
        login_name = normalize_lookup_key(product['login_name'])
        login_keyword = normalize_lookup_key(product['login_keyword'])
        job_id = product['id']
        
        lookup_key = f"{login_name}-{login_keyword}"
        relative_path = f"assets/jobs/{json_file.name}"
        
        expected_job_id = json_file.stem
        if job_id != expected_job_id:
            print(f"⚠️  Warning: job_id '{job_id}' doesn't match filename '{expected_job_id}' in {json_file.name}", file=sys.stderr)
        
        if lookup_key in manifest:
            print(f"⚠️  Duplicate lookup key '{lookup_key}': {json_file.name} conflicts with {manifest[lookup_key]['file_path']}", file=sys.stderr)
            continue
        
        manifest[lookup_key] = {
            "file_path": relative_path,
            "job_id": job_id,
            "login_keyword": product['login_keyword'],
            "login_name": product['login_name']
        }
        print(f"✅ Added: {lookup_key} → {job_id} ({json_file.name})")
    
    return manifest


def write_manifest(manifest: dict, manifest_path: str):
    """Write manifest to file"""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent  # .github/scripts/orchestration -> .github/scripts -> .github -> project root
    output_file = project_root / manifest_path
    
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    manifest_data = {
        "jobs": manifest,
        "generated_at": datetime.now(UTC).isoformat().replace('+00:00', 'Z')
    }
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(manifest_data, f, indent=2, ensure_ascii=False)
        
        job_count = len(manifest)
        print(f"\n✅ Manifest generated: {job_count} job(s) mapped")
        print(f"📄 Output: {output_file}")
    except Exception as e:
        print(f"❌ Error writing manifest: {e}", file=sys.stderr)
        raise


# ============================================================================
# GIT FUNCTIONS
# ============================================================================

def git_commit_and_push(message: str) -> bool:
    """Commit and push changes to git."""
    try:
        subprocess.run(['git', 'config', '--local', 'user.email', 'action@github.com'], check=True)
        subprocess.run(['git', 'config', '--local', 'user.name', 'GitHub Action'], check=True)
        
        status_result = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True, check=True)
        has_unstaged = bool(status_result.stdout.strip())
        
        if has_unstaged:
            stash_result = subprocess.run(['git', 'stash', '--include-untracked'], check=False, capture_output=True, text=True)
            if stash_result.returncode != 0 and 'No local changes' not in stash_result.stdout:
                print(f"Warning: git stash failed: {stash_result.stderr}", file=sys.stderr)
            
            pull_result = subprocess.run(['git', 'pull', '--rebase'], check=False, capture_output=True, text=True)
            if pull_result.returncode != 0:
                print(f"Warning: git pull --rebase had issues: {pull_result.stderr}", file=sys.stderr)
            
            stash_pop_result = subprocess.run(['git', 'stash', 'pop'], check=False, capture_output=True, text=True)
            if stash_pop_result.returncode != 0:
                if 'No stash entries' not in stash_pop_result.stderr:
                    print(f"Warning: git stash pop had conflicts: {stash_pop_result.stderr}", file=sys.stderr)
                    subprocess.run(['git', 'stash', 'drop'], check=False)
        else:
            subprocess.run(['git', 'pull', '--rebase'], check=False)
        
        subprocess.run(['git', 'add', '-A'], check=True)
        
        result = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True, check=True)
        if not result.stdout.strip():
            return False
        
        subprocess.run(['git', 'commit', '-m', message], check=True)
        subprocess.run(['git', 'push'], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Git error: {e.stderr}", file=sys.stderr)
        return False


# ============================================================================
# MAIN WORKFLOW
# ============================================================================

def main():
    """TRIGGER=payment: Steps 1-14"""
    parser = argparse.ArgumentParser(description="Payment Workflow")
    parser.add_argument('--job-id', required=True, help="Job ID")
    parser.add_argument('--payload', required=True, help="JSON payload string")
    
    args = parser.parse_args()
    
    jobs_dir = 'assets/jobs'
    manifest_path = 'assets/js/manifest.json'
    
    # Parse payload
    try:
        payload_data = json.loads(args.payload)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid payload JSON: {e}"}), file=sys.stderr)
        sys.exit(1)
    
    results = {
        'trigger': 'payment',
        'action': 'update-payment',
        'steps_run': [],
        'errors': [],
        'committed': False,
        'pushed': False
    }
    
    try:
        # Step 1: Webhook event arrives (payment succeeded)
        print(f"[TRIGGER=payment] Step 1: Webhook event received (payment succeeded)", file=sys.stderr)
        print(f"[TRIGGER=payment] Step 1: Completed - Event received (handled in API)", file=sys.stderr)
        
        # Step 2: Update payment status in JSON immediately
        print(f"[TRIGGER=payment] Step 2: Updating payment status in JSON immediately", file=sys.stderr)
        update_data = {
            'payment_number': payload_data.get('payment_number'),
            'succeeded': payload_data.get('succeeded')
        }
        
        try:
            update_result = update_job_state(args.job_id, 'update-payment', update_data, jobs_dir)
            results['steps_run'].append('update_state_update-payment')
            payment_num = update_result.get('payment_number', '?')
            print(f"[TRIGGER=payment] Step 2: Completed - Payment #{payment_num} status updated for {args.job_id}", file=sys.stderr)
            if update_result.get('product_active_updated'):
                print(f"[TRIGGER=payment] Step 2: All payments complete ({update_result.get('completed_payment_count')}/{update_result.get('total_payments')}) - product.active set to false", file=sys.stderr)
        except (ValueError, IOError) as e:
            results['errors'].append(f"update_state failed: {str(e)}")
            print(f"[TRIGGER=payment] Step 2: ERROR - {str(e)}", file=sys.stderr)
        
        # Step 3: Compare JSONs to catalog (8-step matching logic - Steps 3-11)
        sync_stats = execute_8_step_sync(jobs_dir, manifest_path, 'payment')
        results['steps_run'].append('sync_catalog')
        print(f"[TRIGGER=payment] Step 3: Completed - Sync stats: {json.dumps(sync_stats, indent=2)}", file=sys.stderr)
        
        # Steps 4-11 are handled within execute_8_step_sync (already logged)
        print(f"[TRIGGER=payment] Steps 4-11: Completed within Step 3 sync logic", file=sys.stderr)
        
        # Step 12: Create new manifest that reflects resulting JSON directory
        print(f"[TRIGGER=payment] Step 12: Creating manifest", file=sys.stderr)
        try:
            manifest = generate_manifest(jobs_dir, manifest_path)
            write_manifest(manifest, manifest_path)
            results['steps_run'].append('generate_manifest')
            print(f"[TRIGGER=payment] Step 12: Completed - Manifest generated with {len(manifest)} job(s)", file=sys.stderr)
        except Exception as e:
            results['errors'].append(f"generate_manifest failed: {str(e)}")
            print(f"[TRIGGER=payment] Step 12: ERROR - {str(e)}", file=sys.stderr)
        
        # Step 13: Build pages (logged, actual build happens in separate workflow)
        print(f"[TRIGGER=payment] Step 13: Building pages (will trigger after commit)", file=sys.stderr)
        results['steps_run'].append('build_pages')
        print(f"[TRIGGER=payment] Step 13: Completed - Pages build will trigger after commit", file=sys.stderr)
        
        # Step 14: Deploy
        print(f"[TRIGGER=payment] Step 14: Deploying (committing and pushing changes)", file=sys.stderr)
        commit_message = f"🤖 Auto-update: Payment #{payload_data.get('payment_number', '?')} for {args.job_id}\n\nCo-Authored-By: GitHub Actions <action@github.com>"
        if git_commit_and_push(commit_message):
            results['committed'] = True
            results['pushed'] = True
            print(f"[TRIGGER=payment] Step 14: Completed - Changes committed and pushed", file=sys.stderr)
        else:
            print(f"[TRIGGER=payment] Step 14: Skipped - No changes detected", file=sys.stderr)
        
    except Exception as e:
        results['errors'].append(f"Orchestration error: {str(e)}")
        import traceback
        print(traceback.format_exc(), file=sys.stderr)
    
    print(json.dumps(results, indent=2))
    sys.exit(0 if not results['errors'] else 1)

if __name__ == "__main__":
    main()
