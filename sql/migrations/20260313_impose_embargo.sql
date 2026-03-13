-- Allow impose_embargo to bypass the nation_a_id < nation_b_id ordering constraint
-- (same as export_subsidy and retaliatory_tariff — unilateral agreements store imposer as nation_a, target as nation_b)
ALTER TABLE trade_agreements DROP CONSTRAINT IF EXISTS chk_trade_agr_nation_order;
ALTER TABLE trade_agreements ADD CONSTRAINT chk_trade_agr_nation_order CHECK (
    agreement_type IN ('export_subsidy', 'retaliatory_tariff', 'impose_embargo') OR nation_a_id < nation_b_id
);
