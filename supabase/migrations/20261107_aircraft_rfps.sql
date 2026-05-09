-- ════════════════════════════════════════════════════════════════
-- Aircraft RFPs — airlines posting purchase orders to manufacturers
--
-- Closes the loop on the aviation pipeline: manufacturers research
-- engines + aircraft → produce units into inventory_on_hand → and
-- now airlines can pull those units out of manufacturer inventory
-- via a competitive RFP/bid flow.
--
-- Spec (locked):
--   • RFP specifies design_class + quantity. No max price.
--   • Aviation Manufacturing corps bid: pick one of their own
--     Available aircraft designs that has enough inventory_on_hand,
--     plus a price_per_unit. One bid per manufacturer per RFP.
--   • Airline reviews bids, accepts one. Other bids reject.
--   • If no bid is accepted within 6 ticks the RFP expires and all
--     pending bids reject.
--   • On award: the manufacturer's design.inventory_on_hand
--     decrements by qty; qty new rows land in corp_aircraft for the
--     airline at condition=100; cash flows airline → manufacturer.
--
-- Class scope: regional / narrowbody / widebody only. The existing
-- corp_aircraft.aircraft_class CHECK doesn't allow 'business' and
-- the airline-ops UI is firmly 3-class. Business jets need a
-- separate widening pass to integrate.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── Extend corp_aircraft for provenance + audit ────────────────
-- Existing rows from legacy fleets have NULL design_id and NULL
-- manufacturer_corp_id; new RFP-purchased rows carry both. tail
-- numbers + condition + route_id + overhaul_count etc. all stay
-- as-is from prior migrations.
ALTER TABLE public.corp_aircraft
    ADD COLUMN IF NOT EXISTS design_id            UUID    REFERENCES public.corp_aircraft_designs(id),
    ADD COLUMN IF NOT EXISTS manufacturer_corp_id UUID    REFERENCES public.factions(id),
    ADD COLUMN IF NOT EXISTS purchase_price       BIGINT;

COMMENT ON COLUMN public.corp_aircraft.design_id IS
    'For aircraft purchased via aircraft_rfps: the corp_aircraft_designs row this unit came from. Preserves design provenance after the manufacturer''s inventory_on_hand decrements. NULL on legacy / synthesized rows.';
COMMENT ON COLUMN public.corp_aircraft.manufacturer_corp_id IS
    'For aircraft purchased via aircraft_rfps: the corp that designed + produced this aircraft. Audit + future brand-effect mechanics.';
COMMENT ON COLUMN public.corp_aircraft.purchase_price IS
    'Price paid per unit at award time (winning bid''s price_per_unit). Audit-only; unit accounting goes through emit_corp_cash_event.';


