#!/usr/bin/env bash
# Sends one classic path payment of TUSD for TEUR on testnet, from the user to the user,
# against the sell offer made by testnet_setup.sh, and saves what the network did with it.
# No contract is involved: the floor is the operation's own destMin.
#
#   testnet_path_payment.sh <label> <send_amount> <dest_min>
set -euo pipefail

LABEL="$1"
SEND_AMOUNT="$2"
DEST_MIN="$3"

SPIKE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=/dev/null
. "$SPIKE_DIR/testnet/deployed.env"
# shellcheck source=/dev/null
. "$SPIKE_DIR/scripts/testnet_common.sh"
EVIDENCE="$SPIKE_DIR/testnet/evidence/$LABEL"
mkdir -p "$EVIDENCE"

balances() {
  echo "user TUSD $(balance "$TUSD" "$USER")"
  echo "user TEUR $(balance "$TEUR" "$USER")"
}

balances | tee "$EVIDENCE/balances-before.txt"

stellar tx new path-payment-strict-send --source "$USER_KEY" --network "$NETWORK" --build-only \
  --send-asset "TUSD:$ISSUER" --send-amount "$SEND_AMOUNT" \
  --destination "$USER" --dest-asset "TEUR:$ISSUER" --dest-min "$DEST_MIN" |
  stellar tx sign --sign-with-key "$USER_KEY" --network "$NETWORK" >"$EVIDENCE/signed.xdr"
HASH="$(stellar tx hash --network "$NETWORK" <"$EVIDENCE/signed.xdr")"
echo "$HASH" >"$EVIDENCE/hash.txt"

# A transaction the network applies and fails still makes `tx send` exit non-zero.
stellar tx send --network "$NETWORK" <"$EVIDENCE/signed.xdr" >"$EVIDENCE/send.txt" 2>&1 || true
fetch result "$HASH" >"$EVIDENCE/result.json"

balances | tee "$EVIDENCE/balances-after.txt"
echo "hash $HASH"
