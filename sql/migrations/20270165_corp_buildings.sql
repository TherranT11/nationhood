-- ════════════════════════════════════════════════════════════════════
-- CONSTRUCTION v0 — corp_buildings + begin_construction + Real Estate sector
-- ════════════════════════════════════════════════════════════════════
-- Closed loop, phase 1: Construction corps can spend money to start a
-- building project in their HQ nation. The project counts down ticks
-- (24–36 based on tier) and on completion grants +0.2 GDP_Growth to
-- the host nation (one-time, guarded). Buildings persist as owned
-- assets; the sell-to-Real-Estate flow lands in v1.
--
-- This migration also adds 'real_estate' as a valid entrepreneur
-- corp industry so the buyer half of the future sell flow has a corp
-- type to register against.
--
-- ── Scope (v0, locked with user) ─────────────────────────────────
--   • Construction corps only (industry='construction', owner only).
--   • Nation gate: HQ nation only — Regional HQ multi-nation gating
--     is deferred to v1.
--   • Tier ↔ cost ↔ duration ↔ ambition is a fixed 5-row table.
--     The player picks a tier; cost/duration/ambition fall out.
--   • +0.2 GDP_Growth fires ON COMPLETION (not on start), so the
--     nation only benefits from finished projects. One-time per
--     building (gdp_growth_applied flag).
--   • Completion is driven by complete_finished_buildings(p_tick),
--     called from the tick processor (advance-tick handler-template
--     adds a 3.6e block; idempotent so safe against double-call).
--
-- ── Tier table ───────────────────────────────────────────────────
--   small        $1M     24 ticks  +1 ambition
--   medium       $5M     27 ticks  +2 ambition
--   large       $20M     30 ticks  +3 ambition
--   major       $50M     33 ticks  +4 ambition
--   monumental $100M     36 ticks  +5 ambition
-- Costs sit comfortably inside party_funds scale (entrepreneur corps
-- charter at $5M–$500M); even a fresh founder can swing a Small.
--
-- ── RLS class ────────────────────────────────────────────────────
-- Mirrors entrepreneur_corps / corp_shareholdings / corp_board_seats:
-- SELECT USING(true), no write policy → only SECURITY DEFINER RPCs
-- write. Public market data; everyone can see what's being built.
--
-- ── Real Estate sector ───────────────────────────────────────────
-- Relaxes the entrepreneur_corps.industry CHECK and the
-- found_entrepreneur_corp guard to include 'real_estate'. The
-- column-attached CHECK from 20270139 is dropped by inspection (its
-- generated name may differ across deploys, so DO-block scan); the
-- new constraint is named explicitly so future migrations can find
-- it.
--
-- Idempotent. Re-runnable.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Relax industry CHECK to include 'real_estate' ─────────────
-- Inline CHECK constraints from 20270139 get system-generated names.
-- Scan-and-drop any CHECK on entrepreneur_corps whose definition
-- mentions 'industry', then add a named one with the expanded enum.

DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN
        SELECT conname FROM pg_constraint
         WHERE conrelid = 'public.entrepreneur_corps'::regclass
           AND contype  = 'c'
           AND pg_get_constraintdef(oid) ILIKE '%industry%'
    LOOP
        EXECUTE format('ALTER TABLE public.entrepreneur_corps DROP CONSTRAINT %I', r.conname);
    END LOOP;
END$$;

ALTER TABLE public.entrepreneur_corps
    ADD CONSTRAINT entrepreneur_corps_industry_check
    CHECK (industry IN ('construction','banking','shipping','real_estate'));

-- ── 2. found_entrepreneur_corp — accept 'real_estate' ────────────
-- Verbatim 20270144 body with the IN-list extended. Signature
-- unchanged (CREATE OR REPLACE works without DROP). Comments + GRANT
-- metadata persist.

