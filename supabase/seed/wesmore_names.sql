-- Seed data: the Wesmore (Wesmore and Calcordia) name pool — Britain, circa 1980.
--
-- Run in the Supabase SQL Editor AFTER schema/50_names.sql, and after the Wesmore
-- nation exists (created via /adminsetup). Keyed to the nation's id by matching its
-- NAME loosely, so "Wesmore", "Wesmore and Calcordia", etc. all resolve. If Wesmore
-- doesn't exist yet this inserts nothing (no error) — re-run once it's there.
-- Idempotent: unique (nation_id, kind, name) + on-conflict-do-nothing.

insert into public.nation_names (nation_id, kind, name)
select n.id, 'male', x from public.nations n, unnest(array[
  'David','Michael','Andrew','Christopher','Stephen','Paul','Mark','Richard','John','Peter',
  'Robert','Simon','James','Philip','Jonathan','Matthew','Nicholas','Daniel','Martin','Anthony',
  'Kevin','Gary','Ian','Stuart','Adrian','Nigel','Steven','Timothy','Benjamin','Dominic',
  'Charles','Edward','Alexander','Thomas','Patrick','Alan','Graham','Keith','Colin','Derek',
  'Trevor','Roger','Geoffrey','Raymond','Clive','Shaun','Carl','Jason','Russell','Lee'
]) as x
where n.name ilike '%wesmore%'
on conflict (nation_id, kind, name) do nothing;

insert into public.nation_names (nation_id, kind, name)
select n.id, 'female', x from public.nations n, unnest(array[
  'Sarah','Emma','Claire','Nicola','Rachel','Rebecca','Louise','Samantha','Lisa','Jennifer'
]) as x
where n.name ilike '%wesmore%'
on conflict (nation_id, kind, name) do nothing;

insert into public.nation_names (nation_id, kind, name)
select n.id, 'surname', x from public.nations n, unnest(array[
  'Smith','Jones','Taylor','Brown','Williams','Wilson','Johnson','Davies','Robinson','Wright',
  'Thompson','Evans','Walker','White','Roberts','Green','Hall','Thomas','Clarke','Jackson',
  'Wood','Harris','Edwards','Turner','Martin','Cooper','Hill','Ward','Morris','Moore',
  'Clark','Lee','King','Baker','Harrison','Morgan','Allen','James','Scott','Phillips',
  'Watson','Davis','Parker','Price','Bennett','Young','Griffiths','Mitchell','Collins','Campbell',
  'Bailey','Richardson','Kelly','Cook','Cox','Marshall','Simpson','Shaw','Murphy','Foster',
  'Butler','Bell','Russell','Jenkins','Webb','Mills','Chapman','Hunter','Matthews','Holmes',
  'Palmer','Owen','Mason','Knight','Kennedy','Barker','Dixon','Harvey','Hunt','George',
  'Pearson','Stevens','Armstrong','Spencer','Ford','Walsh','Grant','Cunningham','Ferguson','Lawson',
  'Bradley','Gilbert','Gordon','Reeves','Sutton','Porter','Hudson','Freeman','Dean','Barrett'
]) as x
where n.name ilike '%wesmore%'
on conflict (nation_id, kind, name) do nothing;
