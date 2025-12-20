#!/usr/bin/env python3
"""
Delete a Stripe Price.

Note: Can only delete if never used in a transaction.
Use archive_price.py for normal price archiving.

Usage:
    python3 delete_price.py --price-id "price_xxx"

Returns (stdout):
    {"price_id": "price_xxx", "deleted": true}

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


def delete_price(price_id: str) -> dict:
    """
    Permanently delete a Stripe Price.

    Args:
        price_id: Stripe price ID (e.g., "price_xxx")

    Returns:
        Dictionary confirming deletion

    Raises:
        stripe.error.StripeError: If API call fails (e.g., price was used)
    """
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    if not stripe.api_key:
        raise ValueError("STRIPE_SECRET_KEY environment variable not set")

    # Delete the price
    result = stripe.Price.delete(price_id)

    return {
        'price_id': result.id,
        'deleted': result.deleted
    }


def main():
    parser = argparse.ArgumentParser(description="Delete a Stripe Price")
    parser.add_argument('--price-id', required=True, help="Stripe price ID")

    args = parser.parse_args()

    # Validate inputs
    if not args.price_id or len(args.price_id.strip()) == 0:
        print(json.dumps({"error": "Price ID cannot be empty"}), file=sys.stderr)
        sys.exit(1)

    try:
        result = delete_price(price_id=args.price_id)

        print(json.dumps(result, indent=2))
        sys.exit(0)

    except ValueError as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

    except stripe.error.StripeError as e:
        error_msg = str(e)

        # Check for common error: price was used
        if "used" in error_msg.lower() or "transaction" in error_msg.lower():
            print(json.dumps({
                "error": "Cannot delete price: has been used in transactions. Use archive_price.py instead.",
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
