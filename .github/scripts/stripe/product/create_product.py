#!/usr/bin/env python3
"""
Create a Stripe Product.

Usage:
    python3 create_product.py --name "Product Name" --description "Description" --metadata '{"job_id":"uid-001"}'

Returns (stdout):
    {"product_id": "prod_xxx", "name": "Product Name", "created": 1234567890}

Exit codes:
    0 = Success
    1 = Validation error
    2 = Stripe API error
"""

import sys
import json
import argparse
import os

# Import Stripe (graceful handling if not installed)
try:
    import stripe
except ImportError:
    print(json.dumps({"error": "Stripe library not installed. Run: pip install stripe"}), file=sys.stderr)
    sys.exit(2)


def create_product(name: str, description: str = None, metadata: dict = None) -> dict:
    """
    Create a Stripe Product.

    Args:
        name: Product name (e.g., "Website for Everlastings by Emy")
        description: Product description (optional)
        metadata: Dictionary of metadata (optional)

    Returns:
        Dictionary with product details

    Raises:
        stripe.error.StripeError: If API call fails
    """
    # Configure Stripe API key
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

    if not stripe.api_key:
        raise ValueError("STRIPE_SECRET_KEY environment variable not set")

    # Create the product
    product_params = {
        'name': name,
        'active': True  # New products are active by default
    }

    if description:
        product_params['description'] = description

    if metadata:
        product_params['metadata'] = metadata

    product = stripe.Product.create(**product_params)

    return {
        'product_id': product.id,
        'name': product.name,
        'description': product.description,
        'active': product.active,
        'metadata': dict(product.metadata) if product.metadata else {},
        'created': product.created,
        'updated': product.updated
    }


def main():
    parser = argparse.ArgumentParser(description="Create a Stripe Product")
    parser.add_argument('--name', required=True, help="Product name")
    parser.add_argument('--description', help="Product description")
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
    if not args.name or len(args.name.strip()) == 0:
        print(json.dumps({"error": "Product name cannot be empty"}), file=sys.stderr)
        sys.exit(1)

    try:
        # Create the product
        result = create_product(
            name=args.name,
            description=args.description,
            metadata=metadata
        )

        # Output result as JSON
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
