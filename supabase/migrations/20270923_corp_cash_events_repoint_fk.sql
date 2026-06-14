-- ════════════════════════════════════════════════════════════════════
-- 20270923 — Repoint corp_cash_events.corp_id at entrepreneur_corps
--
-- corp_cash_events.corp_id has referenced factions(id) since 20260701,
-- back when "corps" were faction_type='corporation'. That whole legacy
-- faction-corporation economy was torn down in 20270251 — its only
-- writer, emit_corp_cash_event, is dead. The LIVE writers are the
-- entrepreneur banking RPCs (20270894 credit market, 20270895 subprime
-- packaging, …), which pass an entrepreneur_corps.id. Since that id is a
-- separate space from factions.id, every one of those inserts violated
-- corp_cash_events_corp_id_fkey — Subprime Packaging's "Package the
-- Tranches" being the report that surfaced it.
--
-- Repoint the FK at entrepreneur_corps(id), exactly like the parallel
-- corp_history ledger (20270852). NOT VALID keeps this non-destructive:
-- existing rows aren't rescanned (any stragglers from the dead economy
-- point at vanished faction-corps and are invisible to the entrepreneur
-- UI anyway), while every new insert is checked against entrepreneur_corps.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public.corp_cash_events
    DROP CONSTRAINT IF EXISTS corp_cash_events_corp_id_fkey;

ALTER TABLE public.corp_cash_events
    ADD CONSTRAINT corp_cash_events_corp_id_fkey
        FOREIGN KEY (corp_id) REFERENCES public.entrepreneur_corps(id) ON DELETE CASCADE
        NOT VALID;

NOTIFY pgrst, 'reload schema';

COMMIT;
