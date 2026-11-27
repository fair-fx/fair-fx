#!/usr/bin/env bash
# Gives the user and the mover of testnet_setup.sh what the Aquarius runs need:
# trustlines for Aquarius' own test AQUA and USDC, and test AQUA bought with XLM
# through the Aquarius router on the route its API returns.
#
# Run testnet_setup.sh first. Public addresses are written to spike/testnet/aquarius.env.
set -euo pipefail

NETWORK=testnet
API=https://amm-api-testnet.aqua.network
# From https://docs.aqua.network/developers/reference/addresses-and-networks
AQUARIUS_ROUTER=CBCFTQSPDBAIZ6R6PJQKSQWKNKWH2QIV3I4J72SHWBIK3ADRRAM5A6GD
TEST_ISSUER=GAHPYWLK6YRN7CVYZOO4H3VDRZ7PVF5UJGLZCSPAEIKJE2XSWF5LAGER
AQUA_USDC_POOL=CCF5VCV3ZNY4K4EDPIBTCUFT4YUJ4TZ5DZ2KNUVPO4IF2JAHDB73MFXJ
XLM_TO_SPEND=1000000000   # 100 XLM each

SPIKE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$SPIKE_DIR/testnet/aquarius.env"
XLM_ID="$(stellar contract id asset --asset native --network "$NETWORK")"
AQUA_ID="$(stellar contract id asset --asset "AQUA:$TEST_ISSUER" --network "$NETWORK")"
USDC_ID="$(stellar contract id asset --asset "USDC:$TEST_ISSUER" --network "$NETWORK")"

find_path() { # find_path <token in> <token out> <amount>: the API's answer as JSON
  curl -sS -X POST "$API/api/external/v1/find-path/" \
    -H 'Content-Type: application/json' -H 'User-Agent: spike-tool' \
    -d "{\"token_in_address\":\"$1\",\"token_out_address\":\"$2\",\"amount\":$3}"
}

chain_argument() { # the swaps_chain of a find-path answer on stdin, as the CLI takes it
  python3 -c 'import json, sys; print(json.load(sys.stdin)["swap_chain_xdr"])' |
    stellar xdr decode --type ScVal --output json |
    python3 -c '
import json, sys
hops = json.load(sys.stdin)["vec"]
print(json.dumps([[[t["address"] for t in h["vec"][0]["vec"]], h["vec"][1]["bytes"], h["vec"][2]["address"]] for h in hops]))'
}

for key in fx-spike-user fx-spike-mover; do
  for code in AQUA USDC; do
    stellar tx new change-trust --source "$key" --line "$code:$TEST_ISSUER" --network "$NETWORK"
  done
  CHAIN="$(find_path "$XLM_ID" "$AQUA_ID" "$XLM_TO_SPEND" | chain_argument)"
  stellar contract invoke --id "$AQUARIUS_ROUTER" --source "$key" --network "$NETWORK" -- swap_chained \
    --user "$(stellar keys address "$key")" --swaps_chain "$CHAIN" \
    --token_in "$XLM_ID" --in_amount "$XLM_TO_SPEND" --out_min 0
done

POOL_INDEX="$(curl -sS "$API/pools/$AQUA_USDC_POOL/" -H 'User-Agent: spike-tool' |
  python3 -c 'import json, sys; print(json.load(sys.stdin)["index"])')"

cat >"$OUT" <<ENV
# Public testnet addresses of the Aquarius runs. No secrets here.
AQUARIUS_ROUTER=$AQUARIUS_ROUTER
AQUA=$AQUA_ID
AQUARIUS_USDC=$USDC_ID
AQUA_USDC_POOL=$AQUA_USDC_POOL
AQUA_USDC_POOL_INDEX=$POOL_INDEX
ENV
cat "$OUT"
