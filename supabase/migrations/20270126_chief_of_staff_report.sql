-- ════════════════════════════════════════════════════════════════
-- Chief of Staff "Report to Defense Minister" — Phase 1 (producer).
--
-- The army Chief of Staff files a confidential briefing. It becomes a
-- nation Pressing Issue (consumer render = Phase 2): every party sees
-- a one-line headline; only the party currently controlling the
-- Defense ministry may read the body; each party acknowledges to
-- clear it from its own view (per-faction dismissal).
--
-- Phase 1 = data + producer only: the two tables, the cooldown
-- column, file_chief_of_staff_report (charges $1 = $1,000,000 from
-- factions.party_funds, 12-tick cooldown, snapshots the 8 army
-- modifiers + Defense Minister name + year) and
-- acknowledge_chief_of_staff_report. RLS: NO direct client SELECT —
-- the body is confidential, so Phase 2 reads it through a
-- SECURITY-DEFINER gated RPC. Writes go only through these definer
-- RPCs (caller-ownership checked, same pattern as create_unit).
-- Idempotent DDL.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS chief_of_staff_reports (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id     UUID        NOT NULL REFERENCES nations(id)  ON DELETE CASCADE,
    faction_id    UUID        NOT NULL REFERENCES factions(id) ON DELETE CASCADE,  -- filing army faction
    filed_at_tick INT         NOT NULL,
    report_year   INT         NOT NULL,                 -- 2000 + filed_at_tick/12 (headline stability)
    chief_name    TEXT        NOT NULL,                 -- snapshot "First Last" of the COS at file time
    faction_name  TEXT        NOT NULL,                 -- snapshot
    nation_name   TEXT        NOT NULL,                 -- snapshot
    minister_name TEXT,                                 -- Defense Minister at file time (NULL if vacant)
    body          TEXT        NOT NULL,                 -- the confidential briefing (<= 1200 chars)
    stat_snapshot JSONB       NOT NULL,                 -- the 8 army_* modifier values at file time
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cos_reports_nation ON chief_of_staff_reports (nation_id, filed_at_tick DESC);

CREATE TABLE IF NOT EXISTS chief_of_staff_report_acks (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id           UUID        NOT NULL REFERENCES chief_of_staff_reports(id) ON DELETE CASCADE,
    faction_id          UUID        NOT NULL REFERENCES factions(id)               ON DELETE CASCADE,
    acknowledged_at_tick INT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (report_id, faction_id)
);
CREATE INDEX IF NOT EXISTS idx_cos_acks_faction ON chief_of_staff_report_acks (faction_id);

ALTER TABLE factions ADD COLUMN IF NOT EXISTS last_chief_of_staff_report_tick INT;

-- RLS: confidential. No client SELECT/INSERT — definer RPCs only.
ALTER TABLE chief_of_staff_reports      ENABLE ROW LEVEL SECURITY;
ALTER TABLE chief_of_staff_report_acks  ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cos_reports_no_client ON chief_of_staff_reports;
DROP POLICY IF EXISTS cos_acks_no_client    ON chief_of_staff_report_acks;
-- (no policies created → only SECURITY DEFINER functions can touch them)

-- ── file_chief_of_staff_report ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.file_chief_of_staff_report(
    p_faction_id UUID,
    p_body       TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user    UUID := auth.uid();
    v_fac     factions%ROWTYPE;
    v_body    TEXT;
    v_tick    INT;
    v_cd      INT := 12;
    v_nation  TEXT;
    v_mfirst  TEXT;
    v_mlast   TEXT;
    v_mname   TEXT;
    v_rid     UUID;
    v_cost    NUMERIC := 1000000;
BEGIN
    SELECT * INTO v_fac FROM factions WHERE id = p_faction_id;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Army faction not found');
    END IF;
    IF v_fac.faction_type <> 'military' OR v_fac.branch <> 'army' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not an army faction');
    END IF;
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    IF v_fac.id <> v_user AND v_fac.linked_user_id IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not command this army');
    END IF;

    v_body := btrim(COALESCE(p_body, ''));
    IF v_body = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Report body is required');
    END IF;
    IF char_length(v_body) > 1200 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Report exceeds the 1200 character limit');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF v_fac.last_chief_of_staff_report_tick IS NOT NULL
       AND v_tick < v_fac.last_chief_of_staff_report_tick + v_cd THEN
        RETURN jsonb_build_object('success', false, 'error', 'cooldown',
            'ready_at_tick', v_fac.last_chief_of_staff_report_tick + v_cd);
    END IF;

    IF COALESCE(v_fac.party_funds, 0) < v_cost THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient Army Funds');
    END IF;

    SELECT name INTO v_nation FROM nations WHERE id = v_fac.nation_id;

    SELECT minister_first_name, minister_last_name
      INTO v_mfirst, v_mlast
      FROM ministries
     WHERE nation_id = v_fac.nation_id AND ministry_key = 'defense' AND is_active = true
     LIMIT 1;
    v_mname := NULLIF(btrim(COALESCE(v_mfirst,'') || ' ' || COALESCE(v_mlast,'')), '');

    INSERT INTO chief_of_staff_reports (
        nation_id, faction_id, filed_at_tick, report_year,
        chief_name, faction_name, nation_name, minister_name, body, stat_snapshot
    ) VALUES (
        v_fac.nation_id, p_faction_id, v_tick, 2000 + (v_tick / 12),
        NULLIF(btrim(COALESCE(v_fac.leader_first_name,'') || ' ' || COALESCE(v_fac.leader_last_name,'')), ''),
        COALESCE(v_fac.faction_name, 'Army'),
        COALESCE(v_nation, 'the nation'),
        v_mname,
        v_body,
        jsonb_build_object(
            'manpower',  v_fac.army_manpower,
            'loyalty',   v_fac.army_loyalty,
            'training',  v_fac.army_training,
            'equipment', v_fac.army_equipment,
            'armor',     v_fac.army_armor,
            'artillery', v_fac.army_artillery,
            'logistics', v_fac.army_logistics,
            'supplies',  v_fac.army_supplies
        )
    )
    RETURNING id INTO v_rid;

    UPDATE factions
       SET party_funds = COALESCE(party_funds, 0) - v_cost,
           last_chief_of_staff_report_tick = v_tick
     WHERE id = p_faction_id;

    RETURN jsonb_build_object('success', true, 'report_id', v_rid);
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.file_chief_of_staff_report(UUID, TEXT) TO authenticated;

-- ── acknowledge_chief_of_staff_report ────────────────────────────
-- Per-faction dismissal: the calling faction marks the report
-- acknowledged → Phase 2's render excludes it from that faction's
-- Pressing Issues. Idempotent.
CREATE OR REPLACE FUNCTION public.acknowledge_chief_of_staff_report(
    p_report_id  UUID,
    p_faction_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_user UUID := auth.uid();
    v_fid  UUID;
    v_link UUID;
    v_tick INT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    SELECT id, linked_user_id INTO v_fid, v_link FROM factions WHERE id = p_faction_id;
    IF v_fid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Faction not found');
    END IF;
    IF v_fid <> v_user AND v_link IS DISTINCT FROM v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not your faction');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM chief_of_staff_reports WHERE id = p_report_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Report not found');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    INSERT INTO chief_of_staff_report_acks (report_id, faction_id, acknowledged_at_tick)
    VALUES (p_report_id, p_faction_id, COALESCE(v_tick, 0))
    ON CONFLICT (report_id, faction_id) DO NOTHING;

    RETURN jsonb_build_object('success', true);
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.acknowledge_chief_of_staff_report(UUID, UUID) TO authenticated;
