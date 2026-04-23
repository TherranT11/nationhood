-- ════════════════════════════════════════════════════════════════════════════════
-- Health Insurance — Phase 3: Pricing + Coverage tiers
--
-- Two player-selectable tiers per pool drive premium price and market
-- attractiveness:
--
--   premium_tier   → 'budget' (0.7×) / 'standard' (1.0×) / 'premium' (1.5×)
--   coverage_tier  → 'basic' (0.6×) / 'standard' (1.0×) / 'comprehensive' (1.5×)
--
--   attractiveness = (coverage_mult / premium_mult) × (reputation / 65)
--   your_share     = clamp(0.1, 1.0, attractiveness)
--   target         = min(addressable × your_share, capacity × 50)
--
-- Coverage tier is attractiveness-only in Phase 3. Phase 4 will make it
-- drive claim payout size, which is where Budget+Comprehensive (the
-- customer's best deal) becomes a trap for the corp.
--
-- Idempotent. Safe to re-run.
-- ════════════════════════════════════════════════════════════════════════════════

-- 1. New columns on the pool table, with CHECK constraints as a second line
--    of defence behind the RPC's validation.
ALTER TABLE health_insurance_pools
    ADD COLUMN IF NOT EXISTS premium_tier  TEXT NOT NULL DEFAULT 'standard',
    ADD COLUMN IF NOT EXISTS coverage_tier TEXT NOT NULL DEFAULT 'standard';

DO $$ BEGIN
    ALTER TABLE health_insurance_pools
        ADD CONSTRAINT health_insurance_pools_premium_tier_check
        CHECK (premium_tier IN ('budget', 'standard', 'premium'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE health_insurance_pools
        ADD CONSTRAINT health_insurance_pools_coverage_tier_check
        CHECK (coverage_tier IN ('basic', 'standard', 'comprehensive'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN health_insurance_pools.premium_tier IS
    'budget (0.7x) / standard (1.0x) / premium (1.5x) — multiplier applied to base premium by processHealthInsurancePools.';
COMMENT ON COLUMN health_insurance_pools.coverage_tier IS
    'basic (0.6x) / standard (1.0x) / comprehensive (1.5x) — multiplier feeding the attractiveness formula (and claim payout size in Phase 4).';

-- 2. RPC to set tiers. Ownership + subsector + office-in-nation all checked
--    server-side. Upserts the pool row — a corp may want to pre-set tiers on
--    a just-built office before the first tick has created the pool.
CREATE OR REPLACE FUNCTION set_health_insurance_tiers(
    p_faction_id   UUID,
    p_nation_id    UUID,
    p_premium_tier TEXT,
    p_coverage_tier TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id      UUID;
    v_faction      factions%ROWTYPE;
    v_office_count INT;
BEGIN
    -- ── Auth ──
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- ── Tier validation (CHECK constraints also enforce, but fail earlier here) ──
    IF p_premium_tier NOT IN ('budget', 'standard', 'premium') THEN
        RAISE EXCEPTION 'Invalid premium_tier: %. Must be budget/standard/premium.', p_premium_tier;
    END IF;
    IF p_coverage_tier NOT IN ('basic', 'standard', 'comprehensive') THEN
        RAISE EXCEPTION 'Invalid coverage_tier: %. Must be basic/standard/comprehensive.', p_coverage_tier;
    END IF;

    -- ── Ownership gate ──
    -- Legacy model: factions.id = user.id. Multi-faction model:
    -- factions.linked_user_id = user.id. Matches the pattern in
    -- declare_corp_bankruptcy_rpc.sql.
    SELECT * INTO v_faction FROM factions WHERE id = p_faction_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Faction not found';
    END IF;
    IF v_faction.id <> v_user_id
       AND COALESCE(v_faction.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user_id THEN
        RAISE EXCEPTION 'You do not own this faction';
    END IF;

    -- ── Subsector gate ──
    IF LOWER(COALESCE(v_faction.corp_subsector, '')) <> 'insurance' THEN
        RAISE EXCEPTION 'Only Insurance subsector corporations can set health insurance tiers';
    END IF;

    -- ── Office-in-nation gate ──
    -- Prevent creating pool rows for nations where this corp has no
    -- Insurance Office presence (would let a malicious client pre-seed
    -- pools and game the processor later).
    SELECT COUNT(*) INTO v_office_count
    FROM corp_properties
    WHERE faction_id = p_faction_id
      AND nation_id  = p_nation_id
      AND type       = 'insurance_office'
      AND is_active  = true;

    IF v_office_count = 0 THEN
        RAISE EXCEPTION 'No active Insurance Office in this nation for this corporation';
    END IF;

    -- ── Upsert ──
    INSERT INTO health_insurance_pools (faction_id, nation_id, premium_tier, coverage_tier)
    VALUES (p_faction_id, p_nation_id, p_premium_tier, p_coverage_tier)
    ON CONFLICT (faction_id, nation_id) DO UPDATE
       SET premium_tier  = EXCLUDED.premium_tier,
           coverage_tier = EXCLUDED.coverage_tier;

    RETURN jsonb_build_object(
        'success',       true,
        'premium_tier',  p_premium_tier,
        'coverage_tier', p_coverage_tier
    );
END;
$$;

GRANT EXECUTE ON FUNCTION set_health_insurance_tiers(UUID, UUID, TEXT, TEXT) TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════════
-- VERIFY
-- ════════════════════════════════════════════════════════════════════════════════
SELECT column_name, data_type, column_default
  FROM information_schema.columns
 WHERE table_name = 'health_insurance_pools'
   AND column_name IN ('premium_tier', 'coverage_tier');

SELECT proname, pg_get_function_arguments(oid) AS args
  FROM pg_proc
 WHERE proname = 'set_health_insurance_tiers';
