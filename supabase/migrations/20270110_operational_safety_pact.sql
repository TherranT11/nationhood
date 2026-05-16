-- 20270110_operational_safety_pact.sql
--
-- Strategic Alliances — Airline article: Operational Safety Pact.
-- The airline analogue of Bad Debt Mutual Aid (20260816). When a member
-- corp suffers a moderate or major aviation incident:
--   • each other active member pays 15% of the incident cash cost to
--     the victim (peer corp_cash_reserves down, victim up); and
--   • the op_safety hit is mutualised — the victim keeps 60% of the
--     loss; the remaining 40% is split evenly across the peers.
--
-- Pieces (mirrors the bad_debt_mutual_aid push exactly):
--   1. Helper _apply_op_safety_pact(corp, severity, cost, os_delta, tick)
--      — gated by _alliance_member_has_article(corp,'op_safety_pact');
--      fast no-op otherwise. Returns peer count aided.
--   2. _fire_aviation_incident re-issued verbatim from 20260726 with ONE
--      appended call to the helper, just before RETURN, for moderate/
--      major severities. The helper early-returns if the victim faction
--      no longer exists, so a wipeout incident that bankrupts the corp
--      (handled by the bankruptcy auto-trigger above the call) gets no
--      pact aid — the bankruptcy path owns that case.
--
-- Catalog entry (SECTOR_ARTICLES.Airline) is added client-side in
-- alliances.html; the ratify RPC is generic and needs no change.
-- Idempotent (CREATE OR REPLACE).

BEGIN;

