-- ============================================================================
-- DISPUTE CARDS — the Escalate/Restrain card model for bilateral issues.
--
-- Replaces the old per-option (occupying/claimant) issue_card_definitions format
-- with role-based cards: each card has a theme + two roles (Claimant = the nation
-- that administers/holds the ground; Pressor = the challenger), and each role has
-- a reliable MOVE and a swingy, sometimes-conditional EVENT. The Initiative holder
-- applies one option from THEIR role.
--
-- Stats are single signed values on bilateral_issues (one source of truth):
--   leverage      — Pressor-positive  (+ toward Pressor, − toward Claimant)
--   issue_stat_1  — Claim, Claimant-positive (+ toward Claimant, − toward Pressor)
--   issue_stat_2  — Dissidents, an unsigned shared unrest level (>= 0)
--   tension       — shared 0..10
--
-- Effect JSON per option:
--   { "base": [ {stat, side?, amount} ... ],
--     "condition": { stat, op, value, then:[...], else:[...] } }   (optional)
-- side is 'claimant' | 'pressor' for leverage/claim; omitted for dissidents/tension.
-- A {stat:'initiative', side, action:'lose'} effect passes Initiative to the other side.
-- ============================================================================

BEGIN;

-- ── 1. Card-definition table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.issue_dispute_cards (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_type  TEXT NOT NULL,
    card_number INTEGER NOT NULL,
    theme_name  TEXT NOT NULL,
    theme_desc  TEXT NOT NULL,
    roles       JSONB NOT NULL,
    CONSTRAINT uq_issue_dispute_card UNIQUE (issue_type, card_number)
);

ALTER TABLE public.issue_dispute_cards ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'issue_dispute_cards'
          AND policyname = 'Anyone can read issue_dispute_cards'
    ) THEN
        CREATE POLICY "Anyone can read issue_dispute_cards"
            ON public.issue_dispute_cards FOR SELECT
            USING (true);
    END IF;
END $$;

-- ── 2. Which card is currently active on an issue ───────────────────────────
ALTER TABLE bilateral_issues
    ADD COLUMN IF NOT EXISTS current_card_number INT NOT NULL DEFAULT 1;

-- ── 3. Card 1 — Restless Frontier ───────────────────────────────────────────
INSERT INTO public.issue_dispute_cards (issue_type, card_number, theme_name, theme_desc, roles)
VALUES (
    'territorial_ownership', 1, 'Restless Frontier',
    'The population living in the contested zone has grown agitated, and crowds now gather nightly at the disputed line. Both governments watch closely — but they want different things from the unrest. The side pressing its claim sees leverage in the chaos; the side holding the ground sees a fire it must control.',
    $json$
    {
      "claimant": {
        "move": {
          "name": "Restore Order",
          "kind": "reliable",
          "desc": "Send in administrators to calm the zone and prove you govern it.",
          "effect_text": "−2 Dissidents · +2 Claim to Claimant · −1 Leverage to Claimant",
          "effects": { "base": [
            { "stat": "dissidents", "amount": -2 },
            { "stat": "claim", "side": "claimant", "amount": 2 },
            { "stat": "leverage", "side": "claimant", "amount": -1 }
          ] }
        },
        "event": {
          "name": "Iron Fist",
          "kind": "swingy",
          "desc": "Crush the unrest hard and dare the world to object.",
          "effect_text": "Tension +1. −3 Dissidents. Then: if Dissidents were 5+, +2 Leverage to Claimant; if under 5, −2 Claim to Claimant.",
          "effects": {
            "base": [
              { "stat": "tension", "amount": 1 },
              { "stat": "dissidents", "amount": -3 }
            ],
            "condition": {
              "stat": "dissidents", "op": "gte", "value": 5,
              "then": [ { "stat": "leverage", "side": "claimant", "amount": 2 } ],
              "else": [ { "stat": "claim", "side": "claimant", "amount": -2 } ]
            }
          }
        }
      },
      "pressor": {
        "move": {
          "name": "Back the Agitators",
          "kind": "reliable",
          "desc": "Fund the crowds and frame their demands as proof the land is yours.",
          "effect_text": "+2 Leverage to Pressor · +2 Claim to Pressor · +3 Dissidents",
          "effects": { "base": [
            { "stat": "leverage", "side": "pressor", "amount": 2 },
            { "stat": "claim", "side": "pressor", "amount": 2 },
            { "stat": "dissidents", "amount": 3 }
          ] }
        },
        "event": {
          "name": "Let the Fire Spread",
          "kind": "swingy",
          "desc": "Stand back and gamble the chaos serves you — but a mob has no master.",
          "effect_text": "Tension +2. Then: if Dissidents under 5, +3 Leverage & +3 Claim to Pressor; if 5+, +5 Dissidents & Pressor loses Initiative.",
          "effects": {
            "base": [ { "stat": "tension", "amount": 2 } ],
            "condition": {
              "stat": "dissidents", "op": "lt", "value": 5,
              "then": [
                { "stat": "leverage", "side": "pressor", "amount": 3 },
                { "stat": "claim", "side": "pressor", "amount": 3 }
              ],
              "else": [
                { "stat": "dissidents", "amount": 5 },
                { "stat": "initiative", "side": "pressor", "action": "lose" }
              ]
            }
          }
        }
      }
    }
    $json$::jsonb
)
ON CONFLICT (issue_type, card_number) DO UPDATE
    SET theme_name = EXCLUDED.theme_name,
        theme_desc = EXCLUDED.theme_desc,
        roles      = EXCLUDED.roles;

