//! Mainnet state at one ledger, and a user about to trade USDC for EURC on it through a venue.

use soroban_sdk::{
    Address, Env, Symbol, Val, Vec,
    testutils::{Address as _, EnvTestConfig},
    token::{StellarAssetClient, TokenClient},
};
use spike_guard::{Error, SpikeGuard, SpikeGuardClient, SwapResult};

pub const USDC: &str = "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";
pub const EURC: &str = "CDTKPWPLOURQA2SGTKTUQOWRCBZEORB4BWBOMJ3D3ZTQQSGE5F6JBQLV";
pub const AMOUNT_IN: i128 = 1_000_000_000;

/// A router on mainnet, the snapshot that holds its state, and how to call its swap.
pub struct Venue {
    /// File name in `spike/snapshots/`.
    pub snapshot: &'static str,
    pub router: &'static str,
    pub function: &'static str,
    /// The router's arguments for AMOUNT_IN of USDC to EURC, with the router's own floor at 0.
    pub args: fn(&Trade) -> Vec<Val>,
}

pub fn mainnet(snapshot: &str) -> Env {
    let path = std::format!("{}/../snapshots/{snapshot}", env!("CARGO_MANIFEST_DIR"));
    let mut env = Env::from_ledger_snapshot_file(path);
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
    venue: &'static Venue,
}

/// A user holding exactly AMOUNT_IN of USDC, and the spike guard, on mainnet state.
pub fn trade(venue: &'static Venue) -> Trade {
    let env = mainnet(venue.snapshot);
    env.mock_all_auths();
    let user = Address::generate(&env);
    let usdc = Address::from_str(&env, USDC);
    StellarAssetClient::new(&env, &usdc).mint(&user, &AMOUNT_IN);
    // A test compiles every contract it meets from scratch, which the network does not charge
    // for. A route of three pools runs out of the default budget on that alone.
    env.cost_estimate().budget().reset_unlimited();
    Trade {
        guard: env.register(SpikeGuard, ()),
        router: Address::from_str(&env, venue.router),
        eurc: Address::from_str(&env, EURC),
        user,
        usdc,
        env,
        venue,
    }
}

impl Trade {
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
                &Symbol::new(&self.env, self.venue.function),
                &(self.venue.args)(self),
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
