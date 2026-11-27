"""Reads ledger entries from a Stellar RPC in the shape a ledger snapshot file holds."""
import json
import subprocess
import urllib.request

# The public RPC node answers 403 to the default user agent of urllib.
REQUEST_HEADERS = {"Content-Type": "application/json", "User-Agent": "snapshot-tool"}
# The most keys one getLedgerEntries call takes.
KEYS_PER_CALL = 200


def stellar_xdr(arguments: list[str], text: str) -> str:
    done = subprocess.run(["stellar", "xdr", *arguments], input=text, capture_output=True, text=True, check=True)
    return done.stdout.strip()


def call(rpc_url: str, method: str, params: dict) -> dict:
    body = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
    request = urllib.request.Request(rpc_url, json.dumps(body).encode(), REQUEST_HEADERS)
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)["result"]


def read_entries(rpc_url: str, keys: list[dict]) -> tuple[int, list[dict]]:
    """The entries that exist for `keys`, and the ledger they were read at."""
    if len(keys) > KEYS_PER_CALL:
        raise SystemExit(f"{len(keys)} keys, one call takes {KEYS_PER_CALL}")
    encoded = [stellar_xdr(["encode", "--type", "LedgerKey"], json.dumps(key)) for key in keys]
    result = call(rpc_url, "getLedgerEntries", {"keys": encoded})
    entries = []
    for found in result["entries"]:
        data = json.loads(stellar_xdr(["decode", "--type", "LedgerEntryData", "--output", "json"], found["xdr"]))
        entries.append({
            "entry": {"last_modified_ledger_seq": found["lastModifiedLedgerSeq"], "data": data, "ext": "v0"},
            # An account or a trustline has no expiry ledger.
            "live_until": found.get("liveUntilLedgerSeq"),
        })
    return result["latestLedger"], entries


def read_entry(rpc_url: str, key: dict) -> dict:
    _, entries = read_entries(rpc_url, [key])
    if len(entries) != 1:
        raise SystemExit(f"the RPC has no entry for {json.dumps(key)}")
    return entries[0]
