-- Per-tick corporation cash snapshots used for UI cash-change reconciliation.
CREATE TABLE IF NOT EXISTS public.corp_cash_history (
    id BIGSERIAL PRIMARY KEY,
    faction_id UUID NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    tick INTEGER NOT NULL,
    cash_start BIGINT NOT NULL DEFAULT 0,
    cash_end BIGINT NOT NULL DEFAULT 0,
    cash_delta BIGINT NOT NULL DEFAULT 0,
    non_pnl_cash_movements BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (faction_id, tick)
);

CREATE INDEX IF NOT EXISTS idx_corp_cash_history_faction_tick
    ON public.corp_cash_history (faction_id, tick DESC);

ALTER TABLE public.corp_cash_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'corp_cash_history'
          AND policyname = 'Anyone can read corp_cash_history'
    ) THEN
        CREATE POLICY "Anyone can read corp_cash_history"
            ON public.corp_cash_history
            FOR SELECT
            USING (true);
    END IF;
END $$;
