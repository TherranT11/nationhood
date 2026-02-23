-- ============================================================
-- Nation Profiles — editable lore / description content
-- ============================================================

CREATE TABLE IF NOT EXISTS nation_profiles (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nation_id       UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    flag_image_url  TEXT,
    demonym         TEXT,
    motto           TEXT,
    anthem          TEXT,
    founded_text    TEXT,
    currency_name   TEXT,
    languages       TEXT,
    religion        TEXT,
    calling_code    TEXT,
    driving_side    TEXT DEFAULT 'Right',
    region          TEXT,
    area_text       TEXT,
    coastline_text  TEXT,
    borders_text    TEXT,
    terrain_text    TEXT,
    climate_text    TEXT,
    overview_text   TEXT,
    history_entries JSONB DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT nation_profiles_nation_id_key UNIQUE (nation_id)
);

-- RLS
ALTER TABLE nation_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read nation profiles"
    ON nation_profiles FOR SELECT
    USING (true);

CREATE POLICY "Faction members can update their nation profile"
    ON nation_profiles FOR UPDATE
    USING (
        nation_id IN (
            SELECT f.nation_id FROM factions f WHERE f.id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can insert nation profiles"
    ON nation_profiles FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Seed default profile for San Estrella
INSERT INTO nation_profiles (
    nation_id, demonym, motto, anthem, founded_text, currency_name,
    languages, religion, calling_code, driving_side, region,
    area_text, coastline_text, borders_text, terrain_text, climate_text,
    overview_text, history_entries
)
SELECT
    id,
    'Estrellan',
    '"Por la tierra y su gente" — For the land and its people',
    'Himno de las Estrellas',
    'Independence: March 14, 1847',
    'Estrellan Peso (₱)',
    'Spanish (official), Estrellano Creole (regional)',
    'Mixed — Catholic 42%, Evangelical 18%, Secular 31%, Other 9%',
    '+58',
    'Right',
    'Southern Coast',
    '187,400 km²',
    '640 km',
    'Montequilla (north), Sangreza (east)',
    'Coastal lowlands, central plateau, western highlands',
    'Tropical maritime, hurricane season June–November',
    'San Estrella is a presidential republic located on the southern coast of Crucera, bordered by Montequilla to the north and Sangreza to the east. With a modest economy and moderate political stability, it maintains one of the lowest crime rates in the region while facing mounting debt pressures and rising inflation.

President Isabela Montoya, elected on an anti-corruption platform, governs through a coalition between her Partido Estrella Libre and the smaller Alianza Democrática. Bureaucratic efficiency has deteriorated, while healthcare quality and accessibility continue to decline. The country''s press freedom remains the highest among the five nations, a rare bright spot in an otherwise strained governance landscape.',
    '[
        {"year": "1847", "event": "Independence from colonial rule following the Estrellan War of Liberation"},
        {"year": "1847–1890", "event": "First Republic — unstable period of military coups and short-lived governments"},
        {"year": "1891", "event": "Constitution of Porto Estrella established the modern presidential system"},
        {"year": "1920–1952", "event": "The Banana Republic era — foreign agricultural companies dominated the economy"},
        {"year": "1953", "event": "Nationalist revolution expelled foreign landowners, redistributed farmland"},
        {"year": "1970s", "event": "Brief economic boom from coffee and sugar exports"},
        {"year": "1982–1994", "event": "The Lost Decade — debt crisis, hyperinflation, structural adjustment"},
        {"year": "2001", "event": "President Isabela Montoya elected on anti-corruption platform"},
        {"year": "2003", "event": "Present day — debt crisis looming, inflation rising, healthcare declining"}
    ]'::jsonb
FROM nations
WHERE name = 'San Estrella'
ON CONFLICT (nation_id) DO NOTHING;
