//! The mainnet Soroswap router, alone and under the guard.

use soroban_sdk::{Address, IntoVal, Symbol, Val, Vec, testutils::AuthorizedFunction, vec};
use spike_guard::{Error, SwapResult};

use crate::{
    auth_tree::calls,
    world::{AMOUNT_IN, EURC, Trade, USDC, Venue, mainnet, trade},
};

const SOROSWAP_USDC_EURC_PAIR: &str = "CC7CDFY2VGDODJ7WPO3JIK2MXLOAXL4LRQCC43UJDBAIJ4SVFO3HNPOC";
const SWAP: &str = "swap_exact_tokens_for_tokens";
// What the router pays for AMOUNT_IN at the ledger of the snapshot.
const AMOUNT_OUT: i128 = 917_403_921;

static SOROSWAP: Venue = Venue {
    snapshot: "soroswap-usdc-eurc.json",
    router: "CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH",
    function: SWAP,
    args: swap_args,
};

fn swap_args(trade: &Trade) -> Vec<Val> {
    let env = &trade.env;
    let route = vec![env, trade.usdc.clone(), trade.eurc.clone()];
    let deadline = env.ledger().timestamp() + 600;
    vec![
        env,
        AMOUNT_IN.into_val(env),
        0_i128.into_val(env),
        route.into_val(env),
        trade.user.into_val(env),
        deadline.into_val(env),
    ]
}

#[test]
fn the_mainnet_soroswap_router_quotes_100_usdc_in_eurc() {
    let env = mainnet(SOROSWAP.snapshot);
    let router = Address::from_str(&env, SOROSWAP.router);
    let route = vec![
        &env,
        Address::from_str(&env, USDC),
        Address::from_str(&env, EURC),
    ];

    let amounts: Vec<i128> = env.invoke_contract(
        &router,
        &Symbol::new(&env, "router_get_amounts_out"),
        vec![
            &env,
            1_000_000_000_i128.into_val(&env),
            route.into_val(&env),
        ],
    );

    assert_eq!(env.ledger().sequence(), 65_698_431);
    assert_eq!(amounts, vec![&env, 1_000_000_000, 917_403_921]);
}

#[test]
fn the_guard_swaps_through_the_mainnet_router_at_the_quoted_amount() {
    let trade = trade(&SOROSWAP);

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
    let trade = trade(&SOROSWAP);

    let result = trade.guarded_swap(AMOUNT_OUT + 1);

    assert_eq!(result, Err(Error::BelowFloor));
    assert_eq!(trade.balances(), (1_000_000_000, 0));
}

#[test]
fn the_user_signs_one_tree_from_the_guard_down_to_the_usdc_transfer() {
    let trade = trade(&SOROSWAP);
    let env = &trade.env;

    trade
        .guarded_swap(AMOUNT_OUT)
        .expect("the swap goes through");
    let authorizations = env.auths();

    let [(signer, root)] = authorizations.as_slice() else {
        panic!("expected one authorization, got {}", authorizations.len());
    };
    assert_eq!(signer, &trade.user);
    assert_eq!(
        calls(root),
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
