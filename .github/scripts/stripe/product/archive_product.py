#!/usr/bin/env python3
"""
Archive a Stripe Product (set active=false).

Note: ALL prices must be archived/deleted first, or Stripe will reject the request.

Usage:
    python3 archive_product.py --product-id "prod_xxx"

Returns (stdout):
    {"product_id": "prod_xxx", "archived": true, "active": false}

Exit codes:
    0 = Success
    1 = Validation error
    2 = Stripe API error
"""

import sys
import json
import argparse
import os

try:
    import stripe
except ImportError:
    print(json.dumps({"error": "Stripe library not installed. Run: pip install stripe"}), file=sys.stderr)
    sys.exit(2)


def archive_product(product_id: str) -> dict:
    """
    Archive a Stripe Product by setting active=false.

    Args:
        product_id: Stripe product ID (e.g., "prod_xxx")

    Returns:
        Dictionary with archived product details

    Raises:
        stripe.error.StripeError: If API call fails (e.g., active prices exist)
    """
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    if not stripe.api_key:
        raise ValueError("STRIPE_SECRET_KEY environment variable not set")

    # Set active=false to archive
    product = stripe.Product.modify(product_id, active=False)

    return {
        'product_id': product.id,
        'archived': True,
        'active': product.active,
        'name': product.name
    }


def main():
    parser = argparse.ArgumentParser(description="Archive a Stripe Product")
    parser.add_argument('--product-id', required=True, help="Stripe product ID")

    args = parser.parse_args()

    # Validate inputs
    if not args.product_id or len(args.product_id.strip()) == 0:
        print(json.dumps({"error": "Product ID cannot be empty"}), file=sys.stderr)
        sys.exit(1)

    try:
        result = archive_product(product_id=args.product_id)

        print(json.dumps(result, indent=2))
        sys.exit(0)

    except ValueError as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

    except stripe.error.StripeError as e:
        error_msg = str(e)

        # Check for common error: active prices still exist
        if "has prices" in error_msg.lower() or "active price" in error_msg.lower():
            print(json.dumps({
                "error": "Cannot archive product: active prices still exist. Archive/delete all prices first.",
                "stripe_error": error_msg,
                "type": type(e).__name__
            }), file=sys.stderr)
        else:
            print(json.dumps({
                "error": error_msg,
                "type": type(e).__name__
            }), file=sys.stderr)

        sys.exit(2)


if __name__ == "__main__":
    main()
