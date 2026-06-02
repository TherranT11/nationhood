-- ════════════════════════════════════════════════════════════════════
-- Committee hearings — witness testimony layer over the propose-law
-- flow from 20270498.
--
-- Lifecycle per bill:
--   1. MP proposes a law → committee_proposals row, status='queued'
--   2. Committee member clicks [Hold a Hearing] → committee_hearings
--      row (open), 8 persona templates pre-generated for the bill's
--      category, hearing window closes after 3 ticks.
--   3. ANY faction (one per faction per hearing) picks an unclaimed
--      persona from the slate, writes ≤400 chars, submits → row in
--      committee_hearing_testimonies. The persona is atomically
--      claimed on submission so two players can't both speak as
--      "the Tenants' Union representative."
--   4. Committee members mark testimonies as accepted. Accepted
--      testimonies promote to the public Hearing Record; unaccepted
--      ones expire silently when the hearing closes.
--   5. A committee member closes the hearing (or future tick
--      processor auto-closes at closes_at_tick — out of scope here).
--      Accepted-testimony stat rewards fire at acceptance time
--      (politician → +1 political_capital, entrepreneur →
--      +1 ent_reputation; other faction types: no stat reward in v1).
--
-- Three tables and four RPCs ship together:
--   committee_hearings              (open window per proposal)
--   committee_hearing_personas      (pre-generated slate, atomically
--                                    claimable)
--   committee_hearing_testimonies   (submission rows)
--   committee_hold_hearing(committee_id, proposal_id)
--   submit_hearing_testimony(hearing_id, persona_id, text)
--   accept_hearing_testimony(testimony_id)
--   close_committee_hearing(hearing_id)
--
-- Persona templates: 8 per category, hardcoded. _seed_hearing_personas
-- pulls 8 at random, fills names from the nation's first/last name
-- pools, and substitutes %s in the affiliation template with the
-- nation's capital. Templates live in the helper function so adding
-- a new category later is a single-function rewrite.
--
-- RLS: read public (committee deliberation is public-record territory
-- in real legislatures, and we want non-members to be able to view
-- their own pending submissions). Writes via the SECURITY DEFINER
-- RPCs only — direct UPDATEs to e.g. `accepted` are blocked at the
-- RLS layer for authenticated users.
--
-- Role gates per RPC:
--   committee_hold_hearing      CHAIR ONLY  (calendar control)
--   submit_hearing_testimony    ANY FACTION (with one-per-faction)
--   accept_hearing_testimony    ANY MEMBER  (collective record-keeping)
--   close_committee_hearing     CHAIR ONLY  (calendar control)
--
-- KNOWN GAP — committee membership has no expiry yet. Per design,
-- committee_members rows last 48 ticks from seated_at_tick, but the
-- 20270453 schema doesn't enforce that and no tick-processor sweeps
-- stale rows. As a result, every membership check in this file
-- (committee_members WHERE politician_faction_id = …) will match
-- expired members. A follow-up migration needs to either add an
-- expires_at_tick column or filter every check by
-- seated_at_tick + 48 > current_tick. Out of scope for this file —
-- the impact is bounded to the same set of factions that the
-- existing 20270456 apply RPC already trusts.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Tables ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS committee_hearings (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id         uuid NOT NULL REFERENCES committees(id)           ON DELETE CASCADE,
    proposal_id          uuid NOT NULL REFERENCES committee_proposals(id)  ON DELETE CASCADE,
    nation_id            uuid NOT NULL REFERENCES nations(id)              ON DELETE CASCADE,
    opened_by_faction_id uuid          REFERENCES factions(id)             ON DELETE SET NULL,
    opened_at_tick       int  NOT NULL,
    closes_at_tick       int  NOT NULL,
    closed_at_tick       int,
    status               text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
    created_at           timestamptz NOT NULL DEFAULT now()
);

