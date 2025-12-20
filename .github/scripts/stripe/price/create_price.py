#!/usr/bin/env python3
"""
Create a Stripe Price for a Product.

CRITICAL: Must provide --product to link price to the correct product!

Usage:
    python3 create_price.py --product "prod_xxx" --unit-amount 125000 --currency usd --nickname "Deposit (25%)" --metadata '{"payment_number":"1"}'

Returns (stdout):
    {"price_id": "price_xxx", "product": "prod_xxx", "unit_amount": 125000, "currency": "usd"}

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


def create_price(
    product: str,
    unit_amount: int,
    currency: str = "usd",
    nickname: str = None,
    metadata: dict = None
) -> dict:
    """
    Create a Stripe Price for a Product.

    Args:
        product: Stripe product ID (e.g., "prod_xxx") - REQUIRED!
        unit_amount: Amount in cents (e.g., 125000 for $1,250.00)
        currency: Currency code (default: "usd")
        nickname: Human-readable price name (optional)
        metadata: Dictionary of metadata (optional)

    Returns:
        Dictionary with price details

    Raises:
        stripe.error.StripeError: If API call fails
    """
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    if not stripe.api_key:
        raise ValueError("STRIPE_SECRET_KEY environment variable not set")

    # Build price parameters
    price_params = {
        'product': product,  # CRITICAL: Links to product
        'unit_amount': unit_amount,
        'currency': currency.lower(),
        'active': True  # New prices are active by default
    }

    if nickname:
        price_params['nickname'] = nickname

    if metadata:
        price_params['metadata'] = metadata

    # Create the price
    price = stripe.Price.create(**price_params)

    return {
        'price_id': price.id,
        'product': price.product,
        'unit_amount': price.unit_amount,
        'currency': price.currency,
        'nickname': price.nickname,
        'active': price.active,
        'metadata': dict(price.metadata) if price.metadata else {},
        'created': price.created
    }


def main():
    parser = argparse.ArgumentParser(description="Create a Stripe Price")
    parser.add_argument('--product', required=True, help="Stripe product ID (REQUIRED!)")
    parser.add_argument('--unit-amount', type=int, required=True, help="Amount in cents")
    parser.add_argument('--currency', default='usd', help="Currency code (default: usd)")
    parser.add_argument('--nickname', help="Human-readable price name")
    parser.add_argument('--metadata', help="JSON string of metadata")

    args = parser.parse_args()

    # Parse metadata if provided
    metadata = None
    if args.metadata:
        try:
            metadata = json.loads(args.metadata)
        except json.JSONDecodeError as e:
            print(json.dumps({"error": f"Invalid JSON in metadata: {e}"}), file=sys.stderr)
            sys.exit(1)

    # Validate inputs
    if not args.product or len(args.product.strip()) == 0:
        print(json.dumps({"error": "Product ID cannot be empty"}), file=sys.stderr)
        sys.exit(1)

    if args.unit_amount < 0:
        print(json.dumps({"error": "Unit amount must be positive"}), file=sys.stderr)
        sys.exit(1)

    try:
        result = create_price(
            product=args.product,
            unit_amount=args.unit_amount,
            currency=args.currency,
            nickname=args.nickname,
            metadata=metadata
        )

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
