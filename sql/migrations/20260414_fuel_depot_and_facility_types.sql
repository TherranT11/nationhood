-- ══════════════════════════════════════════════════════════════
-- Fuel Depot & Facility Types — Transit Engine Phase 4
-- ══════════════════════════════════════════════════════════════
-- Adds fuel_depot and dry_dock as constructible facility types.
-- These use the existing `type` column on corp_properties (same
-- pattern as dry_dock queries already in advance-corp-tick).

-- 1. Add fuel_depot and dry_dock catalog entries
INSERT INTO property_catalog
    (name, type, style, base_cost, capacity, base_maintenance, size_class, description, city_template, min_gdp_growth, min_sol, sector_affinity)
VALUES
    ('Fuel Depot — Standard',   'fuel_depot', 'Basic',   15000000,  50,  85000, 'medium',
     'Bulk fuel storage and bunkering facility. Allows your fleet to refuel at base cost and generates revenue when other corps refuel here.',
     'port', 0, 0, 'shipping'),

    ('Fuel Depot — Advanced',   'fuel_depot', 'Modern',  20000000,  80, 110000, 'large',
     'High-capacity fuel terminal with pipeline infrastructure. Faster bunkering, reduced wastage, and premium refueling services for visiting fleets.',
     'port', 25, 20, 'shipping'),

    ('Dry Dock — Standard',     'dry_dock',   'Basic',   35000000, 100, 150000, 'large',
     'Ship repair and maintenance facility. Allows your fleet to dock at base cost and generates revenue when other corps use your dock.',
     'port', 0, 0, 'shipping'),

    ('Dry Dock — Advanced',     'dry_dock',   'Modern',  50000000, 150, 200000, 'large',
     'Full-service shipyard with drydock, crane facilities, and hull repair bays. Faster repairs and premium docking services.',
     'port', 30, 25, 'shipping')

ON CONFLICT DO NOTHING;
