-- 104 · Minority-government confidence decay + snap election.
-- A minority government is inherently unstable: each tick it bleeds −0.3 Government Confidence.
-- When that erosion drops it below 20%, the head-of-government party is punished (−5 Party
-- Popularity, −3 Popularity Ceiling) and a snap election is called — reusing the conviction-effect
-- engine (94) for the penalties and resolve_election (60) for the reseat, so each has ONE source.
-- Invoked once per tick from _advance_tick (60). Run after 60 and 94.
--
-- The election fires only on the DOWNWARD crossing (was ≥20, now <20) so a government can't be
-- dissolved twice for the same collapse and the tick can't loop — resolve_election reseats a fresh
-- government (minority govts form at ~30, schema/60) which is comfortably back above the floor.
-- Confidence is numeric, so the fractional decay accumulates exactly tick over tick.

create or replace function public._apply_minority_confidence(p_tick int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gov public.governments%rowtype;
  v_new numeric;
  v_form_name text; v_leader text; v_title text; v_reason text;
begin
  -- Per active, non-dormant minority government. Each runs in its own sub-block so one
  -- failure can't freeze the world clock (same discipline as every _advance_tick step).
  for v_gov in
    select g.* from public.governments g
    join public.nations n on n.id = g.nation_id
    where g.status = 'active' and g.type = 'minority' and not coalesce(n.dormant, false)
  loop
    begin
      v_new := greatest(0, coalesce(v_gov.confidence, 0) - 0.3);
      update public.governments set confidence = v_new where id = v_gov.id;

      if v_new < 20 and coalesce(v_gov.confidence, 0) >= 20 then
        -- Head of government = the formateur of a minority government. Punish its standing
        -- through the shared conviction-effect engine (floor- and ceiling-aware), then call
        -- the snap election (which also reseats and reschedules — ONE source for that).
        perform public._apply_conviction_effect(v_gov.formateur_party_id, v_gov.nation_id,
                  jsonb_build_object('t', 'Party Popularity', 'v', -5));
        perform public._apply_conviction_effect(v_gov.formateur_party_id, v_gov.nation_id,
                  jsonb_build_object('t', 'Popularity Ceiling', 'v', -3));

        select name into v_form_name from public.parties where id = v_gov.formateur_party_id;
        select name into v_leader from public.politicians
          where party_id = v_gov.formateur_party_id and status = 'Party Leader'
          order by created_at limit 1;
        v_title := public.nation_declaration(v_gov.nation_id, 'head_of_government_title');
        v_reason := 'Confidence in the minority government has collapsed below 20%. '
                 || coalesce(nullif(v_title, ''), 'Prime Minister') || ' '
                 || coalesce(v_leader, v_form_name, 'the incumbent')
                 || ' has lost the nation''s confidence, and a snap election has been called. ';
        perform public.resolve_election(v_gov.nation_id, v_reason);
      end if;
    exception when others then
      raise warning 'tick %: minority confidence failed for nation % — %', p_tick, v_gov.nation_id, sqlerrm;
    end;
  end loop;
end $$;
revoke all on function public._apply_minority_confidence(int) from public, anon, authenticated;

notify pgrst, 'reload schema';
