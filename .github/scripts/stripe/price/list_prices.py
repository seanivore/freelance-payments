#!/usr/bin/env python3
"""
List/search Stripe Prices by job_id or product.

Note: Use search to filter by metadata (job_id). Returns only relevant prices.

Usage:
    python3 list_prices.py --job-id "uid-001"
    python3 list_prices.py --product "prod_xxx"

Returns (stdout):
    {"prices": [...], "count": 3}

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


def list_prices(job_id: str = None, product: str = None, limit: int = 100) -> dict:
    """
    List Stripe Prices filtered by job_id or product.

    Args:
        job_id: Filter by job_id in metadata (optional)
        product: Filter by product ID (optional)
        limit: Maximum prices to return (default: 100)

    Returns:
        Dictionary with prices list

    Raises:
        stripe.error.StripeError: If API call fails
    """
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    if not stripe.api_key:
        raise ValueError("STRIPE_SECRET_KEY environment variable not set")

    prices_list = []

    if job_id:
        # Use search API to filter by metadata
        query = f"active:'true' AND metadata['job_id']:'{job_id}'"
        result = stripe.Price.search(query=query, limit=limit)
        prices_list = result.data
    elif product:
        # Use list API to get prices for a specific product
        result = stripe.Price.list(product=product, limit=limit)
        prices_list = result.data
    else:
        # List all prices (be careful with this - could be many!)
        result = stripe.Price.list(limit=limit)
        prices_list = result.data

    # Extract price data
    prices = []
    for price in prices_list:
        prices.append({
            'price_id': price.id,
            'product': price.product,
            'unit_amount': price.unit_amount,
            'currency': price.currency,
            'nickname': price.nickname,
            'active': price.active,
            'metadata': dict(price.metadata) if price.metadata else {},
            'created': price.created
        })

    return {
        'prices': prices,
        'count': len(prices)
    }


def main():
    parser = argparse.ArgumentParser(description="List/search Stripe Prices")
    parser.add_argument('--job-id', help="Filter by job_id in metadata")
    parser.add_argument('--product', help="Filter by product ID")
    parser.add_argument('--limit', type=int, default=100, help="Maximum prices to return")

    args = parser.parse_args()

    # Validate: must provide at least one filter
    if not args.job_id and not args.product:
        print(json.dumps({"error": "Must provide --job-id or --product to filter prices"}), file=sys.stderr)
        sys.exit(1)

    # Validate limit
    if args.limit < 1 or args.limit > 100:
        print(json.dumps({"error": "Limit must be between 1 and 100"}), file=sys.stderr)
        sys.exit(1)

    try:
        result = list_prices(job_id=args.job_id, product=args.product, limit=args.limit)

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
