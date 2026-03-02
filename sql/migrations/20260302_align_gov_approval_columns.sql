-- Align approval metric naming to canonical gov_approval across nations and nations_history.

DO $$
BEGIN
    -- nations table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'nations' AND column_name = 'national_approval'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'nations' AND column_name = 'gov_approval'
    ) THEN
        EXECUTE 'ALTER TABLE public.nations RENAME COLUMN national_approval TO gov_approval';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'nations' AND column_name = 'national_approval'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'nations' AND column_name = 'gov_approval'
    ) THEN
        EXECUTE 'UPDATE public.nations SET gov_approval = COALESCE(gov_approval, national_approval) WHERE national_approval IS NOT NULL';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'nations' AND column_name = 'gov_approval'
    ) THEN
        EXECUTE 'ALTER TABLE public.nations ADD COLUMN gov_approval REAL DEFAULT 50';
    END IF;

    -- nations_history table
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'nations_history' AND column_name = 'national_approval'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'nations_history' AND column_name = 'gov_approval'
    ) THEN
        EXECUTE 'ALTER TABLE public.nations_history RENAME COLUMN national_approval TO gov_approval';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'nations_history' AND column_name = 'national_approval'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'nations_history' AND column_name = 'gov_approval'
    ) THEN
        EXECUTE 'UPDATE public.nations_history SET gov_approval = COALESCE(gov_approval, national_approval) WHERE national_approval IS NOT NULL';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'nations_history' AND column_name = 'gov_approval'
    ) THEN
        EXECUTE 'ALTER TABLE public.nations_history ADD COLUMN gov_approval NUMERIC';
    END IF;
END $$;
