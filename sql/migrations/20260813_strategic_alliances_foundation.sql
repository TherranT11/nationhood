-- 20260813_strategic_alliances_foundation.sql
--
-- Strategic Alliances — foundational layer.
--
-- Lands the schema + RPCs needed for the alliances UI (alliances.html)
-- to swap from the in-memory mock fixture to real persistent state.
-- This migration is the lifecycle plumbing (found / vote / ratify /
-- withdraw / leave / chat). It does NOT implement per-article runtime
-- effects — those land per-sector in follow-up migrations once a corp
-- can actually be in an alliance with a ratified article.
--
-- Tables:
--   strategic_alliances            One row per alliance, in any state
--                                  (negotiating | active | dissolved).
--                                  Carries Cohesion + Antitrust Heat
--                                  (numeric stats updated by article
--                                  effects later).
--   alliance_members               Junction. left_at_tick null = active
--                                  membership. UNIQUE active per pair.
--   alliance_articles              Articles ratified into a specific
--                                  alliance. ratified_at_tick set on
--                                  ratification; status stays 'active'
--                                  until repealed.
--   alliance_negotiation_votes     One row per (alliance, member) while
--                                  status='negotiating'. UPSERT pattern;
--                                  unsubmit deletes.
--   alliance_chat_messages         Negotiation-room transcript.
--
-- RPCs (all SECURITY DEFINER, callable by the corp's owner):
--   propose_strategic_alliance     Founder seeds the row, charges the
--                                  $20M base + $7M per invitee fee,
--                                  inserts members in 'negotiating'.
--   submit_alliance_vote           Member upserts their article vote.
--   unsubmit_alliance_vote         Member clears their vote.
--   ratify_strategic_alliance      Founder ratifies once consensus
--                                  reached. Flips status, stamps the
--                                  consensus article into
--                                  alliance_articles.
--   withdraw_strategic_alliance    Founder cancels a negotiation;
--                                  refunds the founding fee.
--   leave_strategic_alliance       Member quits. Last member out
--                                  dissolves the alliance.
--   send_alliance_message          Adds a chat row.
--
-- Cohesion default: 5.0 / 10.0 (mid-band on a 0-10 scale, same shape as
-- the corp stats elsewhere). Antitrust Heat default: 0.0.

BEGIN;

-- ── 1. Schema ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS strategic_alliances (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
    sector              TEXT NOT NULL CHECK (sector IN ('Construction', 'Finance', 'Shipping', 'Airline')),
    founder_faction_id  UUID NOT NULL REFERENCES factions(id) ON DELETE RESTRICT,
    mission             TEXT,
    status              TEXT NOT NULL DEFAULT 'negotiating'
                            CHECK (status IN ('negotiating', 'active', 'dissolved')),
    cohesion            NUMERIC NOT NULL DEFAULT 5.0,
    antitrust_heat      NUMERIC NOT NULL DEFAULT 0.0,
    founding_fee_paid   BIGINT NOT NULL DEFAULT 0,
    proposed_at_tick    INT NOT NULL,
    founded_at_tick     INT,                              -- set on ratification
    dissolved_at_tick   INT,                              -- set on dissolution
    dissolved_reason    TEXT CHECK (dissolved_reason IS NULL
                                     OR dissolved_reason IN ('withdrawn','consensus_failed','all_left')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alliances_sector_status
    ON strategic_alliances (sector, status);
CREATE INDEX IF NOT EXISTS idx_alliances_founder
    ON strategic_alliances (founder_faction_id);

CREATE TABLE IF NOT EXISTS alliance_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alliance_id     UUID NOT NULL REFERENCES strategic_alliances(id) ON DELETE CASCADE,
    faction_id      UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('founder','member')),
    joined_at_tick  INT NOT NULL,
    left_at_tick    INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One active membership per (alliance, faction). Allows re-joining
-- after leaving — left_at_tick on the old row, new row for the new term.
CREATE UNIQUE INDEX IF NOT EXISTS idx_alliance_members_active
    ON alliance_members (alliance_id, faction_id)
    WHERE left_at_tick IS NULL;

CREATE INDEX IF NOT EXISTS idx_alliance_members_faction_active
    ON alliance_members (faction_id) WHERE left_at_tick IS NULL;

CREATE TABLE IF NOT EXISTS alliance_articles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alliance_id         UUID NOT NULL REFERENCES strategic_alliances(id) ON DELETE CASCADE,
    article_id          TEXT NOT NULL,           -- e.g. 'aligned_interest'
    article_name        TEXT NOT NULL,           -- display label, snapshot at ratify time
    article_kind        TEXT NOT NULL CHECK (article_kind IN ('cooperative','coordinating','cartel')),
    article_body        TEXT,                    -- snapshot of the body copy
    cartel_score        NUMERIC NOT NULL DEFAULT 0,
    chs_bonus           NUMERIC NOT NULL DEFAULT 0,
    ratified_at_tick    INT NOT NULL,
    repealed_at_tick    INT,
    status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','repealed')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alliance_articles_alliance_active
    ON alliance_articles (alliance_id) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS alliance_negotiation_votes (
    alliance_id     UUID NOT NULL REFERENCES strategic_alliances(id) ON DELETE CASCADE,
    faction_id      UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    article_id      TEXT NOT NULL,
    voted_at_tick   INT NOT NULL,
    PRIMARY KEY (alliance_id, faction_id)
);

CREATE TABLE IF NOT EXISTS alliance_chat_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alliance_id     UUID NOT NULL REFERENCES strategic_alliances(id) ON DELETE CASCADE,
    faction_id      UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    body            TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
    sent_at_tick    INT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alliance_chat_alliance_time
    ON alliance_chat_messages (alliance_id, created_at);

-- ── 2. RLS ────────────────────────────────────────────────────────
-- Reads: alliance state is public game info (every player can see who's
-- in which alliance and what articles are ratified). Writes: routed
-- through SECURITY DEFINER RPCs so the only client mutation path is
-- the function call (no direct INSERT/UPDATE permitted).

ALTER TABLE strategic_alliances           ENABLE ROW LEVEL SECURITY;
ALTER TABLE alliance_members              ENABLE ROW LEVEL SECURITY;
ALTER TABLE alliance_articles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE alliance_negotiation_votes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE alliance_chat_messages        ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY alliances_read_all ON strategic_alliances FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY alliance_members_read_all ON alliance_members FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY alliance_articles_read_all ON alliance_articles FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    -- Votes are visible to alliance members only (some strategic info).
    CREATE POLICY alliance_votes_read_member ON alliance_negotiation_votes FOR SELECT TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM alliance_members am
                JOIN factions f ON f.id = am.faction_id
                WHERE am.alliance_id = alliance_negotiation_votes.alliance_id
                  AND am.left_at_tick IS NULL
                  AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY alliance_chat_read_member ON alliance_chat_messages FOR SELECT TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM alliance_members am
                JOIN factions f ON f.id = am.faction_id
                WHERE am.alliance_id = alliance_chat_messages.alliance_id
                  AND am.left_at_tick IS NULL
                  AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 3. RPCs ──────────────────────────────────────────────────────

-- Helper: load the auth user's owned-or-linked corporation faction by id.
-- Returns NULL if the caller doesn't own the faction. Used by every
-- RPC below — keep one source of truth so the ownership rule is uniform.
CREATE OR REPLACE FUNCTION _alliance_owner_faction(p_faction_id UUID)
RETURNS factions
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_user UUID := auth.uid();
    v_f    factions%ROWTYPE;
BEGIN
    IF v_user IS NULL THEN RETURN NULL; END IF;
    SELECT * INTO v_f FROM factions
    WHERE id = p_faction_id
      AND (id = v_user OR linked_user_id = v_user)
      AND faction_type = 'corporation'
      AND abandoned_at IS NULL;
    RETURN v_f;
END;
$$;

-- ── 3a. propose_strategic_alliance ───────────────────────────────
-- Founder seeds the alliance row + members, charges the $20M + $7M·N
-- founding fee. All invitees must be other corporations in the same
-- sector (server-validated; client also gates this).
CREATE OR REPLACE FUNCTION propose_strategic_alliance(
    p_founder_faction_id UUID,
    p_name               TEXT,
    p_mission            TEXT,
    p_invitee_ids        UUID[]
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_founder       factions%ROWTYPE;
    v_invitee       factions%ROWTYPE;
    v_invitee_id    UUID;
    v_alliance_id   UUID;
    v_tick          INT;
    v_base_fee      CONSTANT BIGINT := 20000000;
    v_per_invitee   CONSTANT BIGINT :=  7000000;
    v_total_fee     BIGINT;
    v_n_invitees    INT;
BEGIN
    v_founder := _alliance_owner_faction(p_founder_faction_id);
    IF v_founder.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Alliance name is required');
    END IF;

    v_n_invitees := COALESCE(array_length(p_invitee_ids, 1), 0);
    IF v_n_invitees < 2 OR v_n_invitees > 10 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Need 2–10 invitees');
    END IF;

    v_total_fee := v_base_fee + v_per_invitee * v_n_invitees;
    IF COALESCE(v_founder.corp_cash_reserves, 0) < v_total_fee THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Need $%s for the founding fee', to_char(v_total_fee, 'FM999,999,999')));
    END IF;

    -- Validate every invitee: must be a different corporation in the
    -- same sector. No duplicates, no founder-self, no abandoned corps.
    FOREACH v_invitee_id IN ARRAY p_invitee_ids LOOP
        IF v_invitee_id = p_founder_faction_id THEN
            RETURN jsonb_build_object('success', false, 'error', 'Cannot invite yourself');
        END IF;
        SELECT * INTO v_invitee FROM factions
        WHERE id = v_invitee_id AND faction_type = 'corporation' AND abandoned_at IS NULL;
        IF v_invitee.id IS NULL THEN
            RETURN jsonb_build_object('success', false,
                'error', 'Invited corporation not found or abandoned');
        END IF;
        IF v_invitee.corp_sector IS DISTINCT FROM v_founder.corp_sector THEN
            RETURN jsonb_build_object('success', false,
                'error', format('Invitees must be %s corporations', v_founder.corp_sector));
        END IF;
    END LOOP;
    -- Reject duplicates in the array.
    IF v_n_invitees <> (SELECT count(DISTINCT id) FROM unnest(p_invitee_ids) AS id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Duplicate invitees');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO strategic_alliances (
        name, sector, founder_faction_id, mission,
        founding_fee_paid, proposed_at_tick
    ) VALUES (
        trim(p_name), v_founder.corp_sector, p_founder_faction_id,
        NULLIF(trim(COALESCE(p_mission, '')), ''),
        v_total_fee, v_tick
    ) RETURNING id INTO v_alliance_id;

    INSERT INTO alliance_members (alliance_id, faction_id, role, joined_at_tick)
    VALUES (v_alliance_id, p_founder_faction_id, 'founder', v_tick);

    INSERT INTO alliance_members (alliance_id, faction_id, role, joined_at_tick)
    SELECT v_alliance_id, id, 'member', v_tick FROM unnest(p_invitee_ids) AS id;

    UPDATE factions
    SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) - v_total_fee
    WHERE id = p_founder_faction_id;

    RETURN jsonb_build_object(
        'success', true,
        'alliance_id', v_alliance_id,
        'founding_fee', v_total_fee
    );
END;
$$;

GRANT EXECUTE ON FUNCTION propose_strategic_alliance(UUID, TEXT, TEXT, UUID[]) TO authenticated;

-- ── 3b. submit_alliance_vote / unsubmit_alliance_vote ────────────
CREATE OR REPLACE FUNCTION submit_alliance_vote(
    p_voter_faction_id UUID,
    p_alliance_id      UUID,
    p_article_id       TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_voter    factions%ROWTYPE;
    v_alliance strategic_alliances%ROWTYPE;
    v_tick     INT;
BEGIN
    v_voter := _alliance_owner_faction(p_voter_faction_id);
    IF v_voter.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    SELECT * INTO v_alliance FROM strategic_alliances WHERE id = p_alliance_id;
    IF v_alliance.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Alliance not found');
    END IF;
    IF v_alliance.status <> 'negotiating' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Alliance is not in negotiation');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM alliance_members
        WHERE alliance_id = p_alliance_id AND faction_id = p_voter_faction_id AND left_at_tick IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are not a member of this alliance');
    END IF;
    IF p_article_id IS NULL OR length(trim(p_article_id)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Article id required');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO alliance_negotiation_votes (alliance_id, faction_id, article_id, voted_at_tick)
    VALUES (p_alliance_id, p_voter_faction_id, p_article_id, v_tick)
    ON CONFLICT (alliance_id, faction_id) DO UPDATE SET
        article_id    = EXCLUDED.article_id,
        voted_at_tick = EXCLUDED.voted_at_tick;

    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION unsubmit_alliance_vote(
    p_voter_faction_id UUID,
    p_alliance_id      UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_voter factions%ROWTYPE;
BEGIN
    v_voter := _alliance_owner_faction(p_voter_faction_id);
    IF v_voter.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    DELETE FROM alliance_negotiation_votes
    WHERE alliance_id = p_alliance_id AND faction_id = p_voter_faction_id;
    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION submit_alliance_vote(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION unsubmit_alliance_vote(UUID, UUID) TO authenticated;

-- ── 3c. ratify_strategic_alliance ────────────────────────────────
-- Founder-only. Requires every active member to have voted for the
-- same article. Snapshots the article metadata into alliance_articles.
CREATE OR REPLACE FUNCTION ratify_strategic_alliance(
    p_founder_faction_id UUID,
    p_alliance_id        UUID,
    -- Article metadata snapshot supplied by the client (single source
    -- of truth for the article catalog lives in alliances.html
    -- SECTOR_ARTICLES today; pass it through so the DB has the copy).
    p_article_name       TEXT,
    p_article_kind       TEXT,
    p_article_body       TEXT,
    p_cartel_score       NUMERIC,
    p_chs_bonus          NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_founder    factions%ROWTYPE;
    v_alliance   strategic_alliances%ROWTYPE;
    v_member_n   INT;
    v_voted_n    INT;
    v_distinct_n INT;
    v_consensus  TEXT;
    v_tick       INT;
BEGIN
    v_founder := _alliance_owner_faction(p_founder_faction_id);
    IF v_founder.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    SELECT * INTO v_alliance FROM strategic_alliances WHERE id = p_alliance_id FOR UPDATE;
    IF v_alliance.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Alliance not found');
    END IF;
    IF v_alliance.founder_faction_id <> p_founder_faction_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the founder can ratify');
    END IF;
    IF v_alliance.status <> 'negotiating' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Alliance is not in negotiation');
    END IF;

    SELECT count(*) INTO v_member_n
    FROM alliance_members WHERE alliance_id = p_alliance_id AND left_at_tick IS NULL;

    SELECT count(*), count(DISTINCT article_id)
    INTO v_voted_n, v_distinct_n
    FROM alliance_negotiation_votes WHERE alliance_id = p_alliance_id;

    IF v_voted_n < v_member_n THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Awaiting %s more vote(s) before ratification', v_member_n - v_voted_n));
    END IF;
    IF v_distinct_n <> 1 THEN
        RETURN jsonb_build_object('success', false,
            'error', 'Members are split — all must vote on the same article');
    END IF;

    SELECT article_id INTO v_consensus
    FROM alliance_negotiation_votes WHERE alliance_id = p_alliance_id LIMIT 1;

    IF p_article_kind IS NULL OR p_article_kind NOT IN ('cooperative','coordinating','cartel') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid article kind');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE strategic_alliances
    SET status = 'active',
        founded_at_tick = v_tick,
        cohesion = LEAST(10::numeric, COALESCE(cohesion, 0) + COALESCE(p_chs_bonus, 0))
    WHERE id = p_alliance_id;

    INSERT INTO alliance_articles (
        alliance_id, article_id, article_name, article_kind, article_body,
        cartel_score, chs_bonus, ratified_at_tick
    ) VALUES (
        p_alliance_id, v_consensus, p_article_name, p_article_kind, p_article_body,
        COALESCE(p_cartel_score, 0), COALESCE(p_chs_bonus, 0), v_tick
    );

    -- Negotiation votes are no longer needed once ratified — clear them
    -- so the alliance row's read path doesn't have to filter by status.
    DELETE FROM alliance_negotiation_votes WHERE alliance_id = p_alliance_id;

    RETURN jsonb_build_object('success', true, 'article_id', v_consensus);
END;
$$;

GRANT EXECUTE ON FUNCTION ratify_strategic_alliance(UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, NUMERIC) TO authenticated;

-- ── 3d. withdraw_strategic_alliance ──────────────────────────────
-- Founder cancels a negotiation. Refunds the founding fee.
CREATE OR REPLACE FUNCTION withdraw_strategic_alliance(
    p_founder_faction_id UUID,
    p_alliance_id        UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_founder  factions%ROWTYPE;
    v_alliance strategic_alliances%ROWTYPE;
    v_tick     INT;
BEGIN
    v_founder := _alliance_owner_faction(p_founder_faction_id);
    IF v_founder.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    SELECT * INTO v_alliance FROM strategic_alliances WHERE id = p_alliance_id FOR UPDATE;
    IF v_alliance.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Alliance not found');
    END IF;
    IF v_alliance.founder_faction_id <> p_founder_faction_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the founder can withdraw');
    END IF;
    IF v_alliance.status <> 'negotiating' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only negotiating proposals can be withdrawn');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE strategic_alliances
    SET status = 'dissolved',
        dissolved_at_tick = v_tick,
        dissolved_reason = 'withdrawn'
    WHERE id = p_alliance_id;

    -- Refund the founding fee.
    UPDATE factions
    SET corp_cash_reserves = COALESCE(corp_cash_reserves, 0) + v_alliance.founding_fee_paid
    WHERE id = p_founder_faction_id;

    -- Mark members as departed so the active-membership index frees up.
    UPDATE alliance_members SET left_at_tick = v_tick
    WHERE alliance_id = p_alliance_id AND left_at_tick IS NULL;

    DELETE FROM alliance_negotiation_votes WHERE alliance_id = p_alliance_id;

    RETURN jsonb_build_object('success', true, 'refunded', v_alliance.founding_fee_paid);
END;
$$;

GRANT EXECUTE ON FUNCTION withdraw_strategic_alliance(UUID, UUID) TO authenticated;

-- ── 3e. leave_strategic_alliance ─────────────────────────────────
-- Member quits. Founder leaving an active alliance is allowed (the
-- founder role is honorary post-ratification). Last member out
-- dissolves the alliance.
CREATE OR REPLACE FUNCTION leave_strategic_alliance(
    p_faction_id  UUID,
    p_alliance_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_corp        factions%ROWTYPE;
    v_alliance    strategic_alliances%ROWTYPE;
    v_remaining   INT;
    v_tick        INT;
BEGIN
    v_corp := _alliance_owner_faction(p_faction_id);
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    SELECT * INTO v_alliance FROM strategic_alliances WHERE id = p_alliance_id FOR UPDATE;
    IF v_alliance.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Alliance not found');
    END IF;
    IF v_alliance.status = 'dissolved' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Alliance is already dissolved');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    UPDATE alliance_members
    SET left_at_tick = v_tick
    WHERE alliance_id = p_alliance_id AND faction_id = p_faction_id AND left_at_tick IS NULL;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are not a member of this alliance');
    END IF;
    DELETE FROM alliance_negotiation_votes
    WHERE alliance_id = p_alliance_id AND faction_id = p_faction_id;

    SELECT count(*) INTO v_remaining
    FROM alliance_members WHERE alliance_id = p_alliance_id AND left_at_tick IS NULL;

    IF v_remaining = 0 THEN
        UPDATE strategic_alliances
        SET status = 'dissolved',
            dissolved_at_tick = v_tick,
            dissolved_reason = 'all_left'
        WHERE id = p_alliance_id;
        RETURN jsonb_build_object('success', true, 'dissolved', true);
    END IF;
    RETURN jsonb_build_object('success', true, 'dissolved', false, 'remaining_members', v_remaining);
END;
$$;

GRANT EXECUTE ON FUNCTION leave_strategic_alliance(UUID, UUID) TO authenticated;

-- ── 3f. send_alliance_message ────────────────────────────────────
CREATE OR REPLACE FUNCTION send_alliance_message(
    p_faction_id   UUID,
    p_alliance_id  UUID,
    p_body         TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_corp factions%ROWTYPE;
    v_tick INT;
BEGIN
    v_corp := _alliance_owner_faction(p_faction_id);
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;
    IF p_body IS NULL OR length(trim(p_body)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Message body required');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM alliance_members
        WHERE alliance_id = p_alliance_id AND faction_id = p_faction_id AND left_at_tick IS NULL
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are not a member of this alliance');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    INSERT INTO alliance_chat_messages (alliance_id, faction_id, body, sent_at_tick)
    VALUES (p_alliance_id, p_faction_id, trim(p_body), v_tick);

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION send_alliance_message(UUID, UUID, TEXT) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
