-- ===========================================================================
-- 137 · Nation Relations — a symmetric 1–10 standing between every pair of nations (5 = neutral
-- default). Stored ONCE per pair, canonically (nation_a < nation_b); read either direction via
-- _relation_get. World-readable (the World page shows each pair as a 10-dot meter — 1 dot = 1,
-- red 1–3 / yellow 4–7 / green 8–10); admin-managed from the adminsetup nation form, and the
-- relation_set / _relation_add helpers give effects (world events, objectives) one way to move it.
-- A pair with no row simply reads 5, so nothing needs pre-seeding.
-- Depends on: 10 (nations, is_admin). Run after 10.
-- ===========================================================================

create table if not exists public.nation_relations (
  nation_a text not null references public.nations (id) on delete cascade,
  nation_b text not null references public.nations (id) on delete cascade,
  value    int  not null default 5 check (value between 1 and 10),
  primary key (nation_a, nation_b),
  check (nation_a < nation_b)                       -- stored canonically, one row per unordered pair
);

alter table public.nation_relations enable row level security;
drop policy if exists "nation_relations_select_all" on public.nation_relations;
create policy "nation_relations_select_all" on public.nation_relations for select using (true);
-- Writes are RPC-only (relation_set below is admin-gated; effects use the security-definer helpers).
-- No client insert/update/delete policy.

-- Read the 1–10 standing between two nations (either order); a missing pair is the 5 default,
-- and a nation with itself is null. ONE source for reading a relation.
create or replace function public._relation_get(p_a text, p_b text)
returns int language sql stable security definer set search_path = public as $$
  select case when p_a = p_b then null
              else coalesce((select value from public.nation_relations
                              where nation_a = least(p_a, p_b) and nation_b = greatest(p_a, p_b)), 5) end;
$$;
revoke all on function public._relation_get(text, text) from public, anon, authenticated;
grant execute on function public._relation_get(text, text) to authenticated;

-- Set the standing to an exact value (clamped 1–10), canonicalising the pair. ONE source for
-- writing a relation. INTERNAL — the admin RPC + effect helpers below call it.
create or replace function public._relation_set(p_a text, p_b text, p_v int)
returns void language plpgsql security definer set search_path = public as $$
declare v_lo text := least(p_a, p_b); v_hi text := greatest(p_a, p_b); v_val int := greatest(1, least(10, coalesce(p_v, 5)));
begin
  if p_a is null or p_b is null or p_a = p_b then return; end if;
  insert into public.nation_relations (nation_a, nation_b, value) values (v_lo, v_hi, v_val)
    on conflict (nation_a, nation_b) do update set value = excluded.value;
end $$;
revoke all on function public._relation_set(text, text, int) from public, anon, authenticated;

-- Move the standing by a delta, clamped to 1–10 (start from the current value / 5 default). The
-- one way effects (a world event's "+X Relations with Y", an objective reward) nudge a relation.
create or replace function public._relation_add(p_a text, p_b text, p_delta int)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public._relation_set(p_a, p_b, coalesce(public._relation_get(p_a, p_b), 5) + coalesce(p_delta, 0));
end $$;
revoke all on function public._relation_add(text, text, int) from public, anon, authenticated;

-- Admin RPC: set the standing between two nations from the adminsetup nation form.
create or replace function public.relation_set(p_a text, p_b text, p_v int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  perform public._relation_set(p_a, p_b, p_v);
end $$;
grant execute on function public.relation_set(text, text, int) to authenticated;

notify pgrst, 'reload schema';
