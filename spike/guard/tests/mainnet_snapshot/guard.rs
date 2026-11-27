use soroban_sdk::{
    Address, IntoVal, Symbol,
    testutils::{AuthorizedFunction, AuthorizedInvocation},
    vec,
};
use spike_guard::{Error, SwapResult};

use crate::world::{AMOUNT_OUT, SOROSWAP_USDC_EURC_PAIR, SWAP, trade};

#[test]
fn the_guard_swaps_through_the_mainnet_router_at_the_quoted_amount() {
    let trade = trade();

    let result = trade.guarded_swap(AMOUNT_OUT);

    assert_eq!(
        result,
        Ok(SwapResult {
            spent: 1_000_000_000,
            received: 917_403_921
        })
    );
    assert_eq!(trade.balances(), (0, 917_403_921));
}

#[test]
fn the_guard_undoes_a_mainnet_swap_that_pays_one_unit_under_the_floor() {
    let trade = trade();

    let result = trade.guarded_swap(AMOUNT_OUT + 1);

    assert_eq!(result, Err(Error::BelowFloor));
    assert_eq!(trade.balances(), (1_000_000_000, 0));
}

/// The calls of one authorization, outermost first, as (contract, function) with the depth.
fn calls(
    invocation: &AuthorizedInvocation,
    depth: u32,
    found: &mut std::vec::Vec<(u32, Address, Symbol)>,
) {
    if let AuthorizedFunction::Contract((contract, function, _)) = &invocation.function {
        found.push((depth, contract.clone(), function.clone()));
    }
    for inner in &invocation.sub_invocations {
        calls(inner, depth + 1, found);
    }
}

#[test]
fn the_user_signs_one_tree_from_the_guard_down_to_the_usdc_transfer() {
    let trade = trade();
    let env = &trade.env;

    trade
        .guarded_swap(AMOUNT_OUT)
        .expect("the swap goes through");
    let authorizations = env.auths();

    let [(signer, root)] = authorizations.as_slice() else {
        panic!("expected one authorization, got {}", authorizations.len());
    };
    let mut tree = std::vec::Vec::new();
    calls(root, 0, &mut tree);
    assert_eq!(signer, &trade.user);
    assert_eq!(
        tree,
        [
            (0, trade.guard.clone(), Symbol::new(env, "guarded_swap")),
            (1, trade.router.clone(), Symbol::new(env, SWAP)),
            (2, trade.usdc.clone(), Symbol::new(env, "transfer")),
        ]
    );
    let transfer = &root.sub_invocations[0].sub_invocations[0];
    assert_eq!(
        transfer.function,
        AuthorizedFunction::Contract((
            trade.usdc.clone(),
            Symbol::new(env, "transfer"),
            vec![
                env,
                trade.user.into_val(env),
                Address::from_str(env, SOROSWAP_USDC_EURC_PAIR).into_val(env),
                1_000_000_000_i128.into_val(env),
            ],
        ))
    );
}
