#!/usr/bin/env bash
# Simulates the same swap twice against the same pool state on testnet, once straight
# to the venue's router and once through the guard, and prints what each would cost.
# Nothing is signed or sent.
#
#   testnet_costs.sh <venue> <amount_in>
#
# <venue> names a file in scripts/venues/.
set -euo pipefail

VENUE_NAME="$1"
AMOUNT_IN="$2"
USER_KEY=fx-spike-user

SPIKE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=/dev/null
. "$SPIKE_DIR/testnet/deployed.env"
# shellcheck source=/dev/null
. "$SPIKE_DIR/scripts/venues/$VENUE_NAME.sh"
OUT="$SPIKE_DIR/testnet/evidence/$VENUE_NAME-costs"
mkdir -p "$OUT"

simulate() { # simulate <name> <contract> <function and arguments...>
  local name="$1" contract="$2"
  shift 2
  stellar contract invoke --id "$contract" --source "$USER_KEY" --network "$NETWORK" --build-only -- "$@" |
    stellar tx simulate --source "$USER_KEY" --network "$NETWORK" >"$OUT/$name.xdr"
  stellar tx decode <"$OUT/$name.xdr" | python3 -m json.tool >"$OUT/$name.json"
}

direct_call "$AMOUNT_IN" "$USER"
simulate direct "$VENUE" "${DIRECT_CALL[@]}"

simulate guarded "$GUARD" guarded_swap --user "$USER" --recipient "$USER" \
  --asset_in "$ASSET_IN" --asset_out "$ASSET_OUT" --amount_in "$AMOUNT_IN" --min_out 0 \
  --venue "$VENUE" --func "$SWAP_FUNCTION" --args "$(guard_args "$AMOUNT_IN" "$USER")"

python3 "$SPIKE_DIR/scripts/print_costs.py" "$OUT/direct.json" "$OUT/guarded.json" | tee "$OUT/table.txt"
