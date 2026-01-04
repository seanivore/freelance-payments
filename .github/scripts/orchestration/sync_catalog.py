#!/usr/bin/env python3
"""
Consolidated Stripe Catalog Sync (v4 schema)
Creates/updates Products, Prices, Customers, Coupons, and stores Checkout Session parameters.

Process:
1. Compare filenames in assets/jobs/ to manifest.json entries
2. Files with no manifest match → Create all Stripe objects
3. Manifest entries with no file match → Archive product
4. Store Stripe IDs in state.objects
5. Store checkout session parameters (sessions created on-demand per CHECKOUT_SESSION_DETAILS.md)

v4 Schema:
- product.id = job_id (matches filename)
- price1, price2 (not price[] array)
- customer (not client)
- coupon (optional)
- state.objects stores Stripe IDs (price_1, price_2, not initial_price/balance_price)

Usage:
    python3 sync_catalog.py --jobs-dir "assets/jobs" --manifest-path "assets/js/manifest.json"

Returns (stdout):
    {"jobs_processed": 5, "products_created": 2, "prices_created": 4, "customers_created": 2, "coupons_created": 1, "products_archived": 0}

Exit codes:
    0 = Success
    1 = Validation error
    2 = Stripe API error
"""

import sys
import json
import argparse
import os
from pathlib import Path
from datetime import datetime, UTC

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.json_io import list_all_jobs, save_job, find_job_file, load_job

# Import Stripe
try:
    import stripe
except ImportError:
    print(json.dumps({"error": "Stripe library not installed. Run: pip install stripe"}), file=sys.stderr)
    sys.exit(2)


def load_manifest(manifest_path: str) -> dict:
    """Load manifest.json and return jobs dict."""
    # Resolve path relative to project root (consistent with other functions)
    utils_dir = Path(__file__).parent.parent  # .github/scripts
    github_dir = utils_dir.parent  # .github
    project_root = github_dir.parent  # project root
    manifest_file = project_root / manifest_path
    
    print(f"DEBUG: Loading manifest from: {manifest_file} (resolved from {manifest_path})", file=sys.stderr)
    
    if not manifest_file.exists():
        print(f"DEBUG: Manifest file does not exist at {manifest_file}", file=sys.stderr)
        return {}
    
    try:
        with open(manifest_file, 'r', encoding='utf-8') as f:
            manifest_data = json.load(f)
            jobs = manifest_data.get('jobs', {})
            print(f"DEBUG: Loaded manifest with {len(jobs)} entries", file=sys.stderr)
            return jobs
    except Exception as e:
        print(f"Warning: Failed to load manifest: {e}", file=sys.stderr)
        import traceback
        print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
        return {}


def create_stripe_product(product: dict, job_id: str) -> str:
    """Create Stripe Product. Returns product_id."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    if not stripe.api_key:
        raise ValueError("STRIPE_SECRET_KEY environment variable not set")

    # Use product.id as Stripe product ID (if allowed)
    # Note: v4 schema has no metadata nesting, but Stripe API still needs metadata dict
    product_params = {
        'name': product.get('name', f'Job {job_id}'),
        'active': product.get('active', True),
        'type': product.get('type', 'service'),
        'metadata': {}  # Stripe metadata (not v4 schema metadata)
    }

    if product.get('description'):
        product_params['description'] = product['description']

    if product.get('unit_label'):
        product_params['unit_label'] = product['unit_label']

    # Try to use custom ID (may not always work, Stripe will generate if needed)
    try:
        stripe_product = stripe.Product.create(id=product.get('id'), **product_params)
    except stripe.error.InvalidRequestError:
        # Custom ID not allowed, let Stripe generate
        stripe_product = stripe.Product.create(**product_params)

    return stripe_product.id


def modify_stripe_product(product_id: str, product: dict) -> str:
    """Modify existing Stripe Product. Returns product_id."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    
    update_params = {
        'name': product.get('name'),
        'active': product.get('active', True),
        'metadata': {}  # Stripe metadata (not v4 schema metadata)
    }

    if product.get('description'):
        update_params['description'] = product['description']

    stripe_product = stripe.Product.modify(product_id, **update_params)
    return stripe_product.id