-- One open hearing per committee at a time. Partial unique index so
-- closed rows don't block a future hearing on the same committee.
CREATE UNIQUE INDEX IF NOT EXISTS committee_hearings_one_open_idx
    ON committee_hearings (committee_id) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS committee_hearings_committee_idx
    ON committee_hearings (committee_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS committee_hearings_proposal_idx
    ON committee_hearings (proposal_id);

COMMENT ON TABLE committee_hearings IS
    '3-tick testimony window per (committee, proposal). Opened by a committee member via committee_hold_hearing; closed by a committee member via close_committee_hearing or implicitly stale once closes_at_tick has passed (clients should gate submissions client-side; server still checks status=open).';

CREATE TABLE IF NOT EXISTS committee_hearing_personas (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hearing_id            uuid NOT NULL REFERENCES committee_hearings(id) ON DELETE CASCADE,
    slug                  text NOT NULL,
    name                  text NOT NULL,
    title                 text NOT NULL,
    affiliation           text NOT NULL,
    claimed_by_faction_id uuid          REFERENCES factions(id) ON DELETE SET NULL,
    claimed_at            timestamptz,
    created_at            timestamptz NOT NULL DEFAULT now(),
    UNIQUE (hearing_id, slug)
);

CREATE INDEX IF NOT EXISTS committee_hearing_personas_hearing_idx
    ON committee_hearing_personas (hearing_id, claimed_by_faction_id);

COMMENT ON TABLE committee_hearing_personas IS
    'Pre-generated witness personas for a hearing. 8 per hearing, sampled from a hardcoded per-category template list and named from the nation''s name pools. Single-use: once claimed_by_faction_id is non-null, the row disappears from the dropdown.';

CREATE TABLE IF NOT EXISTS committee_hearing_testimonies (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hearing_id             uuid NOT NULL REFERENCES committee_hearings(id)          ON DELETE CASCADE,
    persona_id             uuid NOT NULL REFERENCES committee_hearing_personas(id)  ON DELETE CASCADE,
    submitter_faction_id   uuid          REFERENCES factions(id) ON DELETE SET NULL,
    text                   text NOT NULL CHECK (length(btrim(text)) BETWEEN 1 AND 400),
    accepted               boolean NOT NULL DEFAULT false,
    accepted_by_faction_id uuid          REFERENCES factions(id) ON DELETE SET NULL,
    accepted_at_tick       int,
    created_at_tick        int  NOT NULL,
    created_at             timestamptz NOT NULL DEFAULT now(),
    UNIQUE (hearing_id, submitter_faction_id),
    UNIQUE (hearing_id, persona_id)
);

CREATE INDEX IF NOT EXISTS committee_hearing_testimonies_hearing_idx
    ON committee_hearing_testimonies (hearing_id, accepted DESC, created_at);

COMMENT ON TABLE committee_hearing_testimonies IS
    'Witness submissions in a hearing. One per submitter_faction_id per hearing (UNIQUE). One per persona_id per hearing (UNIQUE) — duplicates the personas.claimed_by_faction_id enforcement at the row level. Acceptance is a committee-member action that promotes the testimony to the public Hearing Record and fires the submitter''s stat reward.';

-- ── 2. RLS ──────────────────────────────────────────────────────────
ALTER TABLE committee_hearings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_hearing_personas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_hearing_testimonies   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS committee_hearings_select ON committee_hearings;
CREATE POLICY committee_hearings_select ON committee_hearings
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS committee_hearings_service_all ON committee_hearings;
CREATE POLICY committee_hearings_service_all ON committee_hearings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS committee_hearing_personas_select ON committee_hearing_personas;
CREATE POLICY committee_hearing_personas_select ON committee_hearing_personas
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS committee_hearing_personas_service_all ON committee_hearing_personas;
CREATE POLICY committee_hearing_personas_service_all ON committee_hearing_personas
    FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS committee_hearing_testimonies_select ON committee_hearing_testimonies;
CREATE POLICY committee_hearing_testimonies_select ON committee_hearing_testimonies
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS committee_hearing_testimonies_service_all ON committee_hearing_testimonies;
CREATE POLICY committee_hearing_testimonies_service_all ON committee_hearing_testimonies
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 3. _seed_hearing_personas helper ────────────────────────────────
-- Pulls 8 templates for the category, names them from the nation's
-- pools, fills %s in the affiliation template with the nation's
-- capital. Pure server-side — not callable from the client.
CREATE OR REPLACE FUNCTION public._seed_hearing_personas(
    p_hearing_id uuid, p_category text, p_nation_id uuid
)
RETURNS int
LANGUAGE plpgsql AS $$
DECLARE
    v_nation       nations%ROWTYPE;
    v_city         text;
    v_npool_len    int;
    v_lpool_len    int;
    rec            RECORD;
    v_count        int := 0;
    v_first        text;
    v_last         text;
    v_aff          text;
BEGIN
    SELECT * INTO v_nation FROM nations WHERE id = p_nation_id;
    v_city      := COALESCE(NULLIF(btrim(v_nation.capital), ''), v_nation.name, 'the Capital');
    v_npool_len := COALESCE(array_length(v_nation.first_name_pool, 1), 0);
    v_lpool_len := COALESCE(array_length(v_nation.last_name_pool, 1), 0);

    FOR rec IN
        SELECT slug, title, affiliation_template FROM (VALUES
            -- CIVIL
            ('civil',      'tenants_union',         'Tenants'' Union Representative',           '%s Renters'' Coalition'),
            ('civil',      'landlords_assoc',       'Landlords'' Association Spokesperson',     'Property Owners of %s'),
            ('civil',      'housing_researcher',    'Housing Researcher',                       'Universidad de %s'),
            ('civil',      'family_lawyer',         'Family Law Attorney',                      'Independent'),
            ('civil',      'consumer_advocate',     'Consumer Protection Advocate',             '%s Consumers'' League'),
            ('civil',      'real_estate_dev',       'Real Estate Developer',                    'Independent'),
            ('civil',      'building_inspector',    'Senior Building Inspector',                'Ministry of Interior'),
            ('civil',      'civic_planner',         'Civic Planner',                            'City of %s'),
            -- CRIMINAL
            ('criminal',   'prosecutor',            'District Prosecutor',                      'Ministry of Justice'),
            ('criminal',   'defense_attorney',      'Defense Attorney',                         'Independent'),
            ('criminal',   'police_chief',          'Police Chief',                             'City of %s'),
            ('criminal',   'criminologist',         'Criminologist',                            'Universidad de %s'),
            ('criminal',   'victim_advocate',       'Victims'' Rights Advocate',                '%s Victim Support Network'),
            ('criminal',   'prison_warden',         'Prison Warden',                            'Ministry of Justice'),
            ('criminal',   'civil_liberties',       'Civil Liberties Lawyer',                   'Independent'),
            ('criminal',   'retired_judge',         'Retired Judge',                            'Independent'),
            -- COMMERCIAL
            ('commercial', 'small_business',        'Small Business Owner',                     'Independent'),
            ('commercial', 'chamber',               'Chamber of Commerce Representative',       '%s Chamber of Commerce'),
            ('commercial', 'union_organizer',       'Labour Union Organizer',                   '%s Federation of Labour'),
            ('commercial', 'economist',             'Industrial Economist',                     'Universidad de %s'),
            ('commercial', 'banker',                'Bank Compliance Officer',                  'Independent'),
            ('commercial', 'corporate_counsel',     'Corporate Counsel',                        'Independent'),
            ('commercial', 'trade_secretary',       'Trade Ministry Secretary',                 'Ministry of Trade'),
            ('commercial', 'industry_lobbyist',     'Industry Lobbyist',                        'Manufacturers'' Coalition of %s'),
            -- ELECTORAL
            ('electoral',  'election_official',     'Election Commission Official',             'Ministry of Interior'),
            ('electoral',  'voter_advocate',        'Voter Rights Advocate',                    '%s League of Voters'),
            ('electoral',  'political_scientist',   'Political Scientist',                      'Universidad de %s'),
            ('electoral',  'campaign_manager',      'Veteran Campaign Manager',                 'Independent'),
            ('electoral',  'civic_journalist',      'Civic Journalist',                         '%s Chronicle'),
            ('electoral',  'party_treasurer',       'Party Treasurer',                          'Independent'),
            ('electoral',  'redistricting_expert',  'Redistricting Expert',                     'Independent'),
            ('electoral',  'civil_society',         'Civil Society Director',                   '%s Civic Foundation')
        ) AS t(cat, slug, title, affiliation_template)
        WHERE cat = p_category
        ORDER BY random()
        LIMIT 8
    LOOP
        IF v_npool_len > 0 THEN
            v_first := v_nation.first_name_pool[1 + floor(random() * v_npool_len)::int];
        ELSE
            v_first := 'Witness';
        END IF;
        IF v_lpool_len > 0 THEN
            v_last := v_nation.last_name_pool[1 + floor(random() * v_lpool_len)::int];
        ELSE
            v_last := rec.slug;
        END IF;
        v_aff := replace(rec.affiliation_template, '%s', v_city);

        INSERT INTO committee_hearing_personas (hearing_id, slug, name, title, affiliation)
        VALUES (p_hearing_id, rec.slug, v_first || ' ' || v_last, rec.title, v_aff);
        v_count := v_count + 1;
    END LOOP;
    RETURN v_count;
END $$;

-- ── 4. committee_hold_hearing — open a hearing ──────────────────────
CREATE OR REPLACE FUNCTION public.committee_hold_hearing(
    p_committee_id uuid, p_proposal_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid       uuid := auth.uid();
    v_pol       factions%ROWTYPE;
    v_comm      committees%ROWTYPE;
    v_prop      committee_proposals%ROWTYPE;
    v_tick      int;
    v_hearing   uuid;
    v_seeded    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_comm FROM committees WHERE id = p_committee_id;
    IF v_comm.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'committee_not_found');
    END IF;

    -- CHAIR ONLY — only the head of the committee may place an item
    -- on the agenda. Other members can accept testimony, but not
    -- decide what gets heard.
    PERFORM 1 FROM committee_members
     WHERE committee_id          = v_comm.id
       AND politician_faction_id = v_pol.id
       AND role                  = 'chair';
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_chair');
    END IF;

    SELECT * INTO v_prop FROM committee_proposals WHERE id = p_proposal_id;
    IF v_prop.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'proposal_not_found');
    END IF;
    IF v_prop.committee_id <> v_comm.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'wrong_committee');
    END IF;
    IF v_prop.status NOT IN ('queued') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_proposal_status');
    END IF;

    -- One open hearing per committee — partial unique catches a race,
    -- but check up front for a clean error message.
    PERFORM 1 FROM committee_hearings
     WHERE committee_id = v_comm.id AND status = 'open' LIMIT 1;
    IF FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_already_open');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO committee_hearings (
        committee_id, proposal_id, nation_id, opened_by_faction_id,
        opened_at_tick, closes_at_tick, status
    ) VALUES (
        v_comm.id, v_prop.id, v_comm.nation_id, v_pol.id,
        v_tick, v_tick + 3, 'open'
    ) RETURNING id INTO v_hearing;

    v_seeded := _seed_hearing_personas(v_hearing, v_prop.category, v_comm.nation_id);

    RETURN jsonb_build_object(
        'success',       true,
        'hearing_id',    v_hearing,
        'closes_at_tick', v_tick + 3,
        'personas',      v_seeded
    );
