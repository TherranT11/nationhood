// Canonical vessel specs. Used for starter-fleet seeding, ship-market purchases,
// and new-build shipyard orders on the client, and mirrored inline in
// supabase/functions/advance-corp-tick/index.ts (kept inline there because the
// Deno edge runtime does not share the browser module graph — keep that copy
// in sync if values change here).
//
// Maintenance values are halved from the pre-rebalance table so organic-route
// bids at the scaled ceiling can actually clear fleet overhead. Fields match
// the corp_vessels / vessel_orders / ship_market_listings column names so
// specs can be spread directly into inserts.

export const VESSEL_SPECS = {
    Coastal:   { capacity_dwt: 14000, capacity_unit: 'DWT', base_maintenance:  90000, fuel_capacity:  800, purchase_price:  3000000 },
    Container: { capacity_dwt:  4800, capacity_unit: 'TEU', base_maintenance: 145000, fuel_capacity: 2100, purchase_price: 65000000 },
    Bulk:      { capacity_dwt: 28000, capacity_unit: 'DWT', base_maintenance: 175000, fuel_capacity: 1800, purchase_price:  3000000 },
    Tanker:    { capacity_dwt: 42000, capacity_unit: 'DWT', base_maintenance: 190000, fuel_capacity: 2400, purchase_price: 53000000 },
    Reefer:    { capacity_dwt: 12000, capacity_unit: 'DWT', base_maintenance: 140000, fuel_capacity: 1600, purchase_price:  6000000 },
    LNG:       { capacity_dwt: 18000, capacity_unit: 'DWT', base_maintenance: 290000, fuel_capacity: 1400, purchase_price: 78000000 },
};

export const VESSEL_CLASSES = ['Coastal', 'Container', 'Bulk', 'Tanker', 'Reefer', 'LNG'];
