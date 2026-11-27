# shellcheck shell=bash
# Aquarius on testnet: its test AQUA to its test USDC through one constant product pool.
# Sourced by the testnet scripts after testnet/deployed.env. Needs testnet_setup_aquarius.sh.

# shellcheck source=/dev/null
. "$SPIKE_DIR/testnet/aquarius.env"

IN_NAME=AQUA
OUT_NAME=USDC
ASSET_IN="$AQUA"
ASSET_OUT="$AQUARIUS_USDC"
VENUE="$AQUARIUS_ROUTER"
POOL="$AQUA_USDC_POOL"
SWAP_FUNCTION=swap_chained

# One hop: (the pool's tokens in address order, the pool index, the token that comes out).
guard_args() { # guard_args <amount_in> <trader>: the router's arguments, its own floor at 0
  printf '[{"address":"%s"},{"vec":[{"vec":[{"vec":[{"address":"%s"},{"address":"%s"}]},{"bytes":"%s"},{"address":"%s"}]}]},{"address":"%s"},{"u128":"%s"},{"u128":"0"}]' \
    "$2" "$ASSET_OUT" "$ASSET_IN" "$AQUA_USDC_POOL_INDEX" "$ASSET_OUT" "$ASSET_IN" "$1"
}

direct_call() { # direct_call <amount_in> <trader>: sets DIRECT_CALL to the same swap without the guard
  DIRECT_CALL=("$SWAP_FUNCTION" --user "$2"
    --swaps_chain "[[[\"$ASSET_OUT\",\"$ASSET_IN\"],\"$AQUA_USDC_POOL_INDEX\",\"$ASSET_OUT\"]]"
    --token_in "$ASSET_IN" --in_amount "$1" --out_min 0)
}
