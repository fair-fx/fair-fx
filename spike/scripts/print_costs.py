"""Prints the simulated resources of decoded transactions side by side.

    print_costs.py <simulated.json> [<simulated.json> ...]

Each file is a simulated transaction as `stellar tx decode` prints it. The column
name is the file name without its extension.
"""

import json
import sys
from pathlib import Path

ROWS = (
    "instructions",
    "disk_read_bytes",
    "write_bytes",
    "read_only_entries",
    "read_write_entries",
    "envelope_bytes",
    "resource_fee_stroops",
)


def costs(path: Path) -> dict[str, int]:
    transaction = json.loads(path.read_text())["tx"]["tx"]
    soroban = transaction["ext"]["v1"]
    resources = soroban["resources"]
    return {
        "instructions": int(resources["instructions"]),
        "disk_read_bytes": int(resources["disk_read_bytes"]),
        "write_bytes": int(resources["write_bytes"]),
        "read_only_entries": len(resources["footprint"]["read_only"]),
        "read_write_entries": len(resources["footprint"]["read_write"]),
        "envelope_bytes": envelope_bytes(path),
        "resource_fee_stroops": int(soroban["resource_fee"]),
    }


def envelope_bytes(path: Path) -> int:
    """Size of the unsigned envelope, from the XDR file next to the JSON when there is one."""
    xdr = path.with_suffix(".xdr")
    if not xdr.exists():
        return 0
    return len(xdr.read_text().strip()) * 3 // 4


def main(paths: list[Path]) -> None:
    columns = {path.stem: costs(path) for path in paths}
    print(f"{'':24}" + "".join(f"{name:>14}" for name in columns))
    for row in ROWS:
        print(f"{row:24}" + "".join(f"{column[row]:>14,}" for column in columns.values()))


if __name__ == "__main__":
    main([Path(argument) for argument in sys.argv[1:]])
