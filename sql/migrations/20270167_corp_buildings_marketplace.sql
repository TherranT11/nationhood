-- ════════════════════════════════════════════════════════════════════
-- CONSTRUCTION v1 — building marketplace (list / delist / buy)
-- ════════════════════════════════════════════════════════════════════
-- Closes the construction loop. Construction corps spent money in v0
-- to put up buildings; v1 gives Real Estate corps a way to acquire
-- them. Money flow: buyer-faction party_funds → seller-faction
-- party_funds, ownership flips. No rent (locked with user — Real
-- Estate is buy/sell only). No GDP_Growth on resale (locked — the
-- +0.2 already fired on completion). Secondary RE→RE sales allowed
-- (locked — once a building has an owner_corp_id, that corp can
-- re-list regardless of industry chain).
--
-- ── Schema additions ─────────────────────────────────────────────
--   owner_corp_id uuid  (defaults to builder at INSERT; flips on sale)
--   list_price    bigint (NULL = not for sale; non-NULL = listed)
--
-- ── builder_corp_id relaxation ───────────────────────────────────
-- v0 set ON DELETE CASCADE. Today, if a Construction corp dissolves
-- every building it ever built disappears — including ones a Real
-- Estate corp paid for. We relax to ON DELETE SET NULL so:
--   • A dissolved builder just severs the historical reference.
--   • The asset persists with its current owner intact.
--   • Sold buildings cannot be retroactively destroyed by the builder.
-- NOT NULL on builder_corp_id is also dropped (SET NULL needs it).
--
-- ── RPCs ─────────────────────────────────────────────────────────
--   list_building_for_sale(p_building_id, p_price)
--       Owner-corp's owner faction only. status='completed' required.
--       Sets list_price. Logs 'Building Listed for Sale' event.
--   delist_building(p_building_id)
--       Owner-corp's owner faction only. Clears list_price. Logs.
--   buy_building(p_building_id, p_buyer_corp_id)
--       Buyer corp must be industry='real_estate' AND owned by the
--       caller. Cannot buy own building. Building must be listed +
--       completed. Debits buyer-faction party_funds, credits seller-
--       faction party_funds, flips owner_corp_id, clears list_price.
--       Money conserved. Logs 'Building Acquired'.
--
-- ── Lock order (deadlock-safe) ───────────────────────────────────
--   1. corp_buildings row FOR UPDATE
--   2. both corps (buyer + current owner) in uuid order
--   3. caller's faction FOR UPDATE
-- Seller faction is not explicitly locked — the credit UPDATE is
-- safe under Postgres MVCC (concurrent updates to the same row
-- serialise automatically; no read-then-write race because we only
-- write).
--
-- ── begin_construction patch ─────────────────────────────────────
-- v0 inserted rows without owner_corp_id. After this migration adds
-- the column, new rows would land with owner_corp_id=NULL → break
-- the Active Projects renderer (which queries by owner_corp_id).
-- begin_construction is CREATE OR REPLACEd with one extra column in
-- the INSERT VALUES list; body otherwise verbatim from 20270165.
--
-- Idempotent. Re-runnable.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: add owner_corp_id + list_price ───────────────────

ALTER TABLE corp_buildings
    ADD COLUMN IF NOT EXISTS owner_corp_id uuid
        REFERENCES entrepreneur_corps(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS list_price bigint;

-- CHECK on list_price (idempotent via constraint-name lookup).
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conrelid = 'public.corp_buildings'::regclass
           AND conname  = 'corp_buildings_list_price_check'
    ) THEN
        ALTER TABLE corp_buildings
            ADD CONSTRAINT corp_buildings_list_price_check
            CHECK (list_price IS NULL OR list_price > 0);
    END IF;
END$$;

COMMENT ON COLUMN corp_buildings.owner_corp_id IS
    'Current owner corp. Defaults to builder_corp_id at INSERT; flipped by buy_building. ON DELETE SET NULL → if the owner dissolves the asset persists unowned (UI treats NULL as Abandoned).';
COMMENT ON COLUMN corp_buildings.list_price IS
    'NULL = not for sale. Non-NULL = listed at this price (bigint, party_funds-scale). Set by list_building_for_sale; cleared by delist_building or buy_building.';

-- ── 2. Backfill: existing rows get owner_corp_id = builder_corp_id ─

UPDATE corp_buildings
   SET owner_corp_id = builder_corp_id
 WHERE owner_corp_id IS NULL
   AND builder_corp_id IS NOT NULL;

