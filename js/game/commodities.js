// Commodity vocabulary — single source for the 6-bucket commodity
// system written/read at nation_commodity_state (CHECK constraint in
// migration 20270692). Display surfaces (politician-economy.html's
// strip, cabinet-office.html's Domestic Economy panel, and any future
// commodity-driven view) import this list rather than re-declaring it,
// so a rename here propagates without hunting for copies.
//
// Order is the player-facing display order — extraction commodities
// (crude_oil, minerals, foodstuffs) first, then synthesized /
// service-style buckets (consumer_goods, services, diplomacy).
//
// production_per_tick is NULL by CHECK for consumer_goods / services /
// diplomacy — only the first three buckets carry a production rate.
// Display code reads that NULL directly off nation_commodity_state and
// hides the row; no flag is stored here.
export const COMMODITIES = [
  { key: 'crude_oil',      name: 'Crude Oil'      },
  { key: 'minerals',       name: 'Minerals'       },
  { key: 'foodstuffs',     name: 'Foodstuffs'     },
  { key: 'consumer_goods', name: 'Consumer Goods' },
  { key: 'services',       name: 'Services'       },
  { key: 'diplomacy',      name: 'Diplomacy'      },
];
