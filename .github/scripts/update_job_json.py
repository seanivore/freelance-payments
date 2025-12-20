#!/usr/bin/env python3
"""
Update Job JSON Files with State Changes
Called by GitHub Actions workflow for contract signing and payment updates

Usage:
    python3 update_job_json.py sign-contract <job_id> '<signature_data_json>'
    python3 update_job_json.py update-payment <job_id> <payment_number> '<payment_data_json>'
"""

import json
import sys
import os
from pathlib import Path
from typing import Dict, Optional

try:
    import stripe
    stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False
    print("⚠️  Stripe module not available, skipping Stripe operations", file=sys.stderr)


JOBS_DIR = Path('assets/jobs')


def load_json_file(filepath: Path) -> Optional[Dict]:
    """Load JSON file safely."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error loading {filepath}: {e}", file=sys.stderr)
        return None


def save_json_file(filepath: Path, data: Dict) -> bool:
    """Save JSON file safely."""
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"❌ Error saving {filepath}: {e}", file=sys.stderr)
        return False


def find_job_file(job_id: str) -> Optional[Path]:
    """Find JSON file by job_id."""
    if not JOBS_DIR.exists():
        print(f"❌ Jobs directory not found: {JOBS_DIR}", file=sys.stderr)
        return None

    # Search all JSON files for matching job_id
    for json_file in JOBS_DIR.glob('*.json'):
        if json_file.name.startswith('_'):
            continue

        job_data = load_json_file(json_file)
        if job_data and job_data.get('job_id') == job_id:
            return json_file

    print(f"❌ No JSON file found for job_id: {job_id}", file=sys.stderr)
    return None


def update_contract_signed(job_id: str, signature_data: Dict) -> bool:
    """
    Update contract.signed field and signature data.

    signature_data format:
    {
        "contractor_signature": "Sean Horvath",
        "contractor_date": "2025-12-20",
        "client_signature": "Client Name",
        "client_date": "2025-12-20"
    }
    """
    # Find job file
    job_file = find_job_file(job_id)
    if not job_file:
        return False

    # Load job data
    job_data = load_json_file(job_file)
    if not job_data:
        return False

    # Update contract fields
    if 'contract' not in job_data:
        print(f"⚠️  No contract field in {job_file.name}", file=sys.stderr)
        return False

    contract = job_data['contract']
    contract['signed'] = True
    contract['signed_date'] = signature_data.get('client_date') or signature_data.get('contractor_date')
    contract['contractor_signature'] = signature_data.get('contractor_signature')
    contract['contractor_date'] = signature_data.get('contractor_date')
    contract['client_date'] = signature_data.get('client_date')

    # Also store the client signature if provided (for future reference)
    if 'client_signature' in signature_data:
        contract['signed_by'] = signature_data.get('client_signature')

    # Save updated data
    if save_json_file(job_file, job_data):
        print(f"✅ Contract signed for {job_id}")
        print(f"   File: {job_file.name}")
        print(f"   Signed by: {contract.get('signed_by', 'N/A')}")
        print(f"   Signed date: {contract.get('signed_date', 'N/A')}")
        return True

    return False


def archive_stripe_price(price_id: str) -> bool:
    """Archive a Stripe price (set active=false)."""
    if not STRIPE_AVAILABLE:
        return True  # Skip if Stripe not available

    try:
        stripe.Price.modify(price_id, active=False)
        print(f"  ✅ Archived Stripe price: {price_id}")
        return True
    except Exception as e:
        print(f"  ⚠️  Failed to archive price {price_id}: {e}", file=sys.stderr)
        return False


def archive_stripe_product(product_id: str) -> bool:
    """Archive a Stripe product (set active=false)."""
    if not STRIPE_AVAILABLE:
        return True  # Skip if Stripe not available

    try:
        stripe.Product.modify(product_id, active=False)
        print(f"  ✅ Archived Stripe product: {product_id}")
        return True
    except Exception as e:
        print(f"  ⚠️  Failed to archive product {product_id}: {e}", file=sys.stderr)
        return False


def check_all_payments_paid(payments: list) -> bool:
    """Check if all payments in the list are paid."""
    return all(payment.get('status') == 'paid' for payment in payments)


def update_payment_status(job_id: str, payment_number: int, payment_data: Dict) -> bool:
    """
    Update payment status when payment succeeds.

    payment_data format:
    {
        "status": "paid",
        "paid_date": "2025-12-20",
        "paid_date_unix": 1734739200,
        "stripe_payment_intent_id": "pi_xxxxx"
    }
    """
    # Find job file
    job_file = find_job_file(job_id)
    if not job_file:
        return False

    # Load job data
    job_data = load_json_file(job_file)
    if not job_data:
        return False

    # Find payment by payment_number
    payments = job_data.get('payments', [])
    if not payments:
        print(f"⚠️  No payments found in {job_file.name}", file=sys.stderr)
        return False

    payment_found = False
    current_payment = None
    for payment in payments:
        if payment.get('payment_number') == payment_number:
            # Update payment status
            payment['status'] = payment_data.get('status', 'paid')
            payment['paid_date'] = payment_data.get('paid_date')
            payment['paid_date_unix'] = payment_data.get('paid_date_unix')

            # Optionally store Stripe payment intent ID
            if 'stripe_payment_intent_id' in payment_data:
                payment['stripe_payment_intent_id'] = payment_data['stripe_payment_intent_id']

            current_payment = payment
            payment_found = True
            break

    if not payment_found:
        print(f"⚠️  Payment #{payment_number} not found in {job_file.name}", file=sys.stderr)
        return False

    # Save updated data
    if not save_json_file(job_file, job_data):
        return False

    print(f"✅ Payment updated for {job_id}")
    print(f"   File: {job_file.name}")
    print(f"   Payment: #{payment_number}")
    print(f"   Status: {payment_data.get('status')}")
    print(f"   Paid date: {payment_data.get('paid_date')}")

    # === STRIPE ARCHIVING ===
    # Archive the price that was just paid
    price_id = current_payment.get('stripe_price_id')
    if price_id:
        print(f"\n💳 Archiving Stripe price...")
        archive_stripe_price(price_id)
    else:
        print(f"⚠️  No stripe_price_id found, skipping price archiving", file=sys.stderr)

    # Check if ALL payments are now paid
    all_paid = check_all_payments_paid(payments)
    if all_paid:
        print(f"\n🎉 All payments complete! Archiving product...")
        # Archive the product (get product_id from any payment)
        product_id = current_payment.get('stripe_product_id')
        if product_id:
            archive_stripe_product(product_id)
        else:
            print(f"⚠️  No stripe_product_id found, skipping product archiving", file=sys.stderr)

    return True


def main():
    """Main execution."""
    if len(sys.argv) < 3:
        print("Usage:", file=sys.stderr)
        print("  sign-contract: python3 update_job_json.py sign-contract <job_id> '<signature_data_json>'", file=sys.stderr)
        print("  update-payment: python3 update_job_json.py update-payment <job_id> <payment_number> '<payment_data_json>'", file=sys.stderr)
        sys.exit(1)

    action = sys.argv[1]
    job_id = sys.argv[2]

    try:
        if action == 'sign-contract':
            if len(sys.argv) < 4:
                print("❌ Missing signature_data argument", file=sys.stderr)
                sys.exit(1)

            signature_data = json.loads(sys.argv[3])
            success = update_contract_signed(job_id, signature_data)

        elif action == 'update-payment':
            if len(sys.argv) < 5:
                print("❌ Missing payment_number or payment_data arguments", file=sys.stderr)
                sys.exit(1)

            payment_number = int(sys.argv[3])
            payment_data = json.loads(sys.argv[4])
            success = update_payment_status(job_id, payment_number, payment_data)

        else:
            print(f"❌ Unknown action: {action}", file=sys.stderr)
            print("Valid actions: sign-contract, update-payment", file=sys.stderr)
            sys.exit(1)

        if success:
            print(f"\n✅ Successfully updated {job_id}")
            sys.exit(0)
        else:
            print(f"\n❌ Failed to update {job_id}", file=sys.stderr)
            sys.exit(1)

    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON data: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
