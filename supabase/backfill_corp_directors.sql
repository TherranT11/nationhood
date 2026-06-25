-- ONE-TIME BACKFILL — give every corporation a named NPC director with a 1D4 Acumen.
-- Run once in the Supabase SQL editor. NOT part of schema_all (this is a data fix, not
-- structure). Idempotent: it only touches corporations whose director is NULL, so
-- re-running is a safe no-op and it never renames a firm that already has a director.
--
-- Mirrors corp_create (schema/47): a random first name + surname from the nation's
-- nation_names pool, a generic fallback when the nation has none, and Acumen = 1D4 (1–4).
--
-- NOTE: apply schema/47_corporations.sql first — it adds corp_create/corp_register and
-- the display. These two lines just guarantee the columns exist so this script can run
-- standalone (idempotent; no-op once 47 is applied).
alter table public.corporations add column if not exists director text;
alter table public.corporations add column if not exists acumen   int;

do $$
declare
  v_corp record;
  v_first text; v_last text;
  v_seeded int := 0;
  v_ff text[] := array['Alex','Sam','Jordan','Morgan','Casey','Mira','Andrei','Ilya','Sasha','Lena','Marco','Yara','Theo','Dana','Noa','Quinn'];
  v_fs text[] := array['Hart','Vance','Mercer','Ashford','Frost','Quint','Marsh','Doyle','Reeve','Sloan','Kovic','Reyes','Voss','Lund','Mata','Adler'];
begin
  for v_corp in
    select id, nation_id from public.corporations where director is null
  loop
    -- First name + surname from the nation's pool; fall back to the generic lists.
    select name into v_first from public.nation_names
      where nation_id = v_corp.nation_id and kind in ('male','female') order by random() limit 1;
    if v_first is null then v_first := v_ff[1 + floor(random() * array_length(v_ff, 1))::int]; end if;

    select name into v_last from public.nation_names
      where nation_id = v_corp.nation_id and kind = 'surname' order by random() limit 1;
    if v_last is null then v_last := v_fs[1 + floor(random() * array_length(v_fs, 1))::int]; end if;

    update public.corporations
       set director = v_first || ' ' || v_last,
           acumen   = coalesce(acumen, floor(random() * 4)::int + 1)   -- keep any existing roll
     where id = v_corp.id;

    v_seeded := v_seeded + 1;
    raise notice 'Seeded director % % for corporation % (nation %)', v_first, v_last, v_corp.id, v_corp.nation_id;
  end loop;
  raise notice 'Backfill complete — % director(s) seeded.', v_seeded;
end $$;
