-- ════════════════════════════════════════════════════════════════════
-- 20270860 — Send Cable to Foreign Ministry (the attaché's dispatch)
--
-- The embassy desk's SEND CABLE action goes live: a serving Foreign
-- Attaché files a 240-character dispatch back to their HOME nation's
-- Ministry of Foreign Affairs & Trade, where it reads
--   Diplomatic Communique "{text}" — {Name}, Attaché in {City},
--   {Nation}.
-- No cost; once per tick per attaché — the cable rows themselves are
-- the ledger (no extra stamp column). Sender name and the posting's
-- city/nation are stamped at send time: a communique is a historical
-- record and must not rewrite itself when the posting ends.
-- Independent of next_embassy_action_tick (the Foreign Events
-- cooldown) by design — flavor traffic shouldn't lock the event desk.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.diplomatic_cables (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id   uuid NOT NULL,
    nation_id    uuid NOT NULL,  -- the home Foreign Ministry that receives it
    body         text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 240),
    sender_name  text NOT NULL,
    host_city    text NOT NULL DEFAULT '',
    host_nation  text NOT NULL DEFAULT '',
    sent_at_tick int  NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.diplomatic_cables IS
    'Attaché dispatches to their home Foreign Ministry (20270860). faction_id is a plain uuid by design: faction purges must not trip over it, and the stamped sender/posting fields keep the record readable after one.';

CREATE INDEX IF NOT EXISTS diplomatic_cables_nation_idx
    ON public.diplomatic_cables (nation_id);
CREATE INDEX IF NOT EXISTS diplomatic_cables_faction_tick_idx
    ON public.diplomatic_cables (faction_id, sent_at_tick);

ALTER TABLE public.diplomatic_cables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.diplomatic_cables;
CREATE POLICY "Allow select for all" ON public.diplomatic_cables
    FOR SELECT USING (true);
-- No insert/update/delete policies — writes go through the RPC.

-- ── politician_send_cable ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.politician_send_cable(
    p_faction_id uuid,
    p_text       text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_pol    factions%ROWTYPE;
    v_tick   int;
    v_text   text := TRIM(COALESCE(p_text, ''));
    v_host   nations%ROWTYPE;
    v_name   text;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF length(v_text) < 1 OR length(v_text) > 240 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_text');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE id = p_faction_id
       AND (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     FOR UPDATE;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;
    IF lower(COALESCE(v_pol.status, '')) = 'arrested' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'arrested');
    END IF;
    IF v_pol.politician_foreign_service_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_attache');
    END IF;
    IF v_pol.nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_nation');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- One cable per tick — the rows are the ledger.
    IF EXISTS (SELECT 1 FROM diplomatic_cables
                WHERE faction_id = v_pol.id AND sent_at_tick = v_tick) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_sent');
    END IF;

    SELECT * INTO v_host FROM nations
     WHERE id = v_pol.politician_foreign_service_nation_id;
    v_name := TRIM(COALESCE(v_pol.leader_first_name, '') || ' '
                || COALESCE(v_pol.leader_last_name, ''));

    INSERT INTO diplomatic_cables (
        faction_id, nation_id, body, sender_name,
        host_city, host_nation, sent_at_tick
    ) VALUES (
        v_pol.id, v_pol.nation_id, v_text, COALESCE(NULLIF(v_name, ''), 'Attaché'),
        COALESCE(v_host.capital, ''), COALESCE(v_host.name, ''), v_tick
    );

    RETURN jsonb_build_object('success', true, 'sent_at_tick', v_tick);
END $$;

REVOKE EXECUTE ON FUNCTION public.politician_send_cable(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.politician_send_cable(uuid, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
