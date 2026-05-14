-- ════════════════════════════════════════════════════════════════
-- Backfill: stat_effects on policy_options that shipped empty.
--
-- The multi-option refactor (20260428) moved stat_effects from the
-- policies row down onto each policy_options row. Most options were
-- backfilled at the same time, but ~42 were left with empty / NULL
-- arrays, so their law cards on government.html → Laws subtab show
-- no stat-modifier chips. The renderer at government.html:3286 is
-- correct — it just has nothing to render.
--
-- This migration writes a sensible stat_effects array for every
-- empty option, drafted from the option's own description. Each
-- policy is treated as a gradient (e.g. Income Tax: No Income Tax
-- → Heavy Taxation) so options at one end of an ideology read as
-- mirrors of options at the other end. Rates land in the 0.1–1.0
-- range that the UI already renders cleanly for existing options
-- like Right-to-Work (see migration 20260313_batch_policies_part7
-- _labor for the canonical shape).
--
-- Every UPDATE is guarded:
--   WHERE id = '<option-id>' AND (stat_effects = '[]'::jsonb OR
--                                 stat_effects IS NULL)
-- so re-running the migration after manual edits is safe — only
-- still-empty rows get touched.
--
-- Stat-key vocabulary used here comes from
-- js/game/stats.js → NATION_STAT_COLUMNS (the canonical 25-stat
-- alpha schema):
--   gdp, gdp_growth, debt, immigration, standard_of_living,
--   cost_of_living, budget, state_apparatus, unrest,
--   public_approval, crown_authority, energy, health, education,
--   global_image, infrastructure, industry, farmland,
--   service_sector, unskilled_workers, skilled_workers, wages,
--   income_tax, corporate_tax, crime, corruption, inequality.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────── LABOR / Income Tax Policy ────────
-- Sample drafted in chat first; pattern then mirrored across the
-- other 8 policies in this migration.

-- No Income Tax
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"income_tax",      "direction":"down","rate":1.0, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",      "direction":"up",  "rate":0.4, "delay_ticks":3, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"immigration",     "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",      "direction":"up",  "rate":0.6, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"budget",          "direction":"down","rate":0.8, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"education",       "direction":"down","rate":0.3, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"health",          "direction":"down","rate":0.3, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '5ef87ea2-4956-44c6-ba49-ddaebe3e9902' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Flat Low Tax
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"income_tax",      "direction":"down","rate":0.5, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",      "direction":"up",  "rate":0.2, "delay_ticks":3, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",      "direction":"up",  "rate":0.3, "delay_ticks":2, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval", "direction":"up",  "rate":0.1, "delay_ticks":2, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"budget",          "direction":"down","rate":0.3, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = 'bf35ddfd-d3de-49df-84ef-3e6dc4b3939e' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Progressive Taxation
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"income_tax",      "direction":"up",  "rate":0.3, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"budget",          "direction":"up",  "rate":0.4, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",      "direction":"down","rate":0.2, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval", "direction":"up",  "rate":0.2, "delay_ticks":2, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"education",       "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"health",          "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = 'f2881ff0-7985-48de-9fff-492b0aed1a58' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Steeply Progressive
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"income_tax",      "direction":"up",  "rate":0.6, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"budget",          "direction":"up",  "rate":0.6, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",      "direction":"down","rate":0.5, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"immigration",     "direction":"down","rate":0.3, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",      "direction":"down","rate":0.2, "delay_ticks":3, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"education",       "direction":"up",  "rate":0.3, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"health",          "direction":"up",  "rate":0.3, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '921888de-f6a6-417d-88f6-6b0ac43f66cd' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Heavy Taxation (Income Tax)
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"income_tax",      "direction":"up",  "rate":1.0, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"budget",          "direction":"up",  "rate":0.8, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",      "direction":"down","rate":0.8, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"immigration",     "direction":"down","rate":0.6, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",      "direction":"down","rate":0.5, "delay_ticks":3, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"unrest",          "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"skilled_workers", "direction":"down","rate":0.3, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '4c55cd65-409c-4ffa-9aac-1317b13a9dd8' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);


