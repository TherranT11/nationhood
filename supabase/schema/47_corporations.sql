-- ===========================================================================
-- 47 · Corporations — firms that ride each nation's business climate.
--
-- Admin-authored via /adminsetup (is_admin RLS, same pattern as nations/modifiers).
-- The climate math lives in corporations.js (client) for display; Phase 2 will mirror it
-- in SQL for the tick automation (generation-list release, per-firm growth, sector bonuses)
-- so the formula has ONE server-side source the tick reads. Every nation starts empty.
--
-- status:
--   'placed' — live in the nation's register now.
--   'queued' — on the Growing Economy Generation List; enters as a Startup (seeded with
--              roll_m) once the nation's climate is healthy (Phase 2 auto-release).
-- ===========================================================================
create table if not exists public.corporations (
  id          uuid primary key default gen_random_uuid(),
  nation_id   text not null references public.nations (id) on delete cascade,
  name        text not null,
  category    text not null,                    -- sector (Energy, Finance, …) — drives the sector bonus
  type        text not null default 'pr',       -- 'pr' private | 'so' state-owned
  size        text not null default 'Moderate', -- Startup | Moderate | Enterprise | National Corporation | International Conglomerate
  cash        numeric not null default 0,       -- $B
  debt        numeric not null default 0,       -- $B  (>= 0)
  drift       int     not null default 0,       -- the firm's own trajectory; _corp_growth reads it (with climate + director Acumen), applied per tick
  status      text    not null default 'placed',-- 'placed' | 'queued'
  roll_m      int,                              -- queued: rolled startup cash in $M (1D60+20); null once placed
  director    text,                             -- the NPC director's name, drawn from the nation's name pool at creation
  acumen      int,                              -- the director's Acumen competency, 1D4 (1–4)
  created_at  timestamptz not null default now()
);
create index if not exists corporations_nation_idx on public.corporations (nation_id);
-- Director columns are additive so existing deployments pick them up on re-apply;
-- corp_create seeds them, and supabase/backfill_corp_directors.sql fills legacy rows.
alter table public.corporations add column if not exists director text;
alter table public.corporations add column if not exists acumen   int;

-- RLS: everyone reads (the World/Corporations register is public); only admins write
-- directly. The Phase 2 tick functions run security definer, so they bypass these.
alter table public.corporations enable row level security;
drop policy if exists "corp_select_all"   on public.corporations;
create policy "corp_select_all"   on public.corporations for select using (true);
drop policy if exists "corp_insert_admin" on public.corporations;
create policy "corp_insert_admin" on public.corporations for insert with check (public.is_admin());
drop policy if exists "corp_update_admin" on public.corporations;
create policy "corp_update_admin" on public.corporations for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "corp_delete_admin" on public.corporations;
create policy "corp_delete_admin" on public.corporations for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Phase 2 · ONE server-side source for the business climate. The tick AND the client both
-- read these; the JS copies (businessClimate/corpGrowth in corporations.js, nationTaxBurden
-- in policies.js) are retired in favour of the corp_register / nation_tax_burden RPCs below.
-- The climate depends on the DERIVED tax burden, so that ports too.
-- ---------------------------------------------------------------------------

-- Nation Tax Burden % — the SUM of every in-force policy's 'Tax Burden' EFFECT, clamped 0..100. This
-- delegates to _nation_policy_stat (schema/152), the exact SQL mirror of nationStatContributions
-- (policies.js) — so the figure equals precisely the laws listed on the Tax Burden page (e.g. Wage Tax
-- +9). The old path read a legacy scalar option.taxBurden key that modern effect-based laws never set,
-- and it added the economy.tax seed on top; both are retired (schema/10 always intended the seed to
-- fall to 0 as policies filled the figure in). plpgsql so the schema/152 call resolves at runtime (152
-- is applied after this file).
create or replace function public._nation_tax_burden(p_nation text)
returns numeric language plpgsql stable security definer set search_path = public as $$
begin
  return greatest(0, least(100, coalesce(public._nation_policy_stat(p_nation, 'Tax Burden'), 0)));
end $$;