CREATE OR REPLACE FUNCTION found_entrepreneur_corp(
    p_industry text, p_hq_nation_id uuid, p_name text, p_capital bigint, p_listing text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_fac       factions%ROWTYPE;
    v_fee       bigint := 1000000;
    v_cost      bigint;
    v_tick      int;
    v_id        uuid;
    v_nation_ok boolean;
    v_listing   text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_industry NOT IN ('construction','banking','shipping','real_estate') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_industry');
    END IF;
    IF p_name IS NULL OR btrim(p_name) = '' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'name_required');
    END IF;
    IF p_hq_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hq_required');
    END IF;
    SELECT (continent IS NOT NULL) INTO v_nation_ok
      FROM nations WHERE id = p_hq_nation_id;
    IF v_nation_ok IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_hq_nation');
    END IF;
    IF p_capital IS NULL OR p_capital < 5000000 OR p_capital > 500000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_capital');
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

    v_cost := p_capital + v_fee;
    IF COALESCE(v_fac.party_funds, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', COALESCE(v_fac.party_funds, 0), 'need', v_cost);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE factions SET party_funds = COALESCE(party_funds, 0) - v_cost WHERE id = v_fac.id;

    INSERT INTO entrepreneur_corps
        (owner_faction_id, name, industry, hq_nation_id, starting_capital, founding_fee,
         listing, founded_tick, treasury_cash, shares_outstanding, share_price)
    VALUES
        (v_fac.id, btrim(p_name), p_industry, p_hq_nation_id, p_capital, v_fee,
         v_listing, COALESCE(v_tick, 0),
         CASE WHEN v_listing = 'public' THEN p_capital::numeric END,
         CASE WHEN v_listing = 'public' THEN 20 END,
         CASE WHEN v_listing = 'public' THEN p_capital::numeric / 20 END)
    RETURNING id INTO v_id;

    IF v_listing = 'public' THEN
        INSERT INTO corp_shareholdings (corp_id, holder_faction_id, shares)
        VALUES (v_id, v_fac.id, 20);
    END IF;

    RETURN jsonb_build_object('success', true, 'corp_id', v_id, 'listing', v_listing,
        'spent', v_cost, 'new_funds', COALESCE(v_fac.party_funds, 0) - v_cost);
END;
$$;

GRANT EXECUTE ON FUNCTION found_entrepreneur_corp(text, uuid, text, bigint, text) TO authenticated;

-- ── 3. corp_buildings table ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS corp_buildings (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    builder_corp_id     uuid NOT NULL REFERENCES entrepreneur_corps(id) ON DELETE CASCADE,
    nation_id           uuid NOT NULL REFERENCES nations(id),
    name                text NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 80),
    tier                text NOT NULL CHECK (tier IN ('small','medium','large','major','monumental')),
    cost_paid           bigint   NOT NULL CHECK (cost_paid >= 0),
    ambition_granted    smallint NOT NULL DEFAULT 0,
    status              text     NOT NULL DEFAULT 'in_progress'
                            CHECK (status IN ('in_progress','completed')),
    started_at_tick     int      NOT NULL,
    completes_at_tick   int      NOT NULL,
    completed_at_tick   int,
    gdp_growth_applied  boolean  NOT NULL DEFAULT false,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corp_buildings_corp
    ON corp_buildings (builder_corp_id, status, completes_at_tick);
CREATE INDEX IF NOT EXISTS idx_corp_buildings_due
    ON corp_buildings (status, completes_at_tick) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_corp_buildings_nation
    ON corp_buildings (nation_id);

COMMENT ON TABLE corp_buildings IS
    'Construction-corp building projects (v0). status=in_progress until completes_at_tick reached; completion fires +0.2 GDP_Growth one-time. RPC-write-only (RLS).';

ALTER TABLE corp_buildings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON corp_buildings;
CREATE POLICY "Allow select for all" ON corp_buildings
    FOR SELECT USING (true);

-- ── 4. begin_construction RPC ────────────────────────────────────
-- Construction-corp owner-only. Debits party_funds, bumps ambition,
-- inserts the building row, logs the event. Corp-first lock order
-- (consistent with corp_trade / go_public / corp_board_leave). Tier
-- table is internal — clients pass a tier label, server resolves
-- cost / duration / ambition so the schema is the one source.

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

    -- Tier → cost / duration / ambition. The single source for these
    -- numbers — client UI shows the same table, but the server's
    -- copy is authoritative.
    CASE p_tier
        WHEN 'small'      THEN v_cost := 1000000;   v_duration := 24; v_ambition := 1;
        WHEN 'medium'     THEN v_cost := 5000000;   v_duration := 27; v_ambition := 2;
        WHEN 'large'      THEN v_cost := 20000000;  v_duration := 30; v_ambition := 3;
        WHEN 'major'      THEN v_cost := 50000000;  v_duration := 33; v_ambition := 4;
        WHEN 'monumental' THEN v_cost := 100000000; v_duration := 36; v_ambition := 5;
    END CASE;

    -- Corp first (lock order matches corp_trade / go_public / etc).
    SELECT * INTO v_corp FROM entrepreneur_corps
     WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_construction_corp');
    END IF;

    -- v0: HQ nation only. Regional HQ multi-nation gating lands v1.
    IF p_nation_id <> v_corp.hq_nation_id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_permitted');
    END IF;

    SELECT name INTO v_nation_name FROM nations WHERE id = p_nation_id;
    IF v_nation_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'nation_not_found');
    END IF;

    -- Caller's entrepreneur faction (verbatim prelude). Lock so the
    -- party_funds + ent_ambition updates are race-safe against any
    -- concurrent debit/credit (rally pay, corp_trade, etc).
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

    -- Debit + ambition bump on the founding faction. Ambition is a
    -- smallint stat from 20270138; bumps stack across projects.
    UPDATE factions
       SET party_funds  = COALESCE(party_funds, 0) - v_cost,
           ent_ambition = COALESCE(ent_ambition, 0) + v_ambition
     WHERE id = v_fac.id;

    INSERT INTO corp_buildings
        (builder_corp_id, nation_id, name, tier, cost_paid, ambition_granted,
         status, started_at_tick, completes_at_tick)
    VALUES
        (p_corp_id, p_nation_id, btrim(p_name), p_tier, v_cost, v_ambition,
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

COMMENT ON FUNCTION public.begin_construction(uuid, uuid, text, text) IS
    'Construction-corp owner-only. Spends party_funds, bumps ent_ambition, inserts a corp_buildings row (status=in_progress, completes at started_at_tick + duration). v0 gates to HQ nation only. Tier table (small..monumental) → cost (1M..100M), duration (24..36 ticks), ambition (+1..+5). Server is the source of truth for the table.';

-- ── 5. complete_finished_buildings — tick-processor handler ─────
-- Idempotent. Called once per tick from the advance-tick processor
-- (3.6e block in handler-template). Safe to call lazily from any
-- client (no effects on already-completed rows). Flips status and
-- applies +0.2 GDP_Growth ONE TIME per building (guarded by the
-- gdp_growth_applied flag — defensive against double-call even if
-- the tick-processor block runs twice). Logs a per-completion event.

CREATE OR REPLACE FUNCTION public.complete_finished_buildings(p_tick int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r          RECORD;
    v_count    int := 0;
    v_corp     RECORD;
    v_nation   text;
BEGIN
    IF p_tick IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_tick');
    END IF;

    FOR r IN
        SELECT id, builder_corp_id, nation_id, name, tier, cost_paid,
               gdp_growth_applied
          FROM corp_buildings
         WHERE status = 'in_progress' AND completes_at_tick <= p_tick
         FOR UPDATE
    LOOP
        -- Status + completion timestamp.
        UPDATE corp_buildings
           SET status            = 'completed',
               completed_at_tick = p_tick,
               gdp_growth_applied = true
         WHERE id = r.id;

        -- GDP_Growth bump (one-time per building).
        IF NOT r.gdp_growth_applied THEN
            UPDATE nations
               SET gdp_growth = COALESCE(gdp_growth, 0) + 0.2
             WHERE id = r.nation_id;
        END IF;

        -- Event log. Builder + nation context for the dashboards.
        SELECT c.name, c.owner_faction_id INTO v_corp
          FROM entrepreneur_corps c WHERE c.id = r.builder_corp_id;
        SELECT name INTO v_nation FROM nations WHERE id = r.nation_id;

        INSERT INTO event_log (
            nation_id, faction_id, event_name, description_used,
            category, trigger_key, effects_applied, fired_at_tick
        ) VALUES (
            r.nation_id, v_corp.owner_faction_id,
            'Construction Completed',
            format('%s has completed %s in %s. GDP growth ticks up.',
                   v_corp.name, r.name, v_nation),
            'corporate', 'construction_completed',
            jsonb_build_object(
                'building_id',     r.id,
                'corp_id',         r.builder_corp_id,
                'corp_name',       v_corp.name,
                'tier',            r.tier,
                'cost',            r.cost_paid,
                'gdp_growth_bump', 0.2
            ),
            p_tick
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'completed', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_finished_buildings(int) TO authenticated;

COMMENT ON FUNCTION public.complete_finished_buildings(int) IS
    'Idempotent tick handler — flips in_progress→completed for any corp_buildings row whose completes_at_tick has elapsed, applies +0.2 GDP_Growth one-time (gdp_growth_applied flag), logs the event. Called from advance-tick (3.6e); safe to call lazily.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.complete_finished_buildings(int);
-- DROP FUNCTION IF EXISTS public.begin_construction(uuid, uuid, text, text);
-- DROP TABLE    IF EXISTS corp_buildings;
-- -- Industry CHECK relaxation is best left in place — narrowing it back
-- -- would fail if any 'real_estate' corps already exist. If forced:
-- --   DELETE FROM entrepreneur_corps WHERE industry = 'real_estate';
-- --   ALTER TABLE entrepreneur_corps DROP CONSTRAINT entrepreneur_corps_industry_check;
-- --   ALTER TABLE entrepreneur_corps ADD CONSTRAINT entrepreneur_corps_industry_check
-- --     CHECK (industry IN ('construction','banking','shipping'));
-- COMMIT;
