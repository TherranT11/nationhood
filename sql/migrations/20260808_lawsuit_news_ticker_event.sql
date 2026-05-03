-- 20260808_lawsuit_news_ticker_event.sql
--
-- Surface "X has filed a lawsuit against Y for Z" in the corporate
-- news ticker on every nation in the shard. The Phase 1 RPC already
-- inserted an event_log row, but with category='legal' and into the
-- description_used column. The news ticker (js/news.js loadTickerEvents)
-- queries `event_log` filtered to category='corporate' and reads
-- `description_chosen`, so the lawsuit event was a silent no-op.
--
-- This migration re-publishes file_commercial_lawsuit unchanged except
-- for the event_log INSERT: category 'legal' → 'corporate' and the
-- description goes into description_chosen instead of description_used
-- (matches the convention used by every newer event-emitting RPC —
-- snap election, statements, monarchy seat grants, incidents, etc.).
--
-- Idempotent CREATE OR REPLACE. Function body otherwise unchanged from
-- 20260730_commercial_lawsuits_phase1.

BEGIN;

CREATE OR REPLACE FUNCTION file_commercial_lawsuit(
    p_plaintiff_id     UUID,
    p_defendant_id     UUID,
    p_grievance_type   TEXT,
    p_grievance_sector TEXT,                -- accepted but not trusted; sector is derived server-side
    p_relief_sought    TEXT,
    p_relationship_ref JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user             UUID := auth.uid();
    v_plaintiff        factions%ROWTYPE;
    v_defendant        factions%ROWTYPE;
    v_filing_fee       CONSTANT BIGINT := 2000000;
    v_tick             INT;
    v_lawsuit_id       UUID;
    v_rel_kind         TEXT;
    v_rel_id           UUID;
    v_rel_ok           BOOLEAN := false;
    v_canonical_sector TEXT;
    v_grievance_label  TEXT;
    v_description      TEXT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    IF p_plaintiff_id = p_defendant_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot sue yourself');
    END IF;

    SELECT * INTO v_plaintiff FROM factions WHERE id = p_plaintiff_id FOR UPDATE;
    IF v_plaintiff.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Plaintiff not found');
    END IF;
    IF v_plaintiff.faction_type <> 'corporation' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Plaintiff must be a corporation');
    END IF;
    IF v_plaintiff.id <> v_user
       AND COALESCE(v_plaintiff.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;

    SELECT * INTO v_defendant FROM factions WHERE id = p_defendant_id;
    IF v_defendant.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Defendant not found');
    END IF;
    IF v_defendant.faction_type <> 'corporation' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Defendant must be a corporation');
    END IF;

    v_canonical_sector := CASE p_grievance_type
        WHEN 'breach_of_contract' THEN 'universal'
        WHEN 'fraud'              THEN 'universal'
        WHEN 'defamation'         THEN 'universal'
        WHEN 'predatory_terms'    THEN 'banking'
        WHEN 'non_payout'         THEN 'banking'
        WHEN 'defective_work'     THEN 'construction'
        WHEN 'cargo_loss'         THEN 'shipping'
        ELSE NULL
    END;
    IF v_canonical_sector IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', format('Unknown grievance: %s', p_grievance_type));
    END IF;

    IF v_canonical_sector = 'banking'      AND v_defendant.corp_sector <> 'Finance'      THEN
        RETURN jsonb_build_object('success', false, 'error', 'Banking grievances require a Finance defendant');
    END IF;
    IF v_canonical_sector = 'construction' AND v_defendant.corp_sector <> 'Construction' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Construction grievances require a Construction defendant');
    END IF;
    IF v_canonical_sector = 'shipping'     AND v_defendant.corp_sector <> 'Shipping'     THEN
        RETURN jsonb_build_object('success', false, 'error', 'Shipping grievances require a Shipping defendant');
    END IF;

    v_rel_kind := p_relationship_ref->>'kind';
    BEGIN
        v_rel_id := (p_relationship_ref->>'id')::uuid;
    EXCEPTION WHEN others THEN
        v_rel_id := NULL;
    END;

    IF v_rel_kind IS NULL OR v_rel_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Missing relationship reference');
    END IF;

    IF v_rel_kind = 'loan' THEN
        SELECT TRUE INTO v_rel_ok FROM bank_loans
         WHERE id = v_rel_id
           AND ((borrower_faction_id = p_plaintiff_id AND lender_faction_id   = p_defendant_id)
             OR (lender_faction_id   = p_plaintiff_id AND borrower_faction_id = p_defendant_id));
    ELSE
        RETURN jsonb_build_object('success', false,
            'error', format('Phase 1 only supports loan-based suits (got: %s)', v_rel_kind));
    END IF;

    IF NOT COALESCE(v_rel_ok, false) THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active relationship found between the parties');
    END IF;

    IF COALESCE(v_plaintiff.corp_cash_reserves, 0) < v_filing_fee THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient cash for $%s filing fee', to_char(v_filing_fee, 'FM999,999,999')));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    PERFORM emit_corp_cash_event(
        p_plaintiff_id, 'capital_out', 'Lawsuit filing fee', -v_filing_fee, v_tick
    );

    INSERT INTO commercial_lawsuits (
        plaintiff_faction_id, defendant_faction_id, nation_id,
        grievance_type, grievance_sector, relief_sought,
        relationship_ref, filing_fee, filed_at_tick
    ) VALUES (
        p_plaintiff_id, p_defendant_id, v_plaintiff.nation_id,
        p_grievance_type, v_canonical_sector, p_relief_sought,
        p_relationship_ref, v_filing_fee, v_tick
    ) RETURNING id INTO v_lawsuit_id;

    v_grievance_label := CASE p_grievance_type
        WHEN 'breach_of_contract' THEN 'Breach of Contract'
        WHEN 'fraud'              THEN 'Fraud'
        WHEN 'defamation'         THEN 'Defamation'
        WHEN 'predatory_terms'    THEN 'Predatory Terms'
        WHEN 'non_payout'         THEN 'Non-Payout'
        WHEN 'defective_work'     THEN 'Defective Work'
        WHEN 'cargo_loss'         THEN 'Cargo Loss'
        ELSE p_grievance_type
    END;

    v_description := COALESCE(v_plaintiff.faction_name, 'A corporation')
                  || ' has filed a lawsuit for ' || v_grievance_label
                  || ' against ' || COALESCE(v_defendant.faction_name, 'another corporation')
                  || '. Ministry of Justice reviewing the case now.';

    -- category='corporate' so the news ticker (which filters on that
    -- category) picks it up; description_chosen so the ticker's SELECT
    -- of that column actually returns text. Both changes vs. Phase 1.
    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_chosen,
        category, trigger_key,
        effects_applied, fired_at_tick
    ) VALUES (
        v_plaintiff.nation_id, p_plaintiff_id,
        'Lawsuit Filed: ' || v_grievance_label,
        v_description,
        'corporate',
        'lawsuit_filed',
        jsonb_build_object(
            'lawsuit_id',          v_lawsuit_id,
            'plaintiff_faction_id', p_plaintiff_id,
            'defendant_faction_id', p_defendant_id,
            'grievance_type',      p_grievance_type,
            'relief_sought',       p_relief_sought,
            'filing_fee',          v_filing_fee
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',     true,
        'lawsuit_id',  v_lawsuit_id,
        'filing_fee',  v_filing_fee,
        'description', v_description
    );
END;
$$;

GRANT EXECUTE ON FUNCTION file_commercial_lawsuit(UUID, UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- Backfill: lawsuits filed before this migration landed in event_log
-- with category='legal' and description_used. Promote them to the
-- corporate ticker schema so the existing HHC v SUS suit (and any
-- others filed during Phase 1) actually surface in the news feed.
UPDATE event_log
   SET category          = 'corporate',
       description_chosen = COALESCE(description_chosen, description_used)
 WHERE trigger_key = 'lawsuit_filed'
   AND (category = 'legal' OR description_chosen IS NULL);

COMMIT;

NOTIFY pgrst, 'reload schema';
