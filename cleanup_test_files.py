#!/usr/bin/env python3
"""
Clean up test JSON files for fresh testing
Removes automation-generated fields (Stripe IDs, state data)
Handles special cases for different test scenarios
"""

import json
from pathlib import Path
from typing import Dict


TEST_DIR = Path('assets/docs/W_I_P')


def clean_payment_stripe_fields(payment: Dict) -> None:
    """Remove Stripe-generated fields from payment."""
    payment['stripe_product_id'] = None
    payment['stripe_price_id'] = None
    payment['stripe_product_name'] = None
    payment['stripe_metadata'] = {}


def clean_contract_for_unsigned(contract: Dict) -> None:
    """Reset contract to unsigned state."""
    contract['signed'] = False
    contract['signed_date'] = None
    contract['signed_by'] = None
    contract['contractor_signature'] = None
    contract['contractor_date'] = None
    contract['client_date'] = None


def clean_payment_for_unpaid(payment: Dict) -> None:
    """Reset payment to unpaid state."""
    payment['status'] = 'pending'
    payment['paid_date'] = None
    payment['paid_date_unix'] = None
    # Remove payment intent ID if exists
    if 'stripe_payment_intent_id' in payment:
        del payment['stripe_payment_intent_id']


def clean_payment_for_paid(payment: Dict, paid_date: str = "2025-12-20", paid_unix: int = 1734739200) -> None:
    """Set payment to paid state (for test scenarios)."""
    payment['status'] = 'paid'
    payment['paid_date'] = paid_date
    payment['paid_date_unix'] = paid_unix


def clean_test_file(filepath: Path) -> bool:
    """Clean a single test JSON file."""
    try:
        # Load file
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        print(f"\n🔧 Cleaning: {filepath.name}")

        # Clean all Stripe fields from all payments
        for payment in data.get('payments', []):
            clean_payment_stripe_fields(payment)

        # Handle special cases based on filename
        filename = filepath.name

        if filename == 'test-already-signed.json':
            # Keep contract signed, but clean Stripe fields
            print("  ✓ Keeping contract signed (test scenario)")
            # Contract stays as-is (already signed)
            # Clean payment state
            for payment in data.get('payments', []):
                clean_payment_for_unpaid(payment)

        elif filename == 'test-partially-paid.json':
            # First payment paid, second pending
            print("  ✓ Setting first payment paid, second pending (test scenario)")
            clean_contract_for_unsigned(data['contract'])
            payments = data.get('payments', [])
            if len(payments) >= 2:
                clean_payment_for_paid(payments[0])
                clean_payment_for_unpaid(payments[1])

        elif filename == 'test-all-paid.json':
            # All payments paid
            print("  ✓ Setting all payments paid (test scenario)")
            data['contract']['signed'] = True  # Must be signed to have paid
            for payment in data.get('payments', []):
                clean_payment_for_paid(payment)

        else:
            # Default: Clean slate (unsigned contract, unpaid payments)
            print("  ✓ Resetting to clean slate (unsigned, unpaid)")
            clean_contract_for_unsigned(data['contract'])
            for payment in data.get('payments', []):
                clean_payment_for_unpaid(payment)

        # Save cleaned file
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"  ✅ Cleaned: {filepath.name}")
        return True

    except Exception as e:
        print(f"  ❌ Error cleaning {filepath.name}: {e}")
        return False


def main():
    """Main execution."""
    if not TEST_DIR.exists():
        print(f"❌ Test directory not found: {TEST_DIR}")
        return

    # Find all test JSON files
    test_files = sorted(TEST_DIR.glob('test-*.json'))

    if not test_files:
        print(f"❌ No test files found in {TEST_DIR}")
        return

    print(f"🧹 Cleaning {len(test_files)} test files...\n")

    cleaned = 0
    for test_file in test_files:
        if clean_test_file(test_file):
            cleaned += 1

    print(f"\n✅ Cleaned {cleaned}/{len(test_files)} test files")
    print("\n📋 Test files ready for systematic testing!")
    print("   - Stripe IDs removed (will be generated fresh)")
    print("   - State fields reset appropriately")
    print("   - Special scenarios preserved (already-signed, partially-paid, all-paid)")


if __name__ == '__main__':
    main()
