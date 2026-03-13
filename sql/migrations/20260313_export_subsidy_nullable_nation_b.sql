-- Allow export_subsidy agreements to have null nation_b_id (unilateral — no partner nation)
ALTER TABLE trade_agreements ALTER COLUMN nation_b_id DROP NOT NULL;
