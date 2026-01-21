#!/usr/bin/env python3
import argparse
import json
import os
import re
import subprocess
from pathlib import Path


def _run_uid_command() -> str:
    try:
        result = subprocess.run(["uid"], capture_output=True, text=True, check=True)
    except FileNotFoundError as exc:
        raise RuntimeError("Missing `uid` command in PATH.") from exc
    output = result.stdout.strip()
    match = re.search(r"(uid-[a-z0-9]{3}-[a-z0-9]{3})", output)
    if not match:
        raise RuntimeError(f"Unexpected uid output: {output}")
    return match.group(1)


def _to_cents(amount_str: str) -> int:
    value = float(amount_str)
    return int(round(value * 100))


def _load_template(template_path: Path) -> dict:
    with template_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _write_job(output_path: Path, data: dict) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2)


def _apply_uid(data: dict, uid: str, no_discount: bool) -> dict:
    coupon_id = uid.replace("uid-", "cou-", 1)
    customer_id = uid.replace("uid-", "cus-", 1)

    data["product"]["id"] = uid
    data["price1"]["product"]["products"][0] = uid
    data["price2"]["product"]["products"][0] = uid
    data["coupon"]["applies_to"]["products"][0] = uid

    data["checkout_session_1"]["return_url"] = data["checkout_session_1"]["return_url"].replace(
        "[uid-xxx-xxx]", uid
    )
    data["checkout_session_2"]["return_url"] = data["checkout_session_2"]["return_url"].replace(
        "[uid-xxx-xxx]", uid
    )

    data["customer"]["id"] = customer_id

    if no_discount:
        data["coupon"]["id"] = None
        if data["checkout_session_1"]["discounts"]:
            data["checkout_session_1"]["discounts"][0]["coupon"] = None
    else:
        data["coupon"]["id"] = coupon_id
        if data["checkout_session_1"]["discounts"]:
            data["checkout_session_1"]["discounts"][0]["coupon"] = coupon_id

    return data


def _apply_fields(data: dict, args: argparse.Namespace) -> dict:
    if args.project:
        data["project"] = args.project
    if args.name:
        data["customer"]["name"] = args.name
    if args.cost is not None:
        total_cents = _to_cents(args.cost)
        per_payment = total_cents // 2
        data["price1"]["unit_amount"] = per_payment
        data["price2"]["unit_amount"] = per_payment
        data["product"]["service_usd"] = float(args.cost)
    if args.discount is not None:
        discount_cents = _to_cents(args.discount)
        data["coupon"]["amount_off"] = discount_cents
        data["product"]["discount_usd"] = float(args.discount)
    return data


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate new job JSON files.")
    parser.add_argument("--count", "-n", type=int, default=1, help="Number of jobs to create.")
    parser.add_argument("--no-discount", "-nd", action="store_true", help="Disable coupon fields.")
    parser.add_argument("--project", "-p", type=str, help="Set the project name.")
    parser.add_argument("--name", "-nme", type=str, help="Set customer.name.")
    parser.add_argument("--discount", "-d", type=str, help="Discount amount in dollars (e.g., 50.00).")
    parser.add_argument("--cost", "-c", type=str, help="Total cost in dollars (e.g., 1000.00).")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    template_path = repo_root / "assets" / "docs" / "uid-xxx-xxx.json"
    jobs_dir = repo_root / "assets" / "docs"

    if not template_path.exists():
        raise RuntimeError(f"Template not found: {template_path}")

    created = []
    for _ in range(args.count):
        uid = _run_uid_command()
        data = _load_template(template_path)
        data = _apply_uid(data, uid, args.no_discount)
        data = _apply_fields(data, args)
        output_path = jobs_dir / f"{uid}.json"
        _write_job(output_path, data)
        created.append(output_path)

    print("Created job files:")
    for path in created:
        print(f"  - {path.relative_to(repo_root)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
