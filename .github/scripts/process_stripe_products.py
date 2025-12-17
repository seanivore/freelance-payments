#!/usr/bin/env python3
"""
Process Stripe Products for Job JSON Files
- Detects new/updated payments
- Creates/updates Stripe Products and Prices
- Updates JSON files with Stripe IDs
- Archives Stripe products for deleted JSON files
"""

import os
import json
import stripe
from pathlib import Path
from typing import Dict, List, Optional

# Initialize Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

if not stripe.api_key:
    raise ValueError("STRIPE_SECRET_KEY environment variable not set")

JOBS_DIR = Path('assets/jobs')
MANIFEST_FILE = Path('manifest.json')


def load_json_file(filepath: Path) -> Optional[Dict]:
    """Load JSON file safely."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return None


def save_json_file(filepath: Path, data: Dict) -> bool:
    """Save JSON file safely."""
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving {filepath}: {e}")
        return False


def get_previous_version(filepath: Path) -> Optional[Dict]:
    """Get previous version from git."""
    import subprocess
    try:
        result = subprocess.run(
            ['git', 'show', f'HEAD:{filepath}'],
            capture_output=True,
            text=True,
            check=False
        )
        if result.returncode == 0:
            return json.loads(result.stdout)
    except Exception:
        pass
    return None


def should_update_stripe_payment(payment: Dict, prev_payment: Optional[Dict]) -> bool:
    """Determine if Stripe Product/Price needs to be created/updated."""
    # New payment (no Stripe ID)
    if not payment.get('stripe_product_id'):
        return True
    
    # No previous version (new file)
    if prev_payment is None:
        return True
    
    # Amount changed
    if payment.get('amount') != prev_payment.get('amount'):
        return True
    
    # Description changed
    if payment.get('description') != prev_payment.get('description'):
        return True
    
    # Currency changed
    if payment.get('currency', 'usd') != prev_payment.get('currency', 'usd'):
        return True
    
    return False


def create_stripe_product(job_data: Dict, payment: Dict) -> Dict:
    """Create Stripe Product and Price for a payment."""
    invoice_number = job_data.get('invoice_number') or job_data.get('job_id', '')
    payment_number = payment.get('payment_number', 1)
    
    # Product name format: {invoice_number}-{payment_number}
    product_name = f"{invoice_number}-{payment_number}"
    
    # Prepare metadata
    metadata = {
        'job_id': job_data.get('job_id', ''),
        'invoice_number': invoice_number,
        'payment_number': str(payment_number),
        'client_last_name': job_data.get('client', {}).get('last_name', ''),
        'project_keyword': job_data.get('client', {}).get('project_keyword', '')
    }
    
    # Create or update Product
    existing_product_id = payment.get('stripe_product_id')
    
    if existing_product_id:
        # Update existing product
        try:
            product = stripe.Product.modify(
                existing_product_id,
                name=product_name,
                description=payment.get('description', ''),
                metadata=metadata
            )
        except stripe.error.InvalidRequestError:
            # Product doesn't exist, create new one
            product = stripe.Product.create(
                name=product_name,
                description=payment.get('description', ''),
                metadata=metadata
            )
    else:
        # Create new product
        product = stripe.Product.create(
            name=product_name,
            description=payment.get('description', ''),
            metadata=metadata
        )
    
    # Create or update Price
    amount_cents = int(round(payment.get('amount', 0) * 100))
    currency = payment.get('currency', 'usd').lower()
    
    existing_price_id = payment.get('stripe_price_id')
    
    if existing_price_id:
        # Check if price needs update (Stripe doesn't allow modifying prices)
        try:
            existing_price = stripe.Price.retrieve(existing_price_id)
            if (existing_price.unit_amount != amount_cents or 
                existing_price.currency != currency):
                # Need new price (can't modify existing)
                price = stripe.Price.create(
                    product=product.id,
                    currency=currency,
                    unit_amount=amount_cents,
                    metadata=metadata
                )
            else:
                price = existing_price
        except stripe.error.InvalidRequestError:
            # Price doesn't exist, create new
            price = stripe.Price.create(
                product=product.id,
                currency=currency,
                unit_amount=amount_cents,
                metadata=metadata
            )
    else:
        # Create new price
        price = stripe.Price.create(
            product=product.id,
            currency=currency,
            unit_amount=amount_cents,
            metadata=metadata
        )
    
    return {
        'stripe_product_id': product.id,
        'stripe_price_id': price.id,
        'stripe_product_name': product_name
    }


def process_job_file(filepath: Path) -> bool:
    """Process a single job JSON file."""
    job_data = load_json_file(filepath)
    if not job_data:
        return False
    
    # Get previous version for comparison
    prev_job_data = get_previous_version(filepath)
    
    payments = job_data.get('payments', [])
    if not payments:
        print(f"No payments found in {filepath}")
        return False
    
    updated = False
    
    for i, payment in enumerate(payments):
        # Get previous payment for comparison
        prev_payment = None
        if prev_job_data:
            prev_payments = prev_job_data.get('payments', [])
            payment_number = payment.get('payment_number')
            prev_payment = next(
                (p for p in prev_payments if p.get('payment_number') == payment_number),
                None
            )
        
        # Check if Stripe update needed
        if should_update_stripe_payment(payment, prev_payment):
            print(f"Processing payment {payment.get('payment_number')} in {filepath.name}")
            
            try:
                stripe_data = create_stripe_product(job_data, payment)
                
                # Update payment object
                payment.update(stripe_data)
                
                # Update metadata object
                if 'stripe_metadata' not in payment:
                    payment['stripe_metadata'] = {}
                
                payment['stripe_metadata'].update({
                    'job_id': job_data.get('job_id', ''),
                    'invoice_number': job_data.get('invoice_number') or job_data.get('job_id', ''),
                    'payment_number': str(payment.get('payment_number', '')),
                    'client_last_name': job_data.get('client', {}).get('last_name', ''),
                    'project_keyword': job_data.get('client', {}).get('project_keyword', '')
                })
                
                updated = True
                print(f"✅ Created/updated Stripe Product: {stripe_data['stripe_product_name']}")
                
            except Exception as e:
                print(f"❌ Error processing payment {payment.get('payment_number')}: {e}")
                continue
    
    # Save updated JSON if changes were made
    if updated:
        return save_json_file(filepath, job_data)
    
    return False


def get_orphaned_stripe_products():
    """
    Find Stripe products that don't have corresponding JSON files.
    
    This is more robust than git diff because:
    - Works even if files were deleted before script existed
    - Doesn't depend on git history depth
    - Handles any orphaned products (manual deletions, etc.)
    
    Returns: List of Stripe Product objects that should be deleted
    """
    # Get all JSON files currently in jobs folder
    current_json_files = list(JOBS_DIR.glob('*.json'))
    current_json_files = [f for f in current_json_files if not f.name.startswith('_')]
    
    # Extract job_ids from current JSON files
    current_job_ids = set()
    for json_file in current_json_files:
        job_data = load_json_file(json_file)
        if job_data and job_data.get('job_id'):
            current_job_ids.add(job_data.get('job_id'))
    
    print(f"📁 Found {len(current_job_ids)} active job(s) in folder")
    
    # Get all Stripe products
    orphaned_products = []
    try:
        all_products = stripe.Product.list(limit=100, active=True)  # Only active products
        
        # Handle pagination
        while True:
            for product in all_products.data:
                job_id = product.metadata.get('job_id')
                
                # If product has job_id but no corresponding JSON file → orphaned
                if job_id and job_id not in current_job_ids:
                    orphaned_products.append(product)
            
            if not all_products.has_more:
                break
            
            all_products = stripe.Product.list(
                limit=100,
                active=True,
                starting_after=all_products.data[-1].id
            )
    
    except Exception as e:
        print(f"⚠️  Error fetching Stripe products: {e}")
        return []
    
    return orphaned_products




def delete_orphaned_products():
    """
    Delete Stripe products that don't have corresponding JSON files.
    
    This approach is more robust than git diff because:
    - Compares current folder state vs Stripe catalog (source of truth)
    - Works even if files were deleted before script existed
    - Doesn't depend on git history depth
    - Handles any orphaned products (manual deletions, etc.)
    
    Logic:
    1. Get all JSON files currently in jobs folder → Extract job_ids
    2. Get all Stripe products → Check if job_id exists in folder
    3. Delete products whose job_id doesn't exist in folder
    """
    orphaned_products = get_orphaned_stripe_products()
    
    if not orphaned_products:
        return 0
    
    print(f"\n🗑️  Found {len(orphaned_products)} orphaned Stripe product(s)")
    
    deleted_count = 0
    for product in orphaned_products:
        job_id = product.metadata.get('job_id', 'unknown')
        try:
            stripe.Product.delete(product.id)
            print(f"  ✅ Deleted orphaned product: {product.name} (job: {job_id})")
            deleted_count += 1
        except Exception as e:
            print(f"  ❌ Error deleting product {product.id}: {e}")
    
    if deleted_count > 0:
        print(f"\n✅ Deleted {deleted_count} orphaned Stripe product(s)")
    
    return deleted_count


def main():
    """Main execution."""
    if not JOBS_DIR.exists():
        print(f"Jobs directory not found: {JOBS_DIR}")
        return
    
    # First, clean up orphaned Stripe products (products without JSON files)
    # This compares current folder state vs Stripe catalog (more robust than git diff)
    deleted = delete_orphaned_products()
    
    # Find all JSON files in jobs directory
    json_files = list(JOBS_DIR.glob('*.json'))
    
    # Filter out template file
    json_files = [f for f in json_files if not f.name.startswith('_')]
    
    if not json_files:
        print("No job JSON files found")
        if deleted > 0:
            print("(But deleted products from removed files)")
        return
    
    print(f"\n📁 Found {len(json_files)} job file(s)")
    
    processed = 0
    for json_file in json_files:
        if process_job_file(json_file):
            processed += 1
    
    print(f"\n✅ Processed {processed} file(s) with Stripe updates")
    if deleted > 0:
        print(f"✅ Deleted {deleted} product(s) for removed files")


if __name__ == '__main__':
    main()
