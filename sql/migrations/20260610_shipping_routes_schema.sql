-- ══════════════════════════════════════════════════════════════
-- Shipping Operations SOP1: shipping_routes + shipping_route_bids
--
-- Net-new contract pipeline for the redesigned Shipping Operations
-- page (mockup-driven rebuild). Two tables, parallel in shape to the
-- bank-loan pipeline (L1):
--
--   shipping_routes      — the tender + the active route. One row
--                          per route; status enum walks the row from
--                          'open' (bidding window) → 'awarded' (live,
--                          accruing per-tick revenue to the winning
--                          carrier) → 'completed' / 'cancelled' /
--                          'expired'. Carries everything the page's
--                          Available Routes card and Active Routes
--                          card both render — origin/destination
--                          ports, contract_type tag, requirements,
--                          revenue/tick, term, freighters required.
--
--   shipping_route_bids  — bid record per (route, bidder). UNIQUE
--                          constraint enforces strict one-shot per
--                          carrier per route, mirroring
--                          bank_loan_offers. SOP2 will introduce
--                          place_shipping_bid + award_shipping_route
--                          RPCs against these.
--
-- Lifecycle (SOP2 will implement):
--   1. Issuer (gov ministry / private corp / foreign nation) opens a
--      shipping_routes row in 'open' status with a bid window.
--   2. Carriers with sufficient freighters / fleet_health / route_risk
--      stats place bids via place_shipping_bid RPC. Each row in
--      shipping_route_bids; 'pending' until resolution.
--   3. award_shipping_route RPC picks one bid, flips it to 'accepted',
--      auto-rejects siblings, flips the route to 'awarded' with
--      winner_faction_id set, sets awarded_at_tick + ends_at_tick.
--   4. Per-tick processor (advance-corp-tick) accrues revenue_per_tick
--      to the winner's cash + tracks in corp_revenue_current_tick on
--      every tick from awarded_at_tick → ends_at_tick. At
--      ends_at_tick, status flips to 'completed'.
--
-- Status enums kept consistent with bank_loan_offers vocabulary so
-- code reading both tables can use the same vocabulary mentally:
--   shipping_routes:      open / awarded / completed / cancelled / expired
--   shipping_route_bids:  pending / accepted / rejected / auto_rejected
--                         / expired / withdrawn
-- 'withdrawn' is reserved for a future per-bid-cancel flow.
--
-- RLS:
--   * SELECT all rows for authenticated (route market is public).
--   * No client INSERT/UPDATE/DELETE policies — every write goes
--     through SOP2's SECURITY DEFINER RPCs.
-- ══════════════════════════════════════════════════════════════