-- ── 4. resolve_dispute_card RPC ─────────────────────────────────────────────
-- The Initiative holder applies one option ('move' | 'event') from their role.
-- Data-driven: reads the option's effect JSON and applies it to the single-value
-- stats, then advances to the next card. SECURITY DEFINER + initiative-gated.
CREATE OR REPLACE FUNCTION public.resolve_dispute_card(p_issue_id UUID, p_option TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller    UUID := auth.uid();
    v_issue     bilateral_issues%ROWTYPE;
    v_nation_id UUID;
    v_claimant  UUID;
    v_pressor   UUID;
    v_role      TEXT;
    v_card      issue_dispute_cards%ROWTYPE;
    v_opt       JSONB;
    v_effects   JSONB;
    v_list      JSONB;
    v_cond      JSONB;
    v_eff       JSONB;
    v_lev       INT;
    v_claim     INT;
    v_diss      INT;
    v_tension   NUMERIC;
    v_diss_snap INT;
    v_lev_snap  INT;
    v_claim_snap INT;
    v_new_init  UUID;
    v_match     BOOLEAN;
    v_cv        INT;
    v_tick      INT;
BEGIN
    IF v_caller IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Not authenticated.'); END IF;
    IF p_option NOT IN ('move','event') THEN RETURN jsonb_build_object('ok', false, 'message', 'Invalid option.'); END IF;

    SELECT * INTO v_issue FROM bilateral_issues WHERE id = p_issue_id;
    IF v_issue.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'Issue not found.'); END IF;
    IF v_issue.status NOT IN ('active','partial') THEN
        RETURN jsonb_build_object('ok', false, 'message', 'This issue is not active.');
    END IF;

    -- Caller's nation (must be a party to the issue), via faction ownership.
    SELECT nation_id INTO v_nation_id FROM factions
     WHERE (id = v_caller OR linked_user_id = v_caller)
       AND nation_id IN (v_issue.nation_a_id, v_issue.nation_b_id)
     LIMIT 1;
    IF v_nation_id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'You are not party to this issue.'); END IF;

    IF v_issue.initiative_nation_id IS DISTINCT FROM v_nation_id THEN
        RETURN jsonb_build_object('ok', false, 'message', 'Only the Initiative holder can apply the card.');
    END IF;

    -- Fixed roles: Claimant administers/holds the ground; Pressor is the challenger.
    v_claimant := v_issue.administering_nation_id;
    v_pressor  := CASE WHEN v_issue.nation_a_id = v_claimant THEN v_issue.nation_b_id ELSE v_issue.nation_a_id END;
    v_role     := CASE WHEN v_nation_id = v_claimant THEN 'claimant' ELSE 'pressor' END;

    SELECT * INTO v_card FROM issue_dispute_cards
     WHERE issue_type = v_issue.issue_type AND card_number = COALESCE(v_issue.current_card_number, 1);
    IF v_card.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'No current card to apply.'); END IF;

    v_opt := v_card.roles -> v_role -> p_option;
    IF v_opt IS NULL THEN RETURN jsonb_build_object('ok', false, 'message', 'That option is not available for your role.'); END IF;
    v_effects := v_opt -> 'effects';

    v_lev      := COALESCE(v_issue.leverage, 0);
    v_claim    := COALESCE(v_issue.issue_stat_1, 0);
    v_diss     := COALESCE(v_issue.issue_stat_2, 0);
    v_tension  := COALESCE(v_issue.tension, 0);
    v_lev_snap := v_lev; v_claim_snap := v_claim; v_diss_snap := v_diss;
    v_new_init := v_issue.initiative_nation_id;

    -- Assemble the effect list: base, then the matching conditional branch.
    v_list := COALESCE(v_effects -> 'base', '[]'::jsonb);
    v_cond := v_effects -> 'condition';
    IF v_cond IS NOT NULL THEN
        v_cv := CASE v_cond->>'stat'
                    WHEN 'leverage' THEN v_lev_snap
                    WHEN 'claim'    THEN v_claim_snap
                    ELSE v_diss_snap END;
        v_match := CASE v_cond->>'op'
                       WHEN 'gte' THEN v_cv >= (v_cond->>'value')::int
                       WHEN 'gt'  THEN v_cv >  (v_cond->>'value')::int
                       WHEN 'lte' THEN v_cv <= (v_cond->>'value')::int
                       WHEN 'lt'  THEN v_cv <  (v_cond->>'value')::int
                       ELSE false END;
        v_list := v_list || COALESCE(v_cond -> (CASE WHEN v_match THEN 'then' ELSE 'else' END), '[]'::jsonb);
    END IF;

    -- Apply each effect with the single-value sign conventions.
    FOR v_eff IN SELECT * FROM jsonb_array_elements(v_list) LOOP
        DECLARE
            st  TEXT := v_eff->>'stat';
            sd  TEXT := v_eff->>'side';
            amt INT  := COALESCE((v_eff->>'amount')::int, 0);
        BEGIN
            IF st = 'leverage' THEN
                v_lev := v_lev + amt * (CASE WHEN sd = 'pressor' THEN 1 ELSE -1 END);
            ELSIF st = 'claim' THEN
                v_claim := v_claim + amt * (CASE WHEN sd = 'claimant' THEN 1 ELSE -1 END);
            ELSIF st = 'dissidents' THEN
                v_diss := GREATEST(0, v_diss + amt);
            ELSIF st = 'tension' THEN
                v_tension := LEAST(10, GREATEST(0, v_tension + amt));
            ELSIF st = 'initiative' AND (v_eff->>'action') = 'lose' THEN
                -- the named side loses Initiative; it passes to the other nation
                v_new_init := CASE WHEN sd = 'pressor' THEN v_claimant ELSE v_pressor END;
            END IF;
        END;
    END LOOP;

    SELECT COALESCE(current_tick, 0) INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;

    UPDATE bilateral_issues SET
        leverage             = v_lev,
        issue_stat_1         = v_claim,
        issue_stat_2         = v_diss,
        tension              = v_tension,
        initiative_nation_id = v_new_init,
        current_card_number  = COALESCE(current_card_number, 1) + 1
    WHERE id = p_issue_id;

    INSERT INTO bilateral_issue_history (issue_id, tick, event_type, event_text, metadata)
    VALUES (p_issue_id, v_tick, 'card_played',
        (v_opt->>'name') || ' — ' || v_card.theme_name || '.',
        jsonb_build_object('card_number', v_card.card_number, 'role', v_role, 'option', p_option,
            'leverage', v_lev, 'claim', v_claim, 'dissidents', v_diss, 'tension', v_tension,
            'initiative_changed', (v_new_init IS DISTINCT FROM v_issue.initiative_nation_id)));

    RETURN jsonb_build_object('ok', true, 'message', (v_opt->>'name') || ' applied.',
        'leverage', v_lev, 'claim', v_claim, 'dissidents', v_diss, 'tension', v_tension,
        'initiative_nation_id', v_new_init);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_dispute_card(UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
