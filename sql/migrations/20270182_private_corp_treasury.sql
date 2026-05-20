-- ════════════════════════════════════════════════════════════════════
-- PRIVATE-CORP TREASURY — make `treasury_cash` live for ALL corps
-- ════════════════════════════════════════════════════════════════════
-- Before this migration, treasury_cash was populated ONLY for public
-- corps (via go_public / found_entrepreneur_corp public path). Private
-- corps showed `starting_capital` on entrepreneur-corp.html as "cash
-- on hand" — but the number was phantom: nothing actually spent from
-- it, no debits possible, and begin_construction debited the owner's
-- personal `factions.party_funds` instead.
--
-- The displayed cash should be real. The corp paid `starting_capital`
-- at founding (from the owner); that money belongs to the CORP, not
-- the owner. This migration:
--
--   1. Backfills treasury_cash = starting_capital for every existing
--      private corp where treasury_cash IS NULL.
--   2. Replaces found_entrepreneur_corp so the private path also
--      seeds treasury_cash (parity with the public path).
--   3. Replaces begin_construction to debit
--      entrepreneur_corps.treasury_cash instead of
--      factions.party_funds. Same caller-must-own-corp gate; the
--      money source moves to the corp's own books.
--   4. Replaces go_public to leave treasury_cash alone (it is already
--      seeded at founding). Previously go_public overwrote it back
--      to starting_capital, which would refund any cash a private
--      corp had spent — now a bug because treasury_cash is live.
--
-- go_private (20270153) is intentionally untouched in this migration.
-- It still reclaims treasury_cash into party_funds on the IPO-reverse
-- path — that semantics is acceptable for the user-initiated case
-- (selling out of all share structure to take cash back). For purely
-- private corps founded after this migration, owners get money out
-- by either selling the corp (future work) or going public → private.
--
-- Idempotent. CREATE OR REPLACE on RPCs; backfill UPDATE is filtered
-- by treasury_cash IS NULL so re-running is a no-op.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Backfill private-corp treasury_cash ───────────────────────
-- Money already paid at founding (starting_capital out of the
-- owner's party_funds). Materialise it into a spendable column.
UPDATE entrepreneur_corps
   SET treasury_cash = starting_capital::numeric,
       updated_at    = now()
 WHERE listing       = 'private'
   AND treasury_cash IS NULL;

-- treasury_cash comment now covers both listings.
COMMENT ON COLUMN entrepreneur_corps.treasury_cash IS
    'Live cash pool for the corp. Seeded = starting_capital at founding (both private and public). Debited by begin_construction; AMM-traded for public corps (corp_trade); reclaimed by go_private on the public→private path. Client-write-revoked — mutable only via SECURITY DEFINER RPCs.';

-- ── 2. found_entrepreneur_corp — seed treasury_cash for ALL ──────
-- The 20270144 body wrote treasury_cash only on the public path
-- (CASE WHEN v_listing='public' ...). Drop that gate so the private
-- path seeds it too. Rest of the body unchanged.

CREATE OR REPLACE FUNCTION found_entrepreneur_corp(
    p_industry text, p_hq_nation_id uuid, p_name text, p_capital bigint, p_listing text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_fac       factions%ROWTYPE;
    v_capital   bigint := COALESCE(p_capital, 0);
    v_fee       bigint;
    v_total     bigint;
    v_id        uuid;
    v_tick      int;
    v_listing   text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_name IS NULL OR length(btrim(p_name)) < 2 OR length(btrim(p_name)) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF v_capital < 5000000 OR v_capital > 500000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_capital');
    END IF;
    IF p_industry IS NULL OR length(btrim(p_industry)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_industry');
    END IF;
    IF p_hq_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_hq_nation');
    END IF;
    v_listing := lower(COALESCE(NULLIF(btrim(p_listing), ''), 'private'));
    IF v_listing NOT IN ('private','public') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_listing');
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

    -- Founding fee = 5% of capital (existing rule from 20270142).
    v_fee   := (v_capital * 5) / 100;
    v_total := v_capital + v_fee;
    IF COALESCE(v_fac.party_funds, 0) < v_total THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_total);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_total
     WHERE id = v_fac.id;

    -- Seed treasury_cash = starting_capital REGARDLESS of listing.
    -- Public path also seeds shares; private leaves them NULL.
    INSERT INTO entrepreneur_corps
        (owner_faction_id, name, industry, hq_nation_id, starting_capital, founding_fee,
         listing, founded_tick, treasury_cash, shares_outstanding, share_price)
    VALUES
        (v_fac.id, btrim(p_name), p_industry, p_hq_nation_id, v_capital, v_fee,
         v_listing, COALESCE(v_tick, 0),
         v_capital::numeric,
         CASE WHEN v_listing = 'public' THEN 20 END,
         CASE WHEN v_listing = 'public' THEN v_capital::numeric / 20 END)
    RETURNING id INTO v_id;

    IF v_listing = 'public' THEN
        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (v_id, v_fac.id, 20);
    END IF;

    RETURN jsonb_build_object('success', true, 'corp_id', v_id, 'listing', v_listing,
        'capital', v_capital, 'founding_fee', v_fee);
END;
$$;

GRANT EXECUTE ON FUNCTION found_entrepreneur_corp(text, uuid, text, bigint, text) TO authenticated;

COMMENT ON FUNCTION found_entrepreneur_corp(text, uuid, text, bigint, text) IS
    'Found an entrepreneur corp (private or public). Debits (capital + 5%% fee) from the owner''s party_funds, seeds entrepreneur_corps.treasury_cash = capital for BOTH listings. Public listing also gets 20-share AMM state. Sole source of truth for corp founding; client-write-revoked columns require SECURITY DEFINER.';

-- ── 3. begin_construction — debit treasury_cash, not party_funds ─

CREATE OR REPLACE FUNCTION public.begin_construction(
    p_corp_id        uuid,
    p_nation_id      uuid,
    p_name           text,
    p_tier           text,
    p_building_type  text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid          uuid := auth.uid();
    v_corp         entrepreneur_corps%ROWTYPE;
    v_fac          factions%ROWTYPE;
    v_cost_base    bigint;
    v_dur_base     int;
    v_cost         bigint;
    v_duration     int;
    v_ambition     smallint;
    v_tick         int;
    v_nation_name  text;
    v_col          numeric;
    v_inf          numeric;
    v_col_factor   numeric;
    v_inf_factor   numeric;
    v_mult         numeric;
    v_id           uuid;
    v_has_rhq      boolean;
    v_cy_count     int;
    v_in_progress  int;
    v_corp_cash    numeric;
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
    IF p_building_type NOT IN ('regional_hq','construction_yard','port','banking_office','real_estate_office') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_building_type');
    END IF;
    IF p_building_type = 'regional_hq' AND p_tier NOT IN ('small','medium','large') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_rhq_tier');
    END IF;

    CASE p_tier
        WHEN 'small'      THEN v_cost_base := 20000000;   v_dur_base := 24; v_ambition := 1;
        WHEN 'medium'     THEN v_cost_base := 50000000;   v_dur_base := 27; v_ambition := 2;
        WHEN 'large'      THEN v_cost_base := 100000000;  v_dur_base := 30; v_ambition := 3;
        WHEN 'major'      THEN v_cost_base := 200000000;  v_dur_base := 33; v_ambition := 4;
        WHEN 'monumental' THEN v_cost_base := 400000000;  v_dur_base := 36; v_ambition := 5;
    END CASE;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_construction_corp');
    END IF;

    SELECT name, COALESCE(cost_of_living, 50), COALESCE(infrastructure, 50)
      INTO v_nation_name, v_col, v_inf
      FROM nations WHERE id = p_nation_id;
    IF v_nation_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    v_col_factor := 0.5 + v_col / 100.0;
    v_inf_factor := 0.5 + (100 - v_inf) / 100.0;
    v_mult       := v_col_factor * v_inf_factor;
    v_cost       := ROUND(v_cost_base::numeric * v_mult)::bigint;
    v_duration   := GREATEST(1, ROUND(v_dur_base::numeric * v_mult)::int);

    IF p_building_type <> 'regional_hq' THEN
        IF p_nation_id <> v_corp.hq_nation_id THEN
            SELECT EXISTS (
                SELECT 1 FROM corp_buildings
                 WHERE owner_corp_id = p_corp_id
                   AND nation_id = p_nation_id
                   AND building_type = 'regional_hq'
                   AND status = 'completed'
            ) INTO v_has_rhq;
            IF NOT v_has_rhq THEN
                RETURN jsonb_build_object('success', false, 'reason', 'no_rhq_in_nation');
            END IF;
        END IF;
    END IF;

    IF p_building_type IN ('port','banking_office','real_estate_office') THEN
        SELECT COUNT(*) INTO v_cy_count FROM corp_buildings
         WHERE owner_corp_id = p_corp_id
           AND nation_id = p_nation_id
           AND building_type = 'construction_yard'
           AND status = 'completed';
        SELECT COUNT(*) INTO v_in_progress FROM corp_buildings
         WHERE builder_corp_id = p_corp_id
           AND nation_id = p_nation_id
           AND building_type IN ('port','banking_office','real_estate_office')
           AND status = 'in_progress';
        IF v_in_progress >= v_cy_count * 2 THEN
            RETURN jsonb_build_object('success', false, 'reason', 'capacity_exceeded',
                'cy_count', v_cy_count, 'max', v_cy_count * 2, 'in_progress', v_in_progress);
        END IF;
    END IF;

    -- Owner gate (no money debit from party_funds — corp pays).
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

    -- Corp pays. treasury_cash is seeded at founding for both
    -- listings (20270144 + this migration's found_entrepreneur_corp
    -- update + the backfill above). If a corp predates the backfill
    -- and treasury_cash is still NULL, COALESCE to 0 — owner sees
    -- insufficient_funds with have=0 and can re-fund via go_public
    -- → go_private cycle or by switching to a corp that has cash.
    v_corp_cash := COALESCE(v_corp.treasury_cash, 0);
    IF v_corp_cash < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_corp_cash::bigint, 'need', v_cost,
            'payer', 'corp');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Debit corp treasury (NOT party_funds). Ambition bump still
    -- goes to the owner — the build is the owner's personal
    -- accomplishment surface, distinct from corp finance.
    UPDATE entrepreneur_corps
       SET treasury_cash = COALESCE(treasury_cash, 0) - v_cost,
           updated_at    = now()
     WHERE id = p_corp_id;

    UPDATE factions
       SET ent_ambition = COALESCE(ent_ambition, 0) + v_ambition
     WHERE id = v_fac.id;

    INSERT INTO corp_buildings
        (builder_corp_id, owner_corp_id, nation_id, name, tier, building_type,
         cost_paid, ambition_granted,
         status, started_at_tick, completes_at_tick)
    VALUES
        (p_corp_id, p_corp_id, p_nation_id, btrim(p_name), p_tier, p_building_type,
         v_cost, v_ambition,
         'in_progress', v_tick, v_tick + v_duration)
    RETURNING id INTO v_id;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        p_nation_id, v_fac.id,
        'Construction Begins',
        format('%s breaks ground on %s (%s) in %s.',
               v_corp.name, btrim(p_name),
               CASE p_building_type
                   WHEN 'regional_hq'        THEN 'Regional HQ'
                   WHEN 'construction_yard'  THEN 'Construction Yard'
                   WHEN 'port'               THEN 'Port'
                   WHEN 'banking_office'     THEN 'Banking Office'
                   WHEN 'real_estate_office' THEN 'Real Estate Office'
               END,
               v_nation_name),
        'corporate', 'begin_construction',
        jsonb_build_object(
            'building_id',       v_id,
            'corp_id',           p_corp_id,
            'corp_name',         v_corp.name,
            'tier',              p_tier,
            'building_type',     p_building_type,
            'cost',              v_cost,
            'duration',          v_duration,
            'completes_at_tick', v_tick + v_duration,
            'ambition_bump',     v_ambition,
            'cost_multiplier',   ROUND(v_mult, 3),
            'cost_of_living',    v_col,
            'infrastructure',    v_inf,
            'payer',             'corp_treasury'
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',           true,
        'building_id',       v_id,
        'tier',              p_tier,
        'building_type',     p_building_type,
        'cost',              v_cost,
        'duration',          v_duration,
        'ambition_bump',     v_ambition,
        'started_at_tick',   v_tick,
        'completes_at_tick', v_tick + v_duration,
        'corp_cash_after',   (v_corp_cash - v_cost)::bigint,
        'cost_multiplier',   ROUND(v_mult, 3)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.begin_construction(uuid, uuid, text, text, text) TO authenticated;

COMMENT ON FUNCTION public.begin_construction(uuid, uuid, text, text, text) IS
    'Construction-corp owner breaks ground on a new building. Cost paid from entrepreneur_corps.treasury_cash (the corp''s own books) — NOT the owner''s party_funds. Ambition bump still credits the owner. Caller must own the corp; corp must be in ''construction'' industry; same RHQ-prerequisite, Construction-Yard capacity, and nation cost/duration scaling as before.';

-- ── 4. go_public — leave treasury_cash alone ─────────────────────
-- Pre-fix: writes treasury_cash = starting_capital on IPO. Now
-- treasury_cash is live for private corps too — overwriting would
-- refund whatever the corp had spent pre-IPO (e.g. on construction).
-- New body: only flip listing + seed share state; treasury_cash
-- stays whatever the corp has.

CREATE OR REPLACE FUNCTION public.go_public(
    p_corp_id UUID
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid    UUID := auth.uid();
    v_fac    factions%ROWTYPE;
    v_corp   entrepreneur_corps%ROWTYPE;
    v_price  NUMERIC;
    v_treas  NUMERIC;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
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

    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id
     FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF v_corp.listing <> 'private' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_public');
    END IF;

    -- Share price anchored to the corp's CURRENT cash, not its
    -- starting_capital. If the corp has been growing or shrinking
    -- its treasury, the IPO reflects that. treasury_cash is left
    -- alone — already populated for every corp post-20270182.
    v_treas := COALESCE(v_corp.treasury_cash, v_corp.starting_capital::numeric);
    v_price := v_treas / 20;

    UPDATE entrepreneur_corps
       SET listing            = 'public',
           shares_outstanding = 20,
           share_price        = v_price,
           updated_at         = now()
     WHERE id = p_corp_id;

    INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
    VALUES (p_corp_id, v_fac.id, 20)
    ON CONFLICT (corp_id, holder_faction_id) DO UPDATE SET shares = 20;

    RETURN jsonb_build_object(
        'success',            true,
        'corp_id',            p_corp_id,
        'listing',            'public',
        'shares_outstanding', 20,
        'share_price',        v_price,
        'treasury_cash',      v_treas
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.go_public(UUID) TO authenticated;

COMMENT ON FUNCTION public.go_public(UUID) IS
    'IPO a private entrepreneur corp. treasury_cash is left alone (already populated for every corp); share_price = treasury_cash / 20 so the IPO reflects the corp''s actual book value, not its long-stale starting_capital. shares_outstanding=20 to the founder. Owner-only, private-only, idempotent on double-fire via FOR UPDATE.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Reverting reinstates the phantom "cash on hand" display problem.
-- Drop the new bodies; the prior versions remain in their original
-- migrations (20270180, 20270152, 20270144) and can be re-applied
-- by re-running those files in order.
-- BEGIN;
-- -- Restore prior bodies by re-running 20270180, 20270152, 20270144.
-- -- Backfill is not reversible (treasury_cash stays populated;
-- -- no data loss).
-- COMMIT;
