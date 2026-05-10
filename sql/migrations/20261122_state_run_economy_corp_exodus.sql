-- ════════════════════════════════════════════════════════════════
-- Forced Corporate Exodus — State Apparatus / State Run Economy
--
-- When a nation enacts the State Run Economy option of the State
-- Apparatus policy, every corporation currently HQ'd in that
-- nation is flagged "displaced" and must relocate its national HQ
-- to another nation. Until they relocate:
--   - All corp actions are blocked (BEFORE INSERT triggers below)
--   - A Pressing Issue surfaces on corp-operations
--   - Player picks a destination nation (filtered to exclude any
--     other nation currently under State Run Economy)
-- On relocate:
--   - Flat $5M fee debited from corp_cash_reserves
--   - If cash < $5M, the shortfall is deferred as corp_loans debt
--   - factions.nation_id + national_hq corp_properties row flip
--   - All other corp_properties in the old nation are dissolved
--   - Open construction bids in the old nation are withdrawn
--   - Hero stats / executives / cohesion / alliance memberships
--     are preserved
--
-- Pre-existing State Run Economy nations: backfill at the bottom
-- runs _displace_corps_from_nation for each. Per the 2026-05-10
-- diagnostic, zero nations currently match, so the backfill is
-- effectively a no-op today.
--
-- Matching: policy_name ILIKE '%state apparatus%' AND option_name
-- ILIKE '%state run economy%'. Tolerates minor naming drift on
-- the policyadmin-configured option.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Schema — flag columns on factions ──────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS displaced_from_nation_id UUID
        REFERENCES public.nations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS displaced_at_tick INTEGER;

CREATE INDEX IF NOT EXISTS idx_factions_displaced
    ON public.factions(displaced_from_nation_id)
    WHERE displaced_from_nation_id IS NOT NULL;

COMMENT ON COLUMN public.factions.displaced_from_nation_id IS
    'When a nation enacts State Run Economy, every corp HQ''d there has this set to that nation_id. Cleared by relocate_corp_hq. While set, BEFORE INSERT triggers block corp actions (bids, alliances, loan requests, etc.).';
COMMENT ON COLUMN public.factions.displaced_at_tick IS
    'Tick when the corp was flagged displaced. Grace window before triggers actually fire: action-block triggers compare current_tick >= displaced_at_tick. Set to (enactment_tick + 1) by _displace_corps_from_nation to give players a 1-tick read-the-news grace window.';


-- ── 2. Helper: is nation currently under State Run Economy? ───
CREATE OR REPLACE FUNCTION _is_nation_state_run_economy(p_nation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM active_laws al
        JOIN policies p        ON p.id  = al.policy_id
        JOIN policy_options po ON po.id = al.selected_option_id
        WHERE al.nation_id = p_nation_id
          AND p.policy_name  ILIKE '%state apparatus%'
          AND po.option_name ILIKE '%state run economy%'
    );
$$;

COMMENT ON FUNCTION _is_nation_state_run_economy(UUID) IS
    'Returns TRUE iff the given nation has the State Apparatus → State Run Economy active law. ILIKE-matched on policy_name + option_name so admin-renamed options still match. Used by the displace trigger, the nation-picker filter, and the corp-creation guard.';

