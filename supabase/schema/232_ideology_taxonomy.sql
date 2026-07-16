-- ===========================================================================
-- 232 · Ideology taxonomy — the 7-axis ideology a party declares, and the
--       national conditions that feed / bleed its Party Approval in opposition.
--
-- Replaces the vestigial 11-archetype system (parties.archetype was made nullable and never
-- written; every party read as "No Ideology"). A party now DECLARES one of seven ideologies
-- (Far Left · Left · Center · Right · Far Right · Libertarian · Green) from the Party page.
-- The chosen NAME is stored in parties.archetype (reusing the existing nullable name column —
-- no new column, ideologyLabel/partyColor keep working across every page).
--
--   • ideology_conditions: the (ideology → stat, direction, bump|drop) mapping the winds read
--     (schema/233). MIRRORS the bump/drop lists in archetypes.js — the JS copy is the modal's
--     display source, this table is the mechanic's. KEEP THE TWO IN SYNC.
--   • declare_ideology(name): sets parties.archetype for 1 Action Point (mirrors edit_party,
--     schema/102), writing a party event. Changeable anytime, no cooldown.
--
-- Depends on: 20 (parties), 40 (_lock_party / _spend_action_point / events), current_game_date.
-- Idempotent. Apply after 231.
-- ===========================================================================

set check_function_bodies = off;

-- The ideology → condition map. dir 'HIGH' = the stat above the neutral band helps; 'LOW' =
-- below the band helps. kind 'bump' lifts approval, 'drop' bleeds it (opposition only). stat
-- names are canonical POLICY_STATS (policies.js) read via nation_stat_values.
create table if not exists public.ideology_conditions (
  ideology text not null,
  stat     text not null,
  dir      text not null check (dir in ('HIGH', 'LOW')),
  kind     text not null check (kind in ('bump', 'drop')),
  primary key (ideology, kind, stat)
);

-- Re-seed from scratch each apply so the table always matches this file (and archetypes.js).
delete from public.ideology_conditions;
insert into public.ideology_conditions (ideology, stat, dir, kind) values
  ('Far Left',    'Poverty',            'HIGH', 'bump'),
  ('Far Left',    'Unemployment',       'HIGH', 'bump'),
  ('Far Left',    'Prosperity',         'HIGH', 'drop'),
  ('Far Left',    'Standard of Living', 'HIGH', 'drop'),
  ('Left',        'Wages',              'LOW',  'bump'),
  ('Left',        'Health',             'LOW',  'bump'),
  ('Left',        'Prosperity',         'HIGH', 'drop'),
  ('Left',        'Extremism',          'HIGH', 'drop'),
  ('Center',      'Prosperity',         'HIGH', 'bump'),
  ('Center',      'Rule of Law',        'HIGH', 'bump'),
  ('Center',      'Inflation',          'HIGH', 'drop'),
  ('Center',      'Extremism',          'HIGH', 'drop'),
  ('Right',       'Crime',              'HIGH', 'bump'),
  ('Right',       'Immigration',        'HIGH', 'bump'),
  ('Right',       'Unemployment',       'HIGH', 'drop'),
  ('Right',       'Wages',              'LOW',  'drop'),
  ('Far Right',   'Immigration',        'HIGH', 'bump'),
  ('Far Right',   'National Pride',     'LOW',  'bump'),
  ('Far Right',   'Social Integration', 'HIGH', 'drop'),
  ('Far Right',   'Prosperity',         'HIGH', 'drop'),
  ('Libertarian', 'Tax Burden',         'HIGH', 'bump'),
  ('Libertarian', 'Bureaucracy',        'HIGH', 'bump'),
  ('Libertarian', 'Crime',              'HIGH', 'drop'),
  ('Libertarian', 'Revolt Risk',        'HIGH', 'drop'),
  ('Green',       'Environment',        'LOW',  'bump'),
  ('Green',       'CO₂ Emissions',      'HIGH', 'bump'),
  ('Green',       'Unemployment',       'HIGH', 'drop'),
  ('Green',       'Poverty',            'HIGH', 'drop');

-- Read-only reference data (the ideology list / conditions aren't secret). RLS on, select-all.
alter table public.ideology_conditions enable row level security;
drop policy if exists ideology_conditions_read on public.ideology_conditions;
create policy ideology_conditions_read on public.ideology_conditions for select using (true);

-- Declare (or change) the caller's ideology for 1 Action Point. Server-authoritative: the
-- value is validated against the seeded set, so a client can't store an arbitrary ideology.
create or replace function public.declare_ideology(p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_party public.parties%rowtype; v_name text;
begin
  v_party := public._lock_party();
  v_name := btrim(coalesce(p_name, ''));
  if not exists (select 1 from public.ideology_conditions where ideology = v_name) then
    raise exception 'Unknown ideology.';
  end if;
  perform public._spend_action_point(v_party.id);   -- declaring your ideology costs 1 Action Point
  update public.parties set archetype = v_name where id = v_party.id;
  insert into public.events (nation_id, party_id, kind, body, game_date)
    values (v_party.nation_id, v_party.id, 'party',
            v_party.name || ' declared itself ' || v_name || '.', public.current_game_date());
  return jsonb_build_object('ok', true, 'ideology', v_name);
end $$;
grant execute on function public.declare_ideology(text) to authenticated;

notify pgrst, 'reload schema';
