-- ════════════════════════════════════════════════════════════════════
-- WAR FRONTS — the land/air war map between bordering nations
-- ════════════════════════════════════════════════════════════════════
-- Every bordering pair (diplomatic_relations.proximity = 0) gets 3 LAND fronts
-- (A/B/C) + 1 AIR front. A land front is a linear chain of 7/9/11 sectors
-- running Capital(A) → A's sectors → border → B's sectors → Capital(B). The
-- capital is a single shared node per nation (front_id NULL) that every front
-- converges on; capturing it ends the war. The air front carries a status only.
--
-- Static board: structure + content (Name/Type/Infrastructure/Description) is
-- SEEDED ONCE via generate_war_fronts() and curated through frontadmin.html.
-- Live war-state (occupation, units, air status changes) lives elsewhere.
--
-- Adjacency is DERIVED (no edge table): within a front, position p ↔ p+1; the
-- two is_border sectors straddle the owner flip; a nation's capital ↔ its
-- is_capital_adjacent sectors (the innermost sector of each of its fronts).
--
-- Writes are admin-only (is_admin()); the map gives per-nation combat advantage,
-- so it must not be client-writable. Read-all (the map is public).
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS public.war_fronts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_a_id  UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,  -- canonical: a_id < b_id
    nation_b_id  UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    front_type   TEXT NOT NULL CHECK (front_type IN ('land','air','sea')),
    label        TEXT,            -- 'A'/'B'/'C' for land; 'AIR' for air
    sector_count INT,             -- 7/9/11 land front sectors (excl. capitals); NULL for air
    air_status   TEXT CHECK (air_status IN
                   ('a_domination','a_superiority','contested','b_superiority','b_domination')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_front_pair UNIQUE (nation_a_id, nation_b_id, front_type, label)
);

