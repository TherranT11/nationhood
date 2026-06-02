-- ════════════════════════════════════════════════════════════════════
-- Pull Montequilla into the politician system
--
-- Mirrors what 20270404 (Melizea), 20270406 (Melizea stat pass),
-- 20270496 (committees v2), 20270502 (starter laws), and 20270503
-- (bar exam) collectively did for Melizea + Avelia — bundled into one
-- migration for Montequilla.
--
-- Proposed character: small landlocked agrarian republic, moderate
-- development, jus soli citizenship, agricultural + service economy.
-- All stat values below are PROPOSALS — adjust before applying if a
-- different character is preferred. Idempotent throughout (NOT EXISTS
-- guards on each insert; UPDATEs are write-the-value-you-want).
--
-- What this seeds:
--   1. Nation hero columns (politician_gdp / budget / debt / stability /
--      civil_freedoms) + government_type / head_of_state_title.
--   2. The 28 modifier-trigger stat columns
--      (state_apparatus → population_growth).
--   3. Five committees (Defence & Foreign Affairs, Finance & Budget,
--      Judiciary & Constitutional Affairs, Industry/Trade/Labor,
--      Interior & Public Welfare) + 5 NPC members each per the
--      slot rules in 20270453.
--   4. Three enacted starter laws — Cross-Border Smuggling (Criminal),
--      Land Title & Registration (Civil), Cooperative Enterprise
--      (Commercial). One per code; Constitutional Charter + Electoral
--      Code stay blank.
--   5. Nine bar exam questions — three per starter law, drawn so the
--      answers are testable directly from the article text.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Nation hero columns + government type ────────────────────────
-- politician_gdp is in raw dollars ($45.4B = 45_400_000_000), matching
-- the units 20270408 backfills the rest of the world to. Budget ≈ 25%
-- of GDP, debt ≈ 75% — modest fiscal posture for a developing nation.
UPDATE nations
   SET government_type           = 'Parliamentary Republic',
       head_of_state_title       = 'President',
       politician_gdp            = 45400000000,    -- $45.4B
       politician_budget         = 11400000000,    -- $11.4B
       politician_debt           = 34000000000,    -- $34.0B
       politician_stability      = 60,
       politician_civil_freedoms = 75
 WHERE name = 'Montequilla';

-- ── 2. 28 modifier-trigger stat columns ─────────────────────────────
-- Same shape as 20270406's Melizea pass + the Avelia pass we shipped.
-- Polit_stability + politician_civil_freedoms are mirrored above for
-- the hero card; the modifier surface reads from state_apparatus +
-- civil_liberties below.
UPDATE nations
   SET state_apparatus      = 60,    -- functional, mid-tier institutions
       civil_liberties      = 75,    -- open, liberal-leaning society
       crime                = 35,
       corruption           = 55,
       gdp_growth           = 65,
       income_tax           = 40,
       corporate_tax        = 25,
       industry             = 30,    -- modest manufacturing
       service_sector       = 65,    -- service-heavy economy
       skilled_workers      = 50,
       health               = 60,
       education            = 65,
       infrastructure       = 50,
       wages                = 45,
       cost_of_living       = 50,
       standard_of_living   = 60,
       energy_generation    = 45,
       energy               = 50,
       food_generation      = 70,    -- agricultural strength
       food                 = 75,
       minerals_generation  = 30,    -- landlocked, limited extraction
       minerals             = 25,
       consumer_goods       = 50,
       goods_generation     = 40,
       luxury_goods         = 25,
       luxury_generation    = 15,
       population_growth    = 60
 WHERE name = 'Montequilla';

-- ── 3. Committees + 5-member rosters ────────────────────────────────
-- Mirrors the DO block from 20270496 but scoped to Montequilla only.
-- ON CONFLICT keeps this idempotent against the unique
-- (nation_id, committee_key) constraint.
DO $$
DECLARE
    rec           RECORD;
    v_nation_id   uuid;
    v_comm_id     uuid;
    v_tick        int;
    v_nation      nations%ROWTYPE;
    v_party_ids   uuid[];
    v_party_seats int[];
    v_n_parties   int;
    v_gov_seats   int;
    v_gov_quota   int;
    v_slot_party  uuid;
    v_slot_role   text;
    v_first       text;
    v_last        text;
    v_npool_len   int;
    v_lpool_len   int;
    v_other_idx   int;