-- ── 3. Relax builder_corp_id FK from CASCADE to SET NULL ────────

DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN
        SELECT conname FROM pg_constraint
         WHERE conrelid = 'public.corp_buildings'::regclass
           AND contype  = 'f'
           AND pg_get_constraintdef(oid) ILIKE '%builder_corp_id%entrepreneur_corps%'
    LOOP
        EXECUTE format('ALTER TABLE public.corp_buildings DROP CONSTRAINT %I', r.conname);
    END LOOP;
END$$;

ALTER TABLE corp_buildings
    ADD CONSTRAINT corp_buildings_builder_corp_id_fkey
    FOREIGN KEY (builder_corp_id) REFERENCES entrepreneur_corps(id) ON DELETE SET NULL;

ALTER TABLE corp_buildings
    ALTER COLUMN builder_corp_id DROP NOT NULL;

-- ── 4. Indexes for marketplace queries ──────────────────────────

CREATE INDEX IF NOT EXISTS idx_corp_buildings_owner
    ON corp_buildings (owner_corp_id);

-- Partial index covering the marketplace fetch: completed + listed.
CREATE INDEX IF NOT EXISTS idx_corp_buildings_market
    ON corp_buildings (list_price)
    WHERE list_price IS NOT NULL AND status = 'completed';

-- ── 5. begin_construction — patched to set owner_corp_id ────────
-- Verbatim 20270165 body with owner_corp_id added to the INSERT.

