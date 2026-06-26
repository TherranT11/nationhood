-- One-off: set each nation's Military production to its intended starting value, and bring its
-- Military on-hand to match (= production, 1:1, the same rule the other commodities use).
--
-- Matches by name (case-insensitive, partial) so the short labels map onto the full DB names
-- (e.g. 'vesperia' → 'Federated States of Vesperia'). EDIT the values/patterns to your world.
-- Safe while the Market is read-only; don't re-run after trading goes live (it resets on-hand).
update public.nations
   set production = production || jsonb_build_object('military', v.mil),
       on_hand    = on_hand    || jsonb_build_object('military', v.mil)
  from (values
    ('sessau',    1),
    ('vesperia',  4),
    ('severia',   5),
    ('laurentia', 0),
    ('wesmore',   1)
  ) as v(pat, mil)
 where lower(public.nations.name) like '%' || v.pat || '%';
