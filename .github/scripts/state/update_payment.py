#!/usr/bin/env python3
"""
Update payment status when payment is completed.

Called by Vercel webhook when Stripe payment succeeds.

Actions:
1. Update payment status to "paid"
2. Archive the Stripe price (active=false)
3. If all prices paid, archive the Stripe product (active=false)

Usage:
    python3 update_payment.py --job-id "uid-001" --payment-number 1 --paid-date "2025-12-20"

Returns (stdout):
    {"job_id": "uid-001", "payment_number": 1, "updated": true, "all_paid": false}

Exit codes:
    0 = Success
    1 = Validation error
    2 = File/Stripe error
"""

import sys
import json
import argparse
import subprocess
from pathlib import Path
from datetime import datetime
import time

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.json_io import load_job, save_job


def call_script(script_path: str, **kwargs) -> dict:
    """
    Call another script and return its JSON output.

    Args:
        script_path: Relative path to script (e.g., "../stripe/price/archive_price.py")
        **kwargs: Arguments to pass to script

    Returns:
        Dictionary with script output

    Raises:
        subprocess.CalledProcessError: If script fails
    """
    script_dir = Path(__file__).parent.parent
    full_path = script_dir / script_path

    cmd = ['python3', str(full_path)]

    # Add arguments
    for key, value in kwargs.items():
        cmd.append(f"--{key.replace('_', '-')}")
        cmd.append(str(value))

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise subprocess.CalledProcessError(result.returncode, cmd, result.stdout, result.stderr)

    return json.loads(result.stdout) if result.stdout else {}


def update_payment(job_id: str, payment_number: int, paid_date: str = None) -> dict:
    """
    Update payment status and archive Stripe price/product.

    Args:
        job_id: Job identifier
        payment_number: Which payment (1, 2, 3, etc.)
        paid_date: Date payment was received (ISO format)

    Returns:
        Dictionary with update confirmation

    Raises:
        ValueError: If job or payment not found
        IOError: If file save fails
    """
    # Load job
    job_data = load_job(job_id)
    if not job_data:
        raise ValueError(f"Job not found: {job_id}")

    # Find the payment
    prices = job_data.get('prices', [])
    payment = None
    payment_index = None

    for i, p in enumerate(prices):
        if p.get('payment_number') == payment_number:
            payment = p
            payment_index = i
            break

    if not payment:
        raise ValueError(f"Payment {payment_number} not found in job {job_id}")

    # Update payment status
    if not paid_date:
        paid_date = datetime.now().isoformat()[:10]

    payment['payment_status'] = 'paid'
    payment['paid_date'] = paid_date
    payment['paid_date_unix'] = int(datetime.fromisoformat(paid_date).timestamp())

    # Archive the Stripe price (active=false)
    price_id = payment.get('metadata', {}).get('stripe_price_id')
    if price_id:
        try:
            call_script('stripe/price/archive_price.py', price_id=price_id)
            payment['active'] = False  # Update JSON to match Stripe
        except subprocess.CalledProcessError as e:
            print(f"Warning: Failed to archive price {price_id}: {e.stderr}", file=sys.stderr)

    # Update the payment in the list
    prices[payment_index] = payment
    job_data['prices'] = prices

    # Check if ALL prices are now paid
    all_paid = all(p.get('payment_status') == 'paid' for p in prices)

    # If all paid, archive the product
    if all_paid:
        product_id = job_data.get('product', {}).get('metadata', {}).get('stripe_product_id')
        if product_id:
            try:
                call_script('stripe/product/archive_product.py', product_id=product_id)
                job_data['product']['active'] = False  # Update JSON to match Stripe
            except subprocess.CalledProcessError as e:
                print(f"Warning: Failed to archive product {product_id}: {e.stderr}", file=sys.stderr)

    # Save updated job
    if not save_job(job_id, job_data):
        raise IOError(f"Failed to save job: {job_id}")

    return {
        'job_id': job_id,
        'payment_number': payment_number,
        'updated': True,
        'payment_status': 'paid',
        'all_paid': all_paid
    }


def main():
    parser = argparse.ArgumentParser(description="Update payment status")
    parser.add_argument('--job-id', required=True, help="Job ID")
    parser.add_argument('--payment-number', type=int, required=True, help="Payment number")
    parser.add_argument('--paid-date', help="Date paid (ISO format, default: today)")

    args = parser.parse_args()

    # Validate inputs
    if not args.job_id or len(args.job_id.strip()) == 0:
        print(json.dumps({"error": "Job ID cannot be empty"}), file=sys.stderr)
        sys.exit(1)

    if args.payment_number < 1:
        print(json.dumps({"error": "Payment number must be positive"}), file=sys.stderr)
        sys.exit(1)

    try:
        result = update_payment(
            job_id=args.job_id,
            payment_number=args.payment_number,
            paid_date=args.paid_date
        )

        print(json.dumps(result, indent=2))
        sys.exit(0)

    except ValueError as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

    except (IOError, OSError, subprocess.CalledProcessError) as e:
        print(json.dumps({"error": f"Operation failed: {e}"}), file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
