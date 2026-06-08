-- ════════════════════════════════════════════════════════════════════
-- 20270695 — Promote Sierramar into the politician system
--
-- Mirrors 20270504 (Montequilla) but for Sierramar. The Sierramar
-- nations row has been on the shard since 2026 (capital Porto
-- Serrano, gdp 26.5, arable_land 18, citizenship law, nation_profile
-- prose, etc.) which is why the admin "Add Nation" form rejects a
-- create — the row already exists. This migration brings the row up
-- to the politician-system shape Melizea / Avelia / Montequilla all
-- have, without touching the legacy 2026 columns.
--
-- What this seeds:
--   1. Nation hero columns + government_type + head_of_state_title +
--      total_seats=100 + parliamentary_term_ticks=48 +
--      next_election_tick=current+12 (per spec). The 28 modifier-
--      trigger stat columns + politician_stability + politician_civil
--      _freedoms are intentionally left NULL — the user is seeding
--      those values later via the admin panel.
--   2. Name pools — Crucera default (Spanish), matching the catch-all
--      at the bottom of 20260927. Idempotent: only fills when NULL.
--   3. Five committees + 5-member rosters. Members fill only if at
--      least one movement_party exists in Sierramar at apply time;
--      otherwise the committee rows seed empty (members can be filled
--      by re-running the same DO block once parties are added via the
--      admin "Add Party" form).
--   4. Three Sierramari starter laws (Maritime Contraband Act /
--      Coastal Title and Registration / Harbour Cooperative Charter).
--   5. Nine bar exam questions, three per law.
--
-- Apply after 20270694. Companion migration 20270696 fixes the
-- resolver so parliamentary_term_ticks=48 actually drives the cycle.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Nation hero columns + cycle + first election ─────────────────
-- GDP / Budget / Debt per user spec ($16.4B / $4B / $9.5B). The
-- 28 modifier-trigger stat columns (state_apparatus … population_
-- growth) plus politician_stability / politician_civil_freedoms are
-- not touched here — set them via the admin panel when ready.
-- next_election_tick reads the shard's current_tick at apply time so
-- the "+12" anchors to the apply moment, not the migration's authoring
-- moment.
UPDATE nations
   SET government_type           = 'Parliamentary Republic',
       head_of_state_title       = 'President',
       total_seats               = 100,
       politician_gdp            = 16400000000,    -- $16.4B
       politician_budget         =  4000000000,    -- $4.0B
       politician_debt           =  9500000000,    -- $9.5B
       parliamentary_term_ticks  = 48,
       next_election_tick        = (SELECT current_tick + 12 FROM shard
                                     WHERE name = 'Alpha Shard' LIMIT 1)
 WHERE name = 'Sierramar';

-- ── 2. Name pools (defensive) ───────────────────────────────────────
-- 20260927 has a catch-all that backfills any NULL pool with the
-- Crucera default, but that migration ran at a specific moment in
-- the shard's history. If Sierramar's pools are NULL today (the
-- only sign would be committee members named "Member"), this UPDATE
-- fills them. Idempotent — only writes when NULL.
UPDATE nations
   SET first_name_pool = ARRAY['Alejandro','Camila','Diego','Valentina','Mateo','Isabela','Sebastián','Luca','Andrés','Gabriel','Joaquín','Mariana','Carlos','Tomas','Rafael','Edwin','Emilio','Catalina','Fernando','Renata','Ricardo','Héctor','Ignacio','Santiago','Esteban','Nicolás','Ramón','Arturo','Álvaro','Gonzalo','Javier','Mauricio','Enrique','Sergio','Adrián','Hugo','Cristián','Rubén','Germán','Felipe']
 WHERE name = 'Sierramar'
   AND (first_name_pool IS NULL OR array_length(first_name_pool, 1) IS NULL);

UPDATE nations
   SET last_name_pool = ARRAY['Velasco','Mendoza','Guerrero','Salazar','Castillo','Herrera','Morales','Ríos','Delgado','Espinoza','Guzmán','Navarro','Córdoba','Echeverría','Pacheco','Montero','Aguilar','Valenzuela','Carrasco','Ibarra','Fuentes','Quiroga','Sepúlveda','Villalobos','Paredes','Arellano','Sandoval','Medina','Estrada','Cervantes','Figueroa','Maldonado','Cisneros','Zúñiga','Bustamante','Roldán','Camacho','Gallardo','Barrera','Saavedra']
 WHERE name = 'Sierramar'
   AND (last_name_pool IS NULL OR array_length(last_name_pool, 1) IS NULL);

-- ── 3. Five committees + 5-member rosters ───────────────────────────
-- Same DO-block pattern as 20270504 (Montequilla) and 20270496 (the
-- v2 committees migration), scoped to Sierramar. ON CONFLICT keeps
-- the committees insert idempotent against the unique (nation_id,
-- committee_key) constraint. If no movement_party exists yet,
-- committee rows seed empty — members get filled when this DO block
-- (or an equivalent backfill) runs after parties are added via the
-- admin "Add Party" form.
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
    SELECT id INTO v_nation_id FROM nations WHERE name = 'Sierramar' LIMIT 1;
    IF v_nation_id IS NULL THEN
        RAISE NOTICE 'Sierramar not found on this shard; committee seed skipped.';
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
                v_last := 'NPC';
            END IF;

            INSERT INTO committee_members
                (committee_id, nation_id, party_id, role,
                 npc_first_name, npc_last_name, seated_at_tick)
            VALUES
                (v_comm_id, v_nation_id, v_slot_party, v_slot_role,
                 v_first, v_last, v_tick);
        END LOOP;
    END LOOP;
END $$;

