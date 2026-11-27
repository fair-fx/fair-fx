"""Adds the wasm of every contract in a ledger snapshot that the snapshot lacks.

Usage: python3 add_contract_code.py <snapshot.json> <rpc url>

`stellar snapshot create` of stellar-cli 30.0.1 looks the wasm up and then leaves it out: it only
writes contract data entries. A wasm entry is fixed by its hash, so reading it from the RPC at a
later ledger gives the same bytes.
"""
import json
import sys

from ledger_rpc import read_entry

INSTANCE_KEY = "ledger_key_contract_instance"


def wasm_hashes(entries: list[dict], kind: str) -> set[str]:
    hashes = set()
    for item in entries:
        data = item["entry"]["data"]
        if kind == "code" and "contract_code" in data:
            hashes.add(data["contract_code"]["hash"])
        if kind == "instance" and data.get("contract_data", {}).get("key") == INSTANCE_KEY:
            executable = data["contract_data"]["val"]["contract_instance"]["executable"]
            if isinstance(executable, dict) and "wasm" in executable:
                hashes.add(executable["wasm"])
    return hashes


def main(snapshot_path: str, rpc_url: str) -> None:
    with open(snapshot_path, encoding="utf-8") as file:
        snapshot = json.load(file)
    entries = snapshot["ledger_entries"]
    missing = sorted(wasm_hashes(entries, "instance") - wasm_hashes(entries, "code"))
    for wasm_hash in missing:
        entries.append(read_entry(rpc_url, {"contract_code": {"hash": wasm_hash}}))
        print("added wasm", wasm_hash)
    with open(snapshot_path, "w", encoding="utf-8") as file:
        json.dump(snapshot, file)
    print(f"{len(missing)} added, {len(entries)} entries in {snapshot_path}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
