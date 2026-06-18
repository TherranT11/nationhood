-- 50 · Nation name pools (structure only)
-- Depends on: 10 (nations). Run after 40. The rows are bulk data and live in
-- supabase/seed/ (one file per nation) — run those after this file.

-- ---------------------------------------------------------------------------
-- Nation name pools: the source for each nation's flavoured names (generated
-- politicians/characters). One row per name, scoped by nation_id + kind (male /
-- female first names, surname). Public read; clients never write it. Only the
-- structure lives here; the names are seeded from supabase/seed/<nation>_names.sql.
-- A party's leader + recruits draw from its own nation's rows.
-- ---------------------------------------------------------------------------
create table if not exists public.nation_names (
  id        bigint generated always as identity primary key,
  nation_id text not null references public.nations (id) on delete cascade,
  kind      text not null check (kind in ('male', 'female', 'surname')),
  name      text not null,
  unique (nation_id, kind, name)
);

-- Migrate the original Sessau-only table (sessau_names) into the generic one,
-- once. Idempotent: the copy is on-conflict-do-nothing and the old table is
-- dropped only after a successful copy, so a re-run simply finds it already gone.
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'sessau_names') then
    insert into public.nation_names (nation_id, kind, name)
      select 'sessau', kind, name from public.sessau_names
      on conflict (nation_id, kind, name) do nothing;
    drop table public.sessau_names;
  end if;
end $$;

alter table public.nation_names enable row level security;

drop policy if exists "nation_names_select_all" on public.nation_names;
create policy "nation_names_select_all" on public.nation_names for select using (true);