-- ONE source for a nation's LIVE stat value: the authored base (ministry_stats, schema/150, with the
-- legacy stats.* mirror as the fallback for the consolidated Prosperity / Growth / Rule of Law) PLUS
-- the sum of in-force policy effects on it (_nation_policy_stat, schema/152) — i.e. exactly the
-- base+contribution the Government page shows, so every reader agrees. plpgsql so the schema/152 call
-- resolves at runtime (152 is applied after this file). Depends on: 150, 152, 70 (_to_num).
create or replace function public._nation_live_stat(p_nation text, p_stat text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_base numeric; v_leg text;
begin
  v_leg := case p_stat when 'Growth' then 'growth' when 'Prosperity' then 'prosperity' when 'Rule of Law' then 'order' end;
  select coalesce(public._to_num(ministry_stats->>p_stat),
                  case when v_leg is not null then public._to_num(stats->>v_leg) end, 0)
    into v_base from public.nations where id = p_nation;
  return coalesce(v_base, 0) + coalesce(public._nation_policy_stat(p_nation, p_stat), 0);
end $$;
revoke all on function public._nation_live_stat(text, text) from public, anon, authenticated;

-- Business climate — how far the nation's economy sits above/below the world baseline
-- (CLIMATE_BASE: tax 25, growth 50, prosperity 60, unemployment 7, inflation 10). Growth and
-- Prosperity are the LIVE stat (base + policy effects, _nation_live_stat above — the same value the
-- Government page shows) on the 1..100 scale; their baselines/weights are the 5×-normalized old 1..20
-- tuning (−50 ×0.2 / −60 ×0.06). The tax input is the DERIVED burden. The FORMULA lives here only.
create or replace function public._business_climate(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select round((
      (public._nation_live_stat(p_nation, 'Growth')       - 50) * 0.2
    + (public._nation_live_stat(p_nation, 'Prosperity')   - 60) * 0.06
    - (public._nation_tax_burden(p_nation)                - 25) * 0.04
    - (coalesce((n.economy->>'inflation')::numeric, 0)    - 10) * 0.3
    - (coalesce((n.economy->>'unemployment')::numeric, 0) -  7) * 0.3
  )::numeric, 1)
  from public.nations n where n.id = p_nation;
$$;

-- The five figures behind the business climate and each one's signed contribution
-- to the score — the Corporations-page breakdown. The baselines + weights MUST MATCH
-- _business_climate above (this is the display mirror; _business_climate stays the
-- authoritative score). Contributions are rounded for display and sum to that score.
create or replace function public._business_climate_parts(p_nation text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_array(
    jsonb_build_object('label','Growth',       'unit','/100', 'value', public._nation_live_stat(p_nation, 'Growth'),
      'contrib', round((public._nation_live_stat(p_nation, 'Growth') - 50) * 0.2, 1)),
    jsonb_build_object('label','Prosperity',   'unit','/100', 'value', public._nation_live_stat(p_nation, 'Prosperity'),
      'contrib', round((public._nation_live_stat(p_nation, 'Prosperity') - 60) * 0.06, 1)),
    jsonb_build_object('label','Tax Burden',   'unit','%',   'value', public._nation_tax_burden(p_nation),
      'contrib', round(-(public._nation_tax_burden(p_nation) - 25) * 0.04, 1)),
    jsonb_build_object('label','Inflation',    'unit','%',   'value', coalesce((n.economy->>'inflation')::numeric, 0),
      'contrib', round(-(coalesce((n.economy->>'inflation')::numeric, 0) - 10) * 0.3, 1)),
    jsonb_build_object('label','Unemployment', 'unit','%',   'value', coalesce((n.economy->>'unemployment')::numeric, 0),
      'contrib', round(-(coalesce((n.economy->>'unemployment')::numeric, 0) - 7) * 0.3, 1))
  )
  from public.nations n where n.id = p_nation;
$$;

-- A firm's growth = climate + its drift + the director's edge − a hard debt drag, clamped ±9.
-- The director's Acumen (1–4) tilts the firm: (acumen − 2.5) × 0.8 ≈ −1.2 (weak) … +1.2 (sharp),
-- so a sharp director carries a firm through a poor climate while a weak one drags it in a boom.
-- Null acumen (legacy rows) is neutral. ONE source — there is no JS mirror (the client reads the
-- corp_register RPC). The old 3-arg version (pre-Acumen) is dropped at the foot of this file.
create or replace function public._corp_growth(p_drift numeric, p_debt numeric, p_climate numeric, p_acumen numeric)
returns numeric language sql immutable as $$
  select greatest(-9, least(9, round((
      p_climate
    + coalesce(p_drift, 0)
    + (coalesce(p_acumen, 2.5) - 2.5) * 0.8
    - (case when coalesce(p_debt, 0) > 0 then coalesce(p_debt, 0) * 3 else 0 end)
  )::numeric, 1)));
$$;

-- RPC: the public register for a nation — climate, derived tax burden, and each placed firm
-- with its derived growth. ONE source the corporations page renders directly (no JS formula).
create or replace function public.corp_register(p_nation text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'climate',   public._business_climate(p_nation),
    'climateParts', public._business_climate_parts(p_nation),
    'taxBurden', public._nation_tax_burden(p_nation),
    'firms', coalesce((
      select jsonb_agg(jsonb_build_object(
          'name', c.name, 'type', c.type, 'size', c.size, 'category', c.category,
          'cash', c.cash, 'debt', c.debt,
          'growth', public._corp_growth(c.drift, c.debt, public._business_climate(p_nation), c.acumen),
          -- Director: an NPC who runs the firm (no player party, no age modelled yet).
          'director_name', c.director, 'director_acu', c.acumen,
          'director_party', null, 'director_age', null
        ) order by c.created_at)
      from public.corporations c
      where c.nation_id = p_nation and c.status = 'placed'
    ), '[]'::jsonb)
  );
$$;

-- RPC: a nation's derived Tax Burden % (the home glance reads this).
create or replace function public.nation_tax_burden(p_nation text)
returns numeric language sql stable security definer set search_path = public as $$
  select public._nation_tax_burden(p_nation);
$$;

revoke all on function public._nation_tax_burden(text)    from public, anon, authenticated;
revoke all on function public._business_climate(text)     from public, anon, authenticated;
revoke all on function public._business_climate_parts(text) from public, anon, authenticated;
grant execute on function public.corp_register(text)     to anon, authenticated;
grant execute on function public.nation_tax_burden(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Phase 2b · Sector bonus — a ONE-TIME amount a placed firm adds to its nation, by SIZE
-- (Startup +0.1 … International +0.5), to the production resource or stat its sector maps to.
-- Applied on placement, reversed if the firm folds/is removed (the addition is lost). Firms
-- never shrink, so a bonus is only ever added once and removed once. Finance/Construction/
-- Logistics are rule-modifiers with no production/stat target (no-op). ONE source for the
-- amount+target: the tick (release/fold) and the admin create/delete RPCs all call this.
-- ---------------------------------------------------------------------------
create or replace function public._corp_bonus_amount(p_size text)
returns numeric language sql immutable as $$
  select case lower(p_size)
    when 'startup' then 0.1 when 'moderate' then 0.2 when 'enterprise' then 0.3
    when 'national corporation' then 0.4 when 'international conglomerate' then 0.5 else 0 end;
$$;

create or replace function public._corp_apply_bonus(p_corp public.corporations, p_sign int)
returns void language plpgsql security definer set search_path = public as $$
declare v_amt numeric; v_col text; v_key text; v_lo numeric; v_hi numeric;
begin
  v_amt := p_sign * public._corp_bonus_amount(p_corp.size);
  if v_amt = 0 then return; end if;
  case p_corp.category
    when 'Energy','Nuclear'                          then v_col:='production'; v_key:='energy';     v_lo:=0; v_hi:=null;
    when 'Agriculture'                               then v_col:='production'; v_key:='food';       v_lo:=0; v_hi:=null;
    when 'Mining'                                    then v_col:='production'; v_key:='minerals';   v_lo:=0; v_hi:=null;
    when 'Heavy Industry','Shipping','Manufacturing' then v_col:='production'; v_key:='goods';      v_lo:=0; v_hi:=null;
    when 'Telecom','Services'                        then v_col:='production'; v_key:='services';   v_lo:=0; v_hi:=null;
    when 'Airline'                                   then v_col:='production'; v_key:='diplomacy';  v_lo:=0; v_hi:=null;
    when 'Aerospace'                                 then v_col:='stats';      v_key:='image';      v_lo:=1; v_hi:=20;
    when 'Pharma'                                    then v_col:='stats';      v_key:='welfare';    v_lo:=1; v_hi:=20;
    when 'Retail'                                    then v_col:='stats';      v_key:='prosperity'; v_lo:=1; v_hi:=20;
    when 'Rail'                                      then v_col:='stats';      v_key:='growth';     v_lo:=1; v_hi:=20;
    else return;  -- Finance / Construction / Logistics: rule-modifiers, no production/stat target
  end case;
  perform public._nation_stat_add(p_corp.nation_id, v_col, v_key, v_amt, v_lo, v_hi);
end $$;

-- One place to write a corporation event to the shared feed (kind 'corporation';
-- no owning party). All four lifecycle announcements below route through this.
create or replace function public._corp_event(p_nation text, p_body text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.events (nation_id, party_id, kind, body, game_date)
  values (p_nation, null, 'corporation', p_body, public.current_game_date());
end $$;

-- The "started operations" announcement — fired wherever a firm becomes placed:
-- created placed-now (corp_create) OR released from the generation list (the tick).
create or replace function public._corp_started_event(p_nation text, p_name text, p_category text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public._corp_event(p_nation,
    p_name || ' has started operations in '
      || coalesce((select name from public.nations where id = p_nation), p_nation)
      || ', they are expected to expand operations in the ' || p_category || ' sector.');
end $$;

-- Place a firm and, if it starts placed, apply its sector bonus + announce it. The NON-gated core that
-- corp_create (admin) and the card 'corp_create' effect (schema/185) share — ONE source for founding a
-- firm (director draw + bonus + started event). Returns the new id.
create or replace function public._corp_place(p_nation text, p_name text, p_category text, p_type text,
  p_size text, p_cash numeric, p_debt numeric, p_drift int, p_status text, p_roll_m int)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_corp public.corporations; v_first text; v_last text; v_director text;
begin
  -- Seed an NPC director: a random name from the nation's pool + 1D4 Acumen. Applies whether the firm is
  -- placed now or queued onto the generation list. Null name only if the nation has no names seeded yet.
  select first_name, last_name into v_first, v_last from public._random_name(p_nation);   -- shared draw (schema/50)
  v_director := nullif(btrim(concat_ws(' ', v_first, v_last)), '');
  insert into public.corporations (nation_id, name, category, type, size, cash, debt, drift, status, roll_m, director, acumen)
  values (p_nation, p_name, p_category, p_type, p_size, p_cash, p_debt, p_drift, coalesce(p_status,'placed'), p_roll_m,
          v_director, floor(random() * 4)::int + 1)
  returning * into v_corp;
  if v_corp.status = 'placed' then
    perform public._corp_apply_bonus(v_corp, 1);
    perform public._corp_started_event(v_corp.nation_id, v_corp.name, v_corp.category);  -- a queued firm announces on release instead
  end if;
  return v_corp.id;
end $$;
revoke all on function public._corp_place(text, text, text, text, text, numeric, numeric, int, text, int) from public, anon, authenticated;

-- RPC: admin creates a firm (the gated wrapper over _corp_place).
create or replace function public.corp_create(p_nation text, p_name text, p_category text, p_type text,
  p_size text, p_cash numeric, p_debt numeric, p_drift int, p_status text, p_roll_m int)
returns uuid language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return public._corp_place(p_nation, p_name, p_category, p_type, p_size, p_cash, p_debt, p_drift, p_status, p_roll_m);
end $$;

-- RPC: admin deletes a firm; reverse its sector bonus first if it was placed (the addition is lost).
create or replace function public.corp_delete(p_corp uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_corp public.corporations;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into v_corp from public.corporations where id = p_corp;
  if not found then return; end if;
  if v_corp.status = 'placed' then perform public._corp_apply_bonus(v_corp, -1); end if;
  delete from public.corporations where id = p_corp;
end $$;

-- RPC: the government buys a PRIVATE firm into public ownership (private → state).
-- The sector bonus is type-agnostic (size + category only), so ownership flips need
-- no bonus change; the deal just announces itself to the feed.
create or replace function public.corp_nationalize(p_corp uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_corp public.corporations;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into v_corp from public.corporations where id = p_corp;
  if not found then raise exception 'That corporation no longer exists.'; end if;
  if v_corp.status <> 'placed' then raise exception 'That firm has not started operations yet.'; end if;
  if v_corp.type = 'so' then raise exception 'That corporation is already state-owned.'; end if;
  update public.corporations set type = 'so' where id = p_corp;
  perform public._corp_event(v_corp.nation_id,
    'The government of ' || coalesce((select name from public.nations where id = v_corp.nation_id), v_corp.nation_id)
    || ' completed the purchase of ' || v_corp.name || ', expanding government services into the ' || v_corp.category || ' sector.');
end $$;

-- RPC: the government sells a STATE firm back to investors (state → private). A
-- privatised firm can now fold like any private one if its cash runs out.
create or replace function public.corp_privatize(p_corp uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_corp public.corporations;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into v_corp from public.corporations where id = p_corp;
  if not found then raise exception 'That corporation no longer exists.'; end if;
  if v_corp.status <> 'placed' then raise exception 'That firm has not started operations yet.'; end if;
  if v_corp.type = 'pr' then raise exception 'That corporation is already private.'; end if;
  update public.corporations set type = 'pr' where id = p_corp;
  perform public._corp_event(v_corp.nation_id,
    'The government of ' || coalesce((select name from public.nations where id = v_corp.nation_id), v_corp.nation_id)
    || ' has completed the sale of ' || v_corp.name || ' to investors, bringing in much needed competition into the ' || v_corp.category || ' sector.');
end $$;

revoke all on function public._corp_apply_bonus(public.corporations, int) from public, anon, authenticated;
grant execute on function public.corp_create(text, text, text, text, text, numeric, numeric, int, text, int) to authenticated;
grant execute on function public.corp_delete(uuid) to authenticated;
grant execute on function public.corp_nationalize(uuid) to authenticated;
grant execute on function public.corp_privatize(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Phase 2c · The corporations tick (called by advance_tick, schema/60):
--   1. Generation-list release — a queued firm enters (placed) when its nation's climate is
--      healthy (>= 0.5, the climateWord 'Healthy' band), applying its sector bonus.
--   2. Cash growth — each placed firm's cash compounds by its growth (_corp_growth: climate +
--      drift + director Acumen edge − debt drag, ±9%).
--   3. Fold — a PRIVATE firm whose cash falls to <= 0 goes under: reverse its sector bonus and
--      remove it. State-owned firms never fold (government-backed).
-- Climate is snapshotted once per nation up front, so releases are deterministic (a release's
-- own +prosperity/+growth bonus can't cascade into another release the same tick) and the
-- expensive climate isn't recomputed per firm.
-- ---------------------------------------------------------------------------
create or replace function public._apply_corp_tick()
returns void language plpgsql security definer set search_path = public as $$
declare r record; v_clim numeric; v_growth numeric; v_newcash numeric;
begin
  drop table if exists _corp_clim;
  create temp table _corp_clim on commit drop as
    select id as nation_id, public._business_climate(id) as climate from public.nations;

  for r in select c.* from public.corporations c where c.status = 'queued' loop
    select climate into v_clim from _corp_clim where nation_id = r.nation_id;
    if coalesce(v_clim, 0) >= 0.5 then
      update public.corporations set status = 'placed', roll_m = null where id = r.id;
      perform public._corp_apply_bonus(r, 1);   -- r still carries size/category/nation_id
      perform public._corp_started_event(r.nation_id, r.name, r.category);
    end if;
  end loop;

  for r in select c.* from public.corporations c where c.status = 'placed' loop
    select climate into v_clim from _corp_clim where nation_id = r.nation_id;
    v_growth  := public._corp_growth(r.drift, r.debt, coalesce(v_clim, 0), r.acumen);
    v_newcash := round(r.cash * (1 + v_growth / 100.0), 4);
    if r.type = 'pr' and v_newcash <= 0 then
      perform public._corp_event(r.nation_id,
        'Bad news from ' || coalesce((select name from public.nations where id = r.nation_id), r.nation_id)
        || ' as ' || r.name || ', a ' || r.category || ' titan, has ceased operations, liquidating its assets and defaulting on its debts.');
      perform public._corp_apply_bonus(r, -1);
      delete from public.corporations where id = r.id;
    else
      update public.corporations set cash = v_newcash where id = r.id;
    end if;
  end loop;
end $$;
revoke all on function public._apply_corp_tick() from public, anon, authenticated;

-- Retire the pre-Acumen 3-arg _corp_growth now that corp_register + the tick use the 4-arg form.
-- Safe to run last: both dependents above were just recreated against the new signature.
drop function if exists public._corp_growth(numeric, numeric, numeric);

notify pgrst, 'reload schema';