def archive_stripe_product(product_id: str) -> None:
    """Archive Stripe Product (set active=false)."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    stripe.Product.modify(product_id, active=False)


def create_stripe_price(price_obj: dict, product_id: str) -> str:
    """
    Create Stripe Price. Returns price_id.
    
    Note: Stripe doesn't allow custom IDs for Price objects via Python SDK.
    We use lookup_key instead (e.g., 'uid-xxx-xxx-1') and store the Stripe-generated ID.
    """
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    price_params = {
        'product': product_id,
        'unit_amount': price_obj.get('unit_amount'),
        'currency': price_obj.get('currency', 'usd').lower(),
        'active': price_obj.get('active', True),
        'billing_scheme': price_obj.get('billing_scheme', 'per_unit'),
        'metadata': {}  # Stripe metadata (not v4 schema metadata)
    }

    if price_obj.get('nickname'):
        price_params['nickname'] = price_obj['nickname']

    # Use lookup_key instead of id (Stripe doesn't allow custom Price IDs via SDK)
    # The lookup_key can be used to retrieve the price later: stripe.Price.list(lookup_keys=['uid-xxx-xxx-1'])
    if price_obj.get('id'):
        price_params['lookup_key'] = price_obj['id']

    # Stripe will generate the actual price_id (e.g., 'price_xyz...')
    price = stripe.Price.create(**price_params)

    return price.id  # Returns Stripe-generated ID (e.g., 'price_xyz...')


def archive_stripe_price(price_id: str) -> None:
    """Archive Stripe Price (set active=false)."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    stripe.Price.modify(price_id, active=False)


