-- ===========================================================================
-- 194 · Stat Connectors — couple any ministry stat to any other.
--
-- ⚠ LIVE OWNER = 254. The stat_connectors table and _nation_stat_connectors are re-created verbatim by
-- 254 (self-contained connector revival), which runs later and wins. Edit 254 to change them.
--
-- A connector is an admin-authored, GLOBAL rule (it applies to every nation):
--
--     Every time <source> increases by <per>, <target> changes by <amount>.
--
-- Modelled as DERIVED coupling, not a stored ratchet — the target simply GAINS a live term computed on
-- read, exactly like a policy contribution. The term is  amount × trunc((source_raw − reference) / per),
-- where source_raw is the source stat's value BEFORE any connector applies. Reading the pre-connector
-- value is what makes this single-pass and cycle-proof: a rule can never feed off another rule's output,
-- so X→Y→X can't loop and evaluation order never matters. It is also fully reversible — when the source
-- falls, the target's bump falls with it — and adds no snapshots or drift.
--
-- Scope note: the term is a DISPLAY-layer addition (folded into nation_stat_values, schema/177). For the
-- three real-backed stats (Growth / Prosperity / Rule of Law) it moves the SHOWN figure but not yet the
-- underlying stats.* the election / business-climate maths read — materialising into those is a
-- deliberate later step.
--
-- Depends on: 05 (game_state / is_admin), 10 (nations), 70 (_to_num), 47 (_nation_tax_burden),
-- 152 (_nation_budget_balance, _nation_policy_stat), 175 (_nation_live_stat with delta), 177
-- (nation_stat_values — superseded here). Idempotent.
-- ===========================================================================

create table if not exists public.stat_connectors (
  id         uuid primary key default gen_random_uuid(),
  source     text not null,                 -- the stat whose rise drives the change
  target     text not null,                 -- the stat that changes
  per        numeric not null default 1,    -- [Y] the source distance per step (must be > 0; direction is carried by amount's sign)
  amount     numeric not null default 1,    -- [A] signed change to the target per step (+ raise, − lower)
  reference  numeric not null default 0,    -- the source value the steps are measured FROM
  created_at timestamptz not null default now()
);
-- Idempotent convergence for a DB that ran an earlier draft of this file (dropped the unused note
-- column; the distance is a positive magnitude, so the check is per > 0, not merely non-zero).
alter table public.stat_connectors drop column if exists note;
alter table public.stat_connectors drop constraint if exists stat_connectors_per_nonzero;
alter table public.stat_connectors drop constraint if exists stat_connectors_per_positive;
alter table public.stat_connectors add  constraint stat_connectors_per_positive check (per > 0);

-- World-readable (the coupling rules are public game data); only an admin may write. Mirrors the
-- nations table's own is_admin() gate (schema/10).
alter table public.stat_connectors enable row level security;
drop policy if exists "stat_connectors_select_all" on public.stat_connectors;
create policy "stat_connectors_select_all" on public.stat_connectors for select using (true);
drop policy if exists "stat_connectors_admin_write" on public.stat_connectors;
create policy "stat_connectors_admin_write" on public.stat_connectors for all
  using (public.is_admin()) with check (public.is_admin());

-- A stat's RAW value for one nation — everything EXCEPT connector terms. This is the value connectors
-- read from their source (so they never see another connector's output) and the base every display
-- reader starts from. Routes the three derived stats to their own functions; all others resolve as
-- base + policy + delta (_nation_live_stat). Absent display stats read 0 here (the "--" distinction is
-- kept in nation_stat_values, not here). plpgsql so the 152/175 calls resolve at runtime.
create or replace function public._nation_stat_raw(p_nation text, p_stat text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v numeric;
begin
  if p_stat = 'Budget Balance' then
    return coalesce(public._nation_budget_balance(p_nation), 0);
  elsif p_stat = 'Tax Burden' then
    return coalesce(public._nation_tax_burden(p_nation), 0);
  elsif p_stat = 'Public Debt' then
    select coalesce(public._to_num(economy->>'debt'), 0) into v from public.nations where id = p_nation;
    return coalesce(v, 0);
  else
    return coalesce(public._nation_live_stat(p_nation, p_stat), 0);
  end if;
end $$;
revoke all on function public._nation_stat_raw(text, text) from public, anon, authenticated;

-- The combined connector contribution to one stat for a nation: Σ over every rule that TARGETS it of
-- amount × trunc((source_raw − reference) / per), each rule's contribution clamped to ±500 so a
-- mis-authored rule can't run a stat to absurdity. Single-pass (source_raw excludes connectors).
create or replace function public._nation_stat_connectors(p_nation text, p_stat text)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare v_sum numeric := 0; r record; v_src numeric; v_steps numeric; v_c numeric;
begin
  for r in select source, per, amount, reference from public.stat_connectors where target = p_stat loop
    if r.per = 0 then continue; end if;
    v_src   := public._nation_stat_raw(p_nation, r.source);
    v_steps := trunc((coalesce(v_src, 0) - coalesce(r.reference, 0)) / r.per);
    v_c     := coalesce(r.amount, 0) * v_steps;
    v_sum   := v_sum + greatest(-500, least(500, v_c));
  end loop;
  return v_sum;
end $$;
revoke all on function public._nation_stat_connectors(text, text) from public, anon, authenticated;

-- nation_stat_values — SUPERSEDES schema/177. The VALUE of every stat comes from the one router,
-- _nation_stat_raw, plus its connector term; v_has only decides the "--" case. A stat with real backing
-- (a derived stat, an authored base / policy / delta, or a mirror) always shows; a stat with none shows
-- only when a connector gives it a value, and a truly-empty stat stays "--" (NULL).
create or replace function public.nation_stat_values(p_nation text, p_stats text[])
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_out jsonb := '{}'::jsonb; s text; c numeric; n public.nations%rowtype; v_has boolean;
begin
  select * into n from public.nations where id = p_nation;
  if not found then return v_out; end if;
  foreach s in array coalesce(p_stats, array[]::text[]) loop
    -- Does the stat have any real backing (for the "--" distinction)?
    v_has := s in ('Budget Balance', 'Tax Burden')
          or (s = 'Public Debt' and public._to_num(n.economy->>'debt') is not null)
          or public._to_num(n.ministry_stats->>s) is not null
          or public._to_num(n.stat_deltas->>s) is not null
          or coalesce(public._nation_policy_stat(p_nation, s), 0) <> 0
          or s in ('Growth', 'Prosperity', 'Rule of Law');   -- mirrors always have a real backing
    c := public._nation_stat_connectors(p_nation, s);         -- applies to every stat, even an un-backed one
    if not v_has and coalesce(c, 0) = 0 then continue; end if; -- no base, no connector → "--"
    v_out := jsonb_set(v_out, array[s],
      to_jsonb(round(public._nation_stat_raw(p_nation, s) + coalesce(c, 0), 2)));
  end loop;
  return v_out;
end $$;
grant execute on function public.nation_stat_values(text, text[]) to authenticated;

notify pgrst, 'reload schema';
