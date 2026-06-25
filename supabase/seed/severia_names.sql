-- Seed data: the Severia name pool (a Russian-style one-party socialist state — the
-- Severian United Workers' Party).
--
-- Run in the Supabase SQL Editor AFTER schema/50_names.sql, and after the Severia
-- nation exists (created via /adminsetup). The names are keyed to the nation's actual id
-- by matching its NAME below (any nation whose name contains "Severia" — e.g. "Severia"
-- or "The Severian Republic"). If no such nation exists yet, this inserts nothing (no
-- error) — just re-run it once the nation is there.
--
-- NOTE: Russian surnames take a feminine ending (Ivanov → Ivanova). The pool has
-- a single 'surname' kind (first-name gender isn't linked to the surname), so we
-- seed the MASCULINE forms; a female first name may therefore pair with a
-- masculine surname. Full agreement would need gender-aware name generation.
-- Idempotent: unique (nation_id, kind, name) + on-conflict-do-nothing.

insert into public.nation_names (nation_id, kind, name)
select n.id, 'male', x from public.nations n, unnest(array[
  'Aleksandr','Dmitry','Sergei','Aleksei','Vladimir','Andrei','Mikhail','Ivan',
  'Nikolai','Pavel','Artyom','Nikita','Ilya','Maksim','Evgeny','Anton','Igor',
  'Denis','Roman','Kirill','Daniil','Oleg','Vitaly','Vadim','Stanislav','Yury',
  'Viktor','Anatoly','Konstantin','Valery','Pyotr','Vasily','Grigory','Stepan',
  'Fyodor','Svyatoslav','Yaroslav','Vyacheslav','Boris','Artur','Leonid','Eduard',
  'Georgy','Timur','Ruslan','Vladislav','Matvey','Egor','Arseny','Lev'
]) as x
where n.name ilike '%severia%'
on conflict (nation_id, kind, name) do nothing;

insert into public.nation_names (nation_id, kind, name)
select n.id, 'female', x from public.nations n, unnest(array[
  'Elena','Natalia','Olga','Tatiana','Anna','Maria','Irina','Svetlana',
  'Anastasia','Ekaterina'
]) as x
where n.name ilike '%severia%'
on conflict (nation_id, kind, name) do nothing;

insert into public.nation_names (nation_id, kind, name)
select n.id, 'surname', x from public.nations n, unnest(array[
  'Ivanov','Smirnov','Kuznetsov','Popov','Vasiliev','Petrov','Sokolov','Mikhailov',
  'Novikov','Fedorov','Morozov','Volkov','Alekseev','Lebedev','Semenov','Egorov',
  'Kozlov','Pavlov','Stepanov','Nikolaev','Orlov','Andreev','Makarov','Nikitin',
  'Zakharov','Zaitsev','Soloviev','Borisov','Yakovlev','Vorobiev','Petrovsky',
  'Romanov','Kiselev','Sergeev','Alexandrov','Ilyin','Gusev','Titov','Fedotov',
  'Belov','Zhukov','Levin','Panov','Kopylov','Sorokin','Krylov','Polyakov',
  'Sidorov','Shcherbakov','Vinogradov','Frolov','Bogdanov','Voronov','Gromov',
  'Tikhonov','Dmitriev','Gerasimov','Shevchenko','Ignatov','Savin','Tarasov',
  'Baranov','Kulikov','Bykov','Abramov','Melnikov','Shishkin','Safonov','Maximov',
  'Komarov','Matveev','Nikiforov','Belyaev','Antonov','Danilov','Kabanov',
  'Medvedev','Maslov','Vlasov','Polyansky','Gorshkov','Kudryavtsev','Lisin',
  'Saveliev','Sobolev','Panfilov','Safin','Ponomarev','Chernov','Golubev','Markov',
  'Naumov','Karpov','Kovalev','Kozlovsky','Mironov','Filatov','Ustinov'
]) as x
where n.name ilike '%severia%'
on conflict (nation_id, kind, name) do nothing;
