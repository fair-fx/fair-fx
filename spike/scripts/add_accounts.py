"""Adds classic accounts to a ledger snapshot, read from the RPC as they are now.

Usage: python3 add_accounts.py <snapshot.json> <rpc url> <G... account> [<G... account> ...]

A token contract of a classic asset reads the flags of the asset's issuer account when it opens a
balance for a new holder, and `stellar snapshot create` of stellar-cli 30.0.1 leaves accounts out.
The entry comes from a later ledger than the snapshot: only use it for what rarely changes, such
as the issuer's flags.
"""
import json
import sys

from add_contract_code import read_entry


def main(snapshot_path: str, rpc_url: str, accounts: list[str]) -> None:
    with open(snapshot_path, encoding="utf-8") as file:
        snapshot = json.load(file)
    for account in accounts:
        snapshot["ledger_entries"].append(read_entry(rpc_url, {"account": {"account_id": account}}))
        print("added account", account)
    with open(snapshot_path, "w", encoding="utf-8") as file:
        json.dump(snapshot, file)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3:])
