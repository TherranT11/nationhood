-- ============================================================
-- Add continent column to nations + alpha_tester_codes table
-- ============================================================

-- ── 1. Continent column on nations ──
ALTER TABLE nations ADD COLUMN IF NOT EXISTS continent TEXT DEFAULT NULL;

-- ── 2. Set existing nations to Crucera ──
UPDATE nations SET continent = 'Crucera'
WHERE LOWER(name) IN ('avelia','sangreza','san estrella','montequilla','melizea','palvera');

-- ── 3. Alpha Tester Codes table ──
CREATE TABLE IF NOT EXISTS alpha_tester_codes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        TEXT NOT NULL UNIQUE,
    nation_id   UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    used_by     UUID REFERENCES auth.users(id),
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT code_uppercase CHECK (code = UPPER(code))
);

CREATE INDEX IF NOT EXISTS idx_alpha_codes_nation ON alpha_tester_codes(nation_id);
CREATE INDEX IF NOT EXISTS idx_alpha_codes_code ON alpha_tester_codes(code);

-- RLS: anyone can check codes, but only unused ones are actionable
ALTER TABLE alpha_tester_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'alpha_tester_codes' AND policyname = 'Allow select for authenticated'
    ) THEN
        CREATE POLICY "Allow select for authenticated"
            ON alpha_tester_codes FOR SELECT
            USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'alpha_tester_codes' AND policyname = 'Allow update for authenticated'
    ) THEN
        CREATE POLICY "Allow update for authenticated"
            ON alpha_tester_codes FOR UPDATE
            USING (auth.role() = 'authenticated');
    END IF;
END $$;
