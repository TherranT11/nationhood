-- ============================================================
-- SEED: nation_profiles for Vostia, Sierramar, and Hajjara
--
-- Upserts the editable lore / encyclopedia content shown on
-- nation-info.html (and the "Nation" subtab on nation.html) for
-- three previously under-documented nations.
--
-- Safe to re-run: ON CONFLICT (nation_id) DO UPDATE refreshes
-- the content in place without duplicating rows.
--
-- Strings use dollar-quoting ($p$ ... $p$) to avoid any apostrophe
-- escaping issues with the long overview paragraphs and the JSON
-- history timelines.
-- ============================================================

-- ==================== VOSTIA ====================

INSERT INTO nation_profiles (
    nation_id, flag_url, overview, motto,
    history_timeline,
    official_name, demonym, languages, religion, currency_name,
    founded_year, national_anthem, national_animal, national_flower,
    geographic_region, climate, area_sq_km, coastline_km,
    natural_resources, major_industries, major_exports, major_imports,
    calling_code, internet_tld, drives_on
)
SELECT n.id,
    'assets/flags/Vostia.png',
    $p$Vostia is a mountainous parliamentary democracy on the western edge of the Meridian continent, forged over five centuries of empire, resistance, and reconstruction. Steep limestone ranges cut the country into fiercely independent valleys, each with its own dialect, saint's day, and memory of siege. The capital, Ostavar, sprawls along the banks of the Morova River and anchors a heavy-industry corridor that still employs a third of the working population. Copper, zinc, and lignite drive exports, but bureaucratic inertia, stubborn corruption, and steady emigration of young professionals weigh on a country that insists, always, that it is about to turn the corner. Vostians take fierce pride in their Orthodox heritage, their unbroken line of folk polyphony, and a literary tradition (equal parts epic, elegy, and complaint) that predates most of the continent's written record.$p$,
    $p$Sloboda i Čast - Freedom and Honor$p$,
    $p$[
        {"year": "1389", "event": "Battle of Kosmar Field; Vostian principalities crushed by the Harran Sultanate, beginning four centuries of subjugation."},
        {"year": "1804", "event": "First Vostian Uprising; peasant levies expel Harran garrisons from the northern valleys."},
        {"year": "1878", "event": "Treaty of Berva grants full independence; Principality of Vostia proclaimed."},
        {"year": "1918", "event": "Kingdom of Vostia enlarged at end of the Great Continental War; absorbs the Ostavar Basin and coastal strip."},
        {"year": "1941", "event": "Occupation by the Harran-led coalition; partisan resistance movement takes root in the highlands."},
        {"year": "1945", "event": "Socialist Federal Republic of Vostia established under Marshal Blažov."},
        {"year": "1991", "event": "Federation fractures; rump Vostia emerges after a decade of civil conflict."},
        {"year": "2003", "event": "New constitution adopted; parliamentary republic with 260-seat Skupština."},
        {"year": "2018", "event": "Meridian Accord accession talks stall over judicial reform; mass emigration accelerates."},
        {"year": "2024", "event": "Current political era; coalition governments contend with demographic decline and chronic graft."}
    ]$p$::jsonb,
    'Republic of Vostia',
    'Vostian',
    'Vostian (official), Meridian Common, Harran minority',
    $p$Vostian Orthodox (68%), Catholic (9%), Harran-rite minority (7%), irreligious (16%)$p$,
    'Vostian Dinar (VSD)',
    '1878',
    $p$Bože Pravde Vostije (God of Justice of Vostia)$p$,
    'Golden Eagle',
    $p$Plavi Karanfil (Blue Carnation)$p$,
    $p$Western Meridian - the Zavorje mountain belt and its narrow coastal plain$p$,
    'Continental interior; maritime influence along the 180 km coastline; cold snowy winters in the highlands',
    '88,500',
    '180',
    'Copper, zinc, lead, lignite coal, timber, hydroelectric potential, antimony',
    'Heavy industry, mining, arms manufacturing, agriculture, textiles, hydroelectric generation',
    'Copper cathode, processed metals, small arms, plums and plum brandy, timber',
    'Crude oil, natural gas, electronics, passenger vehicles, pharmaceuticals',
    '+381',
    '.vo',
    'right'
