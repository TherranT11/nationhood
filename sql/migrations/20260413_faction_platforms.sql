-- ══════════════════════════════════════════════════════════════
-- PARTY PLATFORMS — Phase 1: Schema, RPC, Momentum Logic
-- ══════════════════════════════════════════════════════════════

-- ──────────── FACTION PLATFORMS TABLE ────────────
-- Each faction can hold up to 3 platforms (adopted one at a time with 6-tick cooldown).
-- slot: 1, 2, or 3 — filled sequentially.

CREATE TABLE IF NOT EXISTS faction_platforms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id      UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    nation_id       UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    platform_key    TEXT NOT NULL,              -- e.g. 'economic_reform', 'social_justice'
    slot            INT NOT NULL CHECK (slot BETWEEN 1 AND 3),
    adopted_at_tick INT NOT NULL,
    baseline_stats  JSONB DEFAULT '{}'::jsonb,  -- stat snapshots at adoption: { "healthcare_quality": 50, ... }
    target_stats    JSONB DEFAULT '{}'::jsonb,  -- targets (+20): { "healthcare_quality": 70, ... }
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'fulfilled', 'failed', 'abated')),
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(faction_id, slot),                  -- one platform per slot per faction
    UNIQUE(faction_id, platform_key)           -- can't adopt the same platform twice
);

CREATE INDEX IF NOT EXISTS idx_faction_platforms_faction ON faction_platforms(faction_id);
CREATE INDEX IF NOT EXISTS idx_faction_platforms_nation ON faction_platforms(nation_id);
CREATE INDEX IF NOT EXISTS idx_faction_platforms_key ON faction_platforms(platform_key);

-- RLS
ALTER TABLE faction_platforms ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read faction_platforms" ON faction_platforms
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Writes go through the adopt_platform RPC only (SECURITY DEFINER)
-- No direct insert/update/delete policies for authenticated users.

-- ──────────── ADOPT PLATFORM RPC ────────────
-- Validates: AP cost, cooldown, slot availability, duplicate check.
-- Awards momentum to adopter, penalizes existing holders of the same platform.
--
-- Momentum rules:
--   First to adopt:  adopter gets +12
--   Second to adopt: first holder gets -6,  adopter gets +6
--   Third to adopt:  each existing holder gets -4, adopter gets +4
--   Fourth+:         each existing holder gets -2, adopter gets +2
--
-- Returns JSONB: { success, slot, momentum_gained, error }

CREATE OR REPLACE FUNCTION adopt_platform(
    p_faction_id UUID,
    p_nation_id UUID,
    p_platform_key TEXT,
    p_tick INT,
    p_baseline_stats JSONB DEFAULT '{}'::jsonb,
    p_target_stats JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ap_result INT;
    v_next_slot INT;
    v_last_adopted_tick INT;
    v_existing_count INT;
    v_existing_holder RECORD;
    v_my_momentum NUMERIC;
    v_penalty NUMERIC;
    v_cooldown_ticks INT := 6;
    v_ap_cost INT := 2;
BEGIN
    -- 1. Check if faction already has this platform
    IF EXISTS (SELECT 1 FROM faction_platforms WHERE faction_id = p_faction_id AND platform_key = p_platform_key) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You have already adopted this platform.');
    END IF;

    -- 2. Find next available slot (1, 2, or 3)
    SELECT COALESCE(MAX(slot), 0) + 1 INTO v_next_slot
    FROM faction_platforms WHERE faction_id = p_faction_id;

    IF v_next_slot > 3 THEN
        RETURN jsonb_build_object('success', false, 'error', 'All 3 platform slots are full.');
    END IF;

    -- 3. Check cooldown: last adoption must be at least 6 ticks ago
    SELECT MAX(adopted_at_tick) INTO v_last_adopted_tick
    FROM faction_platforms WHERE faction_id = p_faction_id;

    IF v_last_adopted_tick IS NOT NULL AND (p_tick - v_last_adopted_tick) < v_cooldown_ticks THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Platform cooldown active. ' || (v_cooldown_ticks - (p_tick - v_last_adopted_tick)) || ' ticks remaining.'
        );
    END IF;

    -- 4. Deduct AP
    v_ap_result := deduct_ap(p_faction_id, v_ap_cost);
    IF v_ap_result < 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not enough AP. Need ' || v_ap_cost || ' AP.');
    END IF;

    -- 5. Count existing holders of this platform in the same nation
    SELECT COUNT(*) INTO v_existing_count
    FROM faction_platforms
    WHERE nation_id = p_nation_id
      AND platform_key = p_platform_key
      AND faction_id != p_faction_id;

    -- 6. Calculate momentum for adopter
    CASE v_existing_count
        WHEN 0 THEN v_my_momentum := 12; v_penalty := 0;
        WHEN 1 THEN v_my_momentum := 6;  v_penalty := 6;
        WHEN 2 THEN v_my_momentum := 4;  v_penalty := 4;
        ELSE         v_my_momentum := 2;  v_penalty := 2;
    END CASE;

    -- 7. Penalize existing holders
    IF v_penalty > 0 THEN
        FOR v_existing_holder IN
            SELECT fp.faction_id
            FROM faction_platforms fp
            WHERE fp.nation_id = p_nation_id
              AND fp.platform_key = p_platform_key
              AND fp.faction_id != p_faction_id
        LOOP
            PERFORM adjust_momentum(
                v_existing_holder.faction_id,
                -v_penalty,
                'Platform contested: ' || p_platform_key,
                p_tick
            );
        END LOOP;
    END IF;

    -- 8. Award momentum to adopter
    PERFORM adjust_momentum(
        p_faction_id,
        v_my_momentum,
        'Platform adopted: ' || p_platform_key,
        p_tick
    );

    -- 9. Insert the platform with stat snapshots
    INSERT INTO faction_platforms (faction_id, nation_id, platform_key, slot, adopted_at_tick, baseline_stats, target_stats)
    VALUES (p_faction_id, p_nation_id, p_platform_key, v_next_slot, p_tick, p_baseline_stats, p_target_stats);

    RETURN jsonb_build_object(
        'success', true,
        'slot', v_next_slot,
        'momentum_gained', v_my_momentum,
        'existing_holders_penalized', v_existing_count,
        'penalty_per_holder', v_penalty
    );
END;
$$;

ALTER FUNCTION public.adopt_platform(UUID, UUID, TEXT, INT, JSONB, JSONB) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.adopt_platform(UUID, UUID, TEXT, INT, JSONB, JSONB) TO authenticated;
