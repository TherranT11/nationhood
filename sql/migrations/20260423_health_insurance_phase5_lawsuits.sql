-- ════════════════════════════════════════════════════════════════════════════════
-- Health Insurance — Phase 5: Lawsuits + delayed damages
--
-- When a player denies (or negotiates) a claim and the lawsuit roll in
-- resolve_health_insurance_claim comes up true, a row is written here with
-- a resolution_tick 3–6 ticks in the future and damages pre-computed at
-- 2–4× the original claim amount plus a reputation hit of −5 to −10.
--
-- processHealthInsuranceLawsuits (in advance-corp-tick) scans for
-- resolution_tick <= current_tick each corp tick, applies the damages, flips
-- status to 'resolved', and writes a news-feed entry.
--
-- Damages are pinned at filing time so late-ruling edge cases can't
-- retroactively change the amount based on drifted stats (rep, inflation).
--
-- Idempotent. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS health_insurance_lawsuits (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id             UUID NOT NULL REFERENCES health_insurance_claims(id) ON DELETE CASCADE,
    faction_id           UUID NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
    nation_id            UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    pool_id              UUID NOT NULL REFERENCES health_insurance_pools(id) ON DELETE CASCADE,

    -- Pre-computed at filing time so drift between filing and resolution
    -- can't retroactively cheapen a verdict. damages_multiplier is kept
    -- separately from damages_amount so the UI can display "Jury 3.2×"
    -- without back-computing it.
    damages_amount       BIGINT NOT NULL,
    damages_multiplier   NUMERIC(4,2) NOT NULL,      -- 2.00 – 4.00
    reputation_damage    INT NOT NULL,               -- negative; −5 to −10

    -- Lifecycle. resolution_tick is when the verdict hits; resolved_at_tick
    -- is when the processor actually ran it (equal on a healthy tick, later
    -- if the processor fell behind).
    status               TEXT NOT NULL DEFAULT 'pending',
    resolution_tick      INT NOT NULL,
    resolved_at_tick     INT,

    -- Flavor — the citizen whose claim triggered the suit (denormalised so
    -- the news-feed event doesn't need a join and survives a claim delete
    -- ... except that claim delete CASCADEs to the lawsuit anyway).
    citizen_name         TEXT NOT NULL,

    created_at           TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE health_insurance_lawsuits
        ADD CONSTRAINT health_insurance_lawsuits_status_check
        CHECK (status IN ('pending', 'resolved', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Lookup index for the tick processor: find ripe lawsuits per nation.
CREATE INDEX IF NOT EXISTS idx_health_insurance_lawsuits_pending_nation_resolution
    ON health_insurance_lawsuits (nation_id, resolution_tick)
    WHERE status = 'pending';

-- Lookup index for the UI panel: find a corp's pending lawsuits.
CREATE INDEX IF NOT EXISTS idx_health_insurance_lawsuits_pending_faction
    ON health_insurance_lawsuits (faction_id)
    WHERE status = 'pending';

COMMENT ON TABLE health_insurance_lawsuits IS
    'Delayed damages events filed when a player denies or negotiates a claim and the lawsuit roll in resolve_health_insurance_claim hits. Resolved by processHealthInsuranceLawsuits each corp tick.';

-- ────────────────────────────────────────────────────────────────────────────────
-- RLS — SELECT-only from the client (same pattern as pools + claims). Service
-- role bypasses for the tick processor; the resolve RPC below is SECURITY
-- DEFINER and inserts new rows on behalf of the caller.
-- ────────────────────────────────────────────────────────────────────────────────
ALTER TABLE health_insurance_lawsuits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Anyone can read health_insurance_lawsuits"
        ON health_insurance_lawsuits
        FOR SELECT
        USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════════════════════
-- RPC: resolve_health_insurance_claim (UPDATED from Phase 4)
--
-- Same flow as Phase 4, but when the lawsuit die comes up true we now
-- INSERT a health_insurance_lawsuits row atomically — damages amount +
-- reputation damage + resolution tick are all pinned at decision time.
-- ════════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION resolve_health_insurance_claim(
    p_claim_id UUID,
    p_decision TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id            UUID;
    v_claim              health_insurance_claims%ROWTYPE;
    v_faction            factions%ROWTYPE;
    v_current_tick       INT;
    v_cash_delta         BIGINT := 0;
    v_rep_delta          INT := 0;
    v_new_cash           BIGINT;
    v_new_rep            INT;
    v_lawsuit_pending    BOOLEAN := false;
    v_lawsuit_chance     NUMERIC;
    v_damages_multiplier NUMERIC;
    v_damages_amount     BIGINT;
    v_damages_rep        INT;
    v_resolution_tick    INT;
BEGIN
    -- ── Auth ──
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- ── Decision validation ──
    IF p_decision NOT IN ('pay', 'deny', 'negotiate') THEN
        RAISE EXCEPTION 'Invalid decision: %. Must be pay/deny/negotiate.', p_decision;
    END IF;

    -- ── Lock the claim ──
    SELECT * INTO v_claim
    FROM health_insurance_claims
    WHERE id = p_claim_id
      AND status = 'pending'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Claim not found or already resolved';
    END IF;

    -- ── Ownership gate ──
    SELECT * INTO v_faction FROM factions WHERE id = v_claim.faction_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Faction not found';
    END IF;
    IF v_faction.id <> v_user_id
       AND COALESCE(v_faction.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user_id THEN
        RAISE EXCEPTION 'You do not own this faction';
    END IF;

    -- ── Current tick ──
    SELECT COALESCE(current_tick, 0) INTO v_current_tick
    FROM shard WHERE name = 'Alpha Shard';

    -- ── Compute deltas + lawsuit roll per decision ──
    v_lawsuit_chance := GREATEST(0, (100 - COALESCE(v_faction.corp_reputation, 65))) / 200.0;

    IF p_decision = 'pay' THEN
        v_cash_delta := -v_claim.claim_amount;
        v_rep_delta  := 1;
    ELSIF p_decision = 'negotiate' THEN
        v_cash_delta := -CEIL(v_claim.claim_amount / 2.0);
        v_rep_delta  := 0;
        IF random() < v_lawsuit_chance / 2.0 THEN
            v_lawsuit_pending := true;
        END IF;
    ELSE -- deny
        v_cash_delta := 0;
        v_rep_delta  := -3;
        IF random() < v_lawsuit_chance THEN
            v_lawsuit_pending := true;
        END IF;
    END IF;

    -- ── Apply cash + reputation ──
    v_new_cash := COALESCE(v_faction.corp_cash_reserves, 0) + v_cash_delta;
    v_new_rep  := GREATEST(0, LEAST(100, COALESCE(v_faction.corp_reputation, 65) + v_rep_delta));

    UPDATE factions
       SET corp_cash_reserves = v_new_cash,
           corp_reputation    = v_new_rep
     WHERE id = v_faction.id;

    -- ── Resolve the claim ──
    UPDATE health_insurance_claims
       SET status           = p_decision,
           resolved_at_tick = v_current_tick,
           cash_delta       = v_cash_delta,
           reputation_delta = v_rep_delta,
           lawsuit_pending  = v_lawsuit_pending
     WHERE id = p_claim_id;

    -- ── Phase 5: file the lawsuit atomically ──
    -- Pinned at decision time: multiplier 2.0-4.0×, rep damage −5 to −10,
    -- resolution tick 3-6 ticks out. processHealthInsuranceLawsuits will
    -- apply the verdict at resolution_tick.
    IF v_lawsuit_pending THEN
        v_damages_multiplier := 2.0 + random() * 2.0;                -- [2.0, 4.0)
        v_damages_amount     := CEIL(v_claim.claim_amount * v_damages_multiplier);
        v_damages_rep        := -(5 + FLOOR(random() * 6)::INT);     -- −5 .. −10
        v_resolution_tick    := v_current_tick + 3 + FLOOR(random() * 4)::INT; -- +3 .. +6

        INSERT INTO health_insurance_lawsuits (
            claim_id, faction_id, nation_id, pool_id,
            damages_amount, damages_multiplier, reputation_damage,
            resolution_tick, citizen_name
        ) VALUES (
            v_claim.id, v_claim.faction_id, v_claim.nation_id, v_claim.pool_id,
            v_damages_amount, ROUND(v_damages_multiplier, 2), v_damages_rep,
            v_resolution_tick, v_claim.citizen_name
        );
    END IF;

    RETURN jsonb_build_object(
        'success',          true,
        'decision',         p_decision,
        'cash_delta',       v_cash_delta,
        'reputation_delta', v_rep_delta,
        'new_reputation',   v_new_rep,
        'lawsuit_pending',  v_lawsuit_pending
    );
END;
$$;

GRANT EXECUTE ON FUNCTION resolve_health_insurance_claim(UUID, TEXT) TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════════
-- VERIFY
-- ════════════════════════════════════════════════════════════════════════════════
SELECT 'health_insurance_lawsuits' AS table_name, COUNT(*) AS rows
  FROM health_insurance_lawsuits;
