-- 20260730_commercial_lawsuits_phase1.sql
--
-- Phase 1 of the commercial lawsuit system. Lets one corporation
-- file a civil suit against another over an existing business
-- relationship (loan / trade agreement / construction contract).
-- The case lands in the Judicial subtab on government.html for
-- Ministry of Justice review. NO ruling mechanic yet — Phase 1
-- only writes the case, charges the filing fee, and fires the
-- event_log notification. Status flips happen in Phase 2.
--
-- Naming: the existing public.lawsuits table is a separate
-- political-corruption mechanic (party-vs-government). Different
-- shape, different lifecycle, different actors. We isolate the
-- commercial path under its own table to avoid retrofit churn.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS, CREATE OR REPLACE.

BEGIN;


-- ── 1. commercial_lawsuits ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.commercial_lawsuits (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plaintiff_faction_id UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    defendant_faction_id UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    nation_id            UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    grievance_type       TEXT NOT NULL CHECK (grievance_type IN (
        'breach_of_contract','fraud','defamation',
        'predatory_terms','non_payout',
        'defective_work','cargo_loss'
    )),
    grievance_sector     TEXT CHECK (grievance_sector IN ('universal','banking','construction','shipping')),
    relief_sought        TEXT NOT NULL CHECK (relief_sought IN (
        'payment','specific_performance','contract_voidance','asset_seizure'
    )),
    relationship_ref     JSONB,
    status               TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','reviewing','upheld','dismissed','settled','withdrawn')),
    filing_fee           BIGINT NOT NULL DEFAULT 2000000,
    filed_at_tick        INT NOT NULL,
    closed_at_tick       INT,
    ruling               JSONB,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (plaintiff_faction_id <> defendant_faction_id)
);
CREATE INDEX IF NOT EXISTS idx_clawsuits_nation_status ON public.commercial_lawsuits (nation_id, status);
CREATE INDEX IF NOT EXISTS idx_clawsuits_plaintiff    ON public.commercial_lawsuits (plaintiff_faction_id);
CREATE INDEX IF NOT EXISTS idx_clawsuits_defendant    ON public.commercial_lawsuits (defendant_faction_id);

ALTER TABLE public.commercial_lawsuits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
         WHERE schemaname = 'public'
           AND tablename  = 'commercial_lawsuits'
           AND policyname = 'commercial_lawsuits_read_all'
    ) THEN
        -- Public record per the modal footer. Anyone authenticated can
        -- read; writes are RPC-only (SECURITY DEFINER).
        CREATE POLICY "commercial_lawsuits_read_all"
            ON public.commercial_lawsuits FOR SELECT TO authenticated USING (true);
    END IF;
END $$;


-- ── 2. file_commercial_lawsuit RPC ───────────────────────────────
-- Validates ownership + party non-equality + sector/grievance match,
-- charges the $2M filing fee via emit_corp_cash_event (SSoT), inserts
-- the lawsuit row, and emits the public-facing event_log entry that
-- the Judicial subtab + nation news both surface.
--
-- relationship_ref shape (client-provided JSONB):
--   { "kind": "loan"|"trade"|"construction", "id": "<uuid>", "snapshot": {...} }
-- Phase 1 verifies the referenced row exists and involves both parties.
-- Snapshot text is preserved verbatim for the case detail view; we
-- don't trust it for matching, only for display.
CREATE OR REPLACE FUNCTION file_commercial_lawsuit(
    p_plaintiff_id     UUID,
    p_defendant_id     UUID,
    p_grievance_type   TEXT,
    p_grievance_sector TEXT,
    p_relief_sought    TEXT,
    p_relationship_ref JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user        UUID := auth.uid();
    v_plaintiff   factions%ROWTYPE;
    v_defendant   factions%ROWTYPE;
    v_filing_fee  CONSTANT BIGINT := 2000000;
    v_tick        INT;
    v_lawsuit_id  UUID;
    v_rel_kind    TEXT;
    v_rel_id      UUID;
    v_rel_ok      BOOLEAN := false;
    v_grievance_label TEXT;
    v_description TEXT;
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

    -- Sector × grievance compatibility. Universal grievances apply
    -- everywhere; sector-specific ones require a matching defendant.
    IF p_grievance_sector = 'banking'      AND v_defendant.corp_sector <> 'Finance'      THEN
        RETURN jsonb_build_object('success', false, 'error', 'Banking grievances require a Finance defendant');
    END IF;
    IF p_grievance_sector = 'construction' AND v_defendant.corp_sector <> 'Construction' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Construction grievances require a Construction defendant');
    END IF;
    IF p_grievance_sector = 'shipping'     AND v_defendant.corp_sector <> 'Shipping'     THEN
        RETURN jsonb_build_object('success', false, 'error', 'Shipping grievances require a Shipping defendant');
    END IF;

    -- Relationship existence check. Phase 1 looks up the referenced row
    -- and verifies it involves both parties. Snapshot fields aren't
    -- re-validated — the modal pinned them at filing time and the case
    -- detail UI displays them as-is.
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
    ELSIF v_rel_kind = 'construction' THEN
        SELECT TRUE INTO v_rel_ok FROM corp_contracts
         WHERE id = v_rel_id
           AND ((issuer_faction_id = p_plaintiff_id) OR (issuer_faction_id = p_defendant_id));
    ELSIF v_rel_kind = 'trade' THEN
        SELECT TRUE INTO v_rel_ok FROM trade_agreements
         WHERE id = v_rel_id;
    ELSE
        RETURN jsonb_build_object('success', false, 'error', format('Unknown relationship kind: %s', v_rel_kind));
    END IF;

    IF NOT COALESCE(v_rel_ok, false) THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active relationship found between the parties');
    END IF;

    -- Cash check. Filing fee is fixed at $2M per the design spec.
    IF COALESCE(v_plaintiff.corp_cash_reserves, 0) < v_filing_fee THEN
        RETURN jsonb_build_object('success', false,
            'error', format('Insufficient cash for $%s filing fee', to_char(v_filing_fee, 'FM999,999,999')));
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    -- Charge the filing fee through the SSoT helper.
    PERFORM emit_corp_cash_event(
        p_plaintiff_id, 'capital_out', 'Lawsuit filing fee', -v_filing_fee, v_tick
    );

    INSERT INTO commercial_lawsuits (
        plaintiff_faction_id, defendant_faction_id, nation_id,
        grievance_type, grievance_sector, relief_sought,
        relationship_ref, filing_fee, filed_at_tick
    ) VALUES (
        p_plaintiff_id, p_defendant_id, v_plaintiff.nation_id,
        p_grievance_type, p_grievance_sector, p_relief_sought,
        p_relationship_ref, v_filing_fee, v_tick
    ) RETURNING id INTO v_lawsuit_id;

    -- Human-readable grievance label for the public notification.
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

    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        effects_applied, fired_at_tick
    ) VALUES (
        v_plaintiff.nation_id, p_plaintiff_id,
        'Lawsuit Filed: ' || v_grievance_label,
        v_description,
        'legal',
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


COMMIT;

NOTIFY pgrst, 'reload schema';
