-- Store admin panel HTML in database, served only to verified admins.
-- This prevents direct fetch() of the static file.

CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- No one can read system_config directly
CREATE POLICY "No direct access" ON system_config
    FOR ALL TO authenticated
    USING (false)
    WITH CHECK (false);

-- RPC to get admin panel HTML — only returns content if caller is admin
CREATE OR REPLACE FUNCTION get_admin_panel()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    RETURN (SELECT value FROM system_config WHERE key = 'admin_panel_html');
END;
$$;
