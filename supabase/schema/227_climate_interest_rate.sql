-- ===========================================================================
-- 227 · Business climate — swap the Prosperity input for Interest Rates.
--
-- The climate used to reward Prosperity (a +term). Interest Rates is the more direct cost-of-capital
-- signal firms actually feel, so it replaces Prosperity here. High rates HURT the climate (dear money
-- chokes investment), so — like Tax Burden, Inflation and Unemployment — it is SUBTRACTED, baselined at
-- the NEUTRAL rate (3%, INTEREST_RATE.neutral / _nation_interest_rate's v_neutral) so an ordinary-rate
-- economy is neutral, and weighted 0.3 to sit alongside the other economic-pressure inputs.
--
--   climate = (Growth − 50)·0.2  −  (InterestRate − 3)·0.3  −  (TaxBurden − 25)·0.04
--             − (Inflation − 10)·0.3  −  (Unemployment − 7)·0.3
--
-- KNOBS (tune freely): NEUTRAL 3%, WEIGHT 0.3. The value read is _nation_interest_rate (schema/225 — the
-- ONE source the tile + detail page also read, so the breakdown agrees with the headline rate).
-- _business_climate stays the authoritative score; _business_climate_parts is its display mirror and MUST
-- MATCH it. Depends on: 47 (_business_climate*, _nation_live_stat, _nation_tax_burden), 225
-- (_nation_interest_rate). Idempotent. Apply after 225.
-- ===========================================================================

set check_function_bodies = off;

create or replace function public._business_climate(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select round((
      (public._nation_live_stat(p_nation, 'Growth')       - 50) * 0.2
    - (public._nation_interest_rate(p_nation)             -  3) * 0.3
    - (public._nation_tax_burden(p_nation)                - 25) * 0.04
    - (coalesce((n.economy->>'inflation')::numeric, 0)    - 10) * 0.3
    - (coalesce((n.economy->>'unemployment')::numeric, 0) -  7) * 0.3
  )::numeric, 1)
  from public.nations n where n.id = p_nation;
$$;

-- Display mirror — same baselines/weights as _business_climate above. The Interest Rates figure is a %
-- (like Tax Burden / Inflation / Unemployment); its contribution is negative (rates drag the climate).
create or replace function public._business_climate_parts(p_nation text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_array(
    jsonb_build_object('label','Growth',        'unit','/100', 'value', public._nation_live_stat(p_nation, 'Growth'),
      'contrib', round((public._nation_live_stat(p_nation, 'Growth') - 50) * 0.2, 1)),
    jsonb_build_object('label','Interest Rates','unit','%',   'value', public._nation_interest_rate(p_nation),
      'contrib', round(-(public._nation_interest_rate(p_nation) - 3) * 0.3, 1)),
    jsonb_build_object('label','Tax Burden',    'unit','%',   'value', public._nation_tax_burden(p_nation),
      'contrib', round(-(public._nation_tax_burden(p_nation) - 25) * 0.04, 1)),
    jsonb_build_object('label','Inflation',     'unit','%',   'value', coalesce((n.economy->>'inflation')::numeric, 0),
      'contrib', round(-(coalesce((n.economy->>'inflation')::numeric, 0) - 10) * 0.3, 1)),
    jsonb_build_object('label','Unemployment',  'unit','%',   'value', coalesce((n.economy->>'unemployment')::numeric, 0),
      'contrib', round(-(coalesce((n.economy->>'unemployment')::numeric, 0) - 7) * 0.3, 1))
  )
  from public.nations n where n.id = p_nation;
$$;

revoke all on function public._business_climate(text)       from public, anon, authenticated;
revoke all on function public._business_climate_parts(text) from public, anon, authenticated;

notify pgrst, 'reload schema';