-- ══════════════════════════════════════════════════════════════
-- 1. shipping_routes
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS shipping_routes (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Issuer side. nation_id is the issuing nation (gov contracts
    -- belong to that nation; private contracts belong to the issuing
    -- corp's home nation; foreign contracts belong to the foreign
    -- nation). issuer_faction_id is the specific corp / ministry, or
    -- NULL for sovereign-issued tenders that don't have a faction
    -- proxy.
    nation_id             UUID         NOT NULL REFERENCES nations(id),
    issuer_faction_id     UUID         REFERENCES factions(id) ON DELETE SET NULL,
    issuer_name           TEXT         NOT NULL,

    contract_type         TEXT         NOT NULL
                              CHECK (contract_type IN ('government', 'private', 'foreign')),

    name                  TEXT         NOT NULL,
    description           TEXT,

    -- Route corridor. Cross-nation routes set destination_nation_id;
    -- intra-nation routes leave it NULL (origin nation = nation_id).
    origin_port           TEXT         NOT NULL,
    destination_port      TEXT         NOT NULL,
    destination_nation_id UUID         REFERENCES nations(id),

    -- Terms.
    revenue_per_tick      BIGINT       NOT NULL CHECK (revenue_per_tick > 0),
    term_ticks            INT          NOT NULL CHECK (term_ticks > 0),
    freighters_required   INT          NOT NULL DEFAULT 1 CHECK (freighters_required > 0),

    -- Stat-gate thresholds (player must meet to bid). NULL means
    -- no gate on that stat. min_fleet_health is a floor; max_route_risk
    -- is a ceiling. Bid eligibility checked server-side by SOP2.
    min_fleet_health      NUMERIC(4,2) DEFAULT 0,
    max_route_risk        NUMERIC(4,2) DEFAULT 10,

    -- Lifecycle.
    status                TEXT         NOT NULL DEFAULT 'open'
                              CHECK (status IN ('open', 'awarded', 'completed', 'cancelled', 'expired')),
    expires_at_tick       INT          NOT NULL,            -- bid window close

    -- Award snapshot (NULL until status = 'awarded').
    winner_faction_id     UUID         REFERENCES factions(id) ON DELETE SET NULL,
    awarded_at_tick       INT,
    ends_at_tick          INT,                              -- awarded_at + term_ticks

    -- Per-tick payment tracking. last_payment_tick guards against
    -- double-paying in a single tick if the processor runs twice;
    -- total_paid accumulates the lifetime revenue paid to the winner.
    last_payment_tick     INT,
    total_paid            BIGINT       NOT NULL DEFAULT 0,

    -- Audit.
    created_at_tick       INT          NOT NULL,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shr_nation             ON shipping_routes (nation_id);
CREATE INDEX IF NOT EXISTS idx_shr_status             ON shipping_routes (status);
CREATE INDEX IF NOT EXISTS idx_shr_winner             ON shipping_routes (winner_faction_id);
CREATE INDEX IF NOT EXISTS idx_shr_expires            ON shipping_routes (expires_at_tick);
CREATE INDEX IF NOT EXISTS idx_shr_ends               ON shipping_routes (ends_at_tick);
CREATE INDEX IF NOT EXISTS idx_shr_contract_type      ON shipping_routes (contract_type);

COMMENT ON TABLE shipping_routes IS
    'Shipping contract pipeline. Single row per route, status walks open → awarded → completed/cancelled/expired. Carries the corridor (origin/destination ports), terms (revenue/tick, term_ticks, freighters_required), stat gates (min_fleet_health / max_route_risk), and the award snapshot (winner_faction_id, awarded_at_tick, ends_at_tick).';


-- ══════════════════════════════════════════════════════════════
-- 2. shipping_route_bids
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS shipping_route_bids (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The route this bid is responding to. CASCADE on delete because
    -- bids have no meaning without their parent route.
    route_id              UUID         NOT NULL REFERENCES shipping_routes(id) ON DELETE CASCADE,

    -- The carrier corp making the bid. RESTRICT — corps with live bids
    -- can't be deleted; resolve the bids first.
    bidder_faction_id     UUID         NOT NULL REFERENCES factions(id) ON DELETE RESTRICT,

    -- Lifecycle. Mirrors bank_loan_offers vocabulary.
    status                TEXT         NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','accepted','rejected','auto_rejected','expired','withdrawn')),

    -- Mirrors the parent route's expires_at_tick at submit time so the
    -- bid auto-expires with the bid window. Same invariant as
    -- bank_loan_offers — a future per-tick sweep (parallel to L5)
    -- catches drift.
    expires_at_tick       INT          NOT NULL,

    -- Audit.
    created_at_tick       INT          NOT NULL,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    resolved_at_tick      INT,
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),

    -- One bid per (route, carrier), strictly. UNIQUE matches on all
    -- statuses; carriers cannot re-bid the same route after their bid
    -- terminates. Same one-shot rule as bank_loan_offers (L1).
    UNIQUE (route_id, bidder_faction_id)
);

CREATE INDEX IF NOT EXISTS idx_srb_route   ON shipping_route_bids (route_id);
CREATE INDEX IF NOT EXISTS idx_srb_bidder  ON shipping_route_bids (bidder_faction_id);
CREATE INDEX IF NOT EXISTS idx_srb_status  ON shipping_route_bids (status);
CREATE INDEX IF NOT EXISTS idx_srb_expires ON shipping_route_bids (expires_at_tick);

COMMENT ON TABLE shipping_route_bids IS
    'Carrier bids on shipping_routes. One row per (route, carrier), strictly one-shot — once a bid reaches a terminal state the carrier cannot re-bid the same route. Award flow flips the chosen bid to accepted, auto-rejects siblings, and snapshots winner_faction_id onto shipping_routes.';


-- ══════════════════════════════════════════════════════════════
-- RLS
-- ══════════════════════════════════════════════════════════════
-- Read-all for authenticated (route market is public — same model as
-- bank_loan_requests / bank_loan_offers / equity_raises). Writes are
-- SECURITY DEFINER RPC only (SOP2 lands next).
ALTER TABLE shipping_routes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_route_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shipping_routes_read_all" ON shipping_routes;
CREATE POLICY "shipping_routes_read_all"
    ON shipping_routes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "shipping_route_bids_read_all" ON shipping_route_bids;
CREATE POLICY "shipping_route_bids_read_all"
    ON shipping_route_bids FOR SELECT TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';