-- Companion helper: list every nation under State Run Economy.
-- Used by the relocation modal and the corp-creation nation picker
-- to filter out forbidden destinations in one round-trip.
CREATE OR REPLACE FUNCTION list_state_run_economy_nations()
RETURNS TABLE(nation_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT al.nation_id
    FROM active_laws al
    JOIN policies p        ON p.id  = al.policy_id
    JOIN policy_options po ON po.id = al.selected_option_id
    WHERE p.policy_name  ILIKE '%state apparatus%'
      AND po.option_name ILIKE '%state run economy%';
$$;

GRANT EXECUTE ON FUNCTION list_state_run_economy_nations() TO authenticated;


-- ── 3. Helper: flag every active corp in a nation as displaced ──
CREATE OR REPLACE FUNCTION _displace_corps_from_nation(
    p_nation_id   UUID,
    p_grace_ticks INTEGER DEFAULT 1
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tick     INTEGER;
    v_count    INTEGER := 0;
    v_corp     RECORD;
    v_nation_name TEXT;
BEGIN
    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    SELECT name INTO v_nation_name FROM nations WHERE id = p_nation_id;

    FOR v_corp IN
        SELECT id, faction_name
        FROM factions
        WHERE nation_id      = p_nation_id
          AND faction_type   = 'corporation'
          AND abandoned_at   IS NULL
          AND displaced_from_nation_id IS NULL  -- skip already-displaced (idempotent)
    LOOP
        UPDATE factions
        SET displaced_from_nation_id = p_nation_id,
            displaced_at_tick        = v_tick + p_grace_ticks
        WHERE id = v_corp.id;

        INSERT INTO event_log (
            nation_id, faction_id, event_name, description_used,
            category, trigger_key, fired_at_tick
        ) VALUES (
            p_nation_id, v_corp.id,
            'Forced Relocation Required',
            format('%s has nationalized industry under State Run Economy. %s must relocate its headquarters to another nation. A $5M relocation fee will be deducted from corporate reserves on confirmation.',
                COALESCE(v_nation_name, 'Your home nation'),
                v_corp.faction_name),
            'business',
            'corp_state_run_economy_displaced',
            v_tick
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION _displace_corps_from_nation(UUID, INTEGER) IS
    'Flags every active corp HQ''d in the given nation as displaced and posts an event_log entry for each. Idempotent (skips already-displaced corps). Returns count of newly-displaced corps. Called from the bill enactment path when State Run Economy is the new selected option, and at migration time for pre-existing SRE nations.';


-- ── 4. Hook called from bills.js after active_laws upsert ─────
CREATE OR REPLACE FUNCTION maybe_trigger_state_run_economy_exodus(
    p_nation_id UUID,
    p_policy_id UUID,
    p_option_id UUID
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_sre BOOLEAN;
BEGIN
    -- Check the freshly-upserted active_law: is the new option SRE?
    SELECT (
        p.policy_name  ILIKE '%state apparatus%'
        AND po.option_name ILIKE '%state run economy%'
    )
    INTO v_is_sre
    FROM policies p
    JOIN policy_options po ON po.policy_id = p.id
    WHERE p.id = p_policy_id AND po.id = p_option_id;

    IF NOT COALESCE(v_is_sre, FALSE) THEN
        RETURN 0;
    END IF;

    RETURN _displace_corps_from_nation(p_nation_id, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION maybe_trigger_state_run_economy_exodus(UUID, UUID, UUID) TO authenticated;

COMMENT ON FUNCTION maybe_trigger_state_run_economy_exodus(UUID, UUID, UUID) IS
    'Called from bills.js after a successful active_laws upsert. If the new option is State Apparatus → State Run Economy, displaces every corp in the nation. Returns count displaced (0 for non-SRE policies or already-displaced corps).';


-- ── 5. Action-block triggers ──────────────────────────────────
-- Centralised raise-on-displaced helper. Each per-table trigger
-- passes the corp's id (per the table's faction column) plus a
-- friendly action label for the error message.
CREATE OR REPLACE FUNCTION _raise_if_corp_displaced(
    p_corp_id     UUID,
    p_action_name TEXT
) RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_displaced UUID;
    v_at_tick   INTEGER;
    v_current   INTEGER;
BEGIN
    SELECT displaced_from_nation_id, displaced_at_tick
    INTO v_displaced, v_at_tick
    FROM factions WHERE id = p_corp_id;

    IF v_displaced IS NULL THEN RETURN; END IF;

    -- Grace window: skip the block until the grace tick is reached.
    SELECT current_tick INTO v_current FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_current := COALESCE(v_current, 0);
    IF v_at_tick IS NOT NULL AND v_current < v_at_tick THEN RETURN; END IF;

    RAISE EXCEPTION 'Corporation is displaced. % is blocked until HQ relocation is completed.', p_action_name
        USING HINT = 'Open the corp dashboard and resolve the Pressing Issue to relocate.';
END;
$$;

-- Per-table trigger wrappers. Each one reads its own faction-id
-- column (different names across tables) and invokes the helper.

CREATE OR REPLACE FUNCTION _trg_block_construction_bid_if_displaced()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM _raise_if_corp_displaced(NEW.bidder_faction_id, 'Construction bid');
    RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION _trg_block_loan_request_if_displaced()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM _raise_if_corp_displaced(NEW.requesting_faction_id, 'Loan request');
    RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION _trg_block_loan_negotiation_if_displaced()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM _raise_if_corp_displaced(NEW.borrower_faction_id, 'Loan negotiation');
    RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION _trg_block_alliance_propose_if_displaced()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM _raise_if_corp_displaced(NEW.founder_faction_id, 'Alliance proposal');
    RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION _trg_block_alliance_join_if_displaced()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    PERFORM _raise_if_corp_displaced(NEW.faction_id, 'Alliance join');
    RETURN NEW;
END $$;

-- Attach triggers (idempotent via DROP IF EXISTS).
DROP TRIGGER IF EXISTS trg_block_construction_bid_if_displaced ON public.corp_contract_bids;
CREATE TRIGGER trg_block_construction_bid_if_displaced
    BEFORE INSERT ON public.corp_contract_bids
    FOR EACH ROW EXECUTE FUNCTION _trg_block_construction_bid_if_displaced();

DROP TRIGGER IF EXISTS trg_block_loan_request_if_displaced ON public.bank_loan_requests;
CREATE TRIGGER trg_block_loan_request_if_displaced
    BEFORE INSERT ON public.bank_loan_requests
    FOR EACH ROW EXECUTE FUNCTION _trg_block_loan_request_if_displaced();

DROP TRIGGER IF EXISTS trg_block_loan_negotiation_if_displaced ON public.loan_negotiations;
CREATE TRIGGER trg_block_loan_negotiation_if_displaced
    BEFORE INSERT ON public.loan_negotiations
    FOR EACH ROW EXECUTE FUNCTION _trg_block_loan_negotiation_if_displaced();

DROP TRIGGER IF EXISTS trg_block_alliance_propose_if_displaced ON public.strategic_alliances;
CREATE TRIGGER trg_block_alliance_propose_if_displaced
    BEFORE INSERT ON public.strategic_alliances
    FOR EACH ROW EXECUTE FUNCTION _trg_block_alliance_propose_if_displaced();

DROP TRIGGER IF EXISTS trg_block_alliance_join_if_displaced ON public.alliance_members;
CREATE TRIGGER trg_block_alliance_join_if_displaced
    BEFORE INSERT ON public.alliance_members
    FOR EACH ROW EXECUTE FUNCTION _trg_block_alliance_join_if_displaced();


-- ── 6. Relocation RPC ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION relocate_corp_hq(p_new_nation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller       UUID := auth.uid();
    v_corp         factions%ROWTYPE;
    v_tick         INTEGER;
    v_cash         NUMERIC;
    v_fee          CONSTANT NUMERIC := 5000000;
    v_actual_debit NUMERIC;
    v_shortfall    NUMERIC;
    v_old_nation   UUID;
    v_new_nation_name TEXT;
    v_bids_killed  INTEGER := 0;
    v_props_killed INTEGER := 0;
BEGIN
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;

    -- Lock the corp row for the duration of the txn.
    SELECT * INTO v_corp
    FROM factions
    WHERE faction_type = 'corporation'
      AND abandoned_at IS NULL
      AND (id = v_caller OR linked_user_id = v_caller)
    FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_owned_corp');
    END IF;

    IF v_corp.displaced_from_nation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_displaced');
    END IF;
    v_old_nation := v_corp.displaced_from_nation_id;

    IF p_new_nation_id IS NULL OR p_new_nation_id = v_old_nation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_target_nation');
    END IF;

    SELECT name INTO v_new_nation_name FROM nations WHERE id = p_new_nation_id;
    IF v_new_nation_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'target_nation_not_found');
    END IF;

    IF _is_nation_state_run_economy(p_new_nation_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'target_under_state_run_economy');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- ── Fee handling ──
    -- Try to deduct $5M from cash. If short, defer the shortfall to
    -- corp_loans (so the existing debt mechanics handle paydown).
    v_cash := COALESCE(v_corp.corp_cash_reserves, 0);
    v_actual_debit := LEAST(v_cash, v_fee);
    v_shortfall    := v_fee - v_actual_debit;

    IF v_actual_debit > 0 THEN
        PERFORM emit_corp_cash_event(
            v_corp.id,
            'capital_out',
            'HQ relocation fee (' || COALESCE(v_new_nation_name, 'new nation') || ')',
            -v_actual_debit,
            v_tick
        );
    END IF;

    IF v_shortfall > 0 THEN
        UPDATE factions
        SET corp_loans = COALESCE(corp_loans, 0) + v_shortfall
        WHERE id = v_corp.id;
    END IF;

    -- ── HQ move ──
    UPDATE factions
    SET nation_id                = p_new_nation_id,
        displaced_from_nation_id = NULL,
        displaced_at_tick        = NULL
    WHERE id = v_corp.id;

    UPDATE corp_properties
    SET nation_id = p_new_nation_id
    WHERE faction_id = v_corp.id
      AND role       = 'national_hq';

    -- Dissolve all other properties in the old nation.
    WITH deleted AS (
        DELETE FROM corp_properties
        WHERE faction_id = v_corp.id
          AND nation_id  = v_old_nation
          AND role      <> 'national_hq'
        RETURNING id
    )
    SELECT COUNT(*) INTO v_props_killed FROM deleted;

    -- Withdraw open construction bids on contracts issued by the old nation.
    -- Bid state model: corp_contract_bids has 'status' column with terminal 'withdrawn'.
    WITH withdrawn AS (
        UPDATE corp_contract_bids
        SET status = 'withdrawn'
        WHERE bidder_faction_id = v_corp.id
          AND status IN ('open', 'submitted', 'pending')
          AND contract_id IN (
              SELECT id FROM corp_contracts WHERE issuer_nation_id = v_old_nation
          )
        RETURNING id
    )
    SELECT COUNT(*) INTO v_bids_killed FROM withdrawn;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, fired_at_tick
    ) VALUES (
        p_new_nation_id, v_corp.id,
        'HQ Relocated',
        format(
            '%s has completed its forced relocation. New HQ: %s. Fee paid: $%s%s. Properties dissolved: %s. Bids withdrawn: %s.',
            v_corp.faction_name,
            v_new_nation_name,
            to_char(v_actual_debit, 'FM999,999,999'),
            CASE WHEN v_shortfall > 0
                 THEN ' (with $' || to_char(v_shortfall, 'FM999,999,999') || ' deferred as debt)'
                 ELSE '' END,
            v_props_killed,
            v_bids_killed
        ),
        'business',
        'corp_hq_relocated',
        v_tick
    );

    -- Public news article tagged to the OLD nation (the one whose
    -- nationalization caused the exodus). Appears in:
    --   - World view (no nation filter applied)
    --   - Politics tab
    --   - Old nation's local news feed
    -- author_name is required NOT NULL; system-emitted articles use
    -- 'Press Wire' as the byline by convention. status='published' so
    -- it surfaces immediately (default would be 'draft').
    --
    -- Wrapped in an exception block: a failed article INSERT (RLS
    -- denial, constraint shift, etc.) MUST NOT roll back the whole
    -- relocation. The cash, HQ move, property dissolution, and bid
    -- withdrawals are already committed against the corp's state by
    -- this point. A missing news article is a UX miss, not a data
    -- integrity issue.
    BEGIN
        INSERT INTO player_articles (
            nation_id, author_faction_id, author_name,
            headline, body, category, status, published_tick
        ) VALUES (
            v_old_nation, NULL, 'Press Wire',
            v_corp.faction_name || ' relocates HQ amid State Run Economy',
            'Due to mass nationalization efforts in the economy, '
                || v_corp.faction_name
                || ' has relocated its operations to '
                || v_new_nation_name
                || '.',
            'politics', 'published', v_tick
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '[relocate_corp_hq] news article insert failed for corp %: %',
            v_corp.id, SQLERRM;
    END;

    RETURN jsonb_build_object(
        'success',         true,
        'corp_id',         v_corp.id,
        'new_nation_id',   p_new_nation_id,
        'new_nation_name', v_new_nation_name,
        'fee_paid',        v_actual_debit,
        'fee_deferred',    v_shortfall,
        'props_dissolved', v_props_killed,
        'bids_withdrawn',  v_bids_killed
    );
END;
$$;

GRANT EXECUTE ON FUNCTION relocate_corp_hq(UUID) TO authenticated;

COMMENT ON FUNCTION relocate_corp_hq(UUID) IS
    'Player-callable RPC to complete a forced HQ relocation. Validates ownership + displaced status + target nation legality, then atomically: debits $5M (or defers shortfall to corp_loans), moves nation_id + national_hq corp_properties, dissolves other properties in old nation, withdraws bids on old-nation contracts, posts event_log. Returns JSONB summary.';


-- ── 7. Backfill — flag corps in pre-existing SRE nations ──────
-- Per the 2026-05-10 diagnostic this is a no-op (0 nations match)
-- but the loop is here so future re-runs of the migration cover
-- any nations that became SRE after the mechanic shipped but
-- before this migration ran on their environment.
DO $do$
DECLARE
    v_nation_id UUID;
    v_total     INTEGER := 0;
BEGIN
    FOR v_nation_id IN
        SELECT DISTINCT al.nation_id
        FROM active_laws al
        JOIN policies p        ON p.id  = al.policy_id
        JOIN policy_options po ON po.id = al.selected_option_id
        WHERE p.policy_name  ILIKE '%state apparatus%'
          AND po.option_name ILIKE '%state run economy%'
    LOOP
        v_total := v_total + _displace_corps_from_nation(v_nation_id, 1);
    END LOOP;
    RAISE NOTICE '[StateRunEconomy backfill] displaced % corp(s) across pre-existing SRE nations', v_total;
END
$do$;

COMMIT;

NOTIFY pgrst, 'reload schema';
