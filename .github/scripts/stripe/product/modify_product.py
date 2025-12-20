#!/usr/bin/env python3
"""
Modify an existing Stripe Product.

Note: Can only modify description and metadata. Name and other fields are immutable.

Usage:
    python3 modify_product.py --product-id "prod_xxx" --description "New description" --metadata '{"job_id":"uid-001"}'

Returns (stdout):
    {"product_id": "prod_xxx", "modified": true, "updated": 1234567890}

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


def modify_product(product_id: str, description: str = None, metadata: dict = None) -> dict:
    """
    Modify a Stripe Product.

    Args:
        product_id: Stripe product ID (e.g., "prod_xxx")
        description: New description (optional)
        metadata: New metadata dictionary (optional)

    Returns:
        Dictionary with updated product details

    Raises:
        stripe.error.StripeError: If API call fails
    """
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    if not stripe.api_key:
        raise ValueError("STRIPE_SECRET_KEY environment variable not set")

    # Build update parameters
    update_params = {}

    if description is not None:
        update_params['description'] = description

    if metadata is not None:
        update_params['metadata'] = metadata

    # Modify the product
    product = stripe.Product.modify(product_id, **update_params)

    return {
        'product_id': product.id,
        'modified': True,
        'name': product.name,
        'description': product.description,
        'active': product.active,
        'metadata': dict(product.metadata) if product.metadata else {},
        'updated': product.updated
    }


def main():
    parser = argparse.ArgumentParser(description="Modify a Stripe Product")
    parser.add_argument('--product-id', required=True, help="Stripe product ID")
    parser.add_argument('--description', help="New product description")
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
    if not args.product_id or len(args.product_id.strip()) == 0:
        print(json.dumps({"error": "Product ID cannot be empty"}), file=sys.stderr)
        sys.exit(1)

    # Must provide at least one modification
    if args.description is None and args.metadata is None:
        print(json.dumps({"error": "Must provide at least --description or --metadata"}), file=sys.stderr)
        sys.exit(1)

    try:
        result = modify_product(
            product_id=args.product_id,
            description=args.description,
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
