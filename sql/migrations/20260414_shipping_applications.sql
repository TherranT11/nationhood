-- ══════════════════════════════════════════════════════════════
-- Shipping Applications — proposal system between corps and government
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS shipping_applications (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id uuid NOT NULL REFERENCES shipping_routes(id),
    faction_id uuid NOT NULL REFERENCES factions(id),
    proposed_rate numeric NOT NULL DEFAULT 0,
    application_fee numeric NOT NULL DEFAULT 50000,
    status text NOT NULL DEFAULT 'pending',
    applied_at_tick integer,
    reviewed_at_tick integer,
    reviewed_by_faction_id uuid REFERENCES factions(id),
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shipping_applications_route ON shipping_applications(route_id);
CREATE INDEX IF NOT EXISTS idx_shipping_applications_faction ON shipping_applications(faction_id);
CREATE INDEX IF NOT EXISTS idx_shipping_applications_status ON shipping_applications(status);

-- Unique constraint: one application per corp per route
CREATE UNIQUE INDEX IF NOT EXISTS idx_shipping_applications_unique
    ON shipping_applications(route_id, faction_id)
    WHERE status IN ('pending', 'approved');

ALTER TABLE shipping_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shipping applications" ON shipping_applications
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert shipping applications" ON shipping_applications
    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update shipping applications" ON shipping_applications
    FOR UPDATE TO authenticated USING (true);