def create_stripe_customer(customer: dict) -> str:
    """Create Stripe Customer. Returns customer.id."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    customer_params = {
        'name': customer.get('name') or customer.get('business'),
        'email': customer.get('email'),
        'phone': customer.get('phone'),
        'metadata': {}  # Stripe metadata (not v4 schema metadata)
    }

    # Store title in metadata (Stripe Customer API doesn't support title field)
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

    # Try to use custom ID
    try:
        customer = stripe.Customer.create(id=customer.get('id'), **customer_params)
    except stripe.error.InvalidRequestError:
        customer = stripe.Customer.create(**customer_params)

    return customer.id


def create_stripe_coupon(coupon: dict) -> str:
    """Create Stripe Coupon. Returns coupon_id."""
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    coupon_params = {
        'id': coupon.get('id'),  # Coupons allow custom IDs
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


def sync_job(job_data: dict, manifest_job_ids: set, should_create: bool) -> dict:
    """
    Sync a single job to Stripe catalog (v4 schema).
    
    Args:
        job_data: Job JSON dictionary (v4 schema)
        manifest_job_ids: Set of job_ids already in manifest
        should_create: True if this job needs Stripe objects created (new job)
    
    Returns:
        Dictionary with sync stats
    """
    # Get job_id from product.id (v4 schema)
    product = job_data.get('product', {})
    job_id = product.get('id')
    
    if not job_id:
        raise ValueError("Job missing product.id")

    stats = {
        'products_created': 0,
        'products_modified': 0,
        'prices_created': 0,
        'customers_created': 0,
        'coupons_created': 0,
        'products_archived': 0
    }

    # Initialize state if missing (v4 schema: state.objects, not state.object)
    if 'state' not in job_data:
        job_data['state'] = {}
    if 'objects' not in job_data['state']:
        job_data['state']['objects'] = {}

    state_objects = job_data['state']['objects']

    # Only create Stripe objects if this is a new job (not in manifest)
    if should_create:
        # === CREATE PRODUCT ===
        product_id = state_objects.get('product')
        if product_id:
            # Product exists → Modify it
            product_id = modify_stripe_product(product_id, product)
            stats['products_modified'] += 1
        else:
            # Create new product
            product_id = create_stripe_product(product, job_id)
            stats['products_created'] += 1
        
        state_objects['product'] = product_id
        state_objects['created'] = datetime.now(UTC).isoformat().replace('+00:00', 'Z')

        # === CREATE CUSTOMER ===
        customer = job_data.get('customer')
        if customer:
            customer_id = state_objects.get('customer')
            if not customer_id:
                customer_id = create_stripe_customer(customer)
                stats['customers_created'] += 1
            state_objects['customer'] = customer_id

        # === CREATE PRICES ===
        price1 = job_data.get('price1')
        price2 = job_data.get('price2')
        
        # Get existing price IDs from state.objects (v4: price_1, price_2, not initial_price/balance_price)
        price_1_id = state_objects.get('price_1')
        price_2_id = state_objects.get('price_2')
        
        if price1:
            if not price_1_id:
                price_1_id = create_stripe_price(price1, product_id)
                stats['prices_created'] += 1
            # Store Stripe-generated price_id in state.objects
            state_objects['price_1'] = price_1_id
            # Also update price1.id for consistency
            price1['id'] = price_1_id

        if price2:
            if not price_2_id:
                price_2_id = create_stripe_price(price2, product_id)
                stats['prices_created'] += 1
            # Store Stripe-generated price_id in state.objects
            state_objects['price_2'] = price_2_id
            # Also update price2.id for consistency
            price2['id'] = price_2_id

        # === CREATE COUPON (if exists and has amount_off > 0) ===
        coupon_id = None  # Initialize before use
        coupon = job_data.get('coupon')
        if coupon and coupon.get('amount_off', 0) > 0:
            coupon_id = state_objects.get('coupon')
            if not coupon_id:
                coupon_id = create_stripe_coupon(coupon)
                stats['coupons_created'] += 1
            state_objects['coupon'] = coupon_id

        # === UPDATE CHECKOUT SESSION PARAMETERS WITH ACTUAL PRICE_IDS ===
        # Sessions are created on-demand per CHECKOUT_SESSION_DETAILS.md
        # But we update the parameters with actual Stripe price_ids for documentation/completeness
        
        if job_data.get('checkout_session_1') and price_1_id:
            # Update checkout_session_1.line_items[].price with actual Stripe price_id
            checkout_session_1 = job_data['checkout_session_1']
            if 'line_items' in checkout_session_1 and len(checkout_session_1['line_items']) > 0:
                checkout_session_1['line_items'][0]['price'] = price_1_id
            # Update discounts[].coupon with actual Stripe coupon_id (if coupon exists)
            if coupon_id and 'discounts' in checkout_session_1 and checkout_session_1['discounts']:
                if len(checkout_session_1['discounts']) > 0:
                    checkout_session_1['discounts'][0]['coupon'] = coupon_id
        
        if job_data.get('checkout_session_2') and price_2_id:
            # Update checkout_session_2.line_items[].price with actual Stripe price_id
            checkout_session_2 = job_data['checkout_session_2']
            if 'line_items' in checkout_session_2 and len(checkout_session_2['line_items']) > 0:
                checkout_session_2['line_items'][0]['price'] = price_2_id
        
        # Store checkout session parameters in state.objects.checkout_session (v4: payment_1, payment_2)
        if 'checkout_session' not in state_objects:
            state_objects['checkout_session'] = {}
        if price_1_id:
            state_objects['checkout_session']['payment_1'] = 'parameters_stored'
        if price_2_id:
            state_objects['checkout_session']['payment_2'] = 'parameters_stored'

    return stats


def archive_stripe_product_by_job_id(job_id: str, manifest: dict) -> bool:
    """
    Archive a Stripe product by job_id.
    
    Args:
        job_id: Job ID (product.id)
        manifest: Manifest dictionary
    
    Returns:
        True if archived, False if not found
    """
    # Find job entry in manifest
    job_entry = None
    for entry in manifest.values():
        if entry.get('job_id') == job_id:
            job_entry = entry
            break
    
    if not job_entry:
        return False
    
    # Get product_id from state (we'd need to load the JSON file)
    # For now, use job_id as product_id (they match in v4 schema)
    try:
        archive_stripe_product(job_id)
        return True
    except Exception as e:
        print(f"Warning: Failed to archive product {job_id}: {e}", file=sys.stderr)
        return False


def sync_catalog(jobs_dir: str = "assets/jobs", manifest_path: str = "assets/js/manifest.json") -> dict:
    """
    Sync all job files to Stripe catalog (v4 schema).
    
    Logic (per BUG_WORKFLOW_FIX.md):
    1. Compare JSON filenames to manifest entries
    2. If match AND product.active=false → archive
    3. If match AND product.active=true → skip (already synced)
    4. If manifest entry but no JSON file → archive (orphaned)
    5. If JSON file but no manifest entry → create all objects (new)
    
    Args:
        jobs_dir: Directory containing job JSON files
        manifest_path: Path to manifest.json
    
    Returns:
        Dictionary with overall sync stats
    """
    # Load manifest
    manifest = load_manifest(manifest_path)
    # Extract job_ids from manifest entries
    # Handle both formats:
    # - Old format: {"url": {"job_id": "...", "file_path": "..."}}
    # - New format: {"url": "file_path"} (extract job_id from filename)
    manifest_job_ids = set()
    print(f"DEBUG: Processing {len(manifest)} manifest entries", file=sys.stderr)
    for lookup_key, entry in manifest.items():
        print(f"DEBUG: Processing manifest entry: {lookup_key} -> {type(entry).__name__}", file=sys.stderr)
        if isinstance(entry, dict):
            # Old format with job_id field
            job_id = entry.get('job_id')
            if job_id:
                manifest_job_ids.add(job_id)
                print(f"DEBUG: Extracted job_id '{job_id}' from dict entry", file=sys.stderr)
        elif isinstance(entry, str):
            # New format: entry is just the file path string
            # Extract job_id from filename (e.g., "assets/jobs/uid-abc-123.json" -> "uid-abc-123")
            file_path = Path(entry)
            if file_path.suffix == '.json':
                job_id = file_path.stem  # Removes .json extension
                manifest_job_ids.add(job_id)
                print(f"DEBUG: Extracted job_id '{job_id}' from file path '{entry}'", file=sys.stderr)
    
    # Get all job files
    all_jobs = list_all_jobs(jobs_dir)
    json_job_ids = set()
    
    # Build map of job_id -> job_data for quick lookup
    jobs_by_id = {}
    for job_data in all_jobs:
        product = job_data.get('product', {})
        job_id = product.get('id')
        if job_id:
            json_job_ids.add(job_id)
            jobs_by_id[job_id] = job_data
    
    print(f"DEBUG: Found {len(all_jobs)} job file(s) in {jobs_dir}", file=sys.stderr)
    print(f"DEBUG: Found {len(manifest_job_ids)} job_id(s) in manifest", file=sys.stderr)

    overall_stats = {
        'jobs_processed': 0,
        'products_created': 0,
        'products_modified': 0,
        'prices_created': 0,
        'customers_created': 0,
        'coupons_created': 0,
        'products_archived': 0
    }

    # Simplified 4-case logic:
    # 1. Match + active=false → Archive
    # 2. Match + active=true → Skip (already synced)
    # 3. No match + JSON exists → Create (new job)
    # 4. No match + manifest entry exists → Archive (orphaned)
    
    jobs_to_archive = []
    jobs_to_skip = []
    jobs_to_create = []
    
    for job_id in json_job_ids:
        if job_id in manifest_job_ids:
            # Case 1 or 2: Has manifest entry - check product.active
            job_data = jobs_by_id[job_id]
            product = job_data.get('product', {})
            product_active = product.get('active', True)
            
            if not product_active:
                # Case 1: Match + active=false → Archive
                jobs_to_archive.append(job_id)
                print(f"DEBUG: Job {job_id} marked for archiving (active=false)", file=sys.stderr)
            else:
                # Case 2: Match + active=true → Skip (already synced)
                jobs_to_skip.append(job_id)
                print(f"DEBUG: Job {job_id} already synced and active - skipping", file=sys.stderr)
        else:
            # Case 3: No manifest entry → Create (new job)
            jobs_to_create.append(job_id)
            print(f"DEBUG: Job {job_id} is new - will create Stripe objects", file=sys.stderr)
    
    # Case 4: Find orphaned products (in manifest but no JSON file) → Archive
    orphaned_job_ids = manifest_job_ids - json_job_ids
    for job_id in orphaned_job_ids:
        jobs_to_archive.append(job_id)
        print(f"DEBUG: Job {job_id} is orphaned (in manifest but no JSON file) - will archive", file=sys.stderr)
    
    # Step 3: Archive products
    for job_id in jobs_to_archive:
        try:
            # Get product_id from state if job file exists
            # Otherwise use job_id (which should match product_id in v3 schema)
            product_id = job_id  # Default to job_id
            
            if job_id in jobs_by_id:
                # Job file exists - get product_id from state.objects (v4 schema)
                job_data = jobs_by_id[job_id]
                state_objects = job_data.get('state', {}).get('objects', {})
                product_id = state_objects.get('product', job_id)
            else:
                # Orphaned - file was deleted but still in manifest
                # Try to get product_id from manifest entry's stored state (if we had it)
                # For now, use job_id (which should match product_id in v3 schema when custom IDs work)
                # If product_id was auto-generated by Stripe, we'd need to load from git history
                # For simplicity, try job_id first (most common case)
                product_id = job_id
            
            archive_stripe_product(product_id)
            overall_stats['products_archived'] += 1
            print(f"DEBUG: Archived product {product_id} (job_id: {job_id})", file=sys.stderr)
        except Exception as e:
            print(f"Warning: Failed to archive product for job {job_id}: {e}", file=sys.stderr)
    
    # Step 4: Create Stripe objects for new jobs
    for job_id in jobs_to_create:
        job_data = jobs_by_id[job_id]
        
        try:
            print(f"DEBUG: Creating Stripe objects for job {job_id}", file=sys.stderr)
            stats = sync_job(job_data, manifest_job_ids, should_create=True)
            
            # Accumulate stats
            for key in stats:
                overall_stats[key] += stats[key]
            
            overall_stats['jobs_processed'] += 1

            # Save updated job (with Stripe IDs in state.objects)
            # Verify state.objects has Stripe IDs before saving
            state_objects = job_data.get('state', {}).get('objects', {})
            if not state_objects.get('product'):
                print(f"Warning: Job {job_id} has no product ID in state.objects before save - sync_job may have failed", file=sys.stderr)
            
            if not save_job(job_id, job_data, jobs_dir=jobs_dir):
                print(f"Warning: Failed to save job {job_id}", file=sys.stderr)
                # Don't continue - this is a critical error
                raise IOError(f"Failed to save job {job_id} after Stripe sync")
            else:
                # Verify save worked by checking file exists and has Stripe IDs
                from utils.json_io import load_job
                verify_job = load_job(job_id, jobs_dir)
                if verify_job:
                    verify_state = verify_job.get('state', {}).get('objects', {})
                    if verify_state.get('product') == state_objects.get('product'):
                        print(f"DEBUG: Successfully saved and verified job {job_id} with Stripe IDs", file=sys.stderr)
                    else:
                        print(f"Warning: Saved file for {job_id} but Stripe IDs don't match - product: {verify_state.get('product')} vs {state_objects.get('product')}", file=sys.stderr)
                else:
                    print(f"Warning: Saved job {job_id} but could not verify by reloading", file=sys.stderr)

        except Exception as e:
            print(f"Error syncing job {job_id}: {e}", file=sys.stderr)
            import traceback
            print(f"Traceback: {traceback.format_exc()}", file=sys.stderr)
            continue

    return overall_stats


def main():
    parser = argparse.ArgumentParser(description="Sync jobs to Stripe catalog (v4 schema)")
    parser.add_argument('--jobs-dir', default='assets/jobs', help="Jobs directory")
    parser.add_argument('--manifest-path', default='assets/js/manifest.json', help="Path to manifest.json")

    args = parser.parse_args()

    try:
        result = sync_catalog(jobs_dir=args.jobs_dir, manifest_path=args.manifest_path)
        print(json.dumps(result, indent=2))
        sys.exit(0)

    except ValueError as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

    except Exception as e:
        print(json.dumps({"error": f"Unexpected error: {e}"}), file=sys.stderr)
        import traceback
        print(traceback.format_exc(), file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
