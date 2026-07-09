-- Seed: set Wesmore to a Constitutional Monarchy directly.
--
-- One-off admin grant so Wesmore starts as a constitutional monarchy without having to pass
-- the Form-of-State special law on the floor (propose_regime_change, schema/81). A monarchy at
-- reform 0 is a Constitutional Monarchy — it stays a multiparty democracy (the one-party switch
-- only flips for an absolute monarchy, reform ≥ 3). Run in the Supabase SQL Editor after 166.
-- Matched loosely (the nation is "Wesmore and Calcordia"), so any "…Wesmore…" name resolves;
-- if more than one matched you'd want to tighten this.
update public.nations
   set economy = jsonb_set(
         jsonb_set(coalesce(economy, '{}'::jsonb) - 'regime', '{regime_type}', to_jsonb('monarchy'::text), true),
         '{regime_reform}', to_jsonb(0), true)
 where name ilike '%wesmore%';

-- Reconcile the one-party derivation for the affected nation(s) (no-op for a Constitutional
-- Monarchy — it stays multiparty — but keeps ruling_party consistent if the regime was
-- previously one-party). _sync_one_party_state is the single source for that transition (schema/98).
do $$
declare r record;
begin
  for r in select id from public.nations where name ilike '%wesmore%' loop
    perform public._sync_one_party_state(r.id);
  end loop;
end $$;
