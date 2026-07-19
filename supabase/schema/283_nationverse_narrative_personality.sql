-- ===========================================================================
-- 283 · Assign a Nationverse narrative to a specific personality.
--
-- Narratives can now target one personality (the character the narrative is "for"). Nullable:
-- null = not tied to a specific personality (nation-wide or global, as before). ON DELETE SET NULL
-- so removing a personality never orphans/deletes its narratives — they just lose the assignment.
-- Depends on: 271 (nationverse_personalities), 277 (nationverse_narratives). Idempotent. Apply after 282.
-- ===========================================================================

alter table public.nationverse_narratives
  add column if not exists personality_id uuid
  references public.nationverse_personalities(id) on delete set null;

notify pgrst, 'reload schema';
