-- Seed data: the Calcordia name pool (a Scottish set — Highland/Lowland given names
-- alongside clan and Lowland surnames).
--
-- Run in the Supabase SQL Editor AFTER schema/50_names.sql, and after the Calcordia
-- nation exists (created via /adminsetup). The names are keyed to the nation's actual
-- id by matching its NAME below (ilike 'calcordia'), so they line up with whatever slug
-- the admin form assigned. It matches only the nation named "Calcordia" — not "Wesmore".
-- If the nation doesn't exist yet, this inserts nothing (no error) — just re-run it once
-- the nation is there. Idempotent: unique (nation_id, kind, name) + on-conflict-do-nothing.

insert into public.nation_names (nation_id, kind, name)
select n.id, 'male', x from public.nations n, unnest(array[
  'Alasdair','Angus','Callum','Ewan','Hamish','Finlay','Fraser','Malcolm','Duncan','Fergus',
  'Iain','Lachlan','Graeme','Gordon','Douglas','Stuart','Kenneth','Ross','Bruce','Craig',
  'Gavin','Neil','Colin','Grant','Murray','Cameron','Keith','Alan','Ian','Andrew',
  'James','Robert','William','Alexander','Thomas','John','David','George','Hugh','Archie',
  'Blair','Brodie','Calum','Connor','Darren','Derek','Donald','Eric','Gary','Glenn',
  'Gregor','Jamie','Lewis','Logan','Martin','Niall','Patrick','Peter','Roderick','Ronald',
  'Rory','Scott','Stephen','Wallace','Alastair','Murdo','Ruairidh','Struan','Tavish','Torquil',
  'Dougal','Innes','Mungo','Aonghas','Seumas'
]) as x
where n.name ilike 'calcordia'
on conflict (nation_id, kind, name) do nothing;

insert into public.nation_names (nation_id, kind, name)
select n.id, 'female', x from public.nations n, unnest(array[
  'Fiona','Isla','Morag','Kirsty','Mairi','Catriona','Ailsa','Shona','Elspeth','Eilidh'
]) as x
where n.name ilike 'calcordia'
on conflict (nation_id, kind, name) do nothing;

insert into public.nation_names (nation_id, kind, name)
select n.id, 'surname', x from public.nations n, unnest(array[
  'MacDonald','Campbell','Stewart','Robertson','Thomson','Anderson','MacKenzie','Scott','Murray','MacLeod',
  'Fraser','Hamilton','Graham','Ferguson','Douglas','Sinclair','MacGregor','Kerr','Cameron','Johnston',
  'Duncan','Grant','Hunter','Reid','Ross','Morrison','Paterson','Young','Watson','Mitchell',
  'Walker','Wilson','Brown','Taylor','Clark','Smith','McLean','McKay','McIntyre','McPherson',
  'McDougall','McFarlane','McArthur','McCallum','McMillan','McNaughton','McLaren','McEwan','McBride','McQueen',
  'MacNeil','MacRae','MacInnes','MacAulay','MacFadyen','MacKinnon','MacNab','MacLaren','MacFarlane','MacArthur',
  'MacPherson','MacDougall','MacMillan','MacIntyre','MacQueen','MacEwan','MacCallum','MacNaughton','MacBride','MacKay',
  'Bruce','Wallace','Buchanan','Cunningham','Drummond','Gordon','Lennox','Leslie','Maxwell','Montgomery',
  'Munro','Forbes','MacDuff','Sutherland','Maitland','Ramsay','Stirling','Crawford','Dunbar','Erskine',
  'Home','Irvine','Jardine','Kirkpatrick','Livingstone','Ogilvie','Ritchie','Semple','Spence','Turnbull'
]) as x
where n.name ilike 'calcordia'
on conflict (nation_id, kind, name) do nothing;