-- ─────────────────────────────── ECONOMICS / Corporate Taxation ───
-- Tax Haven
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"corporate_tax",   "direction":"down","rate":1.0, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"immigration",     "direction":"up",  "rate":0.4, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",      "direction":"up",  "rate":0.4, "delay_ticks":3, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",      "direction":"up",  "rate":0.5, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"budget",          "direction":"down","rate":0.6, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"industry",        "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"global_image",    "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = 'a149e203-c42b-45d5-af23-3b342e14fbe3' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Pro-Business Low Tax
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"corporate_tax",   "direction":"down","rate":0.5, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",      "direction":"up",  "rate":0.2, "delay_ticks":3, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",      "direction":"up",  "rate":0.2, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"budget",          "direction":"down","rate":0.3, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"industry",        "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '1ef33bba-7157-4c9a-b36c-5267c4f61010' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Standard Rate (baseline / neutral)
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"corporate_tax",   "direction":"up",  "rate":0.1, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"budget",          "direction":"up",  "rate":0.2, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval", "direction":"up",  "rate":0.1, "delay_ticks":2, "duration_ticks":24, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '99429608-a10b-4a84-8861-0606dbd89c1f' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Progressive Corporate Tax
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"corporate_tax",   "direction":"up",  "rate":0.4, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"budget",          "direction":"up",  "rate":0.5, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",      "direction":"down","rate":0.3, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"service_sector",  "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",      "direction":"down","rate":0.1, "delay_ticks":3, "duration_ticks":24, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '01fb8791-b03c-42f8-b05a-d1d390e945f1' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Heavy Taxation (Corporate)
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"corporate_tax",   "direction":"up",  "rate":0.9, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"budget",          "direction":"up",  "rate":0.7, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",      "direction":"down","rate":0.6, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",      "direction":"down","rate":0.4, "delay_ticks":3, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"industry",        "direction":"down","rate":0.3, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"immigration",     "direction":"down","rate":0.4, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"unrest",          "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = 'ed338045-29c0-4395-b0b3-04afc3361aae' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);


-- ─────────────────────────────── ECONOMICS / Industrial Policy ────
-- Laissez-Faire Industrialization
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"industry",            "direction":"up",  "rate":0.4, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"up",  "rate":0.4, "delay_ticks":3, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"up",  "rate":0.5, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"unrest",              "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"down","rate":0.1, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '9478635c-defc-460c-adf6-79917905ebdb' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Light Manufacturing Focus
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"industry",            "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"service_sector",      "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"unskilled_workers",   "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"up",  "rate":0.2, "delay_ticks":3, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = 'e97d7946-1494-447c-a09b-7955784dca4d' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Heavy Industrial Push
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"industry",            "direction":"up",  "rate":0.8, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"infrastructure",      "direction":"up",  "rate":0.5, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"energy",              "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"up",  "rate":0.4, "delay_ticks":3, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"health",              "direction":"down","rate":0.3, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"unrest",              "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"farmland",            "direction":"down","rate":0.2, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = 'd61d7ddf-e7f7-4349-a38b-8f8ea07f3cd2' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Export-Led Industrialization
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"industry",            "direction":"up",  "rate":0.5, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"up",  "rate":0.6, "delay_ticks":3, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"immigration",         "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"skilled_workers",     "direction":"up",  "rate":0.3, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"down","rate":0.1, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"global_image",        "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '01809037-c008-46d1-8aab-0d9a26ef9b1a' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- High-Tech / Innovation-Led
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"industry",            "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"skilled_workers",     "direction":"up",  "rate":0.6, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"education",           "direction":"up",  "rate":0.5, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"global_image",        "direction":"up",  "rate":0.3, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '42f297ee-8a04-4e9b-861b-0812d11dcbb6' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Developing (subsistence economy)
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"farmland",            "direction":"up",  "rate":0.5, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"industry",            "direction":"down","rate":0.5, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"down","rate":0.4, "delay_ticks":3, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"unskilled_workers",   "direction":"up",  "rate":0.4, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"skilled_workers",     "direction":"down","rate":0.3, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"down","rate":0.3, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '2318f54c-3a43-45b2-9a4d-f0cebb11241f' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Resource-Extractive Industrialization
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"industry",            "direction":"up",  "rate":0.4, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"energy",              "direction":"up",  "rate":0.5, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"up",  "rate":0.3, "delay_ticks":3, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"health",              "direction":"down","rate":0.2, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"corruption",          "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '66dc613a-bb0c-4dd8-823d-b2c48ccf1a14' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);


