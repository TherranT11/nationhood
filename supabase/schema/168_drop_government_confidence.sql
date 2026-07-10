-- ===========================================================================
-- 168 · Teardown — drop Government Confidence for good.
-- Government Confidence was superseded by Coalition Health (schema/165) as the
-- government-stability gauge. By this point NOTHING writes governments.confidence
-- (formation seats coalition_health and omits it) and NOTHING reads it — the last
-- two readers (the 'confidence' modifier condition in schema/70 and the
-- 'Government Confidence' crisis metric in schema/99) were removed, and the
-- confidence-returning formation RPCs now report Coalition Health. This drops the
-- two always-null columns and the two orphaned modifier readers.
--
-- APPLY ORDER: re-apply the edited 60/70/99 FIRST (they no longer reference these
-- objects), then this. Postgres doesn't track plpgsql column dependencies, so the
-- drops below succeed regardless — but running the edited files first means no
-- function is left reading a column that's gone.
--
-- Depends on: 60 (governments), 70 (modifier readers). Apply in the Supabase SQL Editor.
-- ===========================================================================

-- The two always-null columns (public approval of the government, and its formation
-- breakdown). Coalition Health (governments.coalition_health/_max) is the gauge now.
alter table public.governments drop column if exists confidence;
alter table public.governments drop column if exists conf_breakdown;

-- The orphaned modifier readers (no callers since Coalition Health isn't modifier-driven).
drop function if exists public._mod_confidence_formation(text);
drop function if exists public._mod_confidence_ceiling(text);

notify pgrst, 'reload schema';
