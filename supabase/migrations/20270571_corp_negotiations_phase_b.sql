-- ════════════════════════════════════════════════════════════════════
-- 20270571 — Corporate Negotiations Phase B: articles + agreements
--
-- Drafting surface. Either party's CEO can add articles, edit
-- title/body, agree to (and withdraw from) an article. When both
-- parties have agreed to an article it locks. When EVERY article on
-- a contract is locked (and there's at least one), the negotiation
-- auto-transitions status: drafting → awaiting_signatures. Adding
-- a fresh article or editing/withdrawing an agreement on an existing
-- one tips it back: awaiting_signatures → drafting.
--
-- Edit semantic: any update_corp_negotiation_article call clears
-- ALL agreements on that article, regardless of whether title/body
-- actually changed. The intent lives in the click — the editor has
-- to re-agree, and so does the counterparty. Matches the user's
-- earlier "edit resets agreement" pick.
--
-- Cancellation: cancel_corp_negotiation now permits both drafting
-- AND awaiting_signatures (parties may walk away after articles are
-- locked but before signing — Phase C lands signing). Cancelled is
-- still terminal: no further mutations.
--
-- New tables (RPC-only, REVOKE ALL from clients):
--   corp_negotiation_articles               — one row per article.
--   corp_negotiation_article_agreements     — composite PK
--                                             (article_id, corp_id).
--                                             The corp_id identifies
--                                             which party agreed.
--
-- Status CHECK widens: 'drafting' | 'awaiting_signatures' | 'cancelled'.
-- Phase C adds 'binding' / 'expired' / 'terminated' alongside
-- signing.
--
-- New RPCs (all SECURITY DEFINER, GRANT to authenticated):
--   add_corp_negotiation_article           — append blank or seeded article
--   update_corp_negotiation_article        — save title/body, clear agreements
--   delete_corp_negotiation_article        — remove article
--   agree_corp_negotiation_article         — add an agreement row for this corp
--   withdraw_corp_negotiation_article_agreement
--                                          — remove this corp's agreement
--
-- Updated RPCs:
--   cancel_corp_negotiation                — accept awaiting_signatures too
--   list_corp_negotiations                 — accept awaiting_signatures too
--   get_corp_contract                      — payload now nests articles[]
--                                             with per-party agreement state
--
-- Status maintenance helper:
--   _recalc_corp_negotiation_status        — called from every mutating
--                                             RPC; no-op on cancelled
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema: tables + status widen ─────────────────────────────

CREATE TABLE IF NOT EXISTS public.corp_negotiation_articles (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negotiation_id           UUID NOT NULL REFERENCES public.corp_negotiations(id) ON DELETE CASCADE,

    -- Both nullable: articles start blank ("Untitled article…") and
    -- get populated through update_corp_negotiation_article. The
    -- empty state is intentional — the mockup shows a placeholder
    -- input on a fresh article.
    title                    TEXT,
    body                     TEXT,

    -- locked = both parties have agreement rows. Maintained by
    -- agree / withdraw / update. locked_at_tick stamps when locked
    -- last flipped true; null when the article has never reached
    -- locked since its last edit.
    locked                   BOOLEAN NOT NULL DEFAULT FALSE,
    locked_at_tick           INT,

    -- Authorship audit. SET NULL on faction delete so historical
    -- articles survive an abandoned entrepreneur.
    created_by_faction_id    UUID REFERENCES public.factions(id) ON DELETE SET NULL,
    created_at_tick          INT NOT NULL,
    updated_by_faction_id    UUID REFERENCES public.factions(id) ON DELETE SET NULL,
    updated_at_tick          INT,

    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corp_negotiation_articles_negotiation
    ON public.corp_negotiation_articles (negotiation_id, created_at);

COMMENT ON TABLE public.corp_negotiation_articles IS
    'Articles drafted on an inter-corp negotiation (Phase B). Ordering is created_at ASC + id tiebreak — no explicit ordinal column until reorder lands. RPC-only.';

REVOKE ALL ON public.corp_negotiation_articles FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.corp_negotiation_article_agreements (
    article_id           UUID NOT NULL REFERENCES public.corp_negotiation_articles(id) ON DELETE CASCADE,
    -- corp_id is the PARTY agreeing (not the faction id). One
    -- agreement row per (article, party). Both rows present →
    -- article locks.
    corp_id              UUID NOT NULL REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE,
    -- Faction who actually clicked the button (the corp's CEO at
    -- the time). Informational; SET NULL on faction delete.
    agreed_by_faction_id UUID REFERENCES public.factions(id) ON DELETE SET NULL,
    agreed_at_tick       INT NOT NULL,
    PRIMARY KEY (article_id, corp_id)
);

COMMENT ON TABLE public.corp_negotiation_article_agreements IS
    'One row per (article, party) agreement. Composite PK enforces "at most one agreement per party per article". Article locks when both parties have rows. RPC-only.';

REVOKE ALL ON public.corp_negotiation_article_agreements FROM PUBLIC, anon, authenticated;

-- Status widen.
ALTER TABLE public.corp_negotiations
    DROP CONSTRAINT IF EXISTS corp_negotiations_status_check;
ALTER TABLE public.corp_negotiations
    ADD CONSTRAINT corp_negotiations_status_check
    CHECK (status IN ('drafting', 'awaiting_signatures', 'cancelled'));

-- ── 2. Helpers ───────────────────────────────────────────────────

-- Resolve the caller's primary entrepreneur faction. Same shape as
-- start_corp_negotiation et al. Pulled into a helper so the article
-- RPCs don't each duplicate the SELECT.
CREATE OR REPLACE FUNCTION public._corp_negotiation_caller_faction()
RETURNS UUID
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_fid UUID;
BEGIN
    IF v_uid IS NULL THEN RETURN NULL; END IF;
    SELECT id INTO v_fid FROM public.factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1;
    RETURN v_fid;
END $$;

-- Recalculate the negotiation's status from its articles. Called
-- after every mutating article/agreement RPC. No-op when status is
-- 'cancelled' so a cancelled draft can't resurrect itself.
--   articles total > 0 AND all locked  → 'awaiting_signatures'
--   otherwise                           → 'drafting'
CREATE OR REPLACE FUNCTION public._recalc_corp_negotiation_status(
    p_negotiation_id UUID
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_status         TEXT;
    v_total          INT;
    v_unlocked       INT;
    v_target         TEXT;
BEGIN
    SELECT status INTO v_status FROM public.corp_negotiations
     WHERE id = p_negotiation_id FOR UPDATE;
    IF v_status IS NULL OR v_status = 'cancelled' THEN
        RETURN;
    END IF;

    SELECT COUNT(*), COUNT(*) FILTER (WHERE NOT locked)
      INTO v_total, v_unlocked
      FROM public.corp_negotiation_articles
     WHERE negotiation_id = p_negotiation_id;

    v_target := CASE
        WHEN v_total > 0 AND v_unlocked = 0 THEN 'awaiting_signatures'
        ELSE 'drafting'
    END;

    IF v_target <> v_status THEN
        UPDATE public.corp_negotiations
           SET status = v_target, updated_at = now()
         WHERE id = p_negotiation_id;
    END IF;
END $$;

-- Resolve and validate (negotiation, caller's corp). Returns the
-- negotiation row alongside the corp the caller is CEO of. Used by
-- every Phase B mutator. Fails if the caller isn't CEO of a party
-- corp, or if the negotiation is cancelled (no further mutations).
CREATE OR REPLACE FUNCTION public._corp_negotiation_validate_caller(
    p_negotiation_id UUID,
    p_corp_id        UUID
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_caller_faction_id UUID := public._corp_negotiation_caller_faction();
    v_neg               public.corp_negotiations%ROWTYPE;
BEGIN
    IF v_caller_faction_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'no_entrepreneur');
    END IF;
    SELECT * INTO v_neg FROM public.corp_negotiations
     WHERE id = p_negotiation_id;
    IF v_neg.id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'negotiation_not_found');
    END IF;
    IF v_neg.status = 'cancelled' THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'negotiation_cancelled');
    END IF;
    -- p_corp_id must be a party AND owned by the caller.
    IF p_corp_id IS NULL OR p_corp_id NOT IN (v_neg.initiating_corp_id, v_neg.counterparty_corp_id) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'corp_not_party');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.entrepreneur_corps
         WHERE id = p_corp_id AND owner_faction_id = v_caller_faction_id
    ) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'not_ceo');
    END IF;
    RETURN jsonb_build_object(
        'ok', true,
        'caller_faction_id', v_caller_faction_id,
        'negotiation_id',    v_neg.id
    );