END $$;

GRANT EXECUTE ON FUNCTION public.committee_hold_hearing(uuid, uuid) TO authenticated;

-- ── 5. submit_hearing_testimony ─────────────────────────────────────
-- Anyone-with-a-faction can submit. Atomic persona claim guarantees
-- no two factions speak as the same persona; UNIQUE (hearing, submitter)
-- guarantees one testimony per faction per hearing.
CREATE OR REPLACE FUNCTION public.submit_hearing_testimony(
    p_hearing_id uuid, p_persona_id uuid, p_text text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_fac     factions%ROWTYPE;
    v_hearing committee_hearings%ROWTYPE;
    v_pers    committee_hearing_personas%ROWTYPE;
    v_tick    int;
    v_text    text;
    v_id      uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    -- Resolve the caller's faction. Any faction type allowed; pick
    -- their earliest active one to avoid ambiguity for users with
    -- multiple factions linked.
    SELECT * INTO v_fac FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_faction');
    END IF;

    SELECT * INTO v_hearing FROM committee_hearings WHERE id = p_hearing_id;
    IF v_hearing.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_not_found');
    END IF;
    IF v_hearing.status <> 'open' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_closed');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);
    IF v_tick > v_hearing.closes_at_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_window_passed');
    END IF;

    v_text := btrim(COALESCE(p_text, ''));
    IF length(v_text) < 1 OR length(v_text) > 400 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_text');
    END IF;

    -- Atomic persona claim. UPDATE … WHERE claimed_by IS NULL returns
    -- 0 rows if someone else claimed it between the page load and the
    -- click. RETURNING populates v_pers only on the winning path.
    UPDATE committee_hearing_personas
       SET claimed_by_faction_id = v_fac.id,
           claimed_at            = now()
     WHERE id = p_persona_id
       AND hearing_id = v_hearing.id
       AND claimed_by_faction_id IS NULL
    RETURNING * INTO v_pers;
    IF v_pers.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'persona_claimed');
    END IF;

    -- UNIQUE (hearing_id, submitter_faction_id) catches a second
    -- testimony from the same faction. On conflict, roll back the
    -- persona claim (so they can try a different persona — actually
    -- no, one-per-faction means even if they pick a different
    -- persona, they're blocked. So leave the claim; they're done).
    BEGIN
        INSERT INTO committee_hearing_testimonies (
            hearing_id, persona_id, submitter_faction_id, text, created_at_tick
        ) VALUES (
            v_hearing.id, v_pers.id, v_fac.id, v_text, v_tick
        ) RETURNING id INTO v_id;
    EXCEPTION WHEN unique_violation THEN
        -- Release the persona — caller already testified, so the
        -- claim is moot. Means another player could pick that
        -- persona afterwards, but better than orphaning it.
        UPDATE committee_hearing_personas
           SET claimed_by_faction_id = NULL, claimed_at = NULL
         WHERE id = v_pers.id;
        RETURN jsonb_build_object('success', false, 'reason', 'already_testified');
    END;

    RETURN jsonb_build_object(
        'success',       true,
        'testimony_id',  v_id,
        'persona_name',  v_pers.name,
        'persona_title', v_pers.title
    );
