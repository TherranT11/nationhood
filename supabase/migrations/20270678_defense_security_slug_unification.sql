-- ════════════════════════════════════════════════════════════════════
-- 20270678 — Defense/security slug unification (paperwork side)
--
-- politician_sit_the_exam assigns 'defense' as the ministry slug
-- (matches government.html's active 'defense' ministry + the live
-- politician_ministry vocabulary). The paperwork-taxonomy.js SoT
-- mistakenly used 'security' for the same domain, which meant
-- _paperwork_valid_ministry_agency never validated for a defense
-- civil servant — they couldn't be promoted to Agency Head (the 5
-- security-domain agencies all failed the (ministry, agency) check).
--
-- 20270634's Agency Head migration flagged this as a "follow-up to
-- align the two slug sets". This is the follow-up.
--
-- Canonical slug: 'defense'. The 5 agency keys inside the bucket
-- (national_police, border_security, counterterrorism, defence_
-- procurement, intelligence) are unchanged — only the ministry-side
-- container slug moves.
--
-- Changes:
--   1. Backfill any existing paperwork_dispatches rows from
--      correct_ministry='security' → 'defense' (the data side).
--   2. Replace the paperwork_dispatches.correct_ministry CHECK so
--      it accepts 'defense' (and rejects 'security').
--   3. Recreate _paperwork_valid_ministry_agency with 'defense' on
--      the 5 security-domain pairs.
--
-- Client (separate hunk in the same commit):
--   • js/paperwork-taxonomy.js — PAPERWORK_MINISTRIES.security
--     becomes PAPERWORK_MINISTRIES.defense, label 'Security' →
--     'Defense'.
--
-- Apply after 20270677.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Backfill data (must happen before the new CHECK lands) ────
UPDATE public.paperwork_dispatches
   SET correct_ministry = 'defense'
 WHERE correct_ministry = 'security';

-- ── 2. Swap the CHECK constraint ─────────────────────────────────
ALTER TABLE public.paperwork_dispatches
    DROP CONSTRAINT IF EXISTS paperwork_dispatches_ministry_check;
ALTER TABLE public.paperwork_dispatches
    ADD CONSTRAINT paperwork_dispatches_ministry_check
    CHECK (correct_ministry IN (
        'foreign_affairs','trade','economic_development','interior','defense',
        'agriculture','sports','transportation','energy','finance'
    ));

-- ── 3. Recreate the (ministry, agency) validator ─────────────────
-- Mirrors js/paperwork-taxonomy.js — keep in sync. The 5 security-
-- domain pairs flip from 'security' → 'defense'; every other pair
-- is character-identical to 20270627's body.
CREATE OR REPLACE FUNCTION public._paperwork_valid_ministry_agency(
    p_ministry text, p_agency text
) RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
    SELECT (p_ministry, p_agency) IN (
        ('foreign_affairs', 'bilateral_relations'),
        ('foreign_affairs', 'treaties_conventions'),
        ('foreign_affairs', 'consular_services'),
        ('foreign_affairs', 'multilateral_affairs'),
        ('foreign_affairs', 'public_diplomacy'),
        ('trade', 'tariffs_customs'),
        ('trade', 'export_promotion'),
        ('trade', 'trade_agreements'),
        ('trade', 'import_regulation'),
        ('trade', 'commercial_disputes'),
        ('economic_development', 'industrial_concessions'),
        ('economic_development', 'environmental_compliance'),
        ('economic_development', 'sectoral_planning'),
        ('economic_development', 'special_economic_zones'),
        ('economic_development', 'foreign_investment'),
        ('interior', 'provincial_affairs'),
        ('interior', 'civil_registry'),
        ('interior', 'disaster_management'),
        ('interior', 'lands_heritage'),
        ('interior', 'municipal_affairs'),
        ('defense', 'national_police'),
        ('defense', 'border_security'),
        ('defense', 'counterterrorism'),
        ('defense', 'defence_procurement'),
        ('defense', 'intelligence'),
        ('agriculture', 'crop_production'),
        ('agriculture', 'livestock_fisheries'),
        ('agriculture', 'agricultural_subsidies'),
        ('agriculture', 'rural_development'),
        ('agriculture', 'food_safety'),
        ('sports', 'olympic_affairs'),
        ('sports', 'sports_federations'),
        ('sports', 'youth_athletics'),
        ('sports', 'venue_management'),
        ('sports', 'doping_control'),
        ('transportation', 'roads_highways'),
        ('transportation', 'civil_aviation'),
        ('transportation', 'maritime_affairs'),
        ('transportation', 'rail_services'),
        ('transportation', 'public_transit'),
        ('energy', 'oil_gas_concessions'),
        ('energy', 'electricity_regulator'),
        ('energy', 'renewable_energy'),
        ('energy', 'nuclear_affairs'),
        ('energy', 'energy_conservation'),
        ('finance', 'tax_collection'),
        ('finance', 'public_debt'),
        ('finance', 'treasury_cash'),
        ('finance', 'banking_supervision'),
        ('finance', 'public_investment')
    );
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
