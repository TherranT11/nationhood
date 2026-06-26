-- 103 · Assign the player's OOC nickname (@handle) at signup.
-- The signup form now collects a nickname and passes it as auth user-metadata
-- (raw_user_meta_data->>'handle'). This redefines the profile-creation trigger so the
-- handle is persisted atomically with the profile — so a player begins the game with a
-- nickname already assigned, regardless of whether email confirmation delayed their first
-- session. Run after 85 (which adds profiles.handle + the format/uniqueness rules mirrored
-- here) and after 00 (the original trigger this supersedes).
--
-- The handle is set only when it's well-formed AND free; a bad or taken nickname is
-- silently skipped (left null) so a collision can never fail account creation — the player
-- can still set one later from the gear menu (set_handle gives a clear "taken" error there).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_h text := btrim(coalesce(new.raw_user_meta_data->>'handle', ''));
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  -- Same rule as set_handle (85): 2–16 letters/digits/underscore, unique case-insensitively.
  if v_h ~ '^[A-Za-z0-9_]{2,16}$' then
    begin
      update public.profiles set handle = v_h where id = new.id;
    exception when unique_violation then
      null; -- nickname taken — leave null, the player can pick another later
    end;
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
