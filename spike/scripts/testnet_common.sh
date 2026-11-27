# shellcheck shell=bash
# Helpers shared by the testnet scripts. Sourced after testnet/deployed.env.

USER_KEY=fx-spike-user
MOVER_KEY=fx-spike-mover

balance() { # balance <token> <holder>
  stellar contract invoke --id "$1" --source "$USER_KEY" --network "$NETWORK" -- \
    balance --id "$2" 2>/dev/null | tr -d '"'
}

fetch() { # fetch <result|meta> <hash>: that part of a sent transaction, without the CLI's status lines
  stellar tx fetch "$1" --hash "$2" --network "$NETWORK" --output json-formatted | sed -n '/^{/,$p'
}
