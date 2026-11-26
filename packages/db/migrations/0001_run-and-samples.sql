-- Up Migration

-- One collector run. A run is written once, when it has finished, together with all its samples.
CREATE TABLE run (
  id              BIGSERIAL PRIMARY KEY,
  -- Start of the run's 5 minute slot. One run per slot: a second write of a slot inserts nothing.
  slot            TIMESTAMPTZ NOT NULL UNIQUE,
  started_at      TIMESTAMPTZ NOT NULL,
  finished_at     TIMESTAMPTZ NOT NULL,
  -- Latest ledger the RPC node reported during the run. NULL when it did not answer.
  ledger          BIGINT,
  -- What the collector could say about the reference price when it wrote the run.
  reference_state TEXT NOT NULL CHECK (reference_state IN ('fresh', 'closed', 'unknown'))
);

-- One read of a reference price in a run, whether or not it gave a price.
CREATE TABLE reference_sample (
  run_id      BIGINT NOT NULL REFERENCES run (id),
  source      TEXT NOT NULL,
  -- The currency the price is for, as the feed names it.
  symbol      TEXT NOT NULL,
  -- ok, or why there is no price: missing, invalid, unavailable.
  status      TEXT NOT NULL,
  -- USD price of the currency, scaled by 10^decimals.
  price       NUMERIC(40, 0),
  decimals    SMALLINT,
  -- When the feed set the price.
  oracle_time TIMESTAMPTZ,
  -- The failure as text, when the read gave one.
  reason      TEXT,
  PRIMARY KEY (run_id, source, symbol),
  CONSTRAINT reference_sample_price_when_ok CHECK (
    (status = 'ok') = (price IS NOT NULL AND decimals IS NOT NULL AND oracle_time IS NOT NULL)
  )
);

-- What one venue answered for one size in one direction. A quote, not a fill.
CREATE TABLE quote_sample (
  run_id           BIGINT NOT NULL REFERENCES run (id),
  pair             TEXT NOT NULL,
  direction        TEXT NOT NULL CHECK (direction IN ('base_to_quote', 'quote_to_base')),
  venue            TEXT NOT NULL,
  -- Both amounts are in the smallest unit of their token.
  amount_in        NUMERIC(40, 0) NOT NULL,
  amount_out       NUMERIC(40, 0),
  -- Stored so that readers do not compute it again. Positive: the venue pays less than the reference.
  shortfall_bps    INTEGER,
  -- The reference_sample.source the shortfall was computed against.
  shortfall_source TEXT,
  -- What the venue needs to execute the quote, in the venue's own shape.
  route            JSONB,
  status           TEXT NOT NULL CHECK (status IN ('ok', 'no_route', 'error')),
  -- Why there is no amount: the kind of no_route or of error.
  cause            TEXT,
  -- The error as text.
  reason           TEXT,
  -- Latest ledger the venue's source had seen. NULL when the venue does not say.
  ledger           BIGINT,
  -- When the venue's answer arrived.
  quoted_at        TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (run_id, pair, direction, venue, amount_in),
  CONSTRAINT quote_sample_amount_when_ok CHECK ((status = 'ok') = (amount_out IS NOT NULL)),
  CONSTRAINT quote_sample_cause_unless_ok CHECK ((status = 'ok') = (cause IS NULL)),
  CONSTRAINT quote_sample_shortfall_has_source CHECK ((shortfall_bps IS NULL) = (shortfall_source IS NULL)),
  CONSTRAINT quote_sample_shortfall_when_ok CHECK (shortfall_bps IS NULL OR status = 'ok')
);

CREATE INDEX quote_sample_lookup ON quote_sample (pair, direction, venue, amount_in, run_id DESC);
