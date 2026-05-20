-- ════════════════════════════════════════════════════════════════════
-- LANDLOCKED — Shipping corps can't HQ in nations without coastline
-- ════════════════════════════════════════════════════════════════════
-- nations.is_landlocked already exists (20260322); Montequilla was
-- flagged there but Dravka was not. This migration flags Dravka and
-- adds a server-side gate to found_entrepreneur_corp: industry=
-- 'shipping' + hq_nation.is_landlocked = TRUE returns
-- landlocked_no_shipping. The client (entrepreneur-corporations.html)
-- filters landlocked nations from the HQ picker when Shipping is
-- selected — server check stays as defence-in-depth.
--
-- ── Scope (what's NOT in this migration) ────────────────────────
-- Port builds (begin_construction with p_building_type='port') in a
-- landlocked nation are still allowed. A Shipping corp founded
-- elsewhere can RHQ-expand into landlocked Dravka and then build a
-- Port there — operationally meaningless but currently legal. If
-- you want Port construction gated by coastline too, flag it and
-- I'll add the check to begin_construction in a follow-up.
--
-- Body of found_entrepreneur_corp is otherwise verbatim from
-- 20270165 (real_estate enum addition). One DECLARE + one IF block
-- added for the landlocked gate; the existing v_nation_ok lookup
-- is widened to also read is_landlocked in the same SELECT to avoid
-- a second query.
--
-- Idempotent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Mark Dravka landlocked ───────────────────────────────────
-- ILIKE so we don't get bitten by case variations in seed data.
-- Idempotent: re-running is a no-op if already TRUE.
UPDATE nations SET is_landlocked = TRUE
 WHERE name ILIKE 'Dravka' AND is_landlocked IS NOT TRUE;

-- ── 2. found_entrepreneur_corp — gate Shipping in landlocked ────

CREATE OR REPLACE FUNCTION found_entrepreneur_corp(
    p_industry text, p_hq_nation_id uuid, p_name text, p_capital bigint, p_listing text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid        uuid := auth.uid();
    v_fac        factions%ROWTYPE;
    v_fee        bigint := 1000000;
    v_cost       bigint;
    v_tick       int;
    v_id         uuid;
    v_nation_ok  boolean;
    v_landlocked boolean;
    v_listing    text;
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
    -- Read both placeability + landlocked in one query (same row).
    SELECT (continent IS NOT NULL), COALESCE(is_landlocked, FALSE)
      INTO v_nation_ok, v_landlocked
      FROM nations WHERE id = p_hq_nation_id;
    IF v_nation_ok IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_hq_nation');
    END IF;
    -- Shipping corps need coastline. Landlocked nations (Montequilla,
    -- Dravka per the seed data) reject Shipping HQ founding.
    IF p_industry = 'shipping' AND v_landlocked THEN
        RETURN jsonb_build_object('success', false, 'reason', 'landlocked_no_shipping');
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

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- Re-apply 20270165 to restore the un-gated found_entrepreneur_corp.
-- Dravka stays flagged is_landlocked (the flag is already established
-- by 20260322's design — Dravka should have been included from the
-- start).