CREATE TABLE IF NOT EXISTS public.war_sectors (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    front_id            UUID REFERENCES war_fronts(id) ON DELETE CASCADE,  -- NULL for capitals
    nation_id           UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    position            INT,            -- 1..N along the front (1 = nation_a's capital end); NULL for capitals
    sector_code         TEXT,           -- 'A4A', 'B5A', 'OR' (capital) …
    name                TEXT,
    type                TEXT CHECK (type IN ('urban','plains','mountains','desert','jungle','coastal')),
    infrastructure      INT CHECK (infrastructure BETWEEN 0 AND 100),
    description         TEXT,
    is_border           BOOLEAN NOT NULL DEFAULT false,
    is_capital          BOOLEAN NOT NULL DEFAULT false,
    is_capital_adjacent BOOLEAN NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_sector_front_pos UNIQUE (front_id, position)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_capital_per_nation ON war_sectors (nation_id) WHERE is_capital;
CREATE INDEX IF NOT EXISTS idx_war_sectors_front ON war_sectors (front_id);

ALTER TABLE public.war_fronts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.war_sectors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS war_fronts_read  ON public.war_fronts;
DROP POLICY IF EXISTS war_sectors_read ON public.war_sectors;
CREATE POLICY war_fronts_read  ON public.war_fronts  FOR SELECT TO authenticated USING (true);
CREATE POLICY war_sectors_read ON public.war_sectors FOR SELECT TO authenticated USING (true);

-- ── generate_war_fronts() — seed the skeleton (admin-only, idempotent) ──
-- Creates a capital sector per nation, then for each bordering pair missing
-- fronts: 3 land fronts (random 7/9/11, balanced split ± a random extra sector)
-- + 1 air front. Sector content is placeholder (curated in frontadmin).
CREATE OR REPLACE FUNCTION public.generate_war_fronts()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_n      RECORD;
    v_pair   RECORD;
    v_label  TEXT;
    v_count  INT;
    v_acount INT;
    v_front  UUID;
    v_pos    INT;
    v_owner  UUID;
    v_seq    INT;
    v_init   TEXT;
    v_made   INT := 0;
BEGIN
    IF NOT is_admin() THEN RETURN jsonb_build_object('ok', false, 'error', 'not_admin'); END IF;

    -- One capital sector per nation (idempotent).
    FOR v_n IN SELECT id, name, capital FROM nations LOOP
        IF NOT EXISTS (SELECT 1 FROM war_sectors WHERE nation_id = v_n.id AND is_capital) THEN
            INSERT INTO war_sectors (front_id, nation_id, sector_code, name, type, infrastructure, description, is_capital)
            VALUES (NULL, v_n.id, upper(left(COALESCE(NULLIF(btrim(v_n.capital), ''), v_n.name), 3)),
                    COALESCE(NULLIF(btrim(v_n.capital), ''), v_n.name || ' Capital'), 'urban', 80, '', true);
        END IF;
    END LOOP;

    -- Bordering pairs, canonicalised (a<b) and de-duped so storage order can't
    -- produce reversed-duplicate fronts.
    FOR v_pair IN
        SELECT DISTINCT LEAST(nation_a_id, nation_b_id) AS a, GREATEST(nation_a_id, nation_b_id) AS b
          FROM diplomatic_relations WHERE proximity = 0
    LOOP
        IF EXISTS (SELECT 1 FROM war_fronts WHERE nation_a_id = v_pair.a AND nation_b_id = v_pair.b) THEN
            CONTINUE;
        END IF;

        FOREACH v_label IN ARRAY ARRAY['A','B','C'] LOOP
            v_count  := (ARRAY[7, 9, 11])[1 + floor(random() * 3)::int];
            v_acount := floor(v_count / 2.0)::int + floor(random() * 2)::int;  -- balanced ± 1
            INSERT INTO war_fronts (nation_a_id, nation_b_id, front_type, label, sector_count)
            VALUES (v_pair.a, v_pair.b, 'land', v_label, v_count) RETURNING id INTO v_front;

            FOR v_pos IN 1 .. v_count LOOP
                IF v_pos <= v_acount THEN
                    v_owner := v_pair.a; v_seq := v_pos;                  -- 1 = A's capital end
                ELSE
                    v_owner := v_pair.b; v_seq := v_count - v_pos + 1;    -- 1 = B's capital end
                END IF;
                SELECT upper(left(name, 1)) INTO v_init FROM nations WHERE id = v_owner;
                INSERT INTO war_sectors
                    (front_id, nation_id, position, sector_code, name, type, infrastructure, description,
                     is_border, is_capital_adjacent)
                VALUES (v_front, v_owner, v_pos,
                        COALESCE(v_init, '?') || v_seq || v_label,
                        COALESCE(v_init, '?') || v_seq || v_label,   -- placeholder name = code
                        'plains', 50, '',
                        (v_pos = v_acount OR v_pos = v_acount + 1),
                        (v_pos = 1 OR v_pos = v_count));
            END LOOP;
            v_made := v_made + 1;
        END LOOP;

        INSERT INTO war_fronts (nation_a_id, nation_b_id, front_type, label, air_status)
        VALUES (v_pair.a, v_pair.b, 'air', 'AIR', 'contested');
    END LOOP;

    RETURN jsonb_build_object('ok', true, 'land_fronts_created', v_made);
END; $$;

GRANT EXECUTE ON FUNCTION public.generate_war_fronts() TO authenticated;

-- ── upsert_war_sector() — admin edits a sector's content ──
CREATE OR REPLACE FUNCTION public.upsert_war_sector(
    p_sector_id UUID, p_name TEXT, p_type TEXT, p_infrastructure INT, p_description TEXT
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT is_admin() THEN RETURN jsonb_build_object('ok', false, 'error', 'not_admin'); END IF;
    IF p_type IS NOT NULL AND p_type NOT IN ('urban','plains','mountains','desert','jungle','coastal') THEN
        RETURN jsonb_build_object('ok', false, 'error', 'invalid_type');
    END IF;
    IF p_infrastructure IS NOT NULL AND (p_infrastructure < 0 OR p_infrastructure > 100) THEN
        RETURN jsonb_build_object('ok', false, 'error', 'invalid_infrastructure');
    END IF;
    UPDATE war_sectors
       SET name           = COALESCE(p_name, name),
           type           = COALESCE(p_type, type),
           infrastructure = COALESCE(p_infrastructure, infrastructure),
           description    = COALESCE(p_description, description)
     WHERE id = p_sector_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'sector_not_found'); END IF;
    RETURN jsonb_build_object('ok', true);
END; $$;

GRANT EXECUTE ON FUNCTION public.upsert_war_sector(UUID, TEXT, TEXT, INT, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
