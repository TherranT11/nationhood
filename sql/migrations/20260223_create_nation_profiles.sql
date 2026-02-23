-- ==================== NATION PROFILES TABLE ====================
-- Stores editable lore content for each nation's encyclopedia page.
-- Each nation has one profile row containing flavour text, history
-- timeline, flag URL, and sidebar metadata fields.
--
-- Designed for upsert via Supabase client:
--   _supabase.from('nation_profiles').upsert({ nation_id, ... })
--
-- Run this migration once against the Supabase database.
-- ================================================================

-- ==================== TABLE ====================

CREATE TABLE IF NOT EXISTS nation_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id           UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,

    -- Flag / banner image
    flag_url            TEXT,                           -- URL to flag image (e.g. assets/flags/sanestrella.png)

    -- Overview / flavour text
    overview            TEXT,                           -- Rich-text overview (rendered as HTML or plain textarea)
    motto               TEXT,                           -- National motto

    -- History timeline: array of { year, event } objects
    -- Example: [{"year":"1821","event":"Independence declared"},{"year":"1965","event":"Civil war ends"}]
    history_timeline    JSONB DEFAULT '[]'::jsonb,

    -- Sidebar lore fields
    official_name       TEXT,                           -- Full official name (e.g. "Republic of San Estrella")
    demonym             TEXT,                           -- What citizens are called (e.g. "Estrellan")
    languages           TEXT,                           -- Official / common languages
    religion            TEXT,                           -- Dominant religion(s)
    currency_name       TEXT,                           -- In-game currency name (e.g. "Estrellan Peso")
    founded_year        TEXT,                           -- Year of founding / independence
    national_anthem     TEXT,                           -- Name of the anthem
    national_animal     TEXT,                           -- Symbolic animal
    national_flower     TEXT,                           -- Symbolic flower / plant
    geographic_region   TEXT,                           -- Region description (e.g. "Caribbean archipelago")
    climate             TEXT,                           -- Climate description
    area_sq_km          TEXT,                           -- Land area (stored as text for display flexibility)
    coastline_km        TEXT,                           -- Coastline length
    natural_resources   TEXT,                           -- Key natural resources
    major_industries    TEXT,                           -- Key industries
    major_exports       TEXT,                           -- Primary exports
    major_imports       TEXT,                           -- Primary imports
    calling_code        TEXT,                           -- Phone calling code
    internet_tld        TEXT,                           -- Top-level domain
    drives_on           TEXT,                           -- 'left' or 'right'

    -- Metadata
    updated_by          UUID REFERENCES auth.users(id), -- Last user who edited
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),

    -- One profile per nation
    CONSTRAINT uq_nation_profiles_nation UNIQUE (nation_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nation_profiles_nation ON nation_profiles(nation_id);

-- ==================== UPDATED_AT TRIGGER ====================

CREATE OR REPLACE FUNCTION update_nation_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nation_profiles_updated_at ON nation_profiles;
CREATE TRIGGER trg_nation_profiles_updated_at
    BEFORE UPDATE ON nation_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_nation_profiles_updated_at();

-- ==================== RLS POLICIES ====================
-- Everyone can read profiles. Authenticated users can insert/update.

ALTER TABLE nation_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: anyone can read
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'nation_profiles' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all"
            ON nation_profiles FOR SELECT
            USING (true);
    END IF;
END $$;

-- INSERT: authenticated users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'nation_profiles' AND policyname = 'Allow insert for authenticated'
    ) THEN
        CREATE POLICY "Allow insert for authenticated"
            ON nation_profiles FOR INSERT
            WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- UPDATE: authenticated users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'nation_profiles' AND policyname = 'Allow update for authenticated'
    ) THEN
        CREATE POLICY "Allow update for authenticated"
            ON nation_profiles FOR UPDATE
            USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- DELETE: authenticated users (admin cleanup only)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'nation_profiles' AND policyname = 'Allow delete for authenticated'
    ) THEN
        CREATE POLICY "Allow delete for authenticated"
            ON nation_profiles FOR DELETE
            USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- ==================== SEED DATA: SAN ESTRELLA ====================
-- Default profile for San Estrella so the page renders immediately.

INSERT INTO nation_profiles (
    nation_id,
    flag_url,
    overview,
    motto,
    history_timeline,
    official_name,
    demonym,
    languages,
    religion,
    currency_name,
    founded_year,
    national_anthem,
    national_animal,
    national_flower,
    geographic_region,
    climate,
    area_sq_km,
    coastline_km,
    natural_resources,
    major_industries,
    major_exports,
    major_imports,
    calling_code,
    internet_tld,
    drives_on
)
SELECT
    n.id,
    'assets/flags/sanestrella.png',
    'San Estrella is a sun-drenched presidential republic spread across a chain of volcanic islands in the southern tropics. Once a colonial backwater, it won independence through a prolonged guerrilla campaign and has since oscillated between populist strongmen and fragile democratic coalitions. Its economy depends heavily on sugar cane, nickel mining, and a growing tourism sector, though chronic debt and infrastructure gaps keep prosperity unevenly distributed. The Estrellan people are known for their vibrant music, street festivals, and fierce civic pride.',
    'Luz y Libertad — Light and Liberty',
    '[
        {"year": "1621", "event": "Colonial settlement established by the Seravian Empire on Isla Mayor."},
        {"year": "1798", "event": "Sugar boom begins; plantation economy dominates the archipelago."},
        {"year": "1821", "event": "Failed independence uprising; leaders executed by colonial authorities."},
        {"year": "1889", "event": "Second independence war begins in the mountain provinces."},
        {"year": "1903", "event": "Treaty of Puerto Claro grants sovereignty; Republic of San Estrella proclaimed."},
        {"year": "1932", "event": "General Montoya seizes power in a military coup; authoritarian era begins."},
        {"year": "1965", "event": "Student-led revolution restores civilian government."},
        {"year": "1978", "event": "New constitution adopted; presidential republic with bicameral legislature."},
        {"year": "1994", "event": "Nickel deposits discovered on Isla Roja; mining boom reshapes economy."},
        {"year": "2011", "event": "Devastating hurricane season; international aid and rebuilding reshape infrastructure."},
        {"year": "2023", "event": "Current political era begins with contested elections and coalition politics."}
    ]'::jsonb,
    'Republic of San Estrella',
    'Estrellan',
    'Spanish (official), Estrellano Creole',
    'Roman Catholicism (majority), Santeria, Protestant minorities',
    'Estrellan Peso (E$)',
    '1903',
    'Amanecer Dorado (Golden Dawn)',
    'Scarlet Macaw',
    'Flor de Fuego (Fire Lily)',
    'Southern tropical archipelago — volcanic island chain',
    'Tropical maritime; wet season May–November, hurricane risk Aug–Oct',
    '48,200',
    '1,830',
    'Nickel, cobalt, sugar cane, tropical hardwoods, offshore fisheries',
    'Mining, sugar refining, tourism, light manufacturing, rum distillation',
    'Nickel ore, refined sugar, rum, tropical fruit, handicrafts',
    'Petroleum products, machinery, vehicles, pharmaceuticals, electronics',
    '+58',
    '.se',
    'right'
FROM nations n
WHERE LOWER(n.name) = 'san estrella'
ON CONFLICT (nation_id) DO NOTHING;