FROM nations n
WHERE LOWER(n.name) = 'vostia'
ON CONFLICT (nation_id) DO UPDATE SET
    flag_url          = EXCLUDED.flag_url,
    overview          = EXCLUDED.overview,
    motto             = EXCLUDED.motto,
    history_timeline  = EXCLUDED.history_timeline,
    official_name     = EXCLUDED.official_name,
    demonym           = EXCLUDED.demonym,
    languages         = EXCLUDED.languages,
    religion          = EXCLUDED.religion,
    currency_name     = EXCLUDED.currency_name,
    founded_year      = EXCLUDED.founded_year,
    national_anthem   = EXCLUDED.national_anthem,
    national_animal   = EXCLUDED.national_animal,
    national_flower   = EXCLUDED.national_flower,
    geographic_region = EXCLUDED.geographic_region,
    climate           = EXCLUDED.climate,
    area_sq_km        = EXCLUDED.area_sq_km,
    coastline_km      = EXCLUDED.coastline_km,
    natural_resources = EXCLUDED.natural_resources,
    major_industries  = EXCLUDED.major_industries,
    major_exports     = EXCLUDED.major_exports,
    major_imports     = EXCLUDED.major_imports,
    calling_code      = EXCLUDED.calling_code,
    internet_tld      = EXCLUDED.internet_tld,
    drives_on         = EXCLUDED.drives_on;

-- ==================== SIERRAMAR ====================

INSERT INTO nation_profiles (
    nation_id, flag_url, overview, motto,
    history_timeline,
    official_name, demonym, languages, religion, currency_name,
    founded_year, national_anthem, national_animal, national_flower,
    geographic_region, climate, area_sq_km, coastline_km,
    natural_resources, major_industries, major_exports, major_imports,
    calling_code, internet_tld, drives_on
)
SELECT n.id,
    'assets/flags/Sierramar.png',
    $p$Sierramar is a small but spirited island democracy in the northeastern reaches of the Crucera continent, shaped by colonial legacy, volcanic geography, and the restless ambition of its young population. The capital, Porto Serrano, wraps around a natural deepwater harbor where fishing fleets share dock space with container ships from across the Sierramari Channel, one of the busiest transit lanes in the region. Inland, the Sierra del Mar rises almost vertically from the coast, creating microclimates that support coffee and tropical fruit in the highlands and sugarcane in the lowland flats. Solvarist faith anchors daily life through festivals, family obligation, and a calendar of saint's days older than the Republic itself, while a rising generation pushes hard for modernization, better jobs, and relief from the annual hurricane season. Emigration drains talent, graft tests patience, and weather tests everything else, but Sierramari resilience is a point of national pride, worn on the sleeve and sung in every chorus of the anthem.$p$,
    $p$Mar, Monte, y Mañana - Sea, Mountain, and Tomorrow$p$,
    $p$[
        {"year": "1498", "event": "First contact; Seravian navigators chart the island's leeward coast."},
        {"year": "1573", "event": "Fortaleza de San Serrano built at the mouth of the harbor; permanent settlement begins."},
        {"year": "1687", "event": "Sugar economy takes root; enslaved labor imported from across the Crucera basin."},
        {"year": "1830", "event": "Abolition decree; plantation oligarchy restructures into wage-labor estates."},
        {"year": "1887", "event": "Autonomy Charter granted; Sierramar becomes a self-governing commonwealth."},
        {"year": "1901", "event": "Full independence proclaimed; Parliamentary Republic of Sierramar established."},
        {"year": "1948", "event": "Modern fishing fleet commissioned; Porto Serrano becomes a regional shipping hub."},
        {"year": "1979", "event": "Hurricane Celeste devastates the east coast; international aid reshapes coastal infrastructure."},
        {"year": "2004", "event": "New electoral law adopts proportional representation; multiparty era begins."},
        {"year": "2022", "event": "Current political era; coalition governments juggle tourism, emigration, and climate pressure."}
    ]$p$::jsonb,
    'Parliamentary Republic of Sierramar',
    'Sierramari',
    'Estrellan (official), Sierramari Creole',
    'Solvarist (84%), Protestant minorities (9%), irreligious (7%)',
    'Serrano Real (SRR)',
    '1901',
    $p$Canto del Mar (Song of the Sea)$p$,
    'Frigatebird',
    $p$Hibisco del Monte (Mountain Hibiscus)$p$,
    'Northeastern Crucera, volcanic island in the Sierramari Channel',
    'Tropical maritime; wet season April to October; hurricane risk August to November',
    '4,216',
    '640',
    'Fish stocks, volcanic soil, freshwater rivers, timber, minor bauxite deposits, tidal energy potential',
    'Tourism, commercial fishing, port services, light agriculture, rum and spirits production, coffee',
    'Fish and seafood, rum, coffee, tropical fruit, port transit fees, handcrafted goods',
    'Petroleum products, rice and grains, machinery, passenger vehicles, pharmaceuticals, electronics',
    '+787',
    '.sm',
    'right'
