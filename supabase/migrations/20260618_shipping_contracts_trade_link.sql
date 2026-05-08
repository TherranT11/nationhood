-- ══════════════════════════════════════════════════════════════
-- Phase 1: Wire shipping_contracts to trade_flow articles.
--
-- When a trade agreement carries an Energy trade_flow article, the
-- enactment flow (Phase 2) spawns a shipping_contracts row tying the
-- agreement to a shipping bid window. Phase 1 just adds the columns
-- so drafting + storage roundtrip works.
--
-- Columns:
--   trade_agreement_id   FK back to the agreement that spawned this
--                        contract. NULL for legacy organic contracts.
--   commodity            sector key — 'energy' for now; future
--                        commodities reuse the same column.
--   volume_required      units/tick the buyer wants delivered. The
--                        winning bid is capped at this volume even if
--                        the corp allocates more freighters.
--   delivery_priority    buyer-side selection that drives auto-award:
--                          'fastest'  → highest energy/tick delivered
--                          'safest'   → lowest route risk
--                          'cheapest' → lowest $/tick total (also the
--                                       universal tiebreaker)
--                        Distinct from the SOP-side award_criterion
--                        column (lowest_price / fastest_delivery /
--                        lowest_risk) so corp-page contract terminology
--                        stays separate from buyer-facing terminology.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE shipping_contracts
    ADD COLUMN IF NOT EXISTS trade_agreement_id UUID
        REFERENCES trade_agreements(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS commodity        TEXT,
    ADD COLUMN IF NOT EXISTS volume_required  INT,
    ADD COLUMN IF NOT EXISTS delivery_priority TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
         WHERE table_name = 'shipping_contracts'
           AND constraint_name = 'shipping_contracts_delivery_priority_check'
    ) THEN
        ALTER TABLE shipping_contracts
            ADD CONSTRAINT shipping_contracts_delivery_priority_check
            CHECK (delivery_priority IS NULL
                OR delivery_priority IN ('fastest', 'safest', 'cheapest'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_shipping_contracts_trade_agreement
    ON shipping_contracts(trade_agreement_id)
    WHERE trade_agreement_id IS NOT NULL;

COMMENT ON COLUMN shipping_contracts.trade_agreement_id IS
    'FK to the trade_agreements row that spawned this shipping contract. NULL for SOP / legacy organic contracts.';
COMMENT ON COLUMN shipping_contracts.commodity IS
    'Sector key for the cargo (e.g. ''energy''). Used to filter contracts by commodity in the corp Available Routes view.';
COMMENT ON COLUMN shipping_contracts.volume_required IS
    'Units of commodity the buyer wants delivered per tick. Winning bid is capped at this volume even when the corp allocates more freighters than strictly needed (1 freighter = 3 energy/tick).';
COMMENT ON COLUMN shipping_contracts.delivery_priority IS
    'Buyer-side preference driving auto-award: fastest / safest / cheapest. Cheapest is also the universal tiebreaker across all three.';

NOTIFY pgrst, 'reload schema';
