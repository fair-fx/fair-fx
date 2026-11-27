"""Makes a ledger snapshot from the entries one simulated transaction touches.

Usage: python3 snapshot_from_footprint.py <simulated.json> <header.json> <rpc url> <out.json>

<simulated.json> is a simulated transaction as `stellar tx decode` prints it: its footprint names
every ledger entry the call read or wrote. <header.json> is another snapshot of the same network,
for the settings a snapshot starts with. All entries come from one RPC call, so they are the state
of one ledger, and that ledger becomes the snapshot's. No 14 GB download, but only this one call
is sure to run on the result.
"""
import json
import sys

from ledger_rpc import call, read_entries

HEADER_FIELDS = (
    "protocol_version", "network_id", "base_reserve",
    "min_persistent_entry_ttl", "min_temp_entry_ttl", "max_entry_ttl",
)


def footprint_keys(simulated_path: str) -> list[dict]:
    with open(simulated_path, encoding="utf-8") as file:
        footprint = json.load(file)["tx"]["tx"]["ext"]["v1"]["resources"]["footprint"]
    return footprint["read_only"] + footprint["read_write"]


def close_time(rpc_url: str, ledger: int) -> int:
    ledgers = call(rpc_url, "getLedgers", {"startLedger": ledger, "pagination": {"limit": 1}})["ledgers"]
    return int(ledgers[0]["ledgerCloseTime"])


def main(simulated_path: str, header_path: str, rpc_url: str, out_path: str) -> None:
    with open(header_path, encoding="utf-8") as file:
        header = json.load(file)
    keys = footprint_keys(simulated_path)
    ledger, entries = read_entries(rpc_url, keys)
    snapshot = {field: header[field] for field in HEADER_FIELDS}
    snapshot["sequence_number"] = ledger
    snapshot["timestamp"] = close_time(rpc_url, ledger)
    snapshot["ledger_entries"] = entries
    with open(out_path, "w", encoding="utf-8") as file:
        json.dump(snapshot, file)
    print(f"{len(entries)} of {len(keys)} footprint entries exist, ledger {ledger}, written to {out_path}")


if __name__ == "__main__":
    main(*sys.argv[1:5])