-- ── aircraft_rfps ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.aircraft_rfps (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    airline_corp_id    UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    design_class       TEXT NOT NULL CHECK (design_class IN ('regional', 'narrowbody', 'widebody')),
    quantity           INT  NOT NULL CHECK (quantity > 0),
    status             TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'awarded', 'expired')),
    winning_bid_id     UUID,
    created_at_tick    INT  NOT NULL,
    expires_at_tick    INT  NOT NULL,
    awarded_at_tick    INT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aircraft_rfps_airline_open
    ON public.aircraft_rfps (airline_corp_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_aircraft_rfps_open_class
    ON public.aircraft_rfps (design_class) WHERE status = 'open';

ALTER TABLE public.aircraft_rfps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aircraft_rfps_read_all" ON public.aircraft_rfps;
CREATE POLICY "aircraft_rfps_read_all"
    ON public.aircraft_rfps FOR SELECT USING (true);

COMMENT ON TABLE public.aircraft_rfps IS
    'Airline purchase-order RFPs: airline posts (class, qty); manufacturers bid; airline accepts one. Inserts via post_aircraft_rfp; status transitions via award_aircraft_rfp + processAircraftRfpExpiry.';


-- ── aircraft_rfp_bids ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.aircraft_rfp_bids (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfp_id                UUID NOT NULL REFERENCES public.aircraft_rfps(id) ON DELETE CASCADE,
    manufacturer_corp_id  UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    source_design_id      UUID NOT NULL REFERENCES public.corp_aircraft_designs(id),
    price_per_unit        BIGINT NOT NULL CHECK (price_per_unit >= 0),
    status                TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at_tick       INT  NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (rfp_id, manufacturer_corp_id)
);

CREATE INDEX IF NOT EXISTS idx_aircraft_rfp_bids_rfp
    ON public.aircraft_rfp_bids (rfp_id);
CREATE INDEX IF NOT EXISTS idx_aircraft_rfp_bids_mfr_pending
    ON public.aircraft_rfp_bids (manufacturer_corp_id) WHERE status = 'pending';

ALTER TABLE public.aircraft_rfp_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aircraft_rfp_bids_read_all" ON public.aircraft_rfp_bids;
CREATE POLICY "aircraft_rfp_bids_read_all"
    ON public.aircraft_rfp_bids FOR SELECT USING (true);

COMMENT ON TABLE public.aircraft_rfp_bids IS
    'One bid per (manufacturer, RFP). Manufacturer commits to selling N units of a specific aircraft design at price_per_unit. Status transitions handled by award_aircraft_rfp (one accepted, others rejected) and processAircraftRfpExpiry (all pending → rejected on RFP expiry).';

-- Add the FK from aircraft_rfps.winning_bid_id to aircraft_rfp_bids
-- AFTER both tables exist (chicken-and-egg if defined inline).
ALTER TABLE public.aircraft_rfps
    DROP CONSTRAINT IF EXISTS aircraft_rfps_winning_bid_id_fkey;
ALTER TABLE public.aircraft_rfps
    ADD CONSTRAINT aircraft_rfps_winning_bid_id_fkey
    FOREIGN KEY (winning_bid_id) REFERENCES public.aircraft_rfp_bids(id)
    ON DELETE SET NULL;


-- ── post_aircraft_rfp RPC ──────────────────────────────────────
-- Airline posts an RFP for N aircraft of a given class. 6-tick
-- bid window. No posting fee in v1; the airline pays only on
-- acceptance.
CREATE OR REPLACE FUNCTION post_aircraft_rfp(
    p_design_class TEXT,
    p_quantity     INT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_corp factions%ROWTYPE;
    v_tick INT;
    v_rfp_id UUID;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    IF p_design_class NOT IN ('regional', 'narrowbody', 'widebody') THEN
        RETURN jsonb_build_object('success', false,
            'error', 'design_class must be regional, narrowbody, or widebody');
    END IF;
    IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 50 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Quantity must be between 1 and 50');
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = (
        SELECT id FROM factions
         WHERE (id = v_user OR linked_user_id = v_user)
           AND faction_type = 'corporation'
           AND corp_sector  = 'Airline'
         LIMIT 1
    );
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Only airline corporations can post aircraft RFPs');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO aircraft_rfps (
        airline_corp_id, design_class, quantity,
        status, created_at_tick, expires_at_tick
    ) VALUES (
        v_corp.id, p_design_class, p_quantity,
        'open', v_tick, v_tick + 6
    ) RETURNING id INTO v_rfp_id;

    RETURN jsonb_build_object(
        'success',          true,
        'rfp_id',           v_rfp_id,
        'design_class',     p_design_class,
        'quantity',         p_quantity,
        'expires_at_tick',  v_tick + 6
    );
END;
$$;

GRANT EXECUTE ON FUNCTION post_aircraft_rfp(TEXT, INT) TO authenticated;


-- ── bid_on_aircraft_rfp RPC ────────────────────────────────────
-- Manufacturer submits a bid: pick which of their own Available
-- aircraft designs to fulfill from + price_per_unit. UNIQUE on
-- (rfp_id, manufacturer_corp_id) enforces one bid per manufacturer
-- per RFP server-side.
CREATE OR REPLACE FUNCTION bid_on_aircraft_rfp(
    p_rfp_id           UUID,
    p_source_design_id UUID,
    p_price_per_unit   BIGINT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_corp factions%ROWTYPE;
    v_rfp aircraft_rfps%ROWTYPE;
    v_design corp_aircraft_designs%ROWTYPE;
    v_tick INT;
    v_bid_id UUID;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    IF p_price_per_unit IS NULL OR p_price_per_unit < 0 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'price_per_unit must be a non-negative integer');
    END IF;

    -- Caller must be the manufacturer corp.
    SELECT * INTO v_corp FROM factions
     WHERE (id = v_user OR linked_user_id = v_user)
       AND faction_type = 'corporation'
       AND corp_sector  = 'Aviation Manufacturing'
     LIMIT 1;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Only Aviation Manufacturing corporations can bid on aircraft RFPs');
    END IF;

    SELECT * INTO v_rfp FROM aircraft_rfps WHERE id = p_rfp_id;
    IF v_rfp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'RFP not found');
    END IF;
    IF v_rfp.status <> 'open' THEN
        RETURN jsonb_build_object('success', false,
            'error', 'RFP is no longer open');
    END IF;

    -- Design must be the bidder's, available, aircraft type, the
    -- right class, and have enough inventory_on_hand to cover qty.
    SELECT * INTO v_design FROM corp_aircraft_designs
     WHERE id = p_source_design_id AND is_active = TRUE;
    IF v_design.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Aircraft design not found');
    END IF;
    IF v_design.corp_id <> v_corp.id THEN
        RETURN jsonb_build_object('success', false,
            'error', 'You can only bid with your own aircraft designs');
    END IF;
    IF v_design.design_type <> 'aircraft' THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Design must be an aircraft (not an engine)');
    END IF;
    IF v_design.status <> 'available' THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Design must be Available (R&D complete)');
    END IF;
    IF v_design.airframe_class <> v_rfp.design_class THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Design class %s does not match RFP class %s',
                v_design.airframe_class, v_rfp.design_class));
    END IF;
    IF COALESCE(v_design.inventory_on_hand, 0) < v_rfp.quantity THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient inventory — RFP needs %s units, design has %s',
                v_rfp.quantity, COALESCE(v_design.inventory_on_hand, 0)));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- UNIQUE (rfp_id, manufacturer_corp_id) enforces one-bid-per-
    -- manufacturer-per-RFP. The ON CONFLICT lets a bidder update
    -- their own bid in place (e.g., switch design or adjust price)
    -- as long as the RFP is still open.
    INSERT INTO aircraft_rfp_bids (
        rfp_id, manufacturer_corp_id, source_design_id,
        price_per_unit, status, created_at_tick
    ) VALUES (
        p_rfp_id, v_corp.id, p_source_design_id,
        p_price_per_unit, 'pending', v_tick
    )
    ON CONFLICT (rfp_id, manufacturer_corp_id) DO UPDATE SET
        source_design_id = EXCLUDED.source_design_id,
        price_per_unit   = EXCLUDED.price_per_unit,
        created_at_tick  = EXCLUDED.created_at_tick,
        status           = 'pending'
    RETURNING id INTO v_bid_id;

    RETURN jsonb_build_object(
        'success',         true,
        'bid_id',          v_bid_id,
        'rfp_id',          p_rfp_id,
        'price_per_unit',  p_price_per_unit,
        'total_cost',      p_price_per_unit * v_rfp.quantity
    );
