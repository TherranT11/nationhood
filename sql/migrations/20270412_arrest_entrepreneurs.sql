-- ════════════════════════════════════════════════════════════════════
-- ADMIN / MODERATION: ARREST ENTREPRENEURS  (Joaquín Carrasco, Alejandro Aguilar)
-- ════════════════════════════════════════════════════════════════════
-- Marks the two entrepreneur factions with status='arrested' and HARD-LOCKS
-- them out of every economic action: found / close a corporation, buy /
-- sell shares, trade, invest, bid, borrow, board votes, shipping, aircraft,
-- buildings, sale offers — anything that costs money or touches a corp.
--
-- WHY TRIGGERS (not RPC edits):
--   ~92 SECURITY DEFINER RPCs each resolve the caller's entrepreneur the
--   same way ( faction_type='entrepreneur' AND (id=auth.uid() OR
--   linked_user_id=auth.uid()) ). There is no shared guard. Editing all 92
--   is fragile, so we enforce with BEFORE triggers — the same idiom the
--   repo already uses for enforce_entrepreneur_nation_lock(). A trigger
--   fires INSIDE every RPC, no matter how many exist.
--
-- WHY auth.uid() IS THE RIGHT GATE:
--   auth.uid() still returns the END USER even inside a SECURITY DEFINER
--   RPC (it reads the request JWT), but is NULL for the system world-tick
--   (service role) and for admin SQL. So we block ONLY player-initiated
--   actions: the arrested player's businesses keep ticking, and an admin
--   can still un-arrest them (see ROLLBACK).
--
-- SCOPING: the lock is tied to the ENTREPRENEUR faction only. If either of
--   these users also runs a Political Party or Military Branch, those are
--   different faction rows (different faction_type) and are NOT affected.
--
-- Idempotent. Transactional.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. status column ────────────────────────────────────────────────
ALTER TABLE public.factions
    ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

COMMENT ON COLUMN public.factions.status IS
    'Lifecycle / moderation status. ''active'' (default) or ''arrested'' '
    '(hard-locked out of actions by block_arrested_entrepreneur_action / '
    '_funds triggers). Free text so future statuses can be added.';

-- ── 2. caller-based guard: blocks the arrested entrepreneur''s own writes ──
CREATE OR REPLACE FUNCTION public.block_arrested_entrepreneur_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
BEGIN
    -- System world-tick / admin SQL have no JWT -> never blocked, so the
    -- arrested player's corps keep operating and admins can still act.
    IF v_uid IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    IF EXISTS (
        SELECT 1
          FROM public.factions f
         WHERE f.faction_type = 'entrepreneur'
           AND f.status = 'arrested'
           AND (f.id = v_uid OR f.linked_user_id = v_uid)
    ) THEN
        RAISE EXCEPTION
            'ENTREPRENEUR_ARRESTED: this entrepreneur is under arrest and cannot take economic actions (found/close a corporation, buy/sell shares, trade, invest, bid, borrow, etc.).'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.block_arrested_entrepreneur_action() IS
    'BEFORE INS/UPD/DEL guard for entrepreneur action tables. Raises if the '
    'CALLER (auth.uid()) owns an entrepreneur faction with status=''arrested''. '
    'Bypasses when auth.uid() IS NULL (system tick / admin), so businesses '
    'keep ticking and admins can un-arrest. Fires inside every RPC.';

-- ── 3. row-scoped money guard on the entrepreneur''s own faction row ──
-- Catch-all for "etc.": every paid entrepreneur action moves the founder''s
-- factions.party_funds. Scoped to the ARRESTED ENTREPRENEUR row + a real
-- funds change + the owning user, so it never touches their party/military
-- factions and never blocks benign session updates (e.g. last_seen_tick).
CREATE OR REPLACE FUNCTION public.block_arrested_entrepreneur_funds()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid uuid := auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        RETURN NEW;  -- tick / admin
    END IF;

    IF OLD.faction_type = 'entrepreneur'
       AND OLD.status = 'arrested'
       AND (OLD.id = v_uid OR OLD.linked_user_id = v_uid)
       AND NEW.party_funds IS DISTINCT FROM OLD.party_funds
    THEN
        RAISE EXCEPTION
            'ENTREPRENEUR_ARRESTED: this entrepreneur is under arrest and cannot move funds.'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.block_arrested_entrepreneur_funds() IS
    'BEFORE UPDATE guard on factions: blocks the arrested entrepreneur from '
    'moving its own party_funds (the money chokepoint behind every paid '
    'action). Row-scoped to the entrepreneur faction; ignores their other '
    'factions and non-funds updates; bypasses system tick / admin.';

DROP TRIGGER IF EXISTS trg_block_arrested_ent_funds ON public.factions;
CREATE TRIGGER trg_block_arrested_ent_funds
    BEFORE UPDATE ON public.factions
    FOR EACH ROW
    EXECUTE FUNCTION public.block_arrested_entrepreneur_funds();

