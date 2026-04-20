-- ══════════════════════════════════════════════════════════════════════════
-- Internet Sovereignty Act — structural (foundational) policy
--
-- Creates a national internet firewall. Foreign platforms can be blocked.
-- Surveillance of domestic communications becomes legal.
--
-- Effects on enactment:
--   • Freedom Index   −5  (one-shot, stat_effects)
--   • Press Freedom   −3  (one-shot, stat_effects)
--   • Stability       +2  (one-shot, stat_effects)
--   • Gov Approval    +2  (one-shot, stat_effects)
--   • GDP Growth      −0.5 / tick for 3 ticks (temporary; target_stat +
--                     stat_change_per_tick + duration_months — the existing
--                     per-tick modifier primitive on policies)
--
-- Persistent rule while ISA is an active law in a nation:
--   Government-coalition members earn +1 momentum per post on subsequent
--   news articles in a tick (otherwise +0). Wired in js/news.js, gated
--   on ISA being present in active_laws and author in the coalition.
--
-- policy_type = 'structural' is the existing "foundational-only" gate —
-- bill.html:293 filters structural policies to foundational bill drafts
-- only, so players must pass this with a foundational supermajority.
-- No new column, no new enact function, no bespoke bill field.
--
-- Idempotent upsert-by-key via DO block: UPDATEs the existing row if
-- one exists (preserves the UUID so any enacted active_laws row keeps
-- its FK-by-value link), INSERTs if not. Safe to re-run.
-- ══════════════════════════════════════════════════════════════════════════

DO $isa$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id FROM public.policies WHERE policy_key = 'internet_sovereignty' LIMIT 1;

    IF v_id IS NULL THEN
        INSERT INTO public.policies (
            policy_key,
            policy_name,
            description,
            major_sector,
            minor_sector,
            ideology,
            policy_type,
            target_stat,
            stat_direction,
            stat_change,
            stat_change_per_tick,
            duration_months,
            stat_effects,
            approval_impact,
            ap_cost,
            upfront_cost,
            ongoing_cost,
            is_active
        ) VALUES (
            'internet_sovereignty',
            'Internet Sovereignty Act',
            'Creates a national internet firewall. Foreign platforms can be blocked. Surveillance of domestic communications becomes legal. Government-coalition parties earn +1 Momentum per subsequent news post each tick while the Act is in force.',
            'Governance',
            'Civil Liberties',
            'Nationalism',
            'structural',
            'gdp_growth',
            'down',
            0,
            0.5,
            3,
            '[
                {"stat_key":"freedom_index","direction":"down","rate":5,"delay_ticks":0,"duration_ticks":1,"adjust_type":null,"adjust_value":0},
                {"stat_key":"press_freedom","direction":"down","rate":3,"delay_ticks":0,"duration_ticks":1,"adjust_type":null,"adjust_value":0},
                {"stat_key":"stability","direction":"up","rate":2,"delay_ticks":0,"duration_ticks":1,"adjust_type":null,"adjust_value":0},
                {"stat_key":"gov_approval","direction":"up","rate":2,"delay_ticks":0,"duration_ticks":1,"adjust_type":null,"adjust_value":0},
                {"stat_key":"gdp_growth","direction":"down","rate":0.5,"delay_ticks":0,"duration_ticks":3,"adjust_type":null,"adjust_value":0}
            ]'::jsonb,
            0,
            0,
            0,
            0,
            true
        );
    ELSE
        UPDATE public.policies SET
            policy_name           = 'Internet Sovereignty Act',
            description           = 'Creates a national internet firewall. Foreign platforms can be blocked. Surveillance of domestic communications becomes legal. Government-coalition parties earn +1 Momentum per subsequent news post each tick while the Act is in force.',
            major_sector          = 'Governance',
            minor_sector          = 'Civil Liberties',
            ideology              = 'Nationalism',
            policy_type           = 'structural',
            target_stat           = 'gdp_growth',
            stat_direction        = 'down',
            stat_change           = 0,
            stat_change_per_tick  = 0.5,
            duration_months       = 3,
            stat_effects          = '[
                {"stat_key":"freedom_index","direction":"down","rate":5,"delay_ticks":0,"duration_ticks":1,"adjust_type":null,"adjust_value":0},
                {"stat_key":"press_freedom","direction":"down","rate":3,"delay_ticks":0,"duration_ticks":1,"adjust_type":null,"adjust_value":0},
                {"stat_key":"stability","direction":"up","rate":2,"delay_ticks":0,"duration_ticks":1,"adjust_type":null,"adjust_value":0},
                {"stat_key":"gov_approval","direction":"up","rate":2,"delay_ticks":0,"duration_ticks":1,"adjust_type":null,"adjust_value":0},
                {"stat_key":"gdp_growth","direction":"down","rate":0.5,"delay_ticks":0,"duration_ticks":3,"adjust_type":null,"adjust_value":0}
            ]'::jsonb,
            approval_impact       = 0,
            is_active             = true
        WHERE id = v_id;
    END IF;
END
$isa$;
