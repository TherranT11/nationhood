-- =========================================================================
-- Backfill active_laws from existing nation_policies starting-status rows.
--
-- The Citizenship Framework Act save in policyadmin wrote rows to
-- nation_policies but not to active_laws, so the laws.html page (which
-- queries active_laws) showed "0 total". The savePolicy code now writes
-- both tables on subsequent saves, but rows already in nation_policies
-- need a one-time backfill.
--
-- Idempotent: ON CONFLICT DO NOTHING leaves any active_laws row that
-- already exists for (nation_id, policy_id) untouched.
-- =========================================================================

INSERT INTO active_laws (nation_id, policy_id, selected_option_id, passed_tick)
SELECT np.nation_id, np.policy_id, np.selected_option_id, 0
FROM nation_policies np
WHERE np.selected_option_id IS NOT NULL
ON CONFLICT (nation_id, policy_id) DO NOTHING;