END $$;

GRANT EXECUTE ON FUNCTION public.submit_hearing_testimony(uuid, uuid, text) TO authenticated;

-- ── 6. accept_hearing_testimony ─────────────────────────────────────
-- Committee member only. Marks accepted=true and fires the stat
-- reward for the submitter (politician → +1 political_capital,
-- entrepreneur → +1 ent_reputation; other faction types: no reward).
CREATE OR REPLACE FUNCTION public.accept_hearing_testimony(p_testimony_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_test    committee_hearing_testimonies%ROWTYPE;
    v_hearing committee_hearings%ROWTYPE;
    v_sub     factions%ROWTYPE;
    v_tick    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_test FROM committee_hearing_testimonies WHERE id = p_testimony_id;
    IF v_test.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'testimony_not_found');
    END IF;
    IF v_test.accepted THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_accepted');
    END IF;

    SELECT * INTO v_hearing FROM committee_hearings WHERE id = v_test.hearing_id;
    IF v_hearing.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_not_found');
    END IF;

    PERFORM 1 FROM committee_members
     WHERE committee_id = v_hearing.committee_id AND politician_faction_id = v_pol.id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_member');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Conditional UPDATE so two members racing to accept the same
    -- testimony don't both fire the stat reward. The first writer wins;
    -- the second's UPDATE matches zero rows and the function returns
    -- without granting a second +1.
    UPDATE committee_hearing_testimonies
       SET accepted               = true,
           accepted_by_faction_id = v_pol.id,
           accepted_at_tick       = v_tick
     WHERE id = v_test.id
       AND accepted = false;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', true, 'testimony_id', v_test.id, 'already_accepted', true);
    END IF;

    -- Submitter reward. Skipped silently if the submitter faction is
    -- gone (ON DELETE SET NULL would have nulled submitter_faction_id).
    IF v_test.submitter_faction_id IS NOT NULL THEN
        SELECT * INTO v_sub FROM factions WHERE id = v_test.submitter_faction_id;
        IF v_sub.faction_type = 'politician' THEN
            UPDATE factions
               SET political_capital = COALESCE(political_capital, 0) + 1
             WHERE id = v_sub.id;
        ELSIF v_sub.faction_type = 'entrepreneur' THEN
            UPDATE factions
               SET ent_reputation = COALESCE(ent_reputation, 0) + 1
             WHERE id = v_sub.id;
        END IF;
        -- All other faction types: no stat reward (acceptance is the
        -- public-record reward).
    END IF;

    RETURN jsonb_build_object('success', true, 'testimony_id', v_test.id);
