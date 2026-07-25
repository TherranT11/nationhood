-- ===========================================================================
-- 333 · Kingdoms — tenth card: Pillage (top) / Trade (bottom). Fully deferred (display only).
--
-- Both faces act against/with another House. Pillage raids an enemy Holding (needs a Cause/Feud/open war, the
-- target's Defense, and building destruction); Trade is a negotiated exchange or Trade Route with another House
-- (needs goods, Pacts, and both players' agreement). Neither the multi-House layer, war/Feud, goods, nor Pacts
-- exist yet, so both sides are playable=false and recorded for the future.
--
-- This is the tenth (final) card type — the 50-card deck is now fully catalogued. Draw already skips card_keys
-- with no playable side (see 331), so this is never dealt as a dead card. Depends on: 318 (cards), 331 (draw
-- filter). Idempotent. Apply after 332.
-- ===========================================================================

insert into public.kingdoms_cards (card_key, side, name, cost_text, cost_gold, cost_food, effects, notes, playable) values
  ('pillage', 'top', 'Pillage', 'Requires mustered levies and a Cause, a Feud, or open war', 0, 0,
   $j$["Target an enemy Holding. Roll 1D6 + your levies + your Prowess, against their Defense (Watchtower +2, Stone Keep +5).","You win by 3 or more · Steal 1D6 Gold, destroy 1 building, the Holding loses 1D2 Population and gains 2 Unrest.","You win by 1–2 · Steal 1D2 Gold, the Holding gains 1 Unrest.","You lose · Your levies are driven off. Lose 1D2 levies and 1 House Prestige.","A Stone Keep protects all buildings in that Holding — no building may be destroyed while it stands.","Unless you are at open war, pillaging costs you 1 House Prestige regardless of outcome. It is theft with an army."]$j$::jsonb,
   $j$["Pillage needs other Houses, Feud/war, and Defense — stored for display until those systems exist."]$j$::jsonb, false),
  ('pillage', 'bottom', 'Trade', 'None · requires a Market, a Merchant Guild, or a standing Pact', 0, 0,
   $j$["Offer another House an exchange of Gold, Food, or goods (Wool, Livestock, ore). Both players must agree.","On completion both Houses gain +1 House Prestige. A Merchant Guild grants its owner +2 Gold on top.","You may instead establish a Trade Route: both Houses gain +2 Gold each Taxation until the end of next year. A Trade Route ends immediately if either House declares Feud on the other.","May not be played with a House you are Feuding with, or with a Holding under Plague."]$j$::jsonb,
   $j$["Trade needs other Houses, goods, and Pacts — stored for display until those systems exist."]$j$::jsonb, false)
on conflict (card_key, side) do update set
  name = excluded.name, cost_text = excluded.cost_text, cost_gold = excluded.cost_gold,
  cost_food = excluded.cost_food, effects = excluded.effects, notes = excluded.notes, playable = excluded.playable;

notify pgrst, 'reload schema';
