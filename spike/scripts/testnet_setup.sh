#!/usr/bin/env bash
# Sets up everything the testnet swaps need, once:
# four funded accounts, two classic test assets wrapped as token contracts,
# a Soroswap pool holding both, and the spike guard contract.
#
# Keys live in the stellar-cli keystore under the names below, never in this repo.
# The public addresses that result are written to spike/testnet/deployed.env.
set -euo pipefail

NETWORK=testnet
ROUTER=CCJUD55AG6W5HAI5LRVNKAE5WDP5XGZBUDS5WNTIVDU7O264UZZE7BRD
ISSUER=fx-spike-issuer
PROVIDER=fx-spike-provider
USER_KEY=fx-spike-user
MOVER=fx-spike-mover

# Amounts are in stroops: 7 decimals, as USDC and EURC have on Stellar.
POOL_TUSD=1000000000000   # 100,000 TUSD
POOL_TEUR=920000000000    #  92,000 TEUR
WALLET=100000000000       #  10,000 of each asset for the user and the mover
PROVIDER_FUNDS=2000000000000

SPIKE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$SPIKE_DIR/testnet/deployed.env"
WASM="$SPIKE_DIR/target/wasm32v1-none/release/spike_guard.wasm"

for key in "$ISSUER" "$PROVIDER" "$USER_KEY" "$MOVER"; do
  stellar keys address "$key" >/dev/null 2>&1 ||
    stellar keys generate "$key" --network "$NETWORK" --fund
done

ISSUER_ADDR="$(stellar keys address "$ISSUER")"
TUSD="TUSD:$ISSUER_ADDR"
TEUR="TEUR:$ISSUER_ADDR"

for asset in "$TUSD" "$TEUR"; do
  stellar contract asset deploy --asset "$asset" --source "$ISSUER" --network "$NETWORK" ||
    echo "token contract for $asset already exists"
done
TUSD_ID="$(stellar contract id asset --asset "$TUSD" --network "$NETWORK")"
TEUR_ID="$(stellar contract id asset --asset "$TEUR" --network "$NETWORK")"

fund() { # fund <key> <amount>: trustline, then a payment from the issuer, for both assets
  local key="$1" amount="$2" asset
  for asset in "$TUSD" "$TEUR"; do
    stellar tx new change-trust --source "$key" --line "$asset" --network "$NETWORK"
    stellar tx new payment --source "$ISSUER" --destination "$(stellar keys address "$key")" \
      --asset "$asset" --amount "$amount" --network "$NETWORK"
  done
}
fund "$PROVIDER" "$PROVIDER_FUNDS"
fund "$USER_KEY" "$WALLET"
fund "$MOVER" "$WALLET"

DEADLINE=$(($(date +%s) + 3600))
stellar contract invoke --id "$ROUTER" --source "$PROVIDER" --network "$NETWORK" -- add_liquidity \
  --token_a "$TUSD_ID" --token_b "$TEUR_ID" \
  --amount_a_desired "$POOL_TUSD" --amount_b_desired "$POOL_TEUR" \
  --amount_a_min 0 --amount_b_min 0 \
  --to "$(stellar keys address "$PROVIDER")" --deadline "$DEADLINE"
PAIR_ID="$(stellar contract invoke --id "$ROUTER" --source "$PROVIDER" --network "$NETWORK" -- \
  router_pair_for --token_a "$TUSD_ID" --token_b "$TEUR_ID" | tr -d '"')"

GUARD_ID="$(stellar contract deploy --wasm "$WASM" --source "$PROVIDER" --network "$NETWORK")"

mkdir -p "$(dirname "$OUT")"
cat >"$OUT" <<EOF
# Public testnet addresses made by scripts/testnet_setup.sh. No secrets here.
NETWORK=$NETWORK
ROUTER=$ROUTER
ISSUER=$ISSUER_ADDR
PROVIDER=$(stellar keys address "$PROVIDER")
USER=$(stellar keys address "$USER_KEY")
MOVER=$(stellar keys address "$MOVER")
TUSD=$TUSD_ID
TEUR=$TEUR_ID
PAIR=$PAIR_ID
GUARD=$GUARD_ID
GUARD_WASM_SHA256=$(shasum -a 256 "$WASM" | cut -d' ' -f1)
EOF
cat "$OUT"