END $$;

-- ── 3. add_corp_negotiation_article ──────────────────────────────
CREATE OR REPLACE FUNCTION public.add_corp_negotiation_article(
    p_negotiation_id UUID,
    p_corp_id        UUID,
    p_title          TEXT DEFAULT NULL,
    p_body           TEXT DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_check        jsonb;
    v_tick         INT;
    v_article_id   UUID;
BEGIN
    IF p_negotiation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    v_check := public._corp_negotiation_validate_caller(p_negotiation_id, p_corp_id);
    IF NOT (v_check ->> 'ok')::boolean THEN
        RETURN jsonb_build_object('success', false, 'reason', v_check ->> 'reason');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    INSERT INTO public.corp_negotiation_articles (
        negotiation_id, title, body,
        created_by_faction_id, created_at_tick
    ) VALUES (
        p_negotiation_id, NULLIF(btrim(p_title), ''), NULLIF(btrim(p_body), ''),
        (v_check ->> 'caller_faction_id')::uuid, COALESCE(v_tick, 0)
    ) RETURNING id INTO v_article_id;

    -- New article is unlocked by default → status may flip back to
    -- drafting if it was awaiting_signatures.
    PERFORM public._recalc_corp_negotiation_status(p_negotiation_id);

    RETURN jsonb_build_object('success', true, 'article_id', v_article_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.add_corp_negotiation_article(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.add_corp_negotiation_article(UUID, UUID, TEXT, TEXT) TO authenticated;

-- ── 4. update_corp_negotiation_article ───────────────────────────
-- Saves title/body and CLEARS all agreements on the article. The
-- editor doesn't auto-re-agree; they have to click agree again.
CREATE OR REPLACE FUNCTION public.update_corp_negotiation_article(
    p_article_id UUID,
    p_corp_id    UUID,
    p_title      TEXT,
    p_body       TEXT
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_negotiation_id UUID;
    v_check          jsonb;
    v_tick           INT;
BEGIN
    IF p_article_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT negotiation_id INTO v_negotiation_id
      FROM public.corp_negotiation_articles WHERE id = p_article_id;
    IF v_negotiation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'article_not_found');
    END IF;

    v_check := public._corp_negotiation_validate_caller(v_negotiation_id, p_corp_id);
    IF NOT (v_check ->> 'ok')::boolean THEN
        RETURN jsonb_build_object('success', false, 'reason', v_check ->> 'reason');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE public.corp_negotiation_articles
       SET title                 = NULLIF(btrim(p_title), ''),
           body                  = NULLIF(btrim(p_body), ''),
           locked                = FALSE,
           locked_at_tick        = NULL,
           updated_by_faction_id = (v_check ->> 'caller_faction_id')::uuid,
           updated_at_tick       = COALESCE(v_tick, 0),
           updated_at            = now()
     WHERE id = p_article_id;

    DELETE FROM public.corp_negotiation_article_agreements
     WHERE article_id = p_article_id;

    PERFORM public._recalc_corp_negotiation_status(v_negotiation_id);

    RETURN jsonb_build_object('success', true, 'article_id', p_article_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.update_corp_negotiation_article(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.update_corp_negotiation_article(UUID, UUID, TEXT, TEXT) TO authenticated;

-- ── 5. delete_corp_negotiation_article ───────────────────────────
CREATE OR REPLACE FUNCTION public.delete_corp_negotiation_article(
    p_article_id UUID,
    p_corp_id    UUID
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_negotiation_id UUID;
    v_check          jsonb;
BEGIN
    IF p_article_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT negotiation_id INTO v_negotiation_id
      FROM public.corp_negotiation_articles WHERE id = p_article_id;
    IF v_negotiation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'article_not_found');
    END IF;

    v_check := public._corp_negotiation_validate_caller(v_negotiation_id, p_corp_id);
    IF NOT (v_check ->> 'ok')::boolean THEN
        RETURN jsonb_build_object('success', false, 'reason', v_check ->> 'reason');
    END IF;

    DELETE FROM public.corp_negotiation_articles WHERE id = p_article_id;

    -- Status may now flip awaiting_signatures → still awaiting if all
    -- remaining articles were locked, OR → drafting if the deletion
    -- left no articles. _recalc handles both.
    PERFORM public._recalc_corp_negotiation_status(v_negotiation_id);

    RETURN jsonb_build_object('success', true, 'article_id', p_article_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.delete_corp_negotiation_article(UUID, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.delete_corp_negotiation_article(UUID, UUID) TO authenticated;

-- ── 6. agree_corp_negotiation_article ────────────────────────────
-- Adds an agreement row for the caller's corp. If both parties now
-- have agreements, the article locks.
CREATE OR REPLACE FUNCTION public.agree_corp_negotiation_article(
    p_article_id UUID,
    p_corp_id    UUID
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_negotiation_id UUID;
    v_check          jsonb;
    v_tick           INT;
    v_neg            public.corp_negotiations%ROWTYPE;
    v_agreement_count INT;
    v_locked         BOOLEAN := FALSE;
BEGIN
    IF p_article_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT negotiation_id INTO v_negotiation_id
      FROM public.corp_negotiation_articles
     WHERE id = p_article_id FOR UPDATE;
    IF v_negotiation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'article_not_found');
    END IF;

    v_check := public._corp_negotiation_validate_caller(v_negotiation_id, p_corp_id);
    IF NOT (v_check ->> 'ok')::boolean THEN
        RETURN jsonb_build_object('success', false, 'reason', v_check ->> 'reason');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    -- ON CONFLICT DO NOTHING so re-clicking Agree as the same corp
    -- is idempotent.
    INSERT INTO public.corp_negotiation_article_agreements (
        article_id, corp_id, agreed_by_faction_id, agreed_at_tick
    ) VALUES (
        p_article_id, p_corp_id,
        (v_check ->> 'caller_faction_id')::uuid, COALESCE(v_tick, 0)
    ) ON CONFLICT (article_id, corp_id) DO NOTHING;

    -- Now both parties have rows? Lock the article. SELECT the
    -- negotiation's parties to compare against the agreements set.
    SELECT * INTO v_neg FROM public.corp_negotiations WHERE id = v_negotiation_id;
    SELECT COUNT(*) INTO v_agreement_count
      FROM public.corp_negotiation_article_agreements
     WHERE article_id = p_article_id
       AND corp_id IN (v_neg.initiating_corp_id, v_neg.counterparty_corp_id);

    IF v_agreement_count >= 2 THEN
        UPDATE public.corp_negotiation_articles
           SET locked = TRUE, locked_at_tick = COALESCE(v_tick, 0),
               updated_at = now()
         WHERE id = p_article_id;
        v_locked := TRUE;
    END IF;

    PERFORM public._recalc_corp_negotiation_status(v_negotiation_id);

    RETURN jsonb_build_object(
        'success',    true,
        'article_id', p_article_id,
        'locked',     v_locked
    );
END $$;

REVOKE EXECUTE ON FUNCTION public.agree_corp_negotiation_article(UUID, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.agree_corp_negotiation_article(UUID, UUID) TO authenticated;

-- ── 7. withdraw_corp_negotiation_article_agreement ──────────────
CREATE OR REPLACE FUNCTION public.withdraw_corp_negotiation_article_agreement(
    p_article_id UUID,
    p_corp_id    UUID
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_negotiation_id UUID;
    v_check          jsonb;
BEGIN
    IF p_article_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT negotiation_id INTO v_negotiation_id
      FROM public.corp_negotiation_articles
     WHERE id = p_article_id FOR UPDATE;
    IF v_negotiation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'article_not_found');
    END IF;

    v_check := public._corp_negotiation_validate_caller(v_negotiation_id, p_corp_id);
    IF NOT (v_check ->> 'ok')::boolean THEN
        RETURN jsonb_build_object('success', false, 'reason', v_check ->> 'reason');
    END IF;

    DELETE FROM public.corp_negotiation_article_agreements
     WHERE article_id = p_article_id AND corp_id = p_corp_id;

    -- Withdrawal unlocks the article (it was only locked if both
    -- agreements were present).
    UPDATE public.corp_negotiation_articles
       SET locked = FALSE, locked_at_tick = NULL, updated_at = now()
     WHERE id = p_article_id AND locked;

    PERFORM public._recalc_corp_negotiation_status(v_negotiation_id);

    RETURN jsonb_build_object('success', true, 'article_id', p_article_id);
END $$;

REVOKE EXECUTE ON FUNCTION public.withdraw_corp_negotiation_article_agreement(UUID, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.withdraw_corp_negotiation_article_agreement(UUID, UUID) TO authenticated;

-- ── 8. cancel_corp_negotiation — accept awaiting_signatures ──────
-- Body byte-identical to Phase A's version except the status guard
-- now allows ('drafting', 'awaiting_signatures'). Parties may walk
-- away even after articles are all locked.
CREATE OR REPLACE FUNCTION public.cancel_corp_negotiation(
    p_contract_id UUID
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                UUID := auth.uid();
    v_contract           public.corp_negotiations%ROWTYPE;
    v_caller_faction_id  UUID;
    v_tick               INT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_contract_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_contract FROM public.corp_negotiations
     WHERE id = p_contract_id FOR UPDATE;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'contract_not_found');
    END IF;
    IF v_contract.status NOT IN ('drafting', 'awaiting_signatures') THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_cancellable');
    END IF;

    v_caller_faction_id := public._corp_negotiation_caller_faction();
    IF v_caller_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.entrepreneur_corps
         WHERE owner_faction_id = v_caller_faction_id
           AND id IN (v_contract.initiating_corp_id, v_contract.counterparty_corp_id)
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_party_ceo');
    END IF;

    SELECT current_tick INTO v_tick FROM public.shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE public.corp_negotiations
       SET status                  = 'cancelled',
           cancelled_at_tick       = COALESCE(v_tick, 0),
           cancelled_by_faction_id = v_caller_faction_id,
           updated_at              = now()
     WHERE id = p_contract_id;

    RETURN jsonb_build_object('success', true, 'contract_id', p_contract_id);
END $$;

-- ── 9. list_corp_negotiations — include awaiting_signatures ─────
CREATE OR REPLACE FUNCTION public.list_corp_negotiations(
    p_corp_id UUID
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid               UUID := auth.uid();
    v_caller_faction_id UUID;
    v_negotiations      jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    v_caller_faction_id := public._corp_negotiation_caller_faction();
    IF v_caller_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.entrepreneur_corps
         WHERE id = p_corp_id AND owner_faction_id = v_caller_faction_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_ceo');
    END IF;

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'contract_id',              row.id,
                'created_at_tick',          row.created_at_tick,
                'status',                   row.status,
                'is_initiator',             row.is_initiator,
                'counterparty_corp_id',     row.counterparty_corp_id,
                'counterparty_corp_name',   row.counterparty_corp_name,
                'counterparty_corp_nation', row.counterparty_corp_nation
            ) ORDER BY row.created_at_tick DESC
        ),
        '[]'::jsonb
    )
      INTO v_negotiations
      FROM (
        SELECT
            c.id,
            c.created_at_tick,
            c.status,
            (c.initiating_corp_id = p_corp_id) AS is_initiator,
            CASE WHEN c.initiating_corp_id = p_corp_id
                 THEN c.counterparty_corp_id
                 ELSE c.initiating_corp_id END AS counterparty_corp_id,
            CASE WHEN c.initiating_corp_id = p_corp_id
                 THEN ec_b.name
                 ELSE ec_a.name END           AS counterparty_corp_name,
            CASE WHEN c.initiating_corp_id = p_corp_id
                 THEN n_b.name
                 ELSE n_a.name END            AS counterparty_corp_nation
          FROM public.corp_negotiations c
          LEFT JOIN public.entrepreneur_corps ec_a ON ec_a.id = c.initiating_corp_id
          LEFT JOIN public.entrepreneur_corps ec_b ON ec_b.id = c.counterparty_corp_id
          LEFT JOIN public.nations n_a ON n_a.id = ec_a.hq_nation_id
          LEFT JOIN public.nations n_b ON n_b.id = ec_b.hq_nation_id
         WHERE c.status IN ('drafting', 'awaiting_signatures')
           AND (c.initiating_corp_id = p_corp_id OR c.counterparty_corp_id = p_corp_id)
      ) row;

    RETURN jsonb_build_object('success', true, 'negotiations', v_negotiations);
END $$;

-- ── 10. get_corp_contract — payload includes articles[] ─────────
-- Adds a nested articles[] array, each row carrying its title/body/
-- locked status plus a parties_agreed[] of {corp_id, corp_name,
-- agreed_at_tick}. Ordering: articles by created_at ASC, id ASC
-- (stable tie-break).
CREATE OR REPLACE FUNCTION public.get_corp_contract(
    p_contract_id UUID
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid                  UUID := auth.uid();
    v_caller_faction_id    UUID;
    v_contract             public.corp_negotiations%ROWTYPE;
    v_initiating_name      TEXT;
    v_initiating_nation    TEXT;
    v_counterparty_name    TEXT;
    v_counterparty_nation  TEXT;
    v_articles             jsonb;
    v_caller_corp_ids      jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_contract_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'missing_argument');
    END IF;

    SELECT * INTO v_contract FROM public.corp_negotiations WHERE id = p_contract_id;
    IF v_contract.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'contract_not_found');
    END IF;

    v_caller_faction_id := public._corp_negotiation_caller_faction();
    IF v_caller_faction_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.entrepreneur_corps
         WHERE owner_faction_id = v_caller_faction_id
           AND id IN (v_contract.initiating_corp_id, v_contract.counterparty_corp_id)
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_party_ceo');
    END IF;

    SELECT ec.name, n.name INTO v_initiating_name, v_initiating_nation
      FROM public.entrepreneur_corps ec
      LEFT JOIN public.nations n ON n.id = ec.hq_nation_id
     WHERE ec.id = v_contract.initiating_corp_id;

    SELECT ec.name, n.name INTO v_counterparty_name, v_counterparty_nation
      FROM public.entrepreneur_corps ec
      LEFT JOIN public.nations n ON n.id = ec.hq_nation_id
     WHERE ec.id = v_contract.counterparty_corp_id;

    -- Which party corp(s) does the caller own? Surfaces to the
    -- client so it can pick the "active perspective" without an
    -- extra round trip. Usually one entry; users who own both
    -- parties' corps get both.
    SELECT COALESCE(jsonb_agg(id), '[]'::jsonb)
      INTO v_caller_corp_ids
      FROM public.entrepreneur_corps
     WHERE owner_faction_id = v_caller_faction_id
       AND id IN (v_contract.initiating_corp_id, v_contract.counterparty_corp_id);

    -- Articles + per-article agreements as a nested LATERAL.
    -- entrepreneur_corps name join inside the agreements aggregate
    -- so the client doesn't need a corp-name lookup per agreement.
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id',              a.id,
                'title',           a.title,
                'body',            a.body,
                'locked',          a.locked,
                'created_at_tick', a.created_at_tick,
                'updated_at_tick', a.updated_at_tick,
                'parties_agreed',  COALESCE(ag.agreements, '[]'::jsonb)
            ) ORDER BY a.created_at ASC, a.id ASC
        ),
        '[]'::jsonb
    )
      INTO v_articles
      FROM public.corp_negotiation_articles a
      LEFT JOIN LATERAL (
        SELECT jsonb_agg(jsonb_build_object(
            'corp_id',        agr.corp_id,
            'corp_name',      ec.name,
            'agreed_at_tick', agr.agreed_at_tick
        )) AS agreements
          FROM public.corp_negotiation_article_agreements agr
          LEFT JOIN public.entrepreneur_corps ec ON ec.id = agr.corp_id
         WHERE agr.article_id = a.id
      ) ag ON TRUE
     WHERE a.negotiation_id = p_contract_id;

    RETURN jsonb_build_object(
        'success', true,
        'contract', jsonb_build_object(
            'id',                       v_contract.id,
            'status',                   v_contract.status,
            'created_at_tick',          v_contract.created_at_tick,
            'cancelled_at_tick',        v_contract.cancelled_at_tick,
            'initiating_corp_id',       v_contract.initiating_corp_id,
            'initiating_corp_name',     v_initiating_name,
            'initiating_corp_nation',   v_initiating_nation,
            'counterparty_corp_id',     v_contract.counterparty_corp_id,
            'counterparty_corp_name',   v_counterparty_name,
            'counterparty_corp_nation', v_counterparty_nation,
            'caller_corp_ids',          v_caller_corp_ids,
            'articles',                 v_articles
        )
    );
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
