-- Add domestic_demand column to trade_flows.
--
-- Purpose: mirror of domestic_production (added 2026-04-21). The UI already
-- shows DOMESTIC PRODUCTION and IMPORT DEMAND, but the full consumption
-- picture requires a third value — the nation's GROSS domestic demand
-- (total fuel burned each tick before the domestic-coverage offset is
-- applied). That value is implicitly computed inside calculateImportDemand
-- but never stored, so the UI can't display it.
--
-- Populated every tick by processTradeFlows (js/game/trade-constants.js).
-- Currently written only for sector='fuel_energy'; other sectors leave it
-- at the default 0 until they get the same gross-demand treatment.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS.

ALTER TABLE trade_flows
    ADD COLUMN IF NOT EXISTS domestic_demand NUMERIC NOT NULL DEFAULT 0;

COMMENT ON COLUMN trade_flows.domestic_demand IS
    'Gross domestic demand per tick — total fuel/goods the nation consumes '
    'before domestic-coverage offset. Currently populated for fuel_energy only.';
