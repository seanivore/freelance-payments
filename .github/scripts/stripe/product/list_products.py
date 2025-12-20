#!/usr/bin/env python3
"""
List Stripe Products with optional metadata filtering.

Usage:
    python3 list_products.py --limit 100
    python3 list_products.py --metadata-filter '{"job_id":"uid-001"}'

Returns (stdout):
    {"products": [...], "count": 5, "has_more": false}

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


def list_products(limit: int = 100, metadata_filter: dict = None) -> dict:
    """
    List Stripe Products.

    Args:
        limit: Maximum number of products to return (default: 100)
        metadata_filter: Dictionary of metadata to filter by (optional)

    Returns:
        Dictionary with products list and metadata

    Raises:
        stripe.error.StripeError: If API call fails
    """
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    if not stripe.api_key:
        raise ValueError("STRIPE_SECRET_KEY environment variable not set")

    # Build query parameters
    params = {'limit': limit}

    # If metadata filter provided, build search query
    if metadata_filter:
        # Use Stripe's search API for metadata filtering
        # Query format: metadata['key']:'value'
        query_parts = [f"metadata['{k}']:'{v}'" for k, v in metadata_filter.items()]
        query = " AND ".join(query_parts)

        # Use search instead of list
        result = stripe.Product.search(query=query, limit=limit)
    else:
        # Use regular list
        result = stripe.Product.list(**params)

    # Extract product data
    products = []
    for product in result.data:
        products.append({
            'product_id': product.id,
            'name': product.name,
            'description': product.description,
            'active': product.active,
            'metadata': dict(product.metadata) if product.metadata else {},
            'created': product.created,
            'updated': product.updated
        })

    return {
        'products': products,
        'count': len(products),
        'has_more': result.has_more if hasattr(result, 'has_more') else False
    }


def main():
    parser = argparse.ArgumentParser(description="List Stripe Products")
    parser.add_argument('--limit', type=int, default=100, help="Maximum products to return")
    parser.add_argument('--metadata-filter', help="JSON string of metadata to filter by")

    args = parser.parse_args()

    # Parse metadata filter if provided
    metadata_filter = None
    if args.metadata_filter:
        try:
            metadata_filter = json.loads(args.metadata_filter)
        except json.JSONDecodeError as e:
            print(json.dumps({"error": f"Invalid JSON in metadata-filter: {e}"}), file=sys.stderr)
            sys.exit(1)

    # Validate limit
    if args.limit < 1 or args.limit > 100:
        print(json.dumps({"error": "Limit must be between 1 and 100"}), file=sys.stderr)
        sys.exit(1)

    try:
        result = list_products(limit=args.limit, metadata_filter=metadata_filter)

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
