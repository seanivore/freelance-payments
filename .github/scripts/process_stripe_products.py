#!/usr/bin/env python3
"""
Process Stripe Products for Job JSON Files
- Detects new/updated payments
- Creates/updates Stripe Products and Prices
- Updates JSON files with Stripe IDs
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


def main():
    """Main execution."""
    if not JOBS_DIR.exists():
        print(f"Jobs directory not found: {JOBS_DIR}")
        return
    
    # Find all JSON files in jobs directory
    json_files = list(JOBS_DIR.glob('*.json'))
    
    # Filter out template file
    json_files = [f for f in json_files if not f.name.startswith('_')]
    
    if not json_files:
        print("No job JSON files found")
        return
    
    print(f"Found {len(json_files)} job file(s)")
    
    processed = 0
    for json_file in json_files:
        if process_job_file(json_file):
            processed += 1
    
    print(f"\n✅ Processed {processed} file(s) with Stripe updates")


if __name__ == '__main__':
    main()
