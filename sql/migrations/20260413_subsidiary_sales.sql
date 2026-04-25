-- ══════════════════════════════════════════════════════════════
-- SUBSIDIARY SALES & BIDS
--
-- Allows corps to list subsidiaries for sale. Other corps can
-- bid. Owner reviews bids and accepts one. Ownership transfers.
-- ══════════════════════════════════════════════════════════════

-- ──────────── SUBSIDIARY SALES ────────────
-- A listing for a subsidiary (regional_hq) put up for sale.

CREATE TABLE IF NOT EXISTS subsidiary_sales (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subsidiary_id       UUID NOT NULL REFERENCES public.corp_properties(id) ON DELETE CASCADE,
    seller_faction_id   UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    nation_id           UUID NOT NULL REFERENCES public.nations(id) ON DELETE CASCADE,

    -- Subsidiary snapshot at listing time
    subsidiary_name     TEXT NOT NULL,
    subsector           TEXT,
    valuation           BIGINT NOT NULL DEFAULT 0,      -- estimated market value
    monthly_revenue     BIGINT NOT NULL DEFAULT 0,      -- revenue snapshot at listing
    sub_cash_at_listing BIGINT NOT NULL DEFAULT 0,      -- sub_cash at listing time
    employee_count      INT NOT NULL DEFAULT 0,          -- capacity filled

    -- Sale state
    status              TEXT NOT NULL DEFAULT 'listed'
                        CHECK (status IN ('listed', 'completed', 'cancelled')),
    listed_at_tick      INT NOT NULL,
    completed_at_tick   INT,
    accepted_bid_id     UUID,                            -- FK added after subsidiary_bids table

    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_sales_nation ON subsidiary_sales(nation_id) WHERE status = 'listed';
CREATE INDEX IF NOT EXISTS idx_sub_sales_seller ON subsidiary_sales(seller_faction_id);
CREATE INDEX IF NOT EXISTS idx_sub_sales_status ON subsidiary_sales(status);

-- ──────────── SUBSIDIARY BIDS ────────────
-- Bids from other corporations on a listed subsidiary.

CREATE TABLE IF NOT EXISTS subsidiary_bids (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id             UUID NOT NULL REFERENCES public.subsidiary_sales(id) ON DELETE CASCADE,
    bidder_faction_id   UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    bid_amount          BIGINT NOT NULL CHECK (bid_amount >= 1000000),  -- minimum $1M

    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    placed_at_tick      INT NOT NULL,
    resolved_at_tick    INT,

    created_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(sale_id, bidder_faction_id)  -- one bid per corp per sale
);

CREATE INDEX IF NOT EXISTS idx_sub_bids_sale ON subsidiary_bids(sale_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_sub_bids_bidder ON subsidiary_bids(bidder_faction_id);

-- Add FK from sales to accepted bid
ALTER TABLE subsidiary_sales
    ADD CONSTRAINT fk_accepted_bid
    FOREIGN KEY (accepted_bid_id) REFERENCES subsidiary_bids(id) ON DELETE SET NULL;

-- ──────────── RLS ────────────
ALTER TABLE subsidiary_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidiary_bids ENABLE ROW LEVEL SECURITY;

-- Sales: all can read (browse listings), authenticated can insert/update
DO $$ BEGIN
  CREATE POLICY "Anyone can read subsidiary_sales" ON subsidiary_sales
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can insert subsidiary_sales" ON subsidiary_sales
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can update subsidiary_sales" ON subsidiary_sales
    FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Bids: all can read (seller sees bids), authenticated can insert/update
DO $$ BEGIN
  CREATE POLICY "Anyone can read subsidiary_bids" ON subsidiary_bids
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can insert subsidiary_bids" ON subsidiary_bids
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated can update subsidiary_bids" ON subsidiary_bids
    FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