BEGIN
    SELECT id INTO v_nation_id FROM nations WHERE name = 'Montequilla' LIMIT 1;
    IF v_nation_id IS NULL THEN
        RAISE NOTICE 'Montequilla not found on this shard; committee seed skipped.';
        RETURN;
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    FOR rec IN
        SELECT key FROM (VALUES
            ('defense_foreign_affairs'),
            ('finance_budget'),
            ('judiciary_constitutional'),
            ('industry_trade_labor'),
            ('interior_public_welfare')
        ) AS k(key)
    LOOP
        INSERT INTO committees (nation_id, committee_key, seeded_at_tick)
        VALUES (v_nation_id, rec.key, v_tick)
        ON CONFLICT (nation_id, committee_key) DO NOTHING
        RETURNING id INTO v_comm_id;

        IF v_comm_id IS NULL THEN
            CONTINUE;  -- already seeded
        END IF;

        SELECT * INTO v_nation FROM nations WHERE id = v_nation_id;

        SELECT array_agg(id ORDER BY COALESCE(seats, 0) DESC, created_at ASC),
               array_agg(COALESCE(seats, 0) ORDER BY COALESCE(seats, 0) DESC, created_at ASC)
          INTO v_party_ids, v_party_seats
          FROM factions
         WHERE nation_id = v_nation_id
           AND faction_type = 'movement_party'
           AND abandoned_at IS NULL;

        v_n_parties := COALESCE(array_length(v_party_ids, 1), 0);
        IF v_n_parties = 0 THEN
            CONTINUE;  -- no parties yet; committee row exists, members fill later
        END IF;

        v_gov_seats := v_party_seats[1];
        v_gov_quota := LEAST(3, GREATEST(0, v_gov_seats));
        v_npool_len := COALESCE(array_length(v_nation.first_name_pool, 1), 0);
        v_lpool_len := COALESCE(array_length(v_nation.last_name_pool, 1), 0);
        v_other_idx := 2;

        FOR i IN 1..5 LOOP
            IF i <= v_gov_quota THEN
                v_slot_party := v_party_ids[1];
                v_slot_role  := CASE i
                                    WHEN 1 THEN 'chair'
                                    WHEN 2 THEN 'vice_chair'
                                    ELSE 'member'
                                END;
            ELSIF v_n_parties >= 2 THEN
                v_slot_party := v_party_ids[2 + ((v_other_idx - 2) % (v_n_parties - 1))];
                IF i = v_gov_quota + 1 THEN
                    v_slot_role := 'ranking_minority';
                ELSE
                    v_slot_role := 'member';
                END IF;
                v_other_idx := v_other_idx + 1;
            ELSE
                v_slot_party := v_party_ids[1];
                v_slot_role  := 'member';
            END IF;

            IF v_npool_len > 0 THEN
                v_first := v_nation.first_name_pool[1 + floor(random() * v_npool_len)::int];
            ELSE
                v_first := 'Member';
            END IF;
            IF v_lpool_len > 0 THEN
                v_last := v_nation.last_name_pool[1 + floor(random() * v_lpool_len)::int];
            ELSE
                v_last := i::text;
            END IF;

            INSERT INTO committee_members (
                committee_id, slot_idx, role, party_id,
                npc_first_name, npc_last_name, seated_at_tick
            ) VALUES (
                v_comm_id, i, v_slot_role, v_slot_party,
                v_first, v_last, v_tick
            );
        END LOOP;
    END LOOP;
END $$;

-- ── 4. Three enacted starter laws ───────────────────────────────────
DO $$
DECLARE
    rec         RECORD;
    v_nation_id uuid;
    v_committee uuid;
BEGIN
    SELECT id INTO v_nation_id FROM nations WHERE name = 'Montequilla' LIMIT 1;
    IF v_nation_id IS NULL THEN RETURN; END IF;

    FOR rec IN
        SELECT * FROM (VALUES
            ('criminal', 'judiciary_constitutional', 'Cross-Border Smuggling',
             '[{"ordinal":1,"tag":"operative","text":"Knowingly transporting unregistered goods across the national frontier carries 4-10 years imprisonment plus forfeiture of the goods and the vehicle used."},
               {"ordinal":2,"tag":"remedy","text":"Repeat offenders within seven years of a prior conviction face doubled sentences and a permanent ban from import-export licensing."},
               {"ordinal":3,"tag":"exception","text":"Goods declared at a frontier post within 48 hours of crossing are subject only to ordinary duties and a 25% civil penalty in lieu of criminal charges."}]'::jsonb),

            ('civil', 'judiciary_constitutional', 'Land Title and Registration',
             '[{"ordinal":1,"tag":"operative","text":"All transfers of agricultural land must be recorded in the National Land Register within 90 days of execution to be enforceable against third parties."},
               {"ordinal":2,"tag":"remedy","text":"An unregistered transfer is voidable at the option of any subsequent good-faith purchaser who records their own interest first."},
               {"ordinal":3,"tag":"administration","text":"The Ministry of Interior maintains the Register. The registration fee is fixed at one percent (1%) of the declared sale price."}]'::jsonb),

            ('commercial', 'industry_trade_labor', 'Cooperative Enterprise',
             '[{"ordinal":1,"tag":"operative","text":"Cooperative enterprises chartered under this section receive a 50% reduction in corporate tax for the first ten years of operation."},
               {"ordinal":2,"tag":"operative","text":"A cooperative must have at least seven member-owners. No single member may hold more than 25% of the voting rights."},
               {"ordinal":3,"tag":"remedy","text":"Breach of either condition above triggers retroactive collection of the tax relief enjoyed during the breach period plus a 10% surcharge."}]'::jsonb)
        ) AS t(category, committee_key, section, articles)
    LOOP
        SELECT id INTO v_committee FROM committees
         WHERE nation_id = v_nation_id AND committee_key = rec.committee_key;
        IF v_committee IS NULL THEN CONTINUE; END IF;

        IF EXISTS (
            SELECT 1 FROM committee_proposals
             WHERE nation_id = v_nation_id
               AND category  = rec.category
               AND section   = rec.section
        ) THEN
            CONTINUE;  -- idempotent
        END IF;

        INSERT INTO committee_proposals (
            committee_id, nation_id, author_faction_id,
            category, section, articles,
            status, proposed_at_tick
        ) VALUES (
            v_committee, v_nation_id, NULL,
            rec.category, rec.section, rec.articles,
            'enacted', 0
        );
    END LOOP;