CREATE OR REPLACE FUNCTION public.begin_construction(
    p_corp_id   uuid,
    p_nation_id uuid,
    p_name      text,
    p_tier      text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_corp         entrepreneur_corps%ROWTYPE;
    v_fac          factions%ROWTYPE;
    v_cost         bigint;
    v_duration     int;
    v_ambition     smallint;
    v_tick         int;
    v_nation_name  text;
    v_id           uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL OR p_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_name IS NULL OR length(btrim(p_name)) < 2 OR length(btrim(p_name)) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF p_tier NOT IN ('small','medium','large','major','monumental') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tier');
    END IF;

    CASE p_tier
        WHEN 'small'      THEN v_cost := 1000000;   v_duration := 24; v_ambition := 1;
        WHEN 'medium'     THEN v_cost := 5000000;   v_duration := 27; v_ambition := 2;
        WHEN 'large'      THEN v_cost := 20000000;  v_duration := 30; v_ambition := 3;
        WHEN 'major'      THEN v_cost := 50000000;  v_duration := 33; v_ambition := 4;
        WHEN 'monumental' THEN v_cost := 100000000; v_duration := 36; v_ambition := 5;
    END CASE;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_construction_corp');
    END IF;
    IF p_nation_id <> v_corp.hq_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_permitted');
    END IF;

    SELECT name INTO v_nation_name FROM nations WHERE id = p_nation_id;
    IF v_nation_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    IF COALESCE(v_fac.party_funds, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE factions
       SET party_funds  = COALESCE(party_funds, 0) - v_cost,
           ent_ambition = COALESCE(ent_ambition, 0) + v_ambition
     WHERE id = v_fac.id;

    -- v1: owner_corp_id seeded to the builder. buy_building flips it later.
    INSERT INTO corp_buildings
        (builder_corp_id, owner_corp_id, nation_id, name, tier, cost_paid, ambition_granted,
         status, started_at_tick, completes_at_tick)
    VALUES
        (p_corp_id, p_corp_id, p_nation_id, btrim(p_name), p_tier, v_cost, v_ambition,
         'in_progress', v_tick, v_tick + v_duration)
    RETURNING id INTO v_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        p_nation_id, v_fac.id,
        'Construction Begins',
        format('%s breaks ground on %s in %s.',
               v_corp.name, btrim(p_name), v_nation_name),
        'corporate', 'begin_construction',
        jsonb_build_object(
            'building_id',       v_id,
            'corp_id',           p_corp_id,
            'corp_name',         v_corp.name,
            'tier',              p_tier,
            'cost',              v_cost,
            'duration',          v_duration,
            'completes_at_tick', v_tick + v_duration,
            'ambition_bump',     v_ambition
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'building_id',       v_id,
        'tier',              p_tier,
        'cost',              v_cost,
        'duration',          v_duration,
        'ambition_bump',     v_ambition,
        'started_at_tick',   v_tick,
        'completes_at_tick', v_tick + v_duration,
        'new_funds',         COALESCE(v_fac.party_funds, 0) - v_cost
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.begin_construction(uuid, uuid, text, text) TO authenticated;

-- ── 6. list_building_for_sale ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.list_building_for_sale(
    p_building_id uuid,
    p_price       bigint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_fac         factions%ROWTYPE;
    v_building    corp_buildings%ROWTYPE;
    v_owner_corp  entrepreneur_corps%ROWTYPE;
    v_nation_name text;
    v_tick        int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_building_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;
    IF p_price IS NULL OR p_price < 1 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_price');
    END IF;

    SELECT * INTO v_building FROM corp_buildings
     WHERE id = p_building_id FOR UPDATE;
    IF v_building.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'building_not_found');
    END IF;
    IF v_building.status <> 'completed' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_completed');
    END IF;
    IF v_building.owner_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_owner');
    END IF;

    SELECT * INTO v_owner_corp FROM entrepreneur_corps
     WHERE id = v_building.owner_corp_id FOR UPDATE;
    IF v_owner_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'owner_corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_owner_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE corp_buildings SET list_price = p_price WHERE id = p_building_id;

    SELECT name INTO v_nation_name FROM nations WHERE id = v_building.nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_building.nation_id, v_fac.id,
        'Building Listed for Sale',
        format('%s lists %s in %s for sale at $%s.',
               v_owner_corp.name, v_building.name, v_nation_name,
               to_char(p_price, 'FM999,999,999,999')),
        'corporate', 'building_listed',
        jsonb_build_object(
            'building_id',   p_building_id,
            'building_name', v_building.name,
            'corp_id',       v_owner_corp.id,
            'corp_name',     v_owner_corp.name,
            'list_price',    p_price,
            'tier',          v_building.tier
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',     true,
        'building_id', p_building_id,
        'list_price',  p_price
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_building_for_sale(uuid, bigint) TO authenticated;

COMMENT ON FUNCTION public.list_building_for_sale(uuid, bigint) IS
    'List a completed building for sale at p_price (>0). Owner-corp''s owner faction only. Sets list_price; logs Building Listed for Sale event. Idempotent re-listing updates the price.';

-- ── 7. delist_building ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.delist_building(p_building_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid         uuid := auth.uid();
    v_fac         factions%ROWTYPE;
    v_building    corp_buildings%ROWTYPE;
    v_owner_corp  entrepreneur_corps%ROWTYPE;
    v_nation_name text;
    v_tick        int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_building_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_building FROM corp_buildings
     WHERE id = p_building_id FOR UPDATE;
    IF v_building.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'building_not_found');
    END IF;
    IF v_building.list_price IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_listed');
    END IF;
    IF v_building.owner_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_owner');
    END IF;

    SELECT * INTO v_owner_corp FROM entrepreneur_corps
     WHERE id = v_building.owner_corp_id FOR UPDATE;
    IF v_owner_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'owner_corp_not_found');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_owner_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE corp_buildings SET list_price = NULL WHERE id = p_building_id;

    SELECT name INTO v_nation_name FROM nations WHERE id = v_building.nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_building.nation_id, v_fac.id,
        'Building Delisted',
        format('%s withdraws %s in %s from the market.',
               v_owner_corp.name, v_building.name, v_nation_name),
        'corporate', 'building_delisted',
        jsonb_build_object(
            'building_id',   p_building_id,
            'building_name', v_building.name,
            'corp_id',       v_owner_corp.id,
            'corp_name',     v_owner_corp.name,
            'tier',          v_building.tier
        ),
        v_tick
    );

    RETURN jsonb_build_object('success', true, 'building_id', p_building_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delist_building(uuid) TO authenticated;

COMMENT ON FUNCTION public.delist_building(uuid) IS
    'Withdraw a listed building from the market. Owner-corp''s owner faction only. Clears list_price; logs Building Delisted event.';

-- ── 8. buy_building ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.buy_building(
    p_building_id   uuid,
    p_buyer_corp_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid              uuid := auth.uid();
    v_fac              factions%ROWTYPE;
    v_building         corp_buildings%ROWTYPE;
    v_buyer_corp       entrepreneur_corps%ROWTYPE;
    v_seller_corp      entrepreneur_corps%ROWTYPE;
    v_seller_fac_id    uuid;
    v_price            bigint;
    v_tick             int;
    v_nation_name      text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_building_id IS NULL OR p_buyer_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    -- Building first (single row).
    SELECT * INTO v_building FROM corp_buildings
     WHERE id = p_building_id FOR UPDATE;
    IF v_building.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'building_not_found');
    END IF;
    IF v_building.list_price IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_for_sale');
    END IF;
    IF v_building.status <> 'completed' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_completed');
    END IF;
    IF v_building.owner_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_seller');
    END IF;
    IF p_buyer_corp_id = v_building.owner_corp_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cannot_buy_own_building');
    END IF;
    v_price := v_building.list_price;

    -- Lock both corps in uuid order to prevent deadlock under
    -- concurrent A↔B sale swaps. The combined SELECT + ORDER BY id +
    -- FOR UPDATE locks in ascending uuid order in one statement.
    PERFORM id FROM entrepreneur_corps
     WHERE id IN (p_buyer_corp_id, v_building.owner_corp_id)
     ORDER BY id FOR UPDATE;

    SELECT * INTO v_buyer_corp FROM entrepreneur_corps WHERE id = p_buyer_corp_id;
    IF v_buyer_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_corp_not_found');
    END IF;
    IF v_buyer_corp.industry <> 'real_estate' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'buyer_not_real_estate');
    END IF;

    SELECT * INTO v_seller_corp FROM entrepreneur_corps WHERE id = v_building.owner_corp_id;
    IF v_seller_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seller_corp_not_found');
    END IF;
    IF v_seller_corp.owner_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'seller_orphan');
    END IF;
    v_seller_fac_id := v_seller_corp.owner_faction_id;

    -- Caller's faction. Verifies they own the buyer corp.
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_buyer_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_buyer_corp_owner');
    END IF;

    IF COALESCE(v_fac.party_funds, 0) < v_price THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_price);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Money flow. Debit then credit always — if buyer faction = seller
    -- faction (intra-faction transfer between two corps the same
    -- player owns) the two updates net to zero on that row, which is
    -- the intended behaviour for asset reorganisation.
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_price
     WHERE id = v_fac.id;
    UPDATE factions SET party_funds = COALESCE(party_funds, 0) + v_price
     WHERE id = v_seller_fac_id;

    UPDATE corp_buildings
       SET owner_corp_id = p_buyer_corp_id,
           list_price    = NULL
     WHERE id = p_building_id;

    SELECT name INTO v_nation_name FROM nations WHERE id = v_building.nation_id;
    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_building.nation_id, v_fac.id,
        'Building Acquired',
        format('%s acquires %s in %s from %s for $%s.',
               v_buyer_corp.name, v_building.name, v_nation_name,
               v_seller_corp.name, to_char(v_price, 'FM999,999,999,999')),
        'corporate', 'building_purchased',
        jsonb_build_object(
            'building_id',      p_building_id,
            'building_name',    v_building.name,
            'buyer_corp_id',    p_buyer_corp_id,
            'buyer_corp_name',  v_buyer_corp.name,
            'seller_corp_id',   v_seller_corp.id,
            'seller_corp_name', v_seller_corp.name,
            'price',            v_price,
            'tier',             v_building.tier
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'building_id',       p_building_id,
        'price',             v_price,
        'new_owner_corp_id', p_buyer_corp_id,
        'seller_corp_id',    v_seller_corp.id,
        'new_funds',         COALESCE(v_fac.party_funds, 0) - v_price
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_building(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.buy_building(uuid, uuid) IS
    'Real-Estate corp acquires a listed completed building. Buyer corp must be industry=real_estate AND owned by the caller. Debits buyer-faction party_funds, credits seller-faction party_funds, flips owner_corp_id, clears list_price. Money conserved. Building/corp/faction lock order is deadlock-safe (corps locked in uuid order). Allows secondary RE→RE sales (no check on seller industry). SECURITY DEFINER.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.buy_building(uuid, uuid);
-- DROP FUNCTION IF EXISTS public.delist_building(uuid);
-- DROP FUNCTION IF EXISTS public.list_building_for_sale(uuid, bigint);
-- -- Re-apply 20270165 to restore the un-patched begin_construction
-- -- (the v1 version's only difference is owner_corp_id in INSERT —
-- -- which is harmless if the column is gone).
-- ALTER TABLE corp_buildings DROP COLUMN IF EXISTS list_price;
-- ALTER TABLE corp_buildings DROP COLUMN IF EXISTS owner_corp_id;
-- -- builder_corp_id relaxation is NOT auto-reversed: corps that
-- -- dissolved between v0 and rollback may have left builder_corp_id
-- -- = NULL rows. Re-tightening to NOT NULL + CASCADE requires manual
-- -- triage of any orphaned rows.
-- COMMIT;