-- ─────────────────────────────── GOVERNANCE / State Apparatus ─────
-- Libertarian
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"state_apparatus",     "direction":"down","rate":1.0, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"up",  "rate":0.3, "delay_ticks":3, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"up",  "rate":0.7, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"budget",              "direction":"down","rate":0.8, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"health",              "direction":"down","rate":0.3, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"education",           "direction":"down","rate":0.3, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '67073033-c29b-482b-80f3-140cbb88598d' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Minimal State
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"state_apparatus",     "direction":"down","rate":0.5, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"up",  "rate":0.2, "delay_ticks":3, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"up",  "rate":0.4, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"budget",              "direction":"down","rate":0.4, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"down","rate":0.1, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '6487ccaa-6443-4717-a53e-9c741ca5a04e' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Mixed-Liberal
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"state_apparatus",     "direction":"up",  "rate":0.2, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"up",  "rate":0.2, "delay_ticks":2, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"down","rate":0.2, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"service_sector",      "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = 'd7e7e851-6d92-4b79-9740-100288b6b6bd' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Mixed-Statist
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"state_apparatus",     "direction":"up",  "rate":0.5, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"up",  "rate":0.3, "delay_ticks":2, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"down","rate":0.4, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"health",              "direction":"up",  "rate":0.3, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"education",           "direction":"up",  "rate":0.3, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"down","rate":0.1, "delay_ticks":3, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"budget",              "direction":"up",  "rate":0.2, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '236d0b3a-1e47-4c28-adb8-ec9e8bf82db0' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- State Capitalism
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"state_apparatus",     "direction":"up",  "rate":0.8, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"industry",            "direction":"up",  "rate":0.4, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"down","rate":0.4, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"up",  "rate":0.2, "delay_ticks":3, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"corruption",          "direction":"up",  "rate":0.3, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"service_sector",      "direction":"down","rate":0.1, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '57224b68-86a0-4101-a178-3c6375eb4d40' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- State-Run Economy
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"state_apparatus",     "direction":"up",  "rate":1.0, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"down","rate":0.8, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"down","rate":0.4, "delay_ticks":3, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"corruption",          "direction":"up",  "rate":0.5, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"service_sector",      "direction":"down","rate":0.4, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"immigration",         "direction":"down","rate":0.3, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"down","rate":0.2, "delay_ticks":6, "duration_ticks":24, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = 'c310b548-b208-4f15-b2f8-0544a517e689' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);


-- ─────────────────────────────── IMMIGRATION / Citizenship ────────
-- Tiered Civic Citizenship
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"public_approval",     "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"skilled_workers",     "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"immigration",         "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"crime",               "direction":"down","rate":0.2, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"education",           "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = 'bce588cf-0ef5-4f49-8817-c83c09d4cf11' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);


-- ─────────────────────────────── JUSTICE / Prison Policy ──────────
-- Mass Incarceration
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"crime",               "direction":"down","rate":0.6, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"unrest",              "direction":"down","rate":0.3, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"budget",              "direction":"down","rate":0.5, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"global_image",        "direction":"down","rate":0.2, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '01bb04c5-dfdb-49e5-bd93-6f5058939150' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Punitive
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"crime",               "direction":"down","rate":0.3, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"unrest",              "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"budget",              "direction":"down","rate":0.3, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '490b2788-d4dc-42d4-90ac-9ab30dbd4e62' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Balanced Justice
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"crime",               "direction":"down","rate":0.4, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"unrest",              "direction":"down","rate":0.3, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"budget",              "direction":"down","rate":0.2, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"up",  "rate":0.1, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '43649b0b-0e56-4e4a-8357-b5f8f12634bd' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Restorative Justice
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"crime",               "direction":"down","rate":0.3, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"down","rate":0.2, "delay_ticks":6, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"global_image",        "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"unrest",              "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '6f40419c-a305-4b19-bf1a-b2bddfe3380f' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Police State Justice
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"crime",               "direction":"down","rate":0.8, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"unrest",              "direction":"down","rate":0.6, "delay_ticks":3, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"down","rate":0.5, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"global_image",        "direction":"down","rate":0.6, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"corruption",          "direction":"up",  "rate":0.4, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"immigration",         "direction":"down","rate":0.4, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '9d34d6ff-a4dd-40a9-9d44-d4fc6123d42a' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);


-- ─────────────────────────────── LABOR / Land Use and Zoning ──────
-- No Zoning / Free Land Use
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"industry",            "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"service_sector",      "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"cost_of_living",      "direction":"down","rate":0.3, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"up",  "rate":0.1, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"health",              "direction":"down","rate":0.1, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = 'fa231ed7-45af-4897-a39e-680f0d696efc' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Permissive Zoning (note: source has a typo "ermissive Zoning" in option_name)
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"industry",            "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"cost_of_living",      "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"up",  "rate":0.1, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"service_sector",      "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '11827c8d-1094-498e-b6e1-524fd2f068e3' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);