END $$;

-- ── 5. Nine bar exam questions ──────────────────────────────────────
-- Three per law, drawn so the correct answer maps cleanly to a single
-- article. Idempotent: NOT EXISTS on (nation_id, prompt) skips
-- re-seeding.
DO $$
DECLARE
    rec        RECORD;
    v_nation   uuid;
    v_law      uuid;
BEGIN
    SELECT id INTO v_nation FROM nations WHERE name = 'Montequilla' LIMIT 1;
    IF v_nation IS NULL THEN RETURN; END IF;

    FOR rec IN
        SELECT * FROM (VALUES
            -- ── Cross-Border Smuggling ──
            ('criminal', 'Cross-Border Smuggling', 'Criminal Code · Cross-Border Smuggling',
             'Under Montequillan law, what is the sentencing range for knowingly transporting unregistered goods across the national frontier?',
             '1–3 years','4–10 years','8–20 years','Life imprisonment','B'),
            ('criminal', 'Cross-Border Smuggling', 'Criminal Code · Cross-Border Smuggling',
             'Within how many years of a prior smuggling conviction does a repeat offence trigger a doubled sentence?',
             '3 years','5 years','7 years','10 years','C'),
            ('criminal', 'Cross-Border Smuggling', 'Criminal Code · Cross-Border Smuggling',
             'What is the deadline for declaring previously-undeclared goods at a frontier post to avoid criminal charges?',
             '12 hours','48 hours','7 days','30 days','B'),

            -- ── Land Title and Registration ──
            ('civil', 'Land Title and Registration', 'Civil Code · Land Title',
             'Within how many days must an Montequillan agricultural-land transfer be recorded in the National Land Register?',
             '30 days','60 days','90 days','180 days','C'),
            ('civil', 'Land Title and Registration', 'Civil Code · Land Title',
             'An unregistered Montequillan land transfer is best described as:',
             'Void from inception.',
             'Voidable by a subsequent good-faith purchaser who records first.',
             'Fully enforceable against all third parties.',
             'Subject to mandatory arbitration before becoming enforceable.','B'),
            ('civil', 'Land Title and Registration', 'Civil Code · Land Title',
             'The Montequillan land-registration fee is fixed at what percentage of the declared sale price?',
             '0.25%','0.5%','1%','2%','C'),

            -- ── Cooperative Enterprise ──
            ('commercial', 'Cooperative Enterprise', 'Commercial Code · Cooperative Enterprise',
             'What corporate-tax relief do Montequillan cooperatives receive for their first ten years?',
             'A 25% reduction.',
             'A 50% reduction.',
             'A full exemption.',
             'No relief.','B'),
            ('commercial', 'Cooperative Enterprise', 'Commercial Code · Cooperative Enterprise',
             'What is the minimum number of member-owners required to charter a Montequillan cooperative?',
             '3','5','7','11','C'),
            ('commercial', 'Cooperative Enterprise', 'Commercial Code · Cooperative Enterprise',
             'Under Montequillan law, the maximum voting share a single member of a cooperative may hold is:',
             '10%','25%','33%','50%','B')
        ) AS t(category, section, domain, prompt, a, b, c, d, correct)
    LOOP
        SELECT id INTO v_law FROM committee_proposals
         WHERE nation_id = v_nation AND category = rec.category AND section = rec.section
         LIMIT 1;

        IF EXISTS (
            SELECT 1 FROM bar_exam_questions
             WHERE nation_id = v_nation AND prompt = rec.prompt
        ) THEN
            CONTINUE;
        END IF;

        INSERT INTO bar_exam_questions (
            nation_id, law_id, domain, prompt,
            answer_a, answer_b, answer_c, answer_d, correct
        ) VALUES (
            v_nation, v_law, rec.domain, rec.prompt,
            rec.a, rec.b, rec.c, rec.d, rec.correct
        );
    END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
