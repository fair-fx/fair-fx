#!/usr/bin/env bash
# Reads the EUR price of the Reflector fiat feed on testnet from inside a contract.
# Deploys the reader on the first run. One read is sent as a transaction, two more are
# simulated only, because a read that fails in simulation is never sent.
#
#   testnet_oracle_read.sh
set -euo pipefail

# The Reflector feed of fiat rates on testnet, quoted in USD with 14 decimals.
REFLECTOR_FIAT_FEED=CCSSOHTBL3LEWUCBBEB5NJFC2OKFRC74OWEIJIZLRJBGAAU4VMU5NV4W
MAX_AGE_SECONDS=600
TOO_STRICT_AGE_SECONDS=1

SPIKE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=/dev/null
. "$SPIKE_DIR/testnet/deployed.env"
# shellcheck source=/dev/null
. "$SPIKE_DIR/scripts/testnet_common.sh"
ENV_FILE="$SPIKE_DIR/testnet/oracle.env"
EVIDENCE="$SPIKE_DIR/testnet/evidence/oracle-read"
WASM="$SPIKE_DIR/target/wasm32v1-none/release/spike_oracle_read.wasm"
mkdir -p "$EVIDENCE"

if [ ! -f "$ENV_FILE" ]; then
  READER="$(stellar contract deploy --wasm "$WASM" --source "$USER_KEY" --network "$NETWORK")"
  cat >"$ENV_FILE" <<ENV
# Public testnet addresses of the oracle read. No secrets here.
REFLECTOR_FIAT_FEED=$REFLECTOR_FIAT_FEED
ORACLE_READER=$READER
ORACLE_READER_WASM_SHA256=$(shasum -a 256 "$WASM" | cut -d' ' -f1)
ENV
fi
# shellcheck source=/dev/null
. "$ENV_FILE"

read_price() { # read_price <file> <symbol> <max age> [<extra invoke flag>]: output and errors to the file
  stellar contract invoke --id "$ORACLE_READER" --source "$USER_KEY" --network "$NETWORK" ${4:-} -- \
    fiat_price --oracle "$REFLECTOR_FIAT_FEED" --symbol "$2" --max_age_seconds "$3" \
    >"$EVIDENCE/$1" 2>&1 || true
}

read_price sent-eur.txt EUR "$MAX_AGE_SECONDS" --send=yes
read_price simulated-eur-too-strict.txt EUR "$TOO_STRICT_AGE_SECONDS"
read_price simulated-unknown-symbol.txt XXX "$MAX_AGE_SECONDS"

grep -h -E '^\{|Error\(Contract|Signing transaction|contract":' "$EVIDENCE"/*.txt | cut -c1-200