-- ─────────────────────────────── LABOR / Pension Policy ───────────
-- No State Pensions
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"budget",              "direction":"up",  "rate":0.6, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"down","rate":0.6, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"up",  "rate":0.5, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"unrest",              "direction":"up",  "rate":0.4, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"down","rate":0.4, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '6e697c3f-e40d-4575-bc0c-b36f1a2ebeae' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Means-Tested Pensions
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"budget",              "direction":"up",  "rate":0.2, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"down","rate":0.1, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"down","rate":0.1, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '5808c397-b266-453e-95a1-d02817e8eafd' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Standard Contributory Pension
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"budget",              "direction":"down","rate":0.2, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '48c5921e-6902-42c6-b986-86f8039e9db3' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Generous Universal Pension
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"budget",              "direction":"down","rate":0.5, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"up",  "rate":0.5, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"down","rate":0.4, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"up",  "rate":0.4, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"down","rate":0.1, "delay_ticks":3, "duration_ticks":24, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '3ec47283-59e0-43ed-be74-ca98a09bd520' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Universal Basic Pension
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"budget",              "direction":"down","rate":0.7, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"up",  "rate":0.6, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"down","rate":0.6, "delay_ticks":4, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"up",  "rate":0.5, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"down","rate":0.2, "delay_ticks":3, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"unskilled_workers",   "direction":"down","rate":0.1, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '38cb7701-cd64-49c4-86af-58e20f95929a' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);


-- ─────────────────────────────── LABOR / Wages Policy ─────────────
-- No Minimum Wage
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"wages",               "direction":"down","rate":0.8, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"up",  "rate":0.7, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"unrest",              "direction":"up",  "rate":0.4, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"down","rate":0.5, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"industry",            "direction":"up",  "rate":0.2, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"up",  "rate":0.2, "delay_ticks":3, "duration_ticks":24, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '8b8b2371-2dae-4dc2-9dc5-5c91b46c0d99' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Subsistence Minimum
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"wages",               "direction":"down","rate":0.4, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"up",  "rate":0.4, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"down","rate":0.3, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"industry",            "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '819c9c75-40ba-4057-8b60-94b6894180e3' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Modest Minimum Wage
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"wages",               "direction":"down","rate":0.1, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"up",  "rate":0.1, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"up",  "rate":0.1, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"up",  "rate":0.1, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = 'adb1c571-27ce-4e29-a40b-0d078fa68627' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Living Wage
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"wages",               "direction":"up",  "rate":0.4, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"down","rate":0.4, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"up",  "rate":0.4, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"down","rate":0.1, "delay_ticks":3, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"unskilled_workers",   "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '725dc914-4de0-48de-8a72-b1ceca5621ee' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Sectoral Bargaining
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"wages",               "direction":"up",  "rate":0.4, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"down","rate":0.3, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"up",  "rate":0.3, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"skilled_workers",     "direction":"up",  "rate":0.2, "delay_ticks":6, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"down","rate":0.1, "delay_ticks":3, "duration_ticks":24, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '7190268f-26af-43d9-a85d-f723fb48d763' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);

-- Universal High Wage
UPDATE policy_options SET stat_effects = '[
    {"stat_key":"wages",               "direction":"up",  "rate":0.9, "delay_ticks":1, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"inequality",          "direction":"down","rate":0.7, "delay_ticks":3, "duration_ticks":48, "adjust_type":null, "adjust_value":0},
    {"stat_key":"standard_of_living",  "direction":"up",  "rate":0.7, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"cost_of_living",      "direction":"up",  "rate":0.5, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0},
    {"stat_key":"public_approval",     "direction":"up",  "rate":0.5, "delay_ticks":4, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"gdp_growth",          "direction":"down","rate":0.3, "delay_ticks":3, "duration_ticks":24, "adjust_type":null, "adjust_value":0},
    {"stat_key":"industry",            "direction":"down","rate":0.2, "delay_ticks":4, "duration_ticks":36, "adjust_type":null, "adjust_value":0}
]'::jsonb WHERE id = '72d156d8-ddb4-47aa-ba2f-3c574657a4de' AND (stat_effects = '[]'::jsonb OR stat_effects IS NULL);


-- ── Verify: nothing should still have empty stat_effects after this
-- migration. If anything comes back from the SELECT below, the
-- update guard fired on something unexpected (e.g. row was edited
-- between diagnostic and run, which is fine — leave as-is).
DO $$
DECLARE
    v_remaining INT;
BEGIN
    SELECT COUNT(*) INTO v_remaining
    FROM policies p
    JOIN policy_options po ON po.policy_id = p.id
    WHERE p.is_active = true AND po.is_active = true
      AND COALESCE(jsonb_array_length(po.stat_effects), 0) = 0;
    RAISE NOTICE 'policy_options with empty stat_effects after backfill: %', v_remaining;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
