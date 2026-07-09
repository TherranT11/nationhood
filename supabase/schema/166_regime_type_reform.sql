-- ===========================================================================
-- 166 · Regime split into {type, reform} — retires the single 1–25 index.
-- Depends on: 10 (nations.economy), 70 (_to_num), 91 (_nation_stat_add). Run after 158.
--
-- The old economy.regime was a single 1–25 number that did double duty: it named the
-- constitutional TYPE (autocracy / democracy / monarchy) AND how far the nation had
-- liberalised. That conflation is gone. Two keys now carry it:
--   economy.regime_type    text  — 'autocracy' | 'democracy' | 'monarchy'
--   economy.regime_reform  int   — 0..15, liberalisation WITHIN the type
-- Nothing derived is stored. Every gate that read the old number now reads these two
-- through the helpers below — _regime_type / _regime_reform are the ONE source, and the
-- band tests (_regime_is_authoritarian / _regime_is_one_party / _regime_is_monarchy)
-- preserve the exact thresholds the 1–25 checks used, re-expressed in type + reform.
--
-- Reform level 0..15 moves via the existing movers for now (policy 'Regime' effect, the
-- electoral-threshold cost, the paramilitary chill, admin events); the parliamentary
-- reform-bill system that will OWN that movement is a later pass. Type changes only via
-- the form-of-state floor measure (schema/81) — an automated effect can't cross types.
-- ===========================================================================

-- ---- The ONE readers of the shape. --------------------------------------------------

-- A nation's constitutional type, or null when unset (an un-configured nation). Read from
-- the economy jsonb so callers that already hold the row don't re-query.
create or replace function public._regime_type(p_economy jsonb)
returns text language sql immutable as $$
  select case p_economy->>'regime_type'
           when 'autocracy' then 'autocracy'
           when 'democracy' then 'democracy'
           when 'monarchy'  then 'monarchy'
           else null
         end;
$$;

-- A nation's reform level, clamped to 0..15. An absent/legacy value reads as 0 (the floor),
-- mirroring how the old _to_num(regime) fell back on the low end.
create or replace function public._regime_reform(p_economy jsonb)
returns int language sql immutable as $$
  select greatest(0, least(15, coalesce(round(public._to_num(p_economy->>'regime_reform')), 0)))::int;
$$;

-- Authoritarian floor — the old "regime ≤ 4": an autocracy at reform ≤ 3. These states
-- suppress political fallout (malaise) and reward a foreign stand against them (sanctions).
-- A null/unset type is NOT authoritarian (mirrors the old "null regime → treated as open") —
-- the coalesce makes this a TOTAL boolean, never null, so callers can safely negate it.
create or replace function public._regime_is_authoritarian(p_economy jsonb)
returns boolean language sql immutable as $$
  select coalesce(public._regime_type(p_economy) = 'autocracy' and public._regime_reform(p_economy) <= 3, false);
$$;

-- One-party state — the old "regime ≤ 4 OR ≥ 24": an autocracy at reform ≤ 3, or an ABSOLUTE
-- monarchy (a monarchy at reform ≥ 3). Both are sole-ruler states. ONE source for the
-- one-party switch (schema/98). Total boolean (false for an unset regime).
create or replace function public._regime_is_one_party(p_economy jsonb)
returns boolean language sql immutable as $$
  select coalesce(
       (public._regime_type(p_economy) = 'autocracy' and public._regime_reform(p_economy) <= 3)
    or (public._regime_type(p_economy) = 'monarchy'  and public._regime_reform(p_economy) >= 3), false);
$$;

-- Monarchy band — the old "regime ≥ 21". ONE source for the crown-only affordances
-- (royal Head-of-State titles). Absolute vs Constitutional is a reform question on top.
-- Total boolean (false for an unset regime).
create or replace function public._regime_is_monarchy(p_economy jsonb)
returns boolean language sql immutable as $$
  select coalesce(public._regime_type(p_economy) = 'monarchy', false);
$$;

-- ---- The ONE writer of a full regime (type + reform together). ----------------------
-- Reform-only deltas keep going through _nation_stat_add(..., 'regime_reform', d, 0, 15) —
-- the same clamp source every stat uses. This helper is for a TYPE change (the form-of-state
-- measure), which sets both keys at once.
create or replace function public._set_regime(p_nation text, p_type text, p_reform int)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.nations
     set economy = jsonb_set(
           jsonb_set(coalesce(economy, '{}'::jsonb), '{regime_type}', to_jsonb(p_type), true),
           '{regime_reform}', to_jsonb(greatest(0, least(15, coalesce(p_reform, 0)))), true)
   where id = p_nation;
end $$;
revoke all on function public._set_regime(text, text, int) from public, anon, authenticated;

-- ---- One-time data migration: map every nation's old economy.regime onto {type, reform}
--      and drop the old key. Numeric values map by band (1–10 autocracy, 11–20 democracy,
--      21–25 monarchy), reform = position within the band (0..15). A legacy free-text regime
--      is best-effort by keyword, defaulting to a mid democracy. A nation with no regime key
--      is left untouched (it was already "unset" — every gate treats a null type that way).
update public.nations set economy =
  (economy - 'regime')
  || jsonb_build_object(
       'regime_type',
       case
         when economy->>'regime' ~ '^-?[0-9]+(\.[0-9]+)?$' then
           case when (economy->>'regime')::numeric >= 21 then 'monarchy'
                when (economy->>'regime')::numeric >= 11 then 'democracy'
                else 'autocracy' end
         when economy->>'regime' ilike '%monarch%' then 'monarchy'
         when economy->>'regime' ilike '%autocra%'
           or economy->>'regime' ilike '%one state%'
           or economy->>'regime' ilike '%one-party%'
           or economy->>'regime' ilike '%dictator%' then 'autocracy'
         else 'democracy'
       end,
       'regime_reform',
       case
         when economy->>'regime' ~ '^-?[0-9]+(\.[0-9]+)?$' then
           greatest(0, least(15,
             case when (economy->>'regime')::numeric >= 21 then round((economy->>'regime')::numeric) - 21
                  when (economy->>'regime')::numeric >= 11 then round((economy->>'regime')::numeric) - 11
                  else greatest(1, round((economy->>'regime')::numeric)) - 1 end))::int
         else 4
       end)
 where economy ? 'regime';

notify pgrst, 'reload schema';
