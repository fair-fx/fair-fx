//! The mainnet Aquarius router under the guard, on the route its API gave for 100 USDC to EURC:
//! three hops, one constant product pool and two concentrated ones.

use soroban_sdk::{Address, BytesN, Env, IntoVal, Symbol, Val, Vec, vec};
use spike_guard::{Error, SwapResult};

use crate::{
    auth_tree::calls,
    world::{AMOUNT_IN, EURC, Trade, USDC, Venue, trade},
};

const SWAP: &str = "swap_chained";
const CETES: &str = "CAL6ER2TI6CTRAY6BFXWNWA7WTYXUXTQCHUBCIBU5O6KM3HJFG6Z6VXV";
const SUSD: &str = "CDFZUVS5YNLXU7VENKOUDEOHCJGKQNVUBWD7KMN6E7ZROKPYPFLRUJFG";
const CONSTANT_PRODUCT_POOL: &str =
    "b2e02fcfca6c96f8ad5cbd84e7784a777b36d9c96a2459402c4f458462aab7f0";
const CONCENTRATED_POOL: &str = "24f9c991c44acf33fff5f44031c40385d235dc212d7379e824ba3db1c35371f3";
// What the router pays for AMOUNT_IN at the ledger of the snapshot.
const AMOUNT_OUT: i128 = 919_094_020;

static AQUARIUS: Venue = Venue {
    snapshot: "aquarius-usdc-eurc.json",
    router: "CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK",
    function: SWAP,
    args: swap_args,
};

type Hop = (Vec<Address>, BytesN<32>, Address);

/// One hop: the pool's two tokens in address order, the pool index, the token that comes out.
fn hop(env: &Env, tokens: [&str; 2], pool_index: &str, token_out: &str) -> Hop {
    let mut index = [0_u8; 32];
    for (byte, pair) in index.iter_mut().zip(pool_index.as_bytes().chunks(2)) {
        let digits = core::str::from_utf8(pair).expect("the index is ascii");
        *byte = u8::from_str_radix(digits, 16).expect("the index is hex");
    }
    (
        vec![
            env,
            Address::from_str(env, tokens[0]),
            Address::from_str(env, tokens[1]),
        ],
        BytesN::from_array(env, &index),
        Address::from_str(env, token_out),
    )
}

fn swap_args(trade: &Trade) -> Vec<Val> {
    let env = &trade.env;
    let chain: Vec<Hop> = vec![
        env,
        hop(env, [CETES, USDC], CONSTANT_PRODUCT_POOL, CETES),
        hop(env, [CETES, SUSD], CONCENTRATED_POOL, SUSD),
        hop(env, [SUSD, EURC], CONCENTRATED_POOL, EURC),
    ];
    vec![
        env,
        trade.user.into_val(env),
        chain.into_val(env),
        trade.usdc.into_val(env),
        (AMOUNT_IN as u128).into_val(env),
        0_u128.into_val(env),
    ]
}

#[test]
fn the_guard_swaps_through_the_mainnet_router_at_the_quoted_amount() {
    let trade = trade(&AQUARIUS);

    let result = trade.guarded_swap(AMOUNT_OUT);

    assert_eq!(
        result,
        Ok(SwapResult {
            spent: 1_000_000_000,
            received: 919_094_020
        })
    );
    assert_eq!(trade.balances(), (0, 919_094_020));
}

#[test]
fn the_guard_undoes_a_mainnet_swap_that_pays_one_unit_under_the_floor() {
    let trade = trade(&AQUARIUS);

    let result = trade.guarded_swap(AMOUNT_OUT + 1);

    assert_eq!(result, Err(Error::BelowFloor));
    assert_eq!(trade.balances(), (1_000_000_000, 0));
}

#[test]
fn the_user_signs_one_tree_from_the_guard_down_to_the_usdc_transfer() {
    let trade = trade(&AQUARIUS);
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
}
