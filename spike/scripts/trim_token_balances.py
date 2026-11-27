"""Writes a copy of a ledger snapshot without the token balances and allowances nobody in a test reads.

Usage: python3 trim_token_balances.py <snapshot.json> <out.json> --token <C...>... --holder <address>...

A snapshot of a widely held token carries one entry per holder. Only the `Balance` and `Allowance`
entries of the given tokens are dropped, and those that name a given holder stay.
"""
import argparse
import json

DROPPED_KINDS = ("Balance", "Allowance")


def is_unread(item: dict, tokens: set[str], holders: set[str]) -> bool:
    data = item["entry"]["data"].get("contract_data")
    if data is None or data["contract"] not in tokens:
        return False
    key = data["key"]
    if not isinstance(key, dict) or "vec" not in key or key["vec"][0].get("symbol") not in DROPPED_KINDS:
        return False
    return not any(holder in json.dumps(key) for holder in holders)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("snapshot")
    parser.add_argument("out")
    parser.add_argument("--token", action="append", required=True)
    parser.add_argument("--holder", action="append", required=True)
    options = parser.parse_args()

    with open(options.snapshot, encoding="utf-8") as file:
        snapshot = json.load(file)
    before = len(snapshot["ledger_entries"])
    tokens, holders = set(options.token), set(options.holder)
    snapshot["ledger_entries"] = [item for item in snapshot["ledger_entries"] if not is_unread(item, tokens, holders)]
    with open(options.out, "w", encoding="utf-8") as file:
        json.dump(snapshot, file, indent=1)
    print(f"{before} entries in, {len(snapshot['ledger_entries'])} out, written to {options.out}")


if __name__ == "__main__":
    main()
