#!/usr/bin/env python3
"""
Archive a Stripe Price (set active=false).

Note: Prices are immutable. Cannot change amount after creation.
Archive old prices when amount changes, then create new price.

Usage:
    python3 archive_price.py --price-id "price_xxx"

Returns (stdout):
    {"price_id": "price_xxx", "archived": true, "active": false}

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


def archive_price(price_id: str) -> dict:
    """
    Archive a Stripe Price by setting active=false.

    Args:
        price_id: Stripe price ID (e.g., "price_xxx")

    Returns:
        Dictionary with archived price details

    Raises:
        stripe.error.StripeError: If API call fails
    """
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    if not stripe.api_key:
        raise ValueError("STRIPE_SECRET_KEY environment variable not set")

    # Set active=false to archive
    price = stripe.Price.modify(price_id, active=False)

    return {
        'price_id': price.id,
        'archived': True,
        'active': price.active,
        'unit_amount': price.unit_amount,
        'currency': price.currency
    }


def main():
    parser = argparse.ArgumentParser(description="Archive a Stripe Price")
    parser.add_argument('--price-id', required=True, help="Stripe price ID")

    args = parser.parse_args()

    # Validate inputs
    if not args.price_id or len(args.price_id.strip()) == 0:
        print(json.dumps({"error": "Price ID cannot be empty"}), file=sys.stderr)
        sys.exit(1)

    try:
        result = archive_price(price_id=args.price_id)

        print(json.dumps(result, indent=2))
        sys.exit(0)

    except ValueError as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

    except stripe.error.StripeError as e:
        print(json.dumps({
            "error": str(e),
            "type": type(e).__name__
        }), file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
