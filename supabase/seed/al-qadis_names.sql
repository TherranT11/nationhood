-- Seed data: the Al-Qadis name pool (a Syrian / Levantine-Arabic set — Arabic given
-- names alongside Syrian surnames).
--
-- Run in the Supabase SQL Editor AFTER schema/50_names.sql, and after the Al-Qadis
-- nation exists (created via /adminsetup). The names are keyed to the nation's actual
-- id by matching its NAME below (ilike '%qadi%'), so they line up with whatever slug the
-- admin form assigned, and catch either "Al-Qadis" or "Al-Qadir". If the nation doesn't
-- exist yet, this inserts nothing (no error) — just re-run it once the nation is there.
-- Idempotent: unique (nation_id, kind, name) + on-conflict-do-nothing.

insert into public.nation_names (nation_id, kind, name)
select n.id, 'male', x from public.nations n, unnest(array[
  'Ahmad','Ali','Amin','Ammar','Anas','Assad','Ayham','Ayman','Azad','Aziz',
  'Bahaa','Basel','Bashar','Bassam','Bilal','Bishr','Burhan','Chadi','Charif','Dani',
  'Daniel','Dawoud','Diya','Elias','Fadi','Fahd','Faisal','Firas','Fouad','Ghiath',
  'Habib','Hadi','Haitham','Hamza','Hani','Hasan','Hisham','Houssam','Ibrahim','Imad',
  'Issa','Jaber','Jafar','Jalal','Jamil','Jihad','Kamel','Karam','Karim','Khaled',
  'Kinan','Layth','Louai','Maher','Mahmoud','Majd','Malik','Marwan','Mazen','Mohammad',
  'Moustafa','Mouwaffak','Munir','Nabil','Nadim','Nael','Naim','Nasser','Nawwar','Nour',
  'Omar','Osama','Qusay','Radwan','Rami'
]) as x
where n.name ilike '%qadi%'
on conflict (nation_id, kind, name) do nothing;

insert into public.nation_names (nation_id, kind, name)
select n.id, 'female', x from public.nations n, unnest(array[
  'Aisha','Amira','Aya','Bana','Dima','Farah','Fatimah','Ghalia','Hala','Hanan'
]) as x
where n.name ilike '%qadi%'
on conflict (nation_id, kind, name) do nothing;

insert into public.nation_names (nation_id, kind, name)
select n.id, 'surname', x from public.nations n, unnest(array[
  'Abadi','Abbas','Abdo','Abdulkarim','Abdullah','Abu','Adel','Ajami','Al-Ali','Al-Asad',
  'Al-Attar','Al-Azm','Al-Chaar','Al-Ghazzi','Al-Hafiz','Al-Hakim','Al-Hassan','Al-Hussein','Al-Khatib','Al-Masri',
  'Al-Rifai','Al-Shaar','Al-Taqi','Ali','Aliko','Alloush','Amin','Antaki','Arabi','Arbash',
  'Asaf','Asfour','Assaf','Atassi','Atrash','Awwad','Ayash','Ayoub','Azar','Badawi',
  'Badr','Bakri','Barakat','Barazi','Basha','Bayrakdar','Bitar','Dagher','Darwish','Daoud',
  'Dib','Elias','Fadel','Fahoum','Fakhoury','Farah','Fares','Farhat','Gaddah','Ghanem',
  'Ghazal','Haddad','Hafez','Hajar','Hajjar','Hakim','Hamad','Hamami','Hamdan','Hanano',
  'Hanna','Hariri','Hashem','Hassan','Hawa','Hilal','Homsi','Idriss','Ibrahim','Ismail',
  'Issa','Jaber','Jaafari','Jalabi','Jamil','Kabbani','Kaddour','Kalan','Kallas','Kanawati',
  'Karam','Karim','Kassab','Kassis','Khaled','Khalil','Khamis','Khan','Khater','Khatib'
]) as x
where n.name ilike '%qadi%'
on conflict (nation_id, kind, name) do nothing;