-- ── 4. Three Sierramari starter laws ────────────────────────────────
-- One per code (Criminal / Civil / Commercial), mirroring 20270504's
-- shape. Themes match Sierramar's island character: maritime smuggling,
-- coastal land registration, harbour cooperative charters. Idempotent:
-- NOT EXISTS on (nation_id, category, section) skips re-seeding.
DO $$
DECLARE
    rec         RECORD;
    v_nation_id uuid;
    v_committee uuid;
BEGIN
    SELECT id INTO v_nation_id FROM nations WHERE name = 'Sierramar' LIMIT 1;
    IF v_nation_id IS NULL THEN RETURN; END IF;

    FOR rec IN
        SELECT * FROM (VALUES
            ('criminal', 'judiciary_constitutional', 'Maritime Contraband Act',
             '[{"ordinal":1,"tag":"operative","text":"Knowingly conveying unregistered goods through Sierramari territorial waters carries 3-8 years imprisonment plus forfeiture of the vessel and cargo."},
               {"ordinal":2,"tag":"remedy","text":"Repeat offenders within five years of a prior conviction face doubled sentences and a permanent ban from any port-of-call privileges in Sierramari harbours."},
               {"ordinal":3,"tag":"exception","text":"Goods declared at the nearest Customs House within 24 hours of arrival are subject only to ordinary duties and a 30% civil penalty in lieu of criminal charges."}]'::jsonb),

            ('civil', 'judiciary_constitutional', 'Coastal Title and Registration',
             '[{"ordinal":1,"tag":"operative","text":"All transfers of coastal land within 200 metres of the mean high-water line must be recorded in the Coastal Registry within 60 days of execution to be enforceable against third parties."},
               {"ordinal":2,"tag":"remedy","text":"An unregistered transfer is voidable at the option of any subsequent good-faith purchaser who records their own interest first."},
               {"ordinal":3,"tag":"administration","text":"The Ministry of Interior maintains the Coastal Registry. The registration fee is fixed at one and one-half percent (1.5%) of the declared sale price."}]'::jsonb),

            ('commercial', 'industry_trade_labor', 'Harbour Cooperative Charter',
             '[{"ordinal":1,"tag":"operative","text":"Harbour-cooperative enterprises chartered under this section receive a 40% reduction in corporate tax for the first fifteen years of operation."},
               {"ordinal":2,"tag":"operative","text":"A harbour cooperative must have at least nine member-owners. No single member may hold more than 20% of the voting rights."},
               {"ordinal":3,"tag":"remedy","text":"Breach of either condition above triggers retroactive collection of the tax relief enjoyed during the breach period plus a 12% surcharge."}]'::jsonb)
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
-- Three per law, drawn so the correct answer maps to a single article.
-- Idempotent: NOT EXISTS on (nation_id, prompt) skips re-seeding.
DO $$
DECLARE
    rec        RECORD;
    v_nation   uuid;
    v_law      uuid;
BEGIN
    SELECT id INTO v_nation FROM nations WHERE name = 'Sierramar' LIMIT 1;
    IF v_nation IS NULL THEN RETURN; END IF;

    FOR rec IN
        SELECT * FROM (VALUES
            -- ── Maritime Contraband Act ──
            ('criminal', 'Maritime Contraband Act', 'Criminal Code · Maritime Contraband',
             'Under Sierramari law, what is the sentencing range for knowingly conveying unregistered goods through territorial waters?',
             '1-3 years','3-8 years','8-20 years','Life imprisonment','B'),
            ('criminal', 'Maritime Contraband Act', 'Criminal Code · Maritime Contraband',
             'Within how many years of a prior smuggling conviction does a repeat Sierramari maritime offence trigger a doubled sentence?',
             '3 years','5 years','7 years','10 years','B'),
            ('criminal', 'Maritime Contraband Act', 'Criminal Code · Maritime Contraband',
             'What is the deadline for declaring previously-undeclared goods at a Sierramari Customs House to avoid criminal charges?',
             '12 hours','24 hours','48 hours','7 days','B'),

            -- ── Coastal Title and Registration ──
            ('civil', 'Coastal Title and Registration', 'Civil Code · Coastal Title',
             'Within how many days must a Sierramari coastal-land transfer be recorded in the Coastal Registry?',
             '30 days','60 days','90 days','180 days','B'),
            ('civil', 'Coastal Title and Registration', 'Civil Code · Coastal Title',
             'An unregistered Sierramari coastal-land transfer is best described as:',
             'Void from inception.',
             'Voidable by a subsequent good-faith purchaser who records first.',
             'Fully enforceable against all third parties.',
             'Subject to mandatory arbitration before becoming enforceable.','B'),
            ('civil', 'Coastal Title and Registration', 'Civil Code · Coastal Title',
             'The Sierramari coastal-registration fee is fixed at what percentage of the declared sale price?',
             '0.5%','1%','1.5%','2%','C'),

            -- ── Harbour Cooperative Charter ──
            ('commercial', 'Harbour Cooperative Charter', 'Commercial Code · Harbour Cooperative',
             'What corporate-tax relief do Sierramari harbour cooperatives receive for their first fifteen years?',
             'A 25% reduction.',
             'A 40% reduction.',
             'A full exemption.',
             'No relief.','B'),
            ('commercial', 'Harbour Cooperative Charter', 'Commercial Code · Harbour Cooperative',
             'What is the minimum number of member-owners required to charter a Sierramari harbour cooperative?',
             '5','7','9','11','C'),
            ('commercial', 'Harbour Cooperative Charter', 'Commercial Code · Harbour Cooperative',
             'Under Sierramari law, the maximum voting share a single member of a harbour cooperative may hold is:',
             '10%','20%','33%','50%','B')
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