-- ── 4. attach the action guard to every entrepreneur / corp action table ──
-- to_regclass() skips any table that doesn't exist on this DB, so the
-- migration is safe across shards / schema drift.
DO $$
DECLARE
    t   text;
    tbls text[] := ARRAY[
        'entrepreneur_corps','corp_shareholdings','corp_ownership',
        'corp_sale_offers','corp_acquisitions','corp_investment_offers',
        'corp_loans','corp_loan_offers','corp_loan_requests',
        'corp_buildings','building_offers','corp_executives',
        'corp_board_seats','corp_board_requests','corp_board_request_pool',
        'corp_board_request_votes','corp_no_confidence_motions',
        'corp_no_confidence_votes','corp_contracts','corp_contract_bids',
        'corp_tax_bills','corp_production_runs','corp_production_run_plants',
        'corp_aircraft','corp_aircraft_designs','corp_airline_terminals',
        'shipping_routes','shipping_contracts','shipping_contract_bids',
        'shipping_applications','shipping_claims',
        'aircraft_rfps','aircraft_rfp_bids',
        'ent_aircraft_designs','ent_aircraft_orders',
        'ent_aircraft_rfps','ent_aircraft_rfp_bids'
    ];
BEGIN
    FOREACH t IN ARRAY tbls LOOP
        IF to_regclass('public.' || t) IS NOT NULL THEN
            EXECUTE format(
                'DROP TRIGGER IF EXISTS trg_block_arrested_ent ON public.%I', t);
            EXECUTE format(
                'CREATE TRIGGER trg_block_arrested_ent '
                'BEFORE INSERT OR UPDATE OR DELETE ON public.%I '
                'FOR EACH ROW EXECUTE FUNCTION public.block_arrested_entrepreneur_action()', t);
        END IF;
    END LOOP;
END $$;

-- ── 5. mark the two entrepreneurs as arrested ────────────────────────
-- Accent-tolerant: 'Joaqu_n' matches both "Joaquin" and "Joaquín".
-- Scoped to active entrepreneur factions only.
DO $$
DECLARE
    v_count int;
    r       record;
BEGIN
    UPDATE public.factions
       SET status = 'arrested'
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (
              (leader_first_name ILIKE 'Joaqu_n' AND leader_last_name ILIKE 'Carrasco')
           OR (leader_first_name ILIKE 'Alejandro' AND leader_last_name ILIKE 'Aguilar')
       );
    GET DIAGNOSTICS v_count = ROW_COUNT;

    RAISE NOTICE 'Arrested % entrepreneur faction(s):', v_count;
    FOR r IN
        SELECT id, leader_first_name, leader_last_name, faction_name
          FROM public.factions
         WHERE faction_type = 'entrepreneur' AND status = 'arrested'
    LOOP
        RAISE NOTICE '  • % % (%) — id=%',
            r.leader_first_name, r.leader_last_name, r.faction_name, r.id;
    END LOOP;

    IF v_count <> 2 THEN
        RAISE WARNING
            'Expected to arrest 2 entrepreneurs but matched %. Review the names above before relying on this lock.', v_count;
    END IF;
END $$;

COMMIT;

-- ════════════════════════════════════════════════════════════════════
-- ROLLBACK — release the arrest and remove the lock entirely
-- ════════════════════════════════════════════════════════════════════
-- BEGIN;
--   -- release just these two (keeps the machinery in place for future use):
--   UPDATE public.factions SET status = 'active'
--    WHERE faction_type = 'entrepreneur' AND status = 'arrested'
--      AND (   (leader_first_name ILIKE 'Joaqu_n'  AND leader_last_name ILIKE 'Carrasco')
--           OR (leader_first_name ILIKE 'Alejandro' AND leader_last_name ILIKE 'Aguilar') );
--
--   -- OR fully tear down the mechanism:
--   -- DO $$ DECLARE t text; tbls text[] := ARRAY[ ...same list as above... ];
--   -- BEGIN FOREACH t IN ARRAY tbls LOOP
--   --   IF to_regclass('public.'||t) IS NOT NULL THEN
--   --     EXECUTE format('DROP TRIGGER IF EXISTS trg_block_arrested_ent ON public.%I', t);
--   --   END IF; END LOOP; END $$;
--   -- DROP TRIGGER IF EXISTS trg_block_arrested_ent_funds ON public.factions;
--   -- DROP FUNCTION IF EXISTS public.block_arrested_entrepreneur_action();
--   -- DROP FUNCTION IF EXISTS public.block_arrested_entrepreneur_funds();
--   -- ALTER TABLE public.factions DROP COLUMN IF EXISTS status;
-- COMMIT;
