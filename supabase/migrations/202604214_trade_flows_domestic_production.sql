-- Add domestic_production column to trade_flows.
--
-- Purpose: the "Prod" column on the economy and trade-negotiation UIs used to
-- read export_capacity, which is gross production minus domestic demand
-- (i.e. exportable surplus). That's misleading — a Finance/petro-state that
-- consumes all its own output showed "Prod = $10M" (the min floor) even
-- though its domestic production was multi-billion. This column captures
-- gross domestic production (after sector multipliers + stability) so the
-- UI can show what the nation actually makes each tick.
--
-- Populated every tick by processTradeFlows (js/game/trade-constants.js).
-- Pre-existing rows get 0 via the default; next tick repopulates.

ALTER TABLE trade_flows
    ADD COLUMN IF NOT EXISTS domestic_production NUMERIC NOT NULL DEFAULT 0;

COMMENT ON COLUMN trade_flows.domestic_production IS
    'Gross domestic production per tick, after sector multipliers and stability, before domestic-demand subtraction and export modifiers.';