END $$;

GRANT EXECUTE ON FUNCTION public.accept_hearing_testimony(uuid) TO authenticated;

-- ── 7. close_committee_hearing ──────────────────────────────────────
-- Committee member only. Marks hearing closed. Idempotent — closing
-- an already-closed hearing is a no-op success.
CREATE OR REPLACE FUNCTION public.close_committee_hearing(p_hearing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_pol     factions%ROWTYPE;
    v_hearing committee_hearings%ROWTYPE;
    v_tick    int;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    SELECT * INTO v_pol FROM factions
     WHERE (id = v_uid OR linked_user_id = v_uid)
       AND faction_type = 'politician'
       AND abandoned_at IS NULL
     ORDER BY created_at ASC LIMIT 1;
    IF v_pol.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_politician');
    END IF;

    SELECT * INTO v_hearing FROM committee_hearings WHERE id = p_hearing_id;
    IF v_hearing.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'hearing_not_found');
    END IF;

    -- CHAIR ONLY — calendar control. Mirrors the gate on hold_hearing.
    PERFORM 1 FROM committee_members
     WHERE committee_id          = v_hearing.committee_id
       AND politician_faction_id = v_pol.id
       AND role                  = 'chair';
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_chair');
    END IF;

    IF v_hearing.status = 'closed' THEN
        RETURN jsonb_build_object('success', true, 'hearing_id', v_hearing.id, 'already_closed', true);
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE committee_hearings
       SET status = 'closed', closed_at_tick = v_tick
     WHERE id = v_hearing.id;

    RETURN jsonb_build_object('success', true, 'hearing_id', v_hearing.id, 'closed_at_tick', v_tick);
END $$;

GRANT EXECUTE ON FUNCTION public.close_committee_hearing(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
