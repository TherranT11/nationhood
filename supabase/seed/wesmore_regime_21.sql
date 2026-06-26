-- Seed: set Wesmore to Regime 21 (Constitutional Monarchy) directly.
--
-- One-off admin grant so Wesmore starts as a constitutional monarchy without
-- having to pass the Form-of-State special law on the floor (propose_regime_change,
-- schema/81). 21 is the bottom of the monarchy band (21–23 = Constitutional; it stays
-- a multiparty democracy — the one-party switch only flips at regime ≤4 or ≥24). Run
-- in the Supabase SQL Editor. Matched loosely (the nation is "Wesmore and Calcordia"),
-- so any "…Wesmore…" name resolves; if more than one matched you'd want to tighten this.
update public.nations
   set economy = jsonb_set(coalesce(economy, '{}'::jsonb), '{regime}', to_jsonb(21), true)
 where name ilike '%wesmore%';

-- Reconcile the one-party derivation for the affected nation(s) (no-op at 21 — it stays
-- multiparty — but keeps ruling_party consistent if the regime was previously in a
-- one-party band). _sync_one_party_state is the single source for that transition (schema/98).
do $$
declare r record;
begin
  for r in select id from public.nations where name ilike '%wesmore%' loop
    perform public._sync_one_party_state(r.id);
  end loop;
end $$;
