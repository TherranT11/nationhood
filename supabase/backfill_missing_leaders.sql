-- ONE-TIME BACKFILL — seed a Party Leader for any party/faction that has none.
-- Run once in the Supabase SQL editor. NOT part of schema_all (this is a data fix, not
-- structure). Idempotent: it only touches parties with ZERO politicians, so re-running is
-- a safe no-op and it never mints a second leader.
--
-- Mirrors the client-side seedLeader (party-creation/index.html): a random name from the
-- nation's nation_names pool, a generic fallback when the nation has none (e.g. Severia),
-- age 25–55, and floor(age/10) stat points spread randomly across the five competencies.

do $$
declare
  v_party record;
  v_first text; v_last text;
  v_age int; v_exp int; v_i int;
  v_cha int; v_acu int; v_gui int; v_res int; v_com int;
  v_seeded int := 0;
  v_ff text[] := array['Alex','Sam','Jordan','Morgan','Casey','Mira','Andrei','Ilya','Sasha','Lena','Marco','Yara','Theo','Dana','Noa','Quinn'];
  v_fs text[] := array['Hart','Vance','Mercer','Ashford','Frost','Quint','Marsh','Doyle','Reeve','Sloan','Kovic','Reyes','Voss','Lund','Mata','Adler'];
begin
  for v_party in
    select pa.id, pa.nation_id
      from public.parties pa
     where not exists (select 1 from public.politicians po where po.party_id = pa.id)
  loop
    -- First name + surname from the nation's pool; fall back to the generic lists.
    select name into v_first from public.nation_names
      where nation_id = v_party.nation_id and kind in ('male','female') order by random() limit 1;
    if v_first is null then v_first := v_ff[1 + floor(random() * array_length(v_ff, 1))::int]; end if;

    select name into v_last from public.nation_names
      where nation_id = v_party.nation_id and kind = 'surname' order by random() limit 1;
    if v_last is null then v_last := v_fs[1 + floor(random() * array_length(v_fs, 1))::int]; end if;

    v_age := 25 + floor(random() * 31)::int;     -- 25..55 inclusive
    v_exp := floor(v_age / 10.0)::int;           -- stat points to spread
    v_cha := 0; v_acu := 0; v_gui := 0; v_res := 0; v_com := 0;
    for v_i in 1..v_exp loop
      case floor(random() * 5)::int
        when 0 then v_cha := v_cha + 1;
        when 1 then v_acu := v_acu + 1;
        when 2 then v_gui := v_gui + 1;
        when 3 then v_res := v_res + 1;
        else        v_com := v_com + 1;
      end case;
    end loop;

    insert into public.politicians (party_id, first_name, last_name, age, experience, status, cha, acu, gui, res, com)
    values (v_party.id, v_first, v_last, v_age, v_exp, 'Party Leader', v_cha, v_acu, v_gui, v_res, v_com);

    v_seeded := v_seeded + 1;
    raise notice 'Seeded leader % % for party % (nation %)', v_first, v_last, v_party.id, v_party.nation_id;
  end loop;
  raise notice 'Backfill complete — % leader(s) seeded.', v_seeded;
end $$;
