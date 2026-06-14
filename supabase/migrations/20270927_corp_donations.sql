-- ════════════════════════════════════════════════════════════════════
-- 20270927 — Corporate Donations
--
-- A corp owner donates from a corp's treasury to either:
--   • a party  — the money lands directly in the party's funds.
--   • a race   — backing a candidate (the real politician's polling_you,
--                or the NPC opponent's polling_opp). Every full $100K
--                rolls 1D10; each 6+ is +1 polling for the backed side,
--                pulled from undecided first, then the other candidate.
--
-- corp_donations is the per-corp ledger the Corporate Donations section
-- reads (amount, party/target label, sent tick). RPC-only writes.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.corp_donations (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id      uuid NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    kind         text NOT NULL CHECK (kind IN ('party', 'race')),
    party_id     uuid REFERENCES public.factions(id) ON DELETE SET NULL,
    target_label text NOT NULL,                 -- party name, or "Name (Party)" for a race
    amount       bigint NOT NULL CHECK (amount > 0),
    sent_tick    int  NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS corp_donations_corp_idx ON public.corp_donations (corp_id, created_at DESC);
ALTER TABLE public.corp_donations ENABLE ROW LEVEL SECURITY;
-- Public game data (the section reads it); writes only via the RPCs below.
DROP POLICY IF EXISTS corp_donations_read ON public.corp_donations;
CREATE POLICY corp_donations_read ON public.corp_donations FOR SELECT USING (true);

-- ── corp_donate_to_party — straight into the party treasury ────────
CREATE OR REPLACE FUNCTION public.corp_donate_to_party(
    p_corp_id  uuid,
    p_party_id uuid,
    p_amount   bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid   uuid := auth.uid();
    v_corp  entrepreneur_corps%ROWTYPE;
    v_fac   factions%ROWTYPE;
    v_party factions%ROWTYPE;
    v_tick  int;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_amount IS NULL OR p_amount <= 0 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    v_fac := _corp_owner_faction(v_corp.owner_faction_id, v_uid);
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_owner'); END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN RETURN jsonb_build_object('success', false, 'reason', 'arrested'); END IF;

    SELECT * INTO v_party FROM factions
     WHERE id = p_party_id AND faction_type = 'movement_party' AND abandoned_at IS NULL;
    IF v_party.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'party_not_found'); END IF;

    IF FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint < p_amount THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'have', FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint, 'need', p_amount);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) - p_amount WHERE id = p_corp_id;
    UPDATE factions          SET party_funds   = COALESCE(party_funds, 0)   + p_amount WHERE id = p_party_id;

    INSERT INTO corp_donations (corp_id, kind, party_id, target_label, amount, sent_tick)
    VALUES (p_corp_id, 'party', p_party_id, v_party.faction_name, p_amount, v_tick);
    PERFORM _log_corp_history(p_corp_id, v_tick, format('Donated $%s to %s.', p_amount, v_party.faction_name));

    RETURN jsonb_build_object('success', true, 'amount', p_amount, 'party', v_party.faction_name);
END $$;

