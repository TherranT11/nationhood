-- ══════════════════════════════════════════════════════════════
-- RADIO BROADCAST SYSTEM — Phase 1: Schema & RLS
-- Tables: radio_stations, radio_personalities, radio_broadcasts,
--         broadcast_good_listens
-- RPC: toggle_broadcast_good_listen (momentum every 3 good listens)
-- ══════════════════════════════════════════════════════════════

-- ──────────── RADIO STATIONS ────────────

CREATE TABLE IF NOT EXISTS radio_stations (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id         UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,
    creator_faction_id UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    callsign          TEXT NOT NULL,            -- e.g. "MHZ"
    name              TEXT NOT NULL,            -- e.g. "Melizean Free Radio"
    frequency         TEXT NOT NULL,            -- e.g. "98.4 FM" (cosmetic)
    station_type      TEXT NOT NULL DEFAULT 'general'
                      CHECK (station_type IN ('general', 'opposition', 'political', 'underground', 'commercial', 'state')),
    ideology          TEXT,                     -- only for station_type='political', e.g. "LIBERTY"
    description       TEXT,
    created_at_tick   INTEGER,
    created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_radio_stations_nation ON radio_stations(nation_id);
CREATE INDEX IF NOT EXISTS idx_radio_stations_creator ON radio_stations(creator_faction_id);

ALTER TABLE radio_stations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read radio_stations" ON radio_stations
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can create radio_stations" ON radio_stations
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update radio_stations" ON radio_stations
    FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ──────────── RADIO PERSONALITIES ────────────
-- Cosmetic characters that deliver broadcasts.
-- Up to 3 per party per station. Tied to a specific station.

CREATE TABLE IF NOT EXISTS radio_personalities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id      UUID NOT NULL REFERENCES public.radio_stations(id) ON DELETE CASCADE,
    faction_id      UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,              -- e.g. "Daniela Vasquez"
    title           TEXT,                       -- e.g. "Opposition Voice" or "Economics Desk"
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_radio_personalities_station ON radio_personalities(station_id);
CREATE INDEX IF NOT EXISTS idx_radio_personalities_faction ON radio_personalities(faction_id);

ALTER TABLE radio_personalities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read radio_personalities" ON radio_personalities
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can create radio_personalities" ON radio_personalities
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete radio_personalities" ON radio_personalities
    FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ──────────── RADIO BROADCASTS ────────────
-- A single broadcast (episode) on a station, delivered by a personality.

CREATE TABLE IF NOT EXISTS radio_broadcasts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id        UUID NOT NULL REFERENCES public.radio_stations(id) ON DELETE CASCADE,
    personality_id    UUID NOT NULL REFERENCES public.radio_personalities(id) ON DELETE CASCADE,
    faction_id        UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    subject           TEXT NOT NULL,
    body              TEXT NOT NULL,
    tags              JSONB DEFAULT '[]'::jsonb, -- e.g. ["POLITICS", "CORRUPTION"]
    published_tick    INTEGER,
    good_listen_count INTEGER DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_radio_broadcasts_station ON radio_broadcasts(station_id);
CREATE INDEX IF NOT EXISTS idx_radio_broadcasts_faction ON radio_broadcasts(faction_id);
CREATE INDEX IF NOT EXISTS idx_radio_broadcasts_tick ON radio_broadcasts(published_tick);

ALTER TABLE radio_broadcasts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read radio_broadcasts" ON radio_broadcasts
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can create radio_broadcasts" ON radio_broadcasts
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ──────────── BROADCAST GOOD LISTENS ────────────
-- One good listen per faction per broadcast (like article likes).

CREATE TABLE IF NOT EXISTS broadcast_good_listens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcast_id    UUID NOT NULL REFERENCES public.radio_broadcasts(id) ON DELETE CASCADE,
    faction_id      UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(broadcast_id, faction_id)
);

CREATE INDEX IF NOT EXISTS idx_broadcast_good_listens_broadcast ON broadcast_good_listens(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_good_listens_faction ON broadcast_good_listens(faction_id);

ALTER TABLE broadcast_good_listens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read broadcast_good_listens" ON broadcast_good_listens
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert broadcast_good_listens" ON broadcast_good_listens
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete broadcast_good_listens" ON broadcast_good_listens
    FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ──────────── TOGGLE GOOD LISTEN RPC ────────────
-- Atomic toggle: like/unlike a broadcast.
-- Awards +1 momentum to broadcaster's party at every 3rd good listen.

CREATE OR REPLACE FUNCTION toggle_broadcast_good_listen(
    p_broadcast_id UUID,
    p_faction_id UUID,
    p_tick INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_existing UUID;
    v_new_count INT;
    v_author_faction UUID;
    v_liked BOOLEAN;
BEGIN
    -- Check if already good-listened
    SELECT id INTO v_existing
    FROM broadcast_good_listens
    WHERE broadcast_id = p_broadcast_id AND faction_id = p_faction_id;

    IF v_existing IS NOT NULL THEN
        -- Remove good listen
        DELETE FROM broadcast_good_listens WHERE id = v_existing;
        UPDATE radio_broadcasts
        SET good_listen_count = GREATEST(0, COALESCE(good_listen_count, 0) - 1)
        WHERE id = p_broadcast_id
        RETURNING good_listen_count INTO v_new_count;
        v_liked := false;
    ELSE
        -- Add good listen
        INSERT INTO broadcast_good_listens (broadcast_id, faction_id)
        VALUES (p_broadcast_id, p_faction_id);

        UPDATE radio_broadcasts
        SET good_listen_count = COALESCE(good_listen_count, 0) + 1
        WHERE id = p_broadcast_id
        RETURNING good_listen_count, faction_id INTO v_new_count, v_author_faction;
        v_liked := true;

        -- Award +1 momentum at every 3rd good listen
        IF v_author_faction IS NOT NULL AND v_new_count > 0 AND (v_new_count % 3) = 0 THEN
            PERFORM adjust_momentum(
                v_author_faction,
                1,
                'Broadcast good listen (' || v_new_count || ' listens)',
                p_tick
            );
        END IF;
    END IF;

    RETURN jsonb_build_object('liked', v_liked, 'good_listen_count', COALESCE(v_new_count, 0));
END;
$$;

ALTER FUNCTION public.toggle_broadcast_good_listen(UUID, UUID, INT) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.toggle_broadcast_good_listen(UUID, UUID, INT) TO authenticated;
