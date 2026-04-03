-- Available properties marketplace — generated per nation, purchasable by corps
CREATE TABLE IF NOT EXISTS available_properties (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id       UUID NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
    catalog_id      UUID NOT NULL REFERENCES property_catalog(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL,
    style           TEXT NOT NULL,
    capacity        INT NOT NULL,
    price           BIGINT NOT NULL,          -- adjusted price (inflation + SoL scaled)
    monthly_maintenance BIGINT NOT NULL,
    condition       INT NOT NULL DEFAULT 80 CHECK (condition BETWEEN 0 AND 100),
    city            TEXT,
    generated_at_tick INT NOT NULL,
    expires_at_tick INT,                      -- NULL = doesn't expire
    status          TEXT NOT NULL DEFAULT 'available', -- 'available', 'sold', 'expired'
    purchased_by    UUID REFERENCES factions(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_available_properties_nation_status ON available_properties(nation_id, status);