REVOKE EXECUTE ON FUNCTION public.corp_donate_to_party(uuid, uuid, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.corp_donate_to_party(uuid, uuid, bigint) TO authenticated;

-- ── corp_donate_to_race — back a candidate; 1D10 per $100K, 6+ = +1 ─
CREATE OR REPLACE FUNCTION public.corp_donate_to_race(
    p_corp_id       uuid,
    p_politician_id uuid,
    p_side          text,
    p_amount        bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid    uuid := auth.uid();
    v_corp   entrepreneur_corps%ROWTYPE;
    v_fac    factions%ROWTYPE;
    v_race   politician_active_election%ROWTYPE;
    v_pol    factions%ROWTYPE;
    v_tick   int;
    v_rolls  int;
    v_hits   int := 0;
    i        int;
    v_bump   int;
    v_from_und int;
    v_from_oth int;
    v_label  text;
    v_party  text;
BEGIN
    IF v_uid IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated'); END IF;
    IF p_amount IS NULL OR p_amount <= 0 THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_amount'); END IF;
    IF COALESCE(p_side, '') NOT IN ('you', 'opp') THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_side'); END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found'); END IF;
    v_fac := _corp_owner_faction(v_corp.owner_faction_id, v_uid);
    IF v_fac.id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'not_owner'); END IF;
    IF lower(COALESCE(v_fac.status, '')) = 'arrested' THEN RETURN jsonb_build_object('success', false, 'reason', 'arrested'); END IF;

    SELECT * INTO v_race FROM politician_active_election WHERE politician_id = p_politician_id FOR UPDATE;
    IF v_race.politician_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'race_not_found'); END IF;

    IF FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint < p_amount THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_treasury',
            'have', FLOOR(COALESCE(v_corp.treasury_cash, 0))::bigint, 'need', p_amount);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE entrepreneur_corps SET treasury_cash = COALESCE(treasury_cash, 0) - p_amount WHERE id = p_corp_id;

    -- 1D10 per full $100K; each 6+ is one polling point for the backed side.
    v_rolls := GREATEST(0, (p_amount / 100000)::int);
    FOR i IN 1..v_rolls LOOP
        IF (1 + floor(random() * 10)::int) >= 6 THEN v_hits := v_hits + 1; END IF;
    END LOOP;

    -- Apply the gain to the backed side, pulled from undecided then the
    -- other candidate, so the three lines still sum to 100.
    IF v_hits > 0 THEN
        IF p_side = 'you' THEN
            v_bump     := LEAST(v_hits, COALESCE(v_race.polling_undecided_pct,0) + COALESCE(v_race.polling_opp_pct,0));
            v_from_und := LEAST(v_bump, COALESCE(v_race.polling_undecided_pct,0));
            v_from_oth := v_bump - v_from_und;
            UPDATE politician_active_election
               SET polling_you_pct       = polling_you_pct + v_bump,
                   polling_undecided_pct  = polling_undecided_pct - v_from_und,
                   polling_opp_pct        = polling_opp_pct - v_from_oth
             WHERE politician_id = p_politician_id;
        ELSE
            v_bump     := LEAST(v_hits, COALESCE(v_race.polling_undecided_pct,0) + COALESCE(v_race.polling_you_pct,0));
            v_from_und := LEAST(v_bump, COALESCE(v_race.polling_undecided_pct,0));
            v_from_oth := v_bump - v_from_und;
            UPDATE politician_active_election
               SET polling_opp_pct        = polling_opp_pct + v_bump,
                   polling_undecided_pct  = polling_undecided_pct - v_from_und,
                   polling_you_pct        = polling_you_pct - v_from_oth
             WHERE politician_id = p_politician_id;
        END IF;
    END IF;

    -- Donation label = the candidate backed.
    IF p_side = 'you' THEN
        SELECT * INTO v_pol FROM factions WHERE id = p_politician_id;
        SELECT faction_name INTO v_party FROM factions WHERE id = v_pol.politician_party_id;
        v_label := TRIM(COALESCE(v_pol.leader_first_name,'') || ' ' || COALESCE(v_pol.leader_last_name,''))
                   || COALESCE(' (' || v_party || ')', '');
    ELSE
        v_label := TRIM(v_race.opp_first || ' ' || v_race.opp_last)
                   || COALESCE(' (' || v_race.opp_party_name || ')', '');
    END IF;

    INSERT INTO corp_donations (corp_id, kind, target_label, amount, sent_tick)
    VALUES (p_corp_id, 'race', v_label, p_amount, v_tick);
    PERFORM _log_corp_history(p_corp_id, v_tick,
        format('Donated $%s backing %s — %s polling roll(s), +%s.', p_amount, v_label, v_rolls, COALESCE(v_bump,0)));

    RETURN jsonb_build_object('success', true, 'amount', p_amount, 'rolls', v_rolls, 'polling_gain', COALESCE(v_bump, 0));
END $$;

REVOKE EXECUTE ON FUNCTION public.corp_donate_to_race(uuid, uuid, text, bigint) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.corp_donate_to_race(uuid, uuid, text, bigint) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
