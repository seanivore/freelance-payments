#!/usr/bin/env python3
"""
Delete a Stripe Product.

Note: ALL prices must be deleted first, or Stripe will reject the request.
Use this for mistakes/test data. Use archive_product.py for normal archiving.

Usage:
    python3 delete_product.py --product-id "prod_xxx"

Returns (stdout):
    {"product_id": "prod_xxx", "deleted": true}

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


def delete_product(product_id: str) -> dict:
    """
    Permanently delete a Stripe Product.

    Args:
        product_id: Stripe product ID (e.g., "prod_xxx")

    Returns:
        Dictionary confirming deletion

    Raises:
        stripe.error.StripeError: If API call fails (e.g., prices still exist)
    """
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    if not stripe.api_key:
        raise ValueError("STRIPE_SECRET_KEY environment variable not set")

    # Delete the product
    result = stripe.Product.delete(product_id)

    return {
        'product_id': result.id,
        'deleted': result.deleted
    }


def main():
    parser = argparse.ArgumentParser(description="Delete a Stripe Product")
    parser.add_argument('--product-id', required=True, help="Stripe product ID")

    args = parser.parse_args()

    # Validate inputs
    if not args.product_id or len(args.product_id.strip()) == 0:
        print(json.dumps({"error": "Product ID cannot be empty"}), file=sys.stderr)
        sys.exit(1)

    try:
        result = delete_product(product_id=args.product_id)

        print(json.dumps(result, indent=2))
        sys.exit(0)

    except ValueError as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

    except stripe.error.StripeError as e:
        error_msg = str(e)

        # Check for common error: prices still exist
        if "has prices" in error_msg.lower() or "price" in error_msg.lower():
            print(json.dumps({
                "error": "Cannot delete product: prices still exist. Delete all prices first.",
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
