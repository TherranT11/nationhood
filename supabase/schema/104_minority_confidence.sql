-- 104 · Minority-government confidence decay — RETIRED.
--
-- Government Confidence is gone (see schema/165). A minority government no longer bleeds a
-- confidence figure and no longer snap-elects at a threshold; Coalition Health (hearts) is
-- now the sole government-stability gauge — a government falls when its hearts hit zero
-- (debt-to-GDP crisis, a vacant cabinet, or a neglected agenda). The per-tick call was
-- removed from _advance_tick (schema/60), so this drop just clears the dead function.
--
-- Apply after 60.

drop function if exists public._apply_minority_confidence(int);

notify pgrst, 'reload schema';
