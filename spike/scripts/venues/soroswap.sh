# shellcheck shell=bash
# Soroswap on testnet: TUSD to TEUR through the pool made by testnet_setup.sh.
# Sourced by the testnet scripts after testnet/deployed.env.

IN_NAME=TUSD
OUT_NAME=TEUR
ASSET_IN="$TUSD"
ASSET_OUT="$TEUR"
VENUE="$ROUTER"
POOL="$PAIR"
SWAP_FUNCTION=swap_exact_tokens_for_tokens
DEADLINE_SECONDS=3600

deadline() { echo $(($(date +%s) + DEADLINE_SECONDS)); }

guard_args() { # guard_args <amount_in> <trader>: the router's arguments, its own floor at 0
  printf '[{"i128":"%s"},{"i128":"0"},{"vec":[{"address":"%s"},{"address":"%s"}]},{"address":"%s"},{"u64":"%s"}]' \
    "$1" "$ASSET_IN" "$ASSET_OUT" "$2" "$(deadline)"
}

direct_call() { # direct_call <amount_in> <trader>: sets DIRECT_CALL to the same swap without the guard
  DIRECT_CALL=("$SWAP_FUNCTION" --amount_in "$1" --amount_out_min 0
    --path "[\"$ASSET_IN\",\"$ASSET_OUT\"]" --to "$2" --deadline "$(deadline)")
}
