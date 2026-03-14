-- Executive Orders system for presidential governments

-- Main table: tracks all executive orders (active and historical)
CREATE TABLE IF NOT EXISTS executive_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nation_id uuid REFERENCES nations(id) ON DELETE CASCADE NOT NULL,
    faction_id uuid REFERENCES factions(id) ON DELETE CASCADE NOT NULL,
    order_type text NOT NULL CHECK (order_type IN (
        'acting_minister', 'tax_adjustment', 'price_controls',
        'national_emergency', 'censure'
    )),
    payload jsonb DEFAULT '{}',
    issued_tick int NOT NULL,
    expires_tick int,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS eo_nation_idx ON executive_orders(nation_id);
CREATE INDEX IF NOT EXISTS eo_active_idx ON executive_orders(nation_id, is_active) WHERE is_active = true;

-- New columns on nations for overreach tracking and emergency cooldown
ALTER TABLE nations ADD COLUMN IF NOT EXISTS overreach_count int DEFAULT 0;
ALTER TABLE nations ADD COLUMN IF NOT EXISTS emergency_cooldown_until int DEFAULT 0;

-- New columns on ministries for acting minister tracking
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS is_acting boolean DEFAULT false;
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS acting_order_id uuid REFERENCES executive_orders(id);
