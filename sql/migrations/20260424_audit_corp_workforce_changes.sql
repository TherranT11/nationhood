-- ════════════════════════════════════════════════════════════════════════════════
-- Audit trigger for corp workforce changes
--
-- Problem: corps report corp_general_workforce (and peers) silently reducing
-- between ticks. Yakovic Concern at Calveth tick 19 and Montequilla
-- Contructions at tick 15 both hit dramatic unexpected drops. A grep of the
-- entire repo turned up zero code paths that write workforce outside of
-- player-initiated actions (Restructure, Hire/Fire, Subsidiary Merge). The
-- reductions must be coming from somewhere — either a trigger/function not
-- tracked in migrations, a RPC body, or a client flow we haven't found.
--
-- Fix strategy: ship a logging trigger that captures the SQL of any statement
-- that modifies a workforce column. Next time a drop happens, the audit row
-- will show the exact query text + application that caused it, making the
-- source trivial to trace.
--
-- No behavior change. Only fires when general / skilled / innovative workforce
-- actually changes (the WHEN clause short-circuits on no-op updates so tick
-- processors that update unrelated columns don't spam the log).
--
-- Idempotent: DROP TRIGGER IF EXISTS + CREATE OR REPLACE FUNCTION. Safe to
-- re-run.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS corp_workforce_audit (
    id                BIGSERIAL PRIMARY KEY,
    faction_id        UUID NOT NULL,
    changed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    old_general       INT,
    new_general       INT,
    old_skilled       INT,
    new_skilled       INT,
    old_innovative    INT,
    new_innovative    INT,
    statement_text    TEXT,
    application_name  TEXT,
    session_user_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_workforce_audit_faction_time
    ON corp_workforce_audit (faction_id, changed_at DESC);

CREATE OR REPLACE FUNCTION log_workforce_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO corp_workforce_audit (
        faction_id,
        old_general, new_general,
        old_skilled, new_skilled,
        old_innovative, new_innovative,
        statement_text,
        application_name,
        session_user_name
    )
    VALUES (
        NEW.id,
        OLD.corp_general_workforce, NEW.corp_general_workforce,
        OLD.corp_skilled_workforce, NEW.corp_skilled_workforce,
        OLD.corp_innovative_workforce, NEW.corp_innovative_workforce,
        current_query(),
        current_setting('application_name', true),
        session_user
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_workforce_change ON factions;
CREATE TRIGGER trg_log_workforce_change
    AFTER UPDATE ON factions
    FOR EACH ROW
    WHEN (
        OLD.corp_general_workforce    IS DISTINCT FROM NEW.corp_general_workforce
     OR OLD.corp_skilled_workforce    IS DISTINCT FROM NEW.corp_skilled_workforce
     OR OLD.corp_innovative_workforce IS DISTINCT FROM NEW.corp_innovative_workforce
    )
    EXECUTE FUNCTION log_workforce_change();

-- ── READ QUERY (copy separately into SQL Editor after the next drop occurs) ──
--
-- SELECT
--     f.faction_name,
--     a.changed_at,
--     a.old_general, a.new_general, a.new_general - a.old_general AS delta_gen,
--     a.old_skilled, a.new_skilled, a.new_skilled - a.old_skilled AS delta_skl,
--     a.old_innovative, a.new_innovative, a.new_innovative - a.old_innovative AS delta_inn,
--     a.application_name,
--     substring(a.statement_text, 1, 400) AS query
-- FROM corp_workforce_audit a
-- JOIN factions f ON f.id = a.faction_id
-- ORDER BY a.changed_at DESC
-- LIMIT 50;
