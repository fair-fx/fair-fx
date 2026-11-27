#!/usr/bin/env bash
# Sends one guarded_swap through a venue's router on testnet, signed by the user's key,
# and saves what the network did with it.
#
#   testnet_guarded_swap.sh <venue> <label> <amount_in> <min_out> [<mover_amount>]
#
# <venue> names a file in scripts/venues/: it holds the assets, the router and the
# router's arguments. The router is always given a floor of 0, so the only floor is
# the guard's. With <mover_amount>, a second account sells that much of the input asset
# into the pool after the user's transaction is signed and before it is sent: the price
# the user simulated against is gone when the transaction is applied.
#
# Evidence goes to spike/testnet/evidence/<label>/. Keys stay in the stellar-cli keystore.
set -euo pipefail

VENUE_NAME="$1"
LABEL="$2"
AMOUNT_IN="$3"
MIN_OUT="$4"
MOVER_AMOUNT="${5:-}"

USER_KEY=fx-spike-user
MOVER_KEY=fx-spike-mover

SPIKE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=/dev/null
. "$SPIKE_DIR/testnet/deployed.env"
# shellcheck source=/dev/null
. "$SPIKE_DIR/scripts/venues/$VENUE_NAME.sh"
EVIDENCE="$SPIKE_DIR/testnet/evidence/$LABEL"
mkdir -p "$EVIDENCE"

balance() { # balance <token> <holder>
  stellar contract invoke --id "$1" --source "$USER_KEY" --network "$NETWORK" -- \
    balance --id "$2" 2>/dev/null | tr -d '"'
}

holder_balances() { # holder_balances <name> <address>
  echo "$1 $IN_NAME $(balance "$ASSET_IN" "$2")"
  echo "$1 $OUT_NAME $(balance "$ASSET_OUT" "$2")"
}

balances() {
  holder_balances user "$USER"
  holder_balances pool "$POOL"
  holder_balances guard "$GUARD"
}

balances | tee "$EVIDENCE/balances-before.txt"

stellar contract invoke --id "$GUARD" --source "$USER_KEY" --network "$NETWORK" --build-only -- \
  guarded_swap --user "$USER" --recipient "$USER" --asset_in "$ASSET_IN" --asset_out "$ASSET_OUT" \
  --amount_in "$AMOUNT_IN" --min_out "$MIN_OUT" \
  --venue "$VENUE" --func "$SWAP_FUNCTION" --args "$(guard_args "$AMOUNT_IN" "$USER")" |
  stellar tx simulate --source "$USER_KEY" --network "$NETWORK" >"$EVIDENCE/simulated.xdr"
stellar tx decode <"$EVIDENCE/simulated.xdr" | python3 -m json.tool >"$EVIDENCE/simulated.json"

stellar tx sign --sign-with-key "$USER_KEY" --network "$NETWORK" <"$EVIDENCE/simulated.xdr" \
  >"$EVIDENCE/signed.xdr"
HASH="$(stellar tx hash --network "$NETWORK" <"$EVIDENCE/signed.xdr")"
echo "$HASH" >"$EVIDENCE/hash.txt"

if [ -n "$MOVER_AMOUNT" ]; then
  direct_call "$MOVER_AMOUNT" "$MOVER"
  stellar contract invoke --id "$VENUE" --source "$MOVER_KEY" --network "$NETWORK" -- \
    "${DIRECT_CALL[@]}" >"$EVIDENCE/mover-swap.txt" 2>&1
  balances | tee "$EVIDENCE/balances-after-mover.txt"
fi

fetch() { # fetch <result|meta>: that part of the sent transaction, without the CLI's status lines
  stellar tx fetch "$1" --hash "$HASH" --network "$NETWORK" --output json-formatted | sed -n '/^{/,$p'
}

# A transaction the network applies and fails still makes `tx send` exit non-zero.
stellar tx send --network "$NETWORK" <"$EVIDENCE/signed.xdr" >"$EVIDENCE/send.txt" 2>&1 || true
fetch result >"$EVIDENCE/result.json"
# The metadata holds the diagnostic events: which contract raised which error.
fetch meta >"$EVIDENCE/meta.json"

balances | tee "$EVIDENCE/balances-after.txt"
echo "hash $HASH"
