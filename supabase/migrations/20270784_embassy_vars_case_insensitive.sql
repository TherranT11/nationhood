-- ════════════════════════════════════════════════════════════════════
-- 20270784 — Embassy event variables: case-insensitive + {Name} alias
--
-- Live repro ("The Defector"): the admin wrote {Name}, the engine
-- only replaced the exact token {Name1}, and the player's dispatch
-- read "…a mid-level military officer named {Name} appears…".
-- {Nation} in the same sentence substituted fine — the semantics
-- were right, the matching was too literal.
--
-- embassy_substitute_vars now matches tokens case-insensitively
-- ({nation}, {NATION}, {Nation} all work) and accepts {Name} as an
-- alias of {Name1}. Values are unchanged: the name is drawn from the
-- HOST nation's name pools, {Corp} from corps operating in the host
-- nation, {City}/{Nation} from the posting — all computed at draw
-- time by embassy_day_to_day (20270778).
--
-- Replacement values get their backslashes escaped because
-- regexp_replace treats \ specially in the replacement string and
-- corp names are player-typed.
--
-- Unresolved draws are re-substituted from their stored vars so
-- in-flight events (snapshotted with the raw token) heal without a
-- redraw. Resolved draws are history and stay as displayed.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.embassy_substitute_vars(p_text text, p_vars jsonb)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
    SELECT regexp_replace(
           regexp_replace(
           regexp_replace(
           regexp_replace(COALESCE(p_text, ''),
        '\{nation\}', replace(COALESCE(p_vars->>'nation', 'the host nation'),          '\', '\\'), 'gi'),
        '\{city\}',   replace(COALESCE(p_vars->>'city',   'the capital'),              '\', '\\'), 'gi'),
        '\{name1?\}', replace(COALESCE(p_vars->>'name1',  'a local official'),         '\', '\\'), 'gi'),
        '\{corp\}',   replace(COALESCE(p_vars->>'corp',   'a multinational corporation'), '\', '\\'), 'gi')
$$;

REVOKE EXECUTE ON FUNCTION public.embassy_substitute_vars(text, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.embassy_substitute_vars(text, jsonb) TO authenticated;

-- Heal unresolved draws snapshotted before this fix. Their vars
-- column already carries the values computed at draw time, so
-- re-running the (now tolerant) substitution fills what the old
-- exact-match pass left raw. Decision order (A/B/C) is preserved
-- via WITH ORDINALITY.
UPDATE public.embassy_event_draws d
   SET title       = public.embassy_substitute_vars(d.title, d.vars),
       description = public.embassy_substitute_vars(d.description, d.vars),
       decisions   = (
           SELECT COALESCE(jsonb_agg(
                      jsonb_set(t.dec, '{description}',
                          to_jsonb(public.embassy_substitute_vars(t.dec->>'description', d.vars)))
                      ORDER BY t.ord), '[]'::jsonb)
             FROM jsonb_array_elements(d.decisions) WITH ORDINALITY AS t(dec, ord)
       )
 WHERE d.resolved_at_tick IS NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
