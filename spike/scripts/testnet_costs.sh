#!/usr/bin/env bash
# Simulates the same TUSD to TEUR swap twice against the same pool state on testnet,
# once straight to the Soroswap router and once through the guard, and prints what
# each would cost. Nothing is signed or sent.
#
#   testnet_costs.sh [<amount_in>]
set -euo pipefail

AMOUNT_IN="${1:-1000000000}"
USER_KEY=fx-spike-user
SWAP_FUNCTION=swap_exact_tokens_for_tokens

SPIKE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=/dev/null
. "$SPIKE_DIR/testnet/deployed.env"
OUT="$SPIKE_DIR/testnet/evidence/costs"
mkdir -p "$OUT"
DEADLINE=$(($(date +%s) + 3600))

simulate() { # simulate <name> <contract> <function and arguments...>
  local name="$1" contract="$2"
  shift 2
  stellar contract invoke --id "$contract" --source "$USER_KEY" --network "$NETWORK" --build-only -- "$@" |
    stellar tx simulate --source "$USER_KEY" --network "$NETWORK" >"$OUT/$name.xdr"
  stellar tx decode <"$OUT/$name.xdr" | python3 -m json.tool >"$OUT/$name.json"
}

simulate direct "$ROUTER" "$SWAP_FUNCTION" --amount_in "$AMOUNT_IN" --amount_out_min 0 \
  --path "[\"$TUSD\",\"$TEUR\"]" --to "$USER" --deadline "$DEADLINE"

simulate guarded "$GUARD" guarded_swap --user "$USER" --recipient "$USER" \
  --asset_in "$TUSD" --asset_out "$TEUR" --amount_in "$AMOUNT_IN" --min_out 0 \
  --venue "$ROUTER" --func "$SWAP_FUNCTION" \
  --args "[{\"i128\":\"$AMOUNT_IN\"},{\"i128\":\"0\"},{\"vec\":[{\"address\":\"$TUSD\"},{\"address\":\"$TEUR\"}]},{\"address\":\"$USER\"},{\"u64\":\"$DEADLINE\"}]"

python3 "$SPIKE_DIR/scripts/print_costs.py" "$OUT/direct.json" "$OUT/guarded.json" | tee "$OUT/table.txt"
