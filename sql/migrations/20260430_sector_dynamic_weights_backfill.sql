-- =========================================================================
-- Sector Dynamic Weights — One-shot backfill
--
-- 20260430_sector_dynamic_weights.sql added primary_stat/secondary_stat
-- columns and the seed mappings, but it left existing rows at their old
-- weight (= 1 across the board on most live nations). The engine only
-- recomputes when an election fires, so without this backfill every nation
-- would sit at Total Weight 12 (below the 24-26 target band) until its
-- next election.
--
-- This script applies the same math the JS engine runs:
--   * read nation stat for primary_stat (handling _inverse suffix)
--   * if secondary_stat present, blend 70/30 against secondary stat
--   * step: blended >= 65 -> 3, >= 35 -> 2, else 1
--   * soft-cap per nation: if Σ raw weights > 28, scale proportionally and
--     re-clamp to [1, 3]
--   * sectors with NULL primary_stat or a stat pointing at a missing column
--     are left untouched (manual / operator-managed weight is preserved)
--
-- Idempotent: running it twice produces the same result. Safe to re-run
-- after an election if anything drifted.
--
-- Implementation note: stat keys are looked up dynamically against
-- to_jsonb(nation_row) so we don't need a giant CASE statement enumerating
-- every nation column. _inverse is detected by suffix-match on the key.
-- =========================================================================

DO $$
DECLARE
    n_rec          RECORD;
    s_rec          RECORD;
    e_rec          RECORD;
    nation_json    JSONB;
    primary_key    TEXT;
    primary_inv    BOOLEAN;
    primary_val    NUMERIC;
    secondary_key  TEXT;
    secondary_inv  BOOLEAN;
    secondary_val  NUMERIC;
    blended        NUMERIC;
    raw_weight     INTEGER;
    raw_weights    JSONB;
    nation_total   INTEGER;
    scale_factor   NUMERIC;
    final_weight   INTEGER;
    rows_updated   INTEGER := 0;
BEGIN
    FOR n_rec IN SELECT * FROM nations LOOP
        nation_json  := to_jsonb(n_rec);
        raw_weights  := '{}'::jsonb;
        nation_total := 0;

        -- Pass 1: compute the un-capped weight for each active sector with
        -- a primary_stat. Skip rows whose stat key resolves to NULL so we
        -- don't clobber operator-managed weights.
        FOR s_rec IN
            SELECT id, primary_stat, secondary_stat
            FROM sectors
            WHERE nation_id = n_rec.id
              AND is_active = true
              AND primary_stat IS NOT NULL
        LOOP
            primary_key := s_rec.primary_stat;
            primary_inv := right(primary_key, 8) = '_inverse';
            IF primary_inv THEN
                primary_key := substring(primary_key FROM 1 FOR length(primary_key) - 8);
            END IF;

            primary_val := NULLIF(nation_json ->> primary_key, '')::numeric;
            IF primary_val IS NULL THEN
                CONTINUE;
            END IF;
            IF primary_inv THEN
                primary_val := 100 - primary_val;
            END IF;

            blended := primary_val;

            IF s_rec.secondary_stat IS NOT NULL THEN
                secondary_key := s_rec.secondary_stat;
                secondary_inv := right(secondary_key, 8) = '_inverse';
                IF secondary_inv THEN
                    secondary_key := substring(secondary_key FROM 1 FOR length(secondary_key) - 8);
                END IF;

                secondary_val := NULLIF(nation_json ->> secondary_key, '')::numeric;
                IF secondary_val IS NOT NULL THEN
                    IF secondary_inv THEN
                        secondary_val := 100 - secondary_val;
                    END IF;
                    blended := primary_val * 0.7 + secondary_val * 0.3;
                END IF;
            END IF;

            IF    blended >= 65 THEN raw_weight := 3;
            ELSIF blended >= 35 THEN raw_weight := 2;
            ELSE                     raw_weight := 1;
            END IF;

            raw_weights  := jsonb_set(raw_weights, ARRAY[s_rec.id::text], to_jsonb(raw_weight));
            nation_total := nation_total + raw_weight;
        END LOOP;

        -- Pass 2: write back, applying the soft-cap if the raw sum
        -- overshot 28.
        IF nation_total > 28 THEN
            scale_factor := 28.0 / nation_total;
            FOR e_rec IN SELECT key AS sid, (value::text)::integer AS w
                         FROM jsonb_each(raw_weights)
            LOOP
                final_weight := GREATEST(1, LEAST(3, round(e_rec.w * scale_factor)::integer));
                UPDATE sectors SET weight = final_weight WHERE id = e_rec.sid::uuid;
                rows_updated := rows_updated + 1;
            END LOOP;
        ELSE
            FOR e_rec IN SELECT key AS sid, (value::text)::integer AS w
                         FROM jsonb_each(raw_weights)
            LOOP
                UPDATE sectors SET weight = e_rec.w WHERE id = e_rec.sid::uuid;
                rows_updated := rows_updated + 1;
            END LOOP;
        END IF;
    END LOOP;

    RAISE NOTICE 'Backfilled weights on % sector rows', rows_updated;
END $$;

-- Verify: per-nation totals should land in the 12-28 range, ideally 24-26
-- for nations with a balanced spread of mid-range stats.
SELECT
    nations.name AS nation,
    SUM(sectors.weight)::int AS total_weight,
    COUNT(*) FILTER (WHERE sectors.is_active) AS active_sectors
FROM sectors
JOIN nations ON nations.id = sectors.nation_id
WHERE sectors.is_active = true
GROUP BY nations.name
ORDER BY total_weight DESC, nations.name;
