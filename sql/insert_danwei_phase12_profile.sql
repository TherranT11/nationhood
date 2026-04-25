-- ============================================================
-- Danwei nation_profiles — Phase 12 of new-nation walkthrough
-- ============================================================
-- Lore, flag URL, and sidebar metadata. Run AFTER insert_danwei.sql
-- (Phase 2) so the nations row exists for the FK lookup. Idempotent —
-- ON CONFLICT (nation_id) DO NOTHING matches the Calveth seed.
--
-- Cultural inspiration: Taiwan. Lore-anchored to Faresia continent:
--   - Zharan (not-China) is a large agrarian traditionalist state, NOT
--     communist — so the typical Taiwan / mainland-civil-war framing
--     doesn't apply.
--   - Fusan (not-Japan) is a People's Republic. It launched a failed
--     maritime invasion of Danwei in 1976; the invasion is the
--     defining modern moment in Danweian history.
-- ============================================================

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
    'assets/flags/Danwei.png',
    'The Republic of Danwei is a high-tech island nation off the eastern coast of Faresia. A presidential republic with deep democratic traditions, Danwei combines a heavily globalist, export-driven economy with one of the most advanced digital infrastructures in the world. Its capital, Danwei City, anchors a dense urban corridor of semiconductor fabs, financial centers, and university campuses. The republic faces real challenges — an aging population, near-total dependence on imported energy, and persistent geopolitical pressure from the People''s Republic of Fusan — yet its people are known for civic engagement, entrepreneurial drive, and quiet resilience. Danweian society blends Zulindao folk tradition with cosmopolitan urbanism, and its press freedoms and judicial independence rank among the highest on the continent.',
    'Endure and Innovate',
    '[
        {"year": "1811", "event": "Founding Charter of Danwei City establishes the Republic along the eastern Faresian archipelago."},
        {"year": "1862", "event": "Constitutional reforms expand suffrage and codify the presidential system; Danwei City confirmed as capital."},
        {"year": "1903", "event": "Pacific Trade Compact opens the island ports to Meridian shipping; early manufacturing base takes root."},
        {"year": "1947", "event": "Universal suffrage extended to women following the Coastal Reform Movement."},
        {"year": "1976", "event": "Fusan Invasion — the People''s Republic of Fusan launches a maritime assault on Danwei''s northern coast; repelled after seventy-three days, cementing modern Danweian sovereignty."},
        {"year": "1984", "event": "Post-invasion industrial miracle; the National Semiconductor Consortium founded with state and private capital."},
        {"year": "1996", "event": "First fully direct presidential election under the Modern Republic Reforms; press freedoms expanded."},
        {"year": "2008", "event": "Danwei becomes a world leader in advanced chip fabrication; export economy enters a sustained surplus."},
        {"year": "2019", "event": "Digital Infrastructure Act establishes near-universal broadband and the National Cyber Defense Authority."},
        {"year": "2026", "event": "Caretaker administration of Han Kuo-yu installed pending the first scheduled direct presidential election."}
    ]'::jsonb,
    'Republic of Danwei',
    'Danweian',
    'Danweian (official), Meridian',
    'Zulindao (plurality), Secular, folk-tradition minorities',
    'Danweian Yuan (D¥)',
    '1811',
    'March of the Free Republic',
    'Danweian Black Bear',
    'Plum Blossom',
    'Island archipelago off the eastern Faresian coast — central mountain range, narrow coastal plains, dense urban corridors',
    'Subtropical maritime; humid summers, mild winters, frequent typhoons',
    '36,200',
    '1,580',
    'Marine fisheries, forest reserves, geothermal potential, limited mineral deposits, freshwater reservoirs',
    'Semiconductors, electronics manufacturing, precision engineering, shipping, financial services',
    'Integrated circuits, electronic components, precision machinery, refined chemicals, optical instruments',
    'Crude oil, natural gas, raw materials, agricultural goods, transportation equipment',
    '+88',
    '.dw',
    'right'
FROM nations n
WHERE LOWER(n.name) = 'danwei'
ON CONFLICT (nation_id) DO NOTHING;

-- Verify: dump the profile row's lore + sidebar surface for sanity check.
SELECT n.name,
       p.official_name, p.demonym, p.languages, p.religion, p.currency_name,
       p.founded_year, p.motto, p.national_animal, p.national_flower,
       p.area_sq_km, p.coastline_km, p.calling_code, p.internet_tld, p.drives_on,
       jsonb_array_length(p.history_timeline) AS timeline_events
  FROM nation_profiles p
  JOIN nations n ON n.id = p.nation_id
 WHERE LOWER(n.name) = 'danwei';