FROM nations n
WHERE LOWER(n.name) = 'sierramar'
ON CONFLICT (nation_id) DO UPDATE SET
    flag_url          = EXCLUDED.flag_url,
    overview          = EXCLUDED.overview,
    motto             = EXCLUDED.motto,
    history_timeline  = EXCLUDED.history_timeline,
    official_name     = EXCLUDED.official_name,
    demonym           = EXCLUDED.demonym,
    languages         = EXCLUDED.languages,
    religion          = EXCLUDED.religion,
    currency_name     = EXCLUDED.currency_name,
    founded_year      = EXCLUDED.founded_year,
    national_anthem   = EXCLUDED.national_anthem,
    national_animal   = EXCLUDED.national_animal,
    national_flower   = EXCLUDED.national_flower,
    geographic_region = EXCLUDED.geographic_region,
    climate           = EXCLUDED.climate,
    area_sq_km        = EXCLUDED.area_sq_km,
    coastline_km      = EXCLUDED.coastline_km,
    natural_resources = EXCLUDED.natural_resources,
    major_industries  = EXCLUDED.major_industries,
    major_exports     = EXCLUDED.major_exports,
    major_imports     = EXCLUDED.major_imports,
    calling_code      = EXCLUDED.calling_code,
    internet_tld      = EXCLUDED.internet_tld,
    drives_on         = EXCLUDED.drives_on;

-- ==================== HAJJARA ====================

