-- ===========================================================================
-- 195 · Leaders age, retire, and pass away.
--
-- Every January the game clock rolls a year, and each PARTY LEADER (the 'Party Leader' politician,
-- schema/30) and each CORPORATE DIRECTOR (corporations.director, schema/47) ages one year. Once a leader
-- reaches the twilight window they leave — retiring or passing away.
--
--   • The window is [70, 78]. It slides DOWN with a poor Standard of Living (schema/47 live stat):
--       −5 if SoL < 50 · −4 if SoL < 60 · −3 if SoL < 70 · no slide at 70+.
--     An unset / 0 Standard of Living is treated as "no data" — it does NOT slide the window (so a nation
--     that never authored the stat doesn't cull its leaders).
--   • A leader is CERTAIN to leave at or past the top of the window, with a chance that rises across it
--     (age − low + 1)/(window + 1), so nobody survives past the top.
--   • RETIRE vs PASS AWAY is age-weighted: at the bottom of the window it's a retirement, at the top a
--     death, ramping linearly between.
--   • A leaver is replaced IN PLACE by a fresh person drawn from the nation's own name pool (never
--     leaving the seat empty — mirrors _card_change_hog, schema/176). A party successor is a genuinely
--     new figure with a young age (25–55) and freshly-rolled competencies (mirrors party-creation:
--     exp = age/10 points spread at random). A corporate successor gets a fresh name, a new 1D4 Acumen,
--     and a young age.
--
-- The mechanic is a per-January step of _advance_tick (schema/60); it self-gates to January, so calling
-- it on any other tick is a no-op. Randomness uses SQL random() (server-side, allowed in the tick).
--
-- Depends on: 05 (game_state), 10 (nations), 20 (parties), 30 (politicians), 40 (events,
-- current_game_date), 47 (corporations, _nation_live_stat), 50 (_random_name). Idempotent.
-- ===========================================================================

-- Corp directors gain an age (party-leader politicians already have one, schema/30). Backfill existing
-- NPC directors with a plausible current age; any still-unaged director is lazily seeded the first
-- January it is processed (coalesce below), so corp_create needs no change.
alter table public.corporations add column if not exists director_age int;
update public.corporations
   set director_age = 25 + floor(random() * 31)::int
 where director is not null and director_age is null;

create or replace function public._age_leaders(p_tick int)
returns void language plpgsql security definer set search_path = public as $$
declare
  r record; v_sol numeric; v_drop int; v_low int; v_high int; v_age int;
  v_leaves boolean; v_died boolean; v_old text; v_first text; v_last text;
  v_exp int; v_i int; v_c int; v_a int; v_g int; v_re int; v_m int; v_new text;
begin
  if (p_tick - 1) % 12 <> 0 then return; end if;   -- January only (tick 1 = January 1980)

  ---- Party leaders ---------------------------------------------------------
  for r in
    select pol.id, coalesce(pol.age, 40) as age, pol.first_name, pol.last_name, pa.id as party_id, pa.nation_id
      from public.politicians pol
      join public.parties pa on pa.id = pol.party_id
     where pol.status = 'Party Leader'
  loop
    v_age  := r.age + 1;   -- a year older
    v_sol  := coalesce(public._nation_live_stat(r.nation_id, 'Standard of Living'), 0);
    v_drop := case when v_sol <= 0 then 0 when v_sol < 50 then 5 when v_sol < 60 then 4 when v_sol < 70 then 3 else 0 end;
    v_low  := 70 - v_drop; v_high := 78 - v_drop;
    v_leaves := v_age >= v_high or (v_age >= v_low and random() < (v_age - v_low + 1)::numeric / (v_high - v_low + 1));
    if not v_leaves then
      update public.politicians set age = v_age where id = r.id;
      continue;
    end if;
    v_died := random() < greatest(0, least(1, (v_age - v_low)::numeric / greatest(1, v_high - v_low)));
    v_old  := btrim(coalesce(r.first_name, '') || ' ' || coalesce(r.last_name, ''));
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (r.nation_id, r.party_id, 'party',
        v_old || case when v_died then ' has passed away. They were ' else ' has decided to finally retire from politics. They are ' end
          || v_age || ' years old.',
        public.current_game_date());
    -- Successor from the name pool. No usable pool → keep the incumbent in the chair, reset age only
    -- (never leave a party leaderless).
    select first_name, last_name into v_first, v_last from public._random_name(r.nation_id);
    if coalesce(btrim(v_first), '') = '' or coalesce(btrim(v_last), '') = '' then
      update public.politicians set age = 45 where id = r.id;
      continue;
    end if;
    v_age := 25 + floor(random() * 31)::int; v_exp := floor(v_age / 10.0)::int;
    v_c := 0; v_a := 0; v_g := 0; v_re := 0; v_m := 0;
    for v_i in 1 .. v_exp loop
      case floor(random() * 5)::int
        when 0 then v_c := v_c + 1; when 1 then v_a := v_a + 1; when 2 then v_g := v_g + 1;
        when 3 then v_re := v_re + 1; else v_m := v_m + 1;
      end case;
    end loop;
    update public.politicians set first_name = v_first, last_name = v_last, age = v_age,
      experience = v_exp, cha = v_c, acu = v_a, gui = v_g, res = v_re, com = v_m
     where id = r.id;
  end loop;

  ---- Corp directors --------------------------------------------------------
  for r in
    select id, nation_id, director, coalesce(director_age, 25 + floor(random() * 31)::int) as age
      from public.corporations where director is not null
  loop
    v_age  := r.age + 1;
    v_sol  := coalesce(public._nation_live_stat(r.nation_id, 'Standard of Living'), 0);
    v_drop := case when v_sol <= 0 then 0 when v_sol < 50 then 5 when v_sol < 60 then 4 when v_sol < 70 then 3 else 0 end;
    v_low  := 70 - v_drop; v_high := 78 - v_drop;
    v_leaves := v_age >= v_high or (v_age >= v_low and random() < (v_age - v_low + 1)::numeric / (v_high - v_low + 1));
    if not v_leaves then
      update public.corporations set director_age = v_age where id = r.id;
      continue;
    end if;
    v_died := random() < greatest(0, least(1, (v_age - v_low)::numeric / greatest(1, v_high - v_low)));
    insert into public.events (nation_id, party_id, kind, body, game_date)
      values (r.nation_id, null, 'party',
        r.director || case when v_died then ' has passed away. They were ' else ' has decided to finally retire. They are ' end
          || v_age || ' years old.',
        public.current_game_date());
    select first_name, last_name into v_first, v_last from public._random_name(r.nation_id);
    v_new := nullif(btrim(concat_ws(' ', v_first, v_last)), '');
    update public.corporations set
      director      = coalesce(v_new, r.director),
      acumen        = 1 + floor(random() * 4)::int,
      director_age  = 25 + floor(random() * 31)::int
     where id = r.id;
  end loop;
end $$;
revoke all on function public._age_leaders(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
