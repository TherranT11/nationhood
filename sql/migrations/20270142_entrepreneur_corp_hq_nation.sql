-- ═══════════════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORPS — HQ is a real nation, not a free-text city
-- ═══════════════════════════════════════════════════════════════════════════════
-- v1 stored HQ as a free-text `hq` column ('Valcosta' .. invented cities).
-- It is now a foreign key to the real `nations` table so the founding UI
-- can show, per nation, that nation's corporate tax and how many
-- entrepreneur corps of the chosen industry are HQ'd there.
--
-- Replaces `hq text` with `hq_nation_id uuid → nations(id)` and changes
-- found_entrepreneur_corp's p_hq → p_hq_nation_id. The RPC validates the
-- nation exists AND has an assigned continent (continent IS NOT NULL =
-- a real, placeable nation — same rule the picker uses; excludes the
-- non-nation Valdoria). One source of truth for a corp's HQ.
--
-- Idempotent. The old free-text cities do not map to real nations, so
-- any pre-existing dev rows keep hq_nation_id = NULL (rendered as "—").
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE entrepreneur_corps
    ADD COLUMN IF NOT EXISTS hq_nation_id uuid REFERENCES nations(id);

CREATE INDEX IF NOT EXISTS idx_entrepreneur_corps_hq_nation
    ON entrepreneur_corps (hq_nation_id);

ALTER TABLE entrepreneur_corps DROP COLUMN IF EXISTS hq;

COMMENT ON COLUMN entrepreneur_corps.hq_nation_id IS
    'HQ nation (FK → nations.id). Set at founding by found_entrepreneur_corp, which requires the nation to have a non-null continent (a real placeable nation).';

-- Replace the old text-HQ signature with the nation-FK one.
DROP FUNCTION IF EXISTS found_entrepreneur_corp(text, text, text, bigint);

CREATE OR REPLACE FUNCTION found_entrepreneur_corp(
    p_industry text, p_hq_nation_id uuid, p_name text, p_capital bigint
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
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_industry NOT IN ('construction','banking','shipping') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_industry');
    END IF;
    IF p_name IS NULL OR btrim(p_name) = '' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'name_required');
    END IF;
    IF p_hq_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hq_required');
    END IF;
    -- Real, placeable nation = exists and has an assigned continent.
    SELECT (continent IS NOT NULL) INTO v_nation_ok
      FROM nations WHERE id = p_hq_nation_id;
    IF v_nation_ok IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_hq_nation');
    END IF;
    IF p_capital IS NULL OR p_capital < 5000000 OR p_capital > 500000000 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_capital');
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
        (owner_faction_id, name, industry, hq_nation_id, starting_capital, founding_fee, listing, founded_tick)
    VALUES
        (v_fac.id, btrim(p_name), p_industry, p_hq_nation_id, p_capital, v_fee, 'private', COALESCE(v_tick, 0))
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'corp_id', v_id,
        'spent', v_cost, 'new_funds', COALESCE(v_fac.party_funds, 0) - v_cost);
END;
$$;

GRANT EXECUTE ON FUNCTION found_entrepreneur_corp(text, uuid, text, bigint) TO authenticated;

COMMIT;

-- PostgREST routes RPCs by cached argument names; a function signature
-- change (p_hq text → p_hq_nation_id uuid) is the one case where the
-- schema cache stays stale after apply, yielding "Could not find the
-- function public.found_entrepreneur_corp(...) in the schema cache".
-- Reload it — same convention the rest of the codebase uses after
-- API-affecting DDL. Idempotent.
NOTIFY pgrst, 'reload schema';
