-- ==================== TRADE TABLE RLS POLICIES ====================
-- Adds missing RLS policies for trade_flows, trade_partners, trade_summary.
-- These tables were created without RLS policies, which blocks frontend reads
-- on Supabase instances where RLS is enabled by default.
--
-- The edge function writes using the service role (bypasses RLS),
-- so only SELECT policies are needed for authenticated users.

-- trade_flows
ALTER TABLE trade_flows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trade_flows_read" ON trade_flows;
CREATE POLICY "trade_flows_read" ON trade_flows
    FOR SELECT TO authenticated USING (true);

-- trade_partners
ALTER TABLE trade_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trade_partners_read" ON trade_partners;
CREATE POLICY "trade_partners_read" ON trade_partners
    FOR SELECT TO authenticated USING (true);

-- trade_summary
ALTER TABLE trade_summary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trade_summary_read" ON trade_summary;
CREATE POLICY "trade_summary_read" ON trade_summary
    FOR SELECT TO authenticated USING (true);
