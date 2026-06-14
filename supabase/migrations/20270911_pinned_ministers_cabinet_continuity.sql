-- Cabinet continuity for manually-appointed (pinned) ministers.
--
-- Context: cabinet ministers live in the `ministries` table and are
-- normally (re)populated by finalize_government_formation (20261120) —
-- it wipes every active ministry and reassigns each portfolio to the new
-- governing coalition with an NPC name. A manual appointment (e.g. an
-- admin seating a specific politician as a minister) is therefore
-- overwritten the next time the government re-forms.
--
-- Desired behaviour: a pinned minister keeps their seat across a
-- re-formation IF AND ONLY IF the new government re-assigns that same
-- portfolio to their party. If the party falls into opposition (or the
-- portfolio is reshuffled to a partner, or left vacant) the pin is
-- dropped and the new coalition's appointee stands.
--
-- Mechanism (mirrors 20270494, which reacts to formations via a trigger
-- on government_formations precisely to avoid a 380-line core rewrite):
--   • `pinned_ministers` is the durable record of manual appointments.
--   • A DEFERRABLE INITIALLY DEFERRED constraint trigger on
--     government_formations fires at COMMIT — i.e. AFTER finalize_
--     government_formation has finished wiping + reassigning the cabinet
--     within the same transaction (it flips status='formed' at line ~160,
--     well before the minister loop, so a non-deferred trigger would run
--     too early). At commit the ministries rows are final, so we can
--     compare the freshly-assigned party against each pin and either
--     restore the pinned minister or retire the pin.
--
-- finalize_government_formation itself is NOT modified.

BEGIN;

-- ── Durable record of manual ("pinned") cabinet appointments. ────────
CREATE TABLE IF NOT EXISTS public.pinned_ministers (
    nation_id    uuid    NOT NULL,
    ministry_key text    NOT NULL,
    party_id     uuid,                 -- the pinned minister's party; the
                                       -- continuity test compares this to
                                       -- the re-formed portfolio holder.
    first_name   text    NOT NULL,
    last_name    text    NOT NULL,
    age          integer,
    created_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (nation_id, ministry_key)
);

-- System/admin data only — never read or written from the client. RLS on
-- with no policies denies anon/authenticated; the SECURITY DEFINER
-- trigger and admin scripts bypass it.
ALTER TABLE public.pinned_ministers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pinned_ministers FROM PUBLIC, anon, authenticated;

-- ── Reapply pins after a government forms. ───────────────────────────
CREATE OR REPLACE FUNCTION public._reapply_pinned_ministers()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_pin RECORD;
    v_row RECORD;
BEGIN
    -- Only on the transition INTO 'formed'. (The same function also flips
    -- old formations to 'dissolved'; those events no-op here.)
    IF NEW.status IS DISTINCT FROM 'formed'
       OR OLD.status IS NOT DISTINCT FROM 'formed' THEN
        RETURN NULL;
    END IF;

    FOR v_pin IN
        SELECT * FROM public.pinned_ministers WHERE nation_id = NEW.nation_id
    LOOP
        SELECT id, party_id INTO v_row
          FROM public.ministries
         WHERE nation_id    = NEW.nation_id
           AND ministry_key = v_pin.ministry_key
           AND is_active    = true
         LIMIT 1;

        IF v_row.id IS NOT NULL
           AND v_row.party_id IS NOT DISTINCT FROM v_pin.party_id THEN
            -- Same party re-took the portfolio → restore the pinned
            -- minister over the NPC the formation just slotted in.
            UPDATE public.ministries
               SET minister_first_name = v_pin.first_name,
                   minister_last_name  = v_pin.last_name,
                   minister_age        = v_pin.age
             WHERE id = v_row.id;
        ELSE
            -- Party lost the portfolio (opposition / reshuffle / vacant)
            -- → retire the pin and leave the new coalition's appointee.
            DELETE FROM public.pinned_ministers
             WHERE nation_id    = v_pin.nation_id
               AND ministry_key = v_pin.ministry_key;
        END IF;
    END LOOP;

    RETURN NULL;
END $$;

COMMENT ON FUNCTION public._reapply_pinned_ministers() IS
    'Deferred constraint-trigger handler on government_formations. At commit (after finalize_government_formation reassigns the cabinet), restores each pinned_ministers entry whose portfolio was re-assigned to the same party, and retires pins whose party lost the portfolio.';

DROP TRIGGER IF EXISTS trg_reapply_pinned_ministers ON public.government_formations;
CREATE CONSTRAINT TRIGGER trg_reapply_pinned_ministers
    AFTER UPDATE ON public.government_formations
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION public._reapply_pinned_ministers();

NOTIFY pgrst, 'reload schema';

COMMIT;
