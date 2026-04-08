-- Add new stat connectors:
--   1. oil_and_gas → manufacturing_output (oil & gas sector feeds industrial production)
--   2. international_reputation → service_output (tourism sector feeds services)
--   3. currency_strength → service_output (financial services sector feeds services)

INSERT INTO stat_connections
    (source_stat, source_dir, threshold, target_stat, target_dir, magnitude, delay_ticks, dampening, category, enabled)
VALUES
    -- Oil & gas resources feed manufacturing (refining, petrochemicals, heavy industry)
    ('oil_and_gas', 'above', 30, 'manufacturing_output', 'up', 0.15, 0, true, 'economic', true),

    -- Tourism (proxied by international reputation) drives service sector output
    ('international_reputation', 'above', 35, 'service_output', 'up', 0.1, 0, true, 'economic', true),

    -- Strong currency attracts financial services activity
    ('currency_strength', 'above', 40, 'service_output', 'up', 0.1, 0, true, 'economic', true);
