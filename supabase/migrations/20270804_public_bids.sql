-- ════════════════════════════════════════════════════════════════════
-- 20270804 — Executive Actions: Submit Public Bid
--
-- The second Executive Action slot. Cities and corporations post
-- REQUESTED CONSTRUCTION PROJECTS; a construction corp owner browses
-- them and bids with a matching blueprint.
--
--   construction_project_requests: the public board. entity is the
--   display name ("City of Miramar del Sur" / a corp's name);
--   requester_city_id / requester_corp_id are the future-resolution
--   FKs (nullable — whichever side posted). NOTHING generates
--   requests yet: city demand mechanics / admin tooling will insert
--   here; until then the board reads empty.
--
--   construction_project_bids: one bid per corp per request (partial
--   unique on live bids), carrying the blueprint it was made with.
--   Awarding (won/lost) is the next phase. Public procurement —
--   both tables are public-read like the rest of the registry.
--
--   submit_public_bid(p_request_id, p_blueprint_id): owner-only
--   (businessman, not arrested, construction corp — the corp is
--   derived from the blueprint). The blueprint's building type must
--   match the request. Submitting a bid IS the tick's executive
--   action: same exec_action_tick allowance draft_blueprint spends,
--   corp row locked FOR UPDATE so it can't be double-spent.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.construction_project_requests (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity            text NOT NULL,
    requester_city_id uuid REFERENCES public.cities(id) ON DELETE CASCADE,
    requester_corp_id uuid REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    city              text NOT NULL,
    nation_id         uuid REFERENCES public.nations(id) ON DELETE CASCADE,
    building_type     text NOT NULL CHECK (building_type IN
                          ('single_story_home', 'double_story', 'multitenant_living')),
    status            text NOT NULL DEFAULT 'open' CHECK (status IN
                          ('open', 'awarded', 'withdrawn', 'expired')),
    created_at_tick   int  NOT NULL DEFAULT 0,
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS construction_project_requests_open_idx
    ON public.construction_project_requests (status) WHERE status = 'open';

ALTER TABLE public.construction_project_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.construction_project_requests;
CREATE POLICY "Allow select for all" ON public.construction_project_requests
    FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.construction_project_bids (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id        uuid NOT NULL REFERENCES public.construction_project_requests(id) ON DELETE CASCADE,
    corp_id           uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    blueprint_id      uuid NOT NULL REFERENCES public.corp_blueprints(id) ON DELETE CASCADE,
    status            text NOT NULL DEFAULT 'pending' CHECK (status IN
                          ('pending', 'won', 'lost', 'withdrawn')),
    submitted_at_tick int  NOT NULL DEFAULT 0,
    created_at        timestamptz NOT NULL DEFAULT now()
);

-- One live bid per corp per request.
CREATE UNIQUE INDEX IF NOT EXISTS construction_project_bids_one_per_corp
    ON public.construction_project_bids (request_id, corp_id)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS construction_project_bids_corp_idx
    ON public.construction_project_bids (corp_id);

ALTER TABLE public.construction_project_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.construction_project_bids;
CREATE POLICY "Allow select for all" ON public.construction_project_bids
    FOR SELECT USING (true);

-- ── submit_public_bid ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_public_bid(
    p_request_id   uuid,
    p_blueprint_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_corp    entrepreneur_corps%ROWTYPE;
    v_bp      corp_blueprints%ROWTYPE;
    v_req     construction_project_requests%ROWTYPE;
    v_tick    int;
    v_id      uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_request_id IS NULL OR p_blueprint_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_bp FROM corp_blueprints WHERE id = p_blueprint_id;
    IF v_bp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_not_found');
    END IF;

    -- Lock the corp row: the per-tick allowance check below must
    -- serialize against a concurrent executive action.
    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = v_bp.corp_id FOR UPDATE;
    IF v_corp.industry <> 'construction' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'industry_not_chartered');
    END IF;

    SELECT * INTO v_fac FROM factions
     WHERE id = v_corp.owner_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'businessman'
       AND abandoned_at IS NULL;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;

    SELECT * INTO v_req FROM construction_project_requests WHERE id = p_request_id;
    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_found');
    END IF;
    IF v_req.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_open',
            'status', v_req.status);
    END IF;
    IF v_req.building_type <> v_bp.building_type THEN
        RETURN jsonb_build_object('success', false, 'reason', 'blueprint_type_mismatch');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF COALESCE(v_corp.exec_action_tick, -1) >= v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_actions_remaining');
    END IF;

    BEGIN
        INSERT INTO construction_project_bids (
            request_id, corp_id, blueprint_id, submitted_at_tick
        ) VALUES (
            p_request_id, v_corp.id, p_blueprint_id, v_tick
        ) RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_bid');
    END;

    UPDATE entrepreneur_corps SET exec_action_tick = v_tick WHERE id = v_corp.id;

    RETURN jsonb_build_object('success', true, 'bid_id', v_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.submit_public_bid(uuid, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.submit_public_bid(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
