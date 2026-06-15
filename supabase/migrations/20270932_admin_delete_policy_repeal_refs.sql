-- ════════════════════════════════════════════════════════════════════
-- 20270932 — admin_delete_policy: clear bills.repeal_active_law_id too
--
-- 20270931 still failed with active_laws_policy_id_fkey. Root cause: the
-- active_laws delete inside the RPC was THROWING (a repeal bill points at
-- one of this policy's active_laws via bills.repeal_active_law_id) and the
-- blanket `EXCEPTION WHEN OTHERS` swallowed it — so the row survived and
-- the later policies delete tripped the FK loudly. 20270931 only nulled
-- bill_articles.repeal_active_law_id, never bills.repeal_active_law_id.
--
-- Re-emit with two changes:
--   1. Null BOTH bills.repeal_active_law_id and bill_articles.
--      repeal_active_law_id that point at this policy's active_laws,
--      before deleting active_laws.
--   2. The child-delete loop now only swallows undefined_table /
--      undefined_column (optional tables in some shards). A real error —
--      an FK we didn't clear, a permission issue — aborts the whole
--      function and surfaces its true reason, instead of masking as a
--      downstream active_laws_policy_id_fkey.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_delete_policy(p_policy_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_result jsonb := '{}'::jsonb;
    v_name   text;
    v_cnt    bigint;
    v_tbl    text;
    -- Child tables holding a policy_id FK. amendment_requests /
    -- bill_amendment_requests are optional in some shards.
    v_children text[] := ARRAY[
        'active_laws', 'nation_policies', 'bill_articles',
        'amendment_requests', 'bill_amendment_requests'
    ];
BEGIN
    SELECT policy_name INTO v_name FROM policies WHERE id = p_policy_id;
    IF v_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'policy_not_found');
    END IF;

    -- A repeal bill or bill article (possibly from ANOTHER policy) can point
    -- at one of this policy's active_laws via repeal_active_law_id; null
    -- those refs first so deleting active_laws below isn't blocked. Both
    -- tables carry the column; each guarded so a shard lacking it is skipped.
    BEGIN
        UPDATE bills SET repeal_active_law_id = NULL
         WHERE repeal_active_law_id IN
               (SELECT id FROM active_laws WHERE policy_id = p_policy_id);
    EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
    END;
    BEGIN
        UPDATE bill_articles SET repeal_active_law_id = NULL
         WHERE repeal_active_law_id IN
               (SELECT id FROM active_laws WHERE policy_id = p_policy_id);
    EXCEPTION WHEN undefined_column OR undefined_table THEN NULL;
    END;

    -- Clear every policy_id FK child. Only a missing table/column is
    -- skipped — any real failure (e.g. an unhandled FK) aborts loudly so
    -- it can't masquerade as the downstream policies FK.
    FOREACH v_tbl IN ARRAY v_children LOOP
        BEGIN
            EXECUTE format('DELETE FROM %I WHERE policy_id = $1', v_tbl) USING p_policy_id;
            GET DIAGNOSTICS v_cnt = ROW_COUNT;
            v_result := v_result || jsonb_build_object(v_tbl, v_cnt);
        EXCEPTION WHEN undefined_table OR undefined_column THEN
            v_result := v_result || jsonb_build_object(v_tbl, 'skipped: missing');
        END;
    END LOOP;

    -- Options, then the policy itself.
    DELETE FROM policy_options WHERE policy_id = p_policy_id;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_result := v_result || jsonb_build_object('policy_options', v_cnt);

    DELETE FROM policies WHERE id = p_policy_id;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_result := v_result || jsonb_build_object('policies', v_cnt);

    RETURN v_result || jsonb_build_object('success', true, 'policy_name', v_name);
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_policy(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_delete_policy(uuid) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
