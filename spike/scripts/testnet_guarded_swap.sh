#!/usr/bin/env bash
# Sends one guarded_swap of TUSD for TEUR through the Soroswap router on testnet,
# signed by the user's key, and saves what the network did with it.
#
#   testnet_guarded_swap.sh <label> <amount_in> <min_out> [<mover_amount>]
#
# The router is always given amount_out_min = 0, so the only floor is the guard's.
# With <mover_amount>, a second account sells that much TUSD into the pool after the
# user's transaction is signed and before it is sent: the price the user simulated
# against is gone when the transaction is applied.
#
# Evidence goes to spike/testnet/evidence/<label>/. Keys stay in the stellar-cli keystore.
set -euo pipefail

LABEL="$1"
AMOUNT_IN="$2"
MIN_OUT="$3"
MOVER_AMOUNT="${4:-}"

USER_KEY=fx-spike-user
MOVER_KEY=fx-spike-mover
SWAP_FUNCTION=swap_exact_tokens_for_tokens
DEADLINE_SECONDS=3600

SPIKE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=/dev/null
. "$SPIKE_DIR/testnet/deployed.env"
EVIDENCE="$SPIKE_DIR/testnet/evidence/$LABEL"
mkdir -p "$EVIDENCE"

balance() { # balance <token> <holder>
  stellar contract invoke --id "$1" --source "$USER_KEY" --network "$NETWORK" -- \
    balance --id "$2" 2>/dev/null | tr -d '"'
}

balances() {
  echo "user TUSD $(balance "$TUSD" "$USER")"
  echo "user TEUR $(balance "$TEUR" "$USER")"
  echo "pair TUSD $(balance "$TUSD" "$PAIR")"
  echo "pair TEUR $(balance "$TEUR" "$PAIR")"
  echo "guard TUSD $(balance "$TUSD" "$GUARD")"
  echo "guard TEUR $(balance "$TEUR" "$GUARD")"
}

router_args() { # router_args <amount_in> <trader>: the Vec<Val> the router's swap takes
  local deadline=$(($(date +%s) + DEADLINE_SECONDS))
  printf '[{"i128":"%s"},{"i128":"0"},{"vec":[{"address":"%s"},{"address":"%s"}]},{"address":"%s"},{"u64":"%s"}]' \
    "$1" "$TUSD" "$TEUR" "$2" "$deadline"
}

balances | tee "$EVIDENCE/balances-before.txt"

stellar contract invoke --id "$GUARD" --source "$USER_KEY" --network "$NETWORK" --build-only -- \
  guarded_swap --user "$USER" --recipient "$USER" --asset_in "$TUSD" --asset_out "$TEUR" \
  --amount_in "$AMOUNT_IN" --min_out "$MIN_OUT" \
  --venue "$ROUTER" --func "$SWAP_FUNCTION" --args "$(router_args "$AMOUNT_IN" "$USER")" |
  stellar tx simulate --source "$USER_KEY" --network "$NETWORK" >"$EVIDENCE/simulated.xdr"
stellar tx decode <"$EVIDENCE/simulated.xdr" | python3 -m json.tool >"$EVIDENCE/simulated.json"

stellar tx sign --sign-with-key "$USER_KEY" --network "$NETWORK" <"$EVIDENCE/simulated.xdr" \
  >"$EVIDENCE/signed.xdr"
HASH="$(stellar tx hash --network "$NETWORK" <"$EVIDENCE/signed.xdr")"
echo "$HASH" >"$EVIDENCE/hash.txt"

if [ -n "$MOVER_AMOUNT" ]; then
  stellar contract invoke --id "$ROUTER" --source "$MOVER_KEY" --network "$NETWORK" -- \
    "$SWAP_FUNCTION" --amount_in "$MOVER_AMOUNT" --amount_out_min 0 \
    --path "[\"$TUSD\",\"$TEUR\"]" --to "$MOVER" --deadline $(($(date +%s) + DEADLINE_SECONDS)) \
    >"$EVIDENCE/mover-swap.txt" 2>&1
  balances | tee "$EVIDENCE/balances-after-mover.txt"
fi

# A transaction the network applies and fails still makes `tx send` exit non-zero.
stellar tx send --network "$NETWORK" <"$EVIDENCE/signed.xdr" >"$EVIDENCE/send.txt" 2>&1 || true
stellar tx fetch result --hash "$HASH" --network "$NETWORK" --output json-formatted \
  >"$EVIDENCE/result.json"
# The metadata holds the diagnostic events: which contract raised which error.
stellar tx fetch meta --hash "$HASH" --network "$NETWORK" --output json-formatted \
  >"$EVIDENCE/meta.json"

balances | tee "$EVIDENCE/balances-after.txt"
echo "hash $HASH"
