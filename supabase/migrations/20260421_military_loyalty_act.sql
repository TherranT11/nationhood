-- ══════════════════════════════════════════════════════════════════════════
-- Military Loyalty Act — structural (foundational) policy
--
-- Ties military promotions and budgets directly to the head of government's
-- office, bypassing the defense ministry. Requires foundational supermajority.
--
-- One-shot effects on enactment:
--   • Stability      +5
--   • Freedom Index  −3
--   • Legitimacy     −3
--
-- Persistent rule while MLA is an active law in a nation:
--   The Defense Minister row in ministries is force-synced each tick to match
--   the current Head of Government (first/last name, age, party_id). The
--   minister_approval resets to 50 whenever the sync changes who holds the
--   slot. The defense ministry cannot be dismissed by the HoG while MLA is
--   active. Sync + enact/repeal hooks live in js/game/military-loyalty.js.
--
-- policy_type = 'structural' is the existing foundational-only gate —
-- bill.html filters structural policies to foundational bill drafts only,
-- so players must pass this with a foundational supermajority.
--
-- Idempotent: UPDATE-by-key first; if no row matched (IF NOT FOUND), INSERT.
-- ══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    UPDATE public.policies SET
        policy_name           = 'Military Loyalty Act',
        description           = 'Ties military promotions and budgets directly to the head of government''s office, bypassing the defense ministry. While active, the Defense Minister is auto-synced to the sitting Head of Government and cannot be dismissed.',
        major_sector          = 'Governance',
        minor_sector          = 'Civil-Military',
        ideology              = 'Authoritarian',
        policy_type           = 'structural',
        target_stat           = 'stability',
        stat_direction        = 'up',
        stat_change           = 0,
        stat_change_per_tick  = 0,
        duration_months       = 1,
        stat_effects          = '[
            {"stat_key":"stability","direction":"up","rate":5,"delay_ticks":0,"duration_ticks":1,"adjust_type":null,"adjust_value":0},
            {"stat_key":"freedom_index","direction":"down","rate":3,"delay_ticks":0,"duration_ticks":1,"adjust_type":null,"adjust_value":0},
            {"stat_key":"legitimacy","direction":"down","rate":3,"delay_ticks":0,"duration_ticks":1,"adjust_type":null,"adjust_value":0}
        ]'::jsonb,
        approval_impact       = 0,
        ap_cost               = 0,
        upfront_cost          = 0,
        ongoing_cost          = 0,
        is_active             = true
    WHERE policy_key = 'military_loyalty';

    IF NOT FOUND THEN
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
            'military_loyalty',
            'Military Loyalty Act',
            'Ties military promotions and budgets directly to the head of government''s office, bypassing the defense ministry. While active, the Defense Minister is auto-synced to the sitting Head of Government and cannot be dismissed.',
            'Governance',
            'Civil-Military',
            'Authoritarian',
            'structural',
            'stability',
            'up',
            0,
            0,
            1,
            '[
                {"stat_key":"stability","direction":"up","rate":5,"delay_ticks":0,"duration_ticks":1,"adjust_type":null,"adjust_value":0},
                {"stat_key":"freedom_index","direction":"down","rate":3,"delay_ticks":0,"duration_ticks":1,"adjust_type":null,"adjust_value":0},
                {"stat_key":"legitimacy","direction":"down","rate":3,"delay_ticks":0,"duration_ticks":1,"adjust_type":null,"adjust_value":0}
            ]'::jsonb,
            0,
            0,
            0,
            0,
            true
        );
    END IF;
END $$;
