-- ===========================================================================
-- 332 · Kingdoms — ninth card: Accept Homage (top) / Demand Oath (bottom). Fully deferred (display only).
--
-- Both faces act between Houses and rest on vassalage — Accept Homage takes homage from a House of lower rank;
-- Demand Oath targets a House of lower rank and can end in Feud. Neither the multi-House layer, vassalage,
-- Pacts, nor Feuding exist yet, so both sides are playable=false and recorded for the future.
--
-- Draw already skips card_keys with no playable side (see 331), so this is never dealt as a dead card. When
-- vassalage/multi-House land, flipping a side to playable auto-enters it in the pool. Depends on: 318 (cards),
-- 331 (draw filter). Idempotent. Apply after 331.
-- ===========================================================================

insert into public.kingdoms_cards (card_key, side, name, cost_text, cost_gold, cost_food, effects, notes, playable) values
  ('homage', 'top', 'Accept Homage', 'None', 0, 0,
   $j$["A House of lower rank may offer you homage; you accept. They become your Vassal.","Gain +1 House Prestige, and +1 Gold each Taxation for every Vassal you hold.","You owe protection. If your Vassal is attacked and you do not answer, lose 2 House Prestige and the oath breaks.","You may hold Vassals up to your Administration."]$j$::jsonb,
   $j$["Accept Homage needs other Houses and vassalage — stored for display until those systems exist."]$j$::jsonb, false),
  ('homage', 'bottom', 'Demand Oath', 'None', 0, 0,
   $j$["Target a House of lower rank. Roll 1D6.","Modifiers: +1 if your Prowess exceeds theirs by 2 or more, +1 if they hold no Pacts, −2 if they hold a Pact with a House of your rank or higher.","4+ · They must swear to you as Vassal, or refuse and become Feuding with you.","3 or less · They refuse freely. Lose 1 House Prestige — you asked, and were denied before the court."]$j$::jsonb,
   $j$["Demand Oath needs other Houses, vassalage, Pacts, and Feuding — stored for display until those systems exist."]$j$::jsonb, false)
on conflict (card_key, side) do update set
  name = excluded.name, cost_text = excluded.cost_text, cost_gold = excluded.cost_gold,
  cost_food = excluded.cost_food, effects = excluded.effects, notes = excluded.notes, playable = excluded.playable;

notify pgrst, 'reload schema';
