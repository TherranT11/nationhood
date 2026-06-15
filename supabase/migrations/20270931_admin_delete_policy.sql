-- ════════════════════════════════════════════════════════════════════
-- 20270931 — admin_delete_policy: server-side cascade for policy deletion
--
-- policyadmin.html's [Del] failed with
--   update or delete on table "policies" violates foreign key constraint
--   "active_laws_policy_id_fkey" on table "active_laws"
-- because the client deleted child rows fire-and-forget (no error/count
-- check) and those deletes are subject to whatever RLS active_laws
-- currently carries — so they silently removed nothing, then the policy
-- delete tripped the FK. active_laws is LIVE state (the assembly
-- floor-vote resolver, 20270892, writes a row when a nation enacts a
-- policy), so the block is real, not stale data.
--
-- Fix: one SECURITY DEFINER RPC (mirrors admin_delete_party) that clears
-- every FK child in order, then policy_options, then the policy — atomic,
-- RLS-proof, admin-gated. The client calls this instead of chaining
-- unchecked deletes.
--
-- FK map into policies(id):        active_laws, nation_policies,
--   bill_articles, amendment_requests, bill_amendment_requests, policy_options
-- FK map into policy_options(id):  active_laws/nation_policies/bill_articles
--   .selected_option_id — covered transitively (those rows share this
--   policy's policy_id, so they're gone before policy_options is deleted).
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
    -- bill_amendment_requests are optional in some shards, so each delete
    -- is guarded — a missing table/column is skipped, not fatal.
    v_children text[] := ARRAY[
        'active_laws', 'nation_policies', 'bill_articles',
        'amendment_requests', 'bill_amendment_requests'
    ];
BEGIN
    IF NOT is_admin() THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_admin');
    END IF;

    SELECT policy_name INTO v_name FROM policies WHERE id = p_policy_id;
    IF v_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'policy_not_found');
    END IF;

    -- A repeal bill article (possibly from another policy's bill) can point
    -- at one of this policy's active_laws via repeal_active_law_id; null
    -- those refs first so the active_laws delete below isn't blocked.
    BEGIN
        UPDATE bill_articles SET repeal_active_law_id = NULL
         WHERE repeal_active_law_id IN
               (SELECT id FROM active_laws WHERE policy_id = p_policy_id);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    FOREACH v_tbl IN ARRAY v_children LOOP
        BEGIN
            EXECUTE format('DELETE FROM %I WHERE policy_id = $1', v_tbl) USING p_policy_id;
            GET DIAGNOSTICS v_cnt = ROW_COUNT;
            v_result := v_result || jsonb_build_object(v_tbl, v_cnt);
        EXCEPTION WHEN OTHERS THEN
            v_result := v_result || jsonb_build_object(v_tbl, 'skipped: ' || SQLERRM);
        END;
    END LOOP;

    -- Options, then the policy itself — unguarded so any remaining FK
    -- surfaces loudly (the whole function rolls back as one transaction).
    DELETE FROM policy_options WHERE policy_id = p_policy_id;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_result := v_result || jsonb_build_object('policy_options', v_cnt);

    DELETE FROM policies WHERE id = p_policy_id;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    v_result := v_result || jsonb_build_object('policies', v_cnt);

    RETURN v_result || jsonb_build_object('success', true, 'policy_name', v_name);
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_policy(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_delete_policy(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
