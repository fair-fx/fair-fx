//! Mainnet state at one ledger, and a user about to trade on it.

use soroban_sdk::{
    Address, Env, IntoVal, Symbol, Val, Vec,
    testutils::{Address as _, EnvTestConfig},
    token::{StellarAssetClient, TokenClient},
    vec,
};
use spike_guard::{Error, SpikeGuard, SpikeGuardClient, SwapResult};

const SNAPSHOT: &str = concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../snapshots/soroswap-usdc-eurc.json"
);
pub const SOROSWAP_ROUTER: &str = "CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH";
pub const USDC: &str = "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";
pub const EURC: &str = "CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV";

pub const SOROSWAP_USDC_EURC_PAIR: &str =
    "CC7CDFY2VGDODJ7WPO3JIK2MXLOAXL4LRQCC43UJDBAIJ4SVFO3HNPOC";
pub const SWAP: &str = "swap_exact_tokens_for_tokens";
pub const AMOUNT_IN: i128 = 1_000_000_000;
// What the router pays for AMOUNT_IN at the ledger of the snapshot.
pub const AMOUNT_OUT: i128 = 917_403_921;

pub fn mainnet() -> Env {
    let mut env = Env::from_ledger_snapshot_file(SNAPSHOT);
    // Without this every test run writes the whole state back to disk.
    env.set_config(EnvTestConfig {
        capture_snapshot_at_drop: false,
    });
    env
}

pub struct Trade {
    pub env: Env,
    pub guard: Address,
    pub router: Address,
    pub user: Address,
    pub usdc: Address,
    pub eurc: Address,
}

/// A user holding exactly AMOUNT_IN of USDC, and the spike guard, on mainnet state.
pub fn trade() -> Trade {
    let env = mainnet();
    env.mock_all_auths();
    let user = Address::generate(&env);
    let usdc = Address::from_str(&env, USDC);
    StellarAssetClient::new(&env, &usdc).mint(&user, &AMOUNT_IN);
    Trade {
        guard: env.register(SpikeGuard, ()),
        router: Address::from_str(&env, SOROSWAP_ROUTER),
        eurc: Address::from_str(&env, EURC),
        user,
        usdc,
        env,
    }
}

impl Trade {
    /// The router's own floor is 0: only the guard can refuse.
    pub fn router_args(&self) -> Vec<Val> {
        let route = vec![&self.env, self.usdc.clone(), self.eurc.clone()];
        let deadline = self.env.ledger().timestamp() + 600;
        vec![
            &self.env,
            AMOUNT_IN.into_val(&self.env),
            0_i128.into_val(&self.env),
            route.into_val(&self.env),
            self.user.into_val(&self.env),
            deadline.into_val(&self.env),
        ]
    }

    pub fn guarded_swap(&self, min_out: i128) -> Result<SwapResult, Error> {
        SpikeGuardClient::new(&self.env, &self.guard)
            .try_guarded_swap(
                &self.user,
                &self.user,
                &self.usdc,
                &self.eurc,
                &AMOUNT_IN,
                &min_out,
                &self.router,
                &Symbol::new(&self.env, SWAP),
                &self.router_args(),
            )
            .map(|result| result.expect("the result decodes"))
            .map_err(|error| error.expect("the error is one of the guard's"))
    }

    pub fn balances(&self) -> (i128, i128) {
        (
            TokenClient::new(&self.env, &self.usdc).balance(&self.user),
            TokenClient::new(&self.env, &self.eurc).balance(&self.user),
        )
    }
}