INSERT INTO nation_profiles (
    nation_id, flag_url, overview, motto,
    history_timeline,
    official_name, demonym, languages, religion, currency_name,
    founded_year, national_anthem, national_animal, national_flower,
    geographic_region, climate, area_sq_km, coastline_km,
    natural_resources, major_industries, major_exports, major_imports,
    calling_code, internet_tld, drives_on
)
SELECT n.id,
    'assets/flags/Hajjara.png',
    $p$Hajjara is a vast desert kingdom on the Al-Makir continent, ruled for three centuries by the House of Hajjar, an absolute monarchy whose legitimacy rests on Solvaric-era conquest, tribal alliance, and custodianship of the great pilgrimage city of Al-Makir al-Kubra. Beneath its sand seas lie some of the richest proven hydrocarbon reserves on the continent, and state oil revenue funds everything from lavish infrastructure to a sprawling welfare-and-stipend apparatus that binds the population to the throne. The Hajjar National Front, the king's party, holds a commanding majority in an advisory parliament; organized opposition exists but operates inside carefully drawn red lines. Society is young, growing, and deeply devout, with daily life ordered around the prayer calendar and the long Al-Ardin festival season. A rising generation of foreign-educated Hajjaris presses, cautiously, for economic diversification, women's labor participation, and a less arbitrary justice system, while the crown balances modernization against the clerical establishment and the tribal confederations that made the kingdom possible.$p$,
    $p$Al-Mulk lillah, wa al-Watan lil-Hajjar - Sovereignty to the Divine, the Nation to Hajjar$p$,
    $p$[
        {"year": "1517", "event": "Pilgrimage city of Al-Makir al-Kubra falls to the Harran Sultanate; begins three centuries of distant suzerainty."},
        {"year": "1745", "event": "Pact of the Two Wells; Sheikh Hajjar ibn Sulaiman forges the tribal confederation that will become the kingdom."},
        {"year": "1818", "event": "First Hajjari campaign crushed by Harran expeditionary forces; House of Hajjar retreats to the Az-Zamil interior."},
        {"year": "1902", "event": "Second Hajjari campaign succeeds; Al-Tayyir captured and proclaimed capital; Emirate of Hajjara founded."},
        {"year": "1932", "event": "Kingdom of Hajjara formally established; first written constitution recognizes the king's absolute authority under divine mandate."},
        {"year": "1938", "event": "First major oil strike at the Az-Zaharan field; economy pivots toward hydrocarbon export."},
        {"year": "1973", "event": "Oil embargo era; state revenues surge; modernization programs launched across education and infrastructure."},
        {"year": "1991", "event": "Consultative Council (Majlis al-Ardin) seated; limited electoral politics introduced under crown oversight."},
        {"year": "2015", "event": "Vision 2045 diversification plan announced; sovereign wealth fund expanded beyond petroleum assets."},
        {"year": "2024", "event": "Current political era; reformist pressure, regional rivalries, and oil-price volatility test the kingdom."}
    ]$p$::jsonb,
    'Kingdom of Hajjara',
    'Hajjari',
    'Hajjari Arabic (official), Classical Ardani, Meridian Common (commercial)',
    $p$Al-Ardin (official state religion, dominant Ilmi tradition), Atfal minority, expatriate Solvarist communities$p$,
    'Hajjari Riyal (HJR)',
    '1932',
    $p$Nashid al-Malik (Anthem of the King)$p$,
    'Hajjari Oryx',
    'Desert Rose (Adenium)',
    'Al-Makir continent, vast arid plateau with sand seas and a narrow coastal plain on the Gulf of Ardan',
    'Hot desert; scorching dry summers, mild winters; rare highland rainfall in the southwest',
    '2,149,690',
    '2,640',
    'Crude oil, natural gas, phosphates, gypsum, gold, uranium deposits, solar irradiance',
    'Petroleum extraction and refining, petrochemicals, construction, pilgrimage tourism, sovereign finance, desalination',
    'Crude oil, refined petroleum, natural gas, petrochemicals, phosphate fertilizer, dates',
    'Machinery, passenger vehicles, foodstuffs, electronics, pharmaceuticals, textiles',
    '+966',
    '.hj',
    'right'
FROM nations n
WHERE LOWER(n.name) = 'hajjara'
ON CONFLICT (nation_id) DO UPDATE SET
    flag_url          = EXCLUDED.flag_url,
    overview          = EXCLUDED.overview,
    motto             = EXCLUDED.motto,
    history_timeline  = EXCLUDED.history_timeline,
    official_name     = EXCLUDED.official_name,
    demonym           = EXCLUDED.demonym,
    languages         = EXCLUDED.languages,
    religion          = EXCLUDED.religion,
    currency_name     = EXCLUDED.currency_name,
    founded_year      = EXCLUDED.founded_year,
    national_anthem   = EXCLUDED.national_anthem,
    national_animal   = EXCLUDED.national_animal,
    national_flower   = EXCLUDED.national_flower,
    geographic_region = EXCLUDED.geographic_region,
    climate           = EXCLUDED.climate,
    area_sq_km        = EXCLUDED.area_sq_km,
    coastline_km      = EXCLUDED.coastline_km,
    natural_resources = EXCLUDED.natural_resources,
    major_industries  = EXCLUDED.major_industries,
    major_exports     = EXCLUDED.major_exports,
    major_imports     = EXCLUDED.major_imports,
    calling_code      = EXCLUDED.calling_code,
    internet_tld      = EXCLUDED.internet_tld,
    drives_on         = EXCLUDED.drives_on;

-- ==================== VERIFY ====================
SELECT n.name, p.official_name, p.motto, LENGTH(p.overview) AS overview_chars,
       jsonb_array_length(p.history_timeline) AS timeline_entries
FROM nations n
JOIN nation_profiles p ON p.nation_id = n.id
WHERE LOWER(n.name) IN ('vostia', 'sierramar', 'hajjara')
ORDER BY n.name;
