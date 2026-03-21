-- Add 'stimulate_economy' to the executive_orders order_type check constraint
-- These are ideology-flavored economic stimulus orders: one per ideology, once per term, 3 AP each.

-- Drop existing check and recreate with new type
ALTER TABLE executive_orders DROP CONSTRAINT IF EXISTS executive_orders_order_type_check;
ALTER TABLE executive_orders ADD CONSTRAINT executive_orders_order_type_check
    CHECK (order_type IN (
        'acting_minister', 'tax_adjustment', 'price_controls',
        'national_emergency', 'censure', 'stimulate_economy'
    ));