END;
$$;

GRANT EXECUTE ON FUNCTION bid_on_aircraft_rfp(UUID, UUID, BIGINT) TO authenticated;


-- ── award_aircraft_rfp RPC ─────────────────────────────────────
-- Airline accepts a specific bid. Atomic transfer: manufacturer
-- inventory decrements; N corp_aircraft rows insert at condition
-- 100 for the airline; cash flows airline → manufacturer; RFP
-- and bids transition.
CREATE OR REPLACE FUNCTION award_aircraft_rfp(
    p_rfp_id UUID,
    p_bid_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_rfp aircraft_rfps%ROWTYPE;
    v_bid aircraft_rfp_bids%ROWTYPE;
    v_design corp_aircraft_designs%ROWTYPE;
    v_airline factions%ROWTYPE;
    v_total BIGINT;
    v_tick INT;
    v_i INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Lock the RFP so concurrent awards on the same RFP serialize.
    SELECT * INTO v_rfp FROM aircraft_rfps WHERE id = p_rfp_id FOR UPDATE;
    IF v_rfp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'RFP not found');
    END IF;
    IF v_rfp.status <> 'open' THEN
        RETURN jsonb_build_object('success', false,
            'error', 'RFP is no longer open');
    END IF;

    -- Caller must be the airline corp.
    SELECT * INTO v_airline FROM factions WHERE id = v_rfp.airline_corp_id FOR UPDATE;
    IF v_airline.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Airline corporation not found');
    END IF;
    IF v_airline.id <> v_user
       AND COALESCE(v_airline.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Only the airline that posted this RFP can accept bids');
    END IF;

    -- Validate bid + lock the manufacturer corp + design rows for
    -- the inventory + cash transfer.
    SELECT * INTO v_bid FROM aircraft_rfp_bids
     WHERE id = p_bid_id AND rfp_id = p_rfp_id;
    IF v_bid.id IS NULL THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Bid not found or does not belong to this RFP');
    END IF;
    IF v_bid.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Bid is no longer pending');
    END IF;

    SELECT * INTO v_design FROM corp_aircraft_designs
     WHERE id = v_bid.source_design_id FOR UPDATE;
    IF v_design.id IS NULL THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Bid''s source design no longer exists');
    END IF;

    -- Re-check inventory at award time: the manufacturer may have
    -- sold units to another buyer since the bid was placed.
    IF COALESCE(v_design.inventory_on_hand, 0) < v_rfp.quantity THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Manufacturer no longer has enough inventory (%s available, need %s). Try a different bid or wait for them to produce more.',
                COALESCE(v_design.inventory_on_hand, 0), v_rfp.quantity));
    END IF;

    v_total := v_bid.price_per_unit * v_rfp.quantity;

    IF COALESCE(v_airline.corp_cash_reserves, 0) < v_total THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient cash — total is $%s; you have $%s',
                to_char(v_total, 'FM999,999,999'),
                to_char(COALESCE(v_airline.corp_cash_reserves, 0), 'FM999,999,999')));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- 1. Decrement manufacturer's design inventory.
    UPDATE corp_aircraft_designs
       SET inventory_on_hand = inventory_on_hand - v_rfp.quantity
     WHERE id = v_design.id;

    -- 2. Insert N corp_aircraft rows for the airline at condition
    --    100. design_id + manufacturer_corp_id + purchase_price
    --    capture provenance for future mechanics.
    FOR v_i IN 1..v_rfp.quantity LOOP
        INSERT INTO corp_aircraft (
            corp_id, aircraft_class, condition,
            acquired_at_tick,
            design_id, manufacturer_corp_id, purchase_price
        ) VALUES (
            v_airline.id, v_rfp.design_class, 100,
            v_tick,
            v_design.id, v_design.corp_id, v_bid.price_per_unit
        );
    END LOOP;

    -- 3. Cash transfer via emit_corp_cash_event for both sides
    --    (audited path). Airline debit, manufacturer credit.
    PERFORM emit_corp_cash_event(
        v_airline.id, 'capital_out',
        format('Aircraft purchase: %s × %s', v_rfp.quantity, v_design.name),
        -v_total, v_tick
    );
    PERFORM emit_corp_cash_event(
        v_design.corp_id, 'capital_in',
        format('Aircraft sale: %s × %s', v_rfp.quantity, v_design.name),
        v_total, v_tick
    );

    -- 4. Status transitions: RFP awarded, winning bid accepted,
    --    other bids on this RFP rejected.
    UPDATE aircraft_rfp_bids
       SET status = 'rejected'
     WHERE rfp_id = p_rfp_id AND id <> p_bid_id AND status = 'pending';

    UPDATE aircraft_rfp_bids
       SET status = 'accepted'
     WHERE id = p_bid_id;

    UPDATE aircraft_rfps
       SET status = 'awarded',
           winning_bid_id  = p_bid_id,
           awarded_at_tick = v_tick
     WHERE id = p_rfp_id;

    RETURN jsonb_build_object(
        'success',        true,
        'rfp_id',         p_rfp_id,
        'bid_id',         p_bid_id,
        'quantity',       v_rfp.quantity,
        'total_paid',     v_total,
        'design_name',    v_design.name,
        'manufacturer',   v_design.corp_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION award_aircraft_rfp(UUID, UUID) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