-- ── 1. Helper RPC ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION _apply_op_safety_pact(
    p_corp_id         UUID,
    p_severity        TEXT,
    p_cost            NUMERIC,
    p_op_safety_delta NUMERIC,
    p_tick            INTEGER
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cash_share  CONSTANT NUMERIC := 0.15;  -- each peer pays 15% of incident cost
    v_victim_keep CONSTANT NUMERIC := 0.60;  -- victim keeps 60% of the op_safety hit
    v_alliance_id   UUID;
    v_peer_ids      UUID[];
    v_peer_count    INT;
    v_per_peer_cash NUMERIC;
    v_full_os       NUMERIC;
    v_restore       NUMERIC;
    v_per_peer_os   NUMERIC;
    v_peer_id       UUID;
    v_victim_name   TEXT;
BEGIN
    -- Fast no-op gates.
    IF p_severity NOT IN ('moderate','major') THEN RETURN 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM factions WHERE id = p_corp_id) THEN
        RETURN 0;  -- victim bankrupted/deleted by the incident — no aid
    END IF;
    v_alliance_id := _alliance_member_has_article(p_corp_id, 'op_safety_pact');
    IF v_alliance_id IS NULL THEN RETURN 0; END IF;

    SELECT array_agg(m.faction_id)
      INTO v_peer_ids
      FROM alliance_members m
     WHERE m.alliance_id = v_alliance_id
       AND m.left_at_tick IS NULL
       AND m.faction_id <> p_corp_id
       AND EXISTS (SELECT 1 FROM factions f WHERE f.id = m.faction_id);
    v_peer_count := COALESCE(array_length(v_peer_ids, 1), 0);
    IF v_peer_count = 0 THEN RETURN 0; END IF;  -- nobody to share with

    SELECT faction_name INTO v_victim_name FROM factions WHERE id = p_corp_id;

    -- ── Cash: each peer pays 15% of the incident cost to the victim ──
    -- emit_corp_cash_event floors corp_cash_reserves at 0, so a broke
    -- peer contributes less than nominal while the victim is still
    -- credited the nominal share — the same flooring tolerance
    -- _fire_aviation_incident already accepts for the incident cost.
    v_per_peer_cash := ROUND(GREATEST(0, COALESCE(p_cost, 0)) * v_cash_share);
    IF v_per_peer_cash > 0 THEN
        FOREACH v_peer_id IN ARRAY v_peer_ids LOOP
            PERFORM emit_corp_cash_event(
                v_peer_id, 'event_cost',
                'Operational Safety Pact · aid to ' || COALESCE(v_victim_name, 'member'),
                -v_per_peer_cash, p_tick);
            PERFORM emit_corp_cash_event(
                p_corp_id, 'capital_in',
                'Operational Safety Pact · alliance aid received',
                v_per_peer_cash, p_tick);
        END LOOP;
    END IF;

    -- ── Op-safety: victim keeps 60%; 40% split across peers ──
    -- _fire_aviation_incident already applied the FULL hit to the
    -- victim, so restore (1 - keep) of it and redistribute that across
    -- the peers. Conserves the total hit (clamped 0..10 like elsewhere).
    v_full_os := ABS(COALESCE(p_op_safety_delta, 0));
    IF v_full_os > 0 THEN
        v_restore     := (1 - v_victim_keep) * v_full_os;
        v_per_peer_os := v_restore / v_peer_count;

        UPDATE factions
           SET corp_op_safety = GREATEST(0, LEAST(10,
                   COALESCE(corp_op_safety, 0) + v_restore))
         WHERE id = p_corp_id;

        FOREACH v_peer_id IN ARRAY v_peer_ids LOOP
            UPDATE factions
               SET corp_op_safety = GREATEST(0, LEAST(10,
                       COALESCE(corp_op_safety, 0) - v_per_peer_os))
             WHERE id = v_peer_id;
        END LOOP;
    END IF;

    RETURN v_peer_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION _apply_op_safety_pact(UUID, TEXT, NUMERIC, NUMERIC, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION _apply_op_safety_pact(UUID, TEXT, NUMERIC, NUMERIC, INTEGER) TO service_role;

COMMENT ON FUNCTION _apply_op_safety_pact(UUID, TEXT, NUMERIC, NUMERIC, INTEGER) IS
    'Operational Safety Pact enforcement (Airline alliance article). On a moderate/major aviation incident for a member of an alliance with the op_safety_pact article ratified: every other active member pays 15% of the incident cost to the victim, and the op_safety hit is mutualised (victim keeps 60%, peers split 40%). No-op fast path otherwise. Returns peer count aided.';


-- ── 2. _fire_aviation_incident — append the pact call ────────────
-- Verbatim 20260726 body; the ONLY change is the IF block right before
-- RETURN that calls _apply_op_safety_pact for moderate/major incidents.
CREATE OR REPLACE FUNCTION _fire_aviation_incident(
    p_corp_id   UUID,
    p_route_id  UUID,
    p_severity  TEXT,
    p_op_safety NUMERIC,
    p_tick      INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_type        aviation_incident_types%ROWTYPE;
    v_corp        factions%ROWTYPE;
    v_route       airline_routes%ROWTYPE;
    v_origin_name TEXT;
    v_dest_name   TEXT;
    v_template    TEXT;
    v_description TEXT;
    v_incident_id UUID;
    v_event_id    UUID;
    v_os_int      INTEGER := GREATEST(0, LEAST(10, FLOOR(COALESCE(p_op_safety, 0))::INTEGER));
    v_new_os      NUMERIC;
    v_cash_after  NUMERIC;
BEGIN
    -- Pick a random eligible incident from the requested tier.
    SELECT * INTO v_type FROM aviation_incident_types
     WHERE severity = p_severity
       AND v_os_int BETWEEN os_min AND os_max
     ORDER BY random()
     LIMIT 1;

    IF v_type.incident_key IS NULL THEN
        RETURN jsonb_build_object('skipped', true, 'reason', 'no_eligible_incident');
    END IF;

    SELECT * INTO v_corp  FROM factions       WHERE id = p_corp_id;
    SELECT * INTO v_route FROM airline_routes WHERE id = p_route_id;

    v_template := v_type.description_templates[
        1 + floor(random() * array_length(v_type.description_templates, 1))::INT
    ];

    SELECT name INTO v_origin_name FROM airline_cities WHERE id = v_route.origin_city_id;
    SELECT name INTO v_dest_name   FROM airline_cities WHERE id = v_route.dest_city_id;

    v_description := replace(v_template, '{corp}',   COALESCE(v_corp.faction_name, 'Airline'));
    v_description := replace(v_description, '{origin}', COALESCE(v_origin_name, 'origin'));
    v_description := replace(v_description, '{dest}',   COALESCE(v_dest_name,   'destination'));

    v_cash_after := COALESCE(v_corp.corp_cash_reserves, 0) - v_type.cost;

    PERFORM emit_corp_cash_event(
        p_corp_id,
        'event_cost',
        'Aviation incident · ' || v_type.label,
        -v_type.cost,
        p_tick
    );

    v_new_os := GREATEST(0, LEAST(10, COALESCE(v_corp.corp_op_safety, 0) + v_type.op_safety_delta));
    UPDATE factions
       SET corp_op_safety = v_new_os
     WHERE id = p_corp_id;

    IF v_type.route_grounded_ticks > 0 THEN
        UPDATE airline_routes
           SET grounded_until_tick = p_tick + v_type.route_grounded_ticks
         WHERE id = p_route_id;
    END IF;

    INSERT INTO aviation_incidents (
        corp_id, route_id, nation_id, incident_key, severity,
        cost, op_safety_delta, description,
        created_at_tick, expires_at_tick
    ) VALUES (
        p_corp_id, p_route_id, v_route.nation_id, v_type.incident_key, p_severity,
        v_type.cost, v_type.op_safety_delta, v_description,
        p_tick, p_tick + 6
    ) RETURNING id INTO v_incident_id;

    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        effects_applied, fired_at_tick
    ) VALUES (
        v_route.nation_id, p_corp_id,
        'Aviation Incident — ' || v_type.label,
        v_description,
        'business',
        'aviation_incident_' || p_severity,
        jsonb_build_object(
            'incident_id',     v_incident_id,
            'incident_key',    v_type.incident_key,
            'severity',        p_severity,
            'cost',            v_type.cost,
            'op_safety_delta', v_type.op_safety_delta,
            'route_grounded_ticks', v_type.route_grounded_ticks,
            'route_id',        p_route_id,
            'corp_id',         p_corp_id
        ),
        p_tick
    ) RETURNING id INTO v_event_id;

    UPDATE aviation_incidents SET event_log_id = v_event_id WHERE id = v_incident_id;

    IF v_cash_after < 0 THEN
        BEGIN
            PERFORM declare_corp_bankruptcy(p_corp_id);
        EXCEPTION WHEN OTHERS THEN
            INSERT INTO event_log (
                nation_id, faction_id,
                event_name, description_used,
                category, trigger_key, effects_applied, fired_at_tick
            ) VALUES (
                v_route.nation_id, p_corp_id,
                'Aviation Incident — Bankruptcy Auto-Trigger Failed',
                'Incident cost exceeded cash; bankruptcy trigger raised: ' || SQLERRM,
                'business', 'aviation_incident_bankruptcy_skip',
                jsonb_build_object('incident_id', v_incident_id, 'error', SQLERRM),
                p_tick
            );
        END;
    END IF;

    -- ── Operational Safety Pact (alliance mutual aid; added 20270110) ──
    -- No-op unless p_corp_id is in an active alliance with the
    -- op_safety_pact article. Runs after the bankruptcy auto-trigger:
    -- a survivable incident gets softened; a wipeout that bankrupted
    -- (deleted) the corp is owned by the bankruptcy path — the helper
    -- early-returns when the victim faction no longer exists.
    IF p_severity IN ('moderate','major') THEN
        PERFORM _apply_op_safety_pact(
            p_corp_id, p_severity, v_type.cost, v_type.op_safety_delta, p_tick);
    END IF;

    RETURN jsonb_build_object(
        'incident_id', v_incident_id,
        'incident_key', v_type.incident_key,
        'severity',     p_severity,
        'cost',         v_type.cost,
        'op_safety_delta', v_type.op_safety_delta,
        'route_grounded_ticks', v_type.route_grounded_ticks,
        'auto_bankrupted', (v_cash_after < 0)
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION _fire_aviation_incident(UUID, UUID, TEXT, NUMERIC, INTEGER) FROM PUBLIC;

COMMIT;

NOTIFY pgrst, 'reload schema';
