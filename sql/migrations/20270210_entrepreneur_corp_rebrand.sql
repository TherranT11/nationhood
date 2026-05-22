-- ════════════════════════════════════════════════════════════════════
-- ENTREPRENEUR CORP — Rebrand (logo + name + stock ticker)
-- ════════════════════════════════════════════════════════════════════
-- Entrepreneur corps had no logo, no ticker, and no way to rename after
-- founding. This adds the Rebrand action (2.6.8.6.2):
--   • set a custom logo, corp name, and stock ticker
--   • costs $1M from the corp's OWN treasury_cash (same "corp pays for
--     corp things" rule as construction / freighters / brokerage fees —
--     20270182), NOT the owner's party_funds
--   • 12-tick cooldown between rebrands
--   • ticker is REQUIRED and UNIQUE among entrepreneur corps (2-4
--     uppercase letters/digits)
--
-- Logo files are uploaded client-side to the existing 'party-logos'
-- storage bucket (no path restriction on it); only the resulting public
-- URL is passed to this RPC.
--
-- NOTE: ticker uniqueness is enforced within entrepreneur_corps only;
-- legacy faction corp_ticker symbols are a separate (largely retired)
-- system and are not cross-checked here.
--
-- Idempotent. ADD COLUMN IF NOT EXISTS; CREATE OR REPLACE on the RPC;
-- CREATE UNIQUE INDEX IF NOT EXISTS.
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE entrepreneur_corps
    ADD COLUMN IF NOT EXISTS ticker                       varchar(4),
    ADD COLUMN IF NOT EXISTS custom_logo_url              text,
    ADD COLUMN IF NOT EXISTS rebrand_cooldown_until_tick  int;

COMMENT ON COLUMN entrepreneur_corps.ticker IS
    'Stock ticker symbol, 2-4 uppercase letters/digits. Unique among entrepreneur corps (partial unique index). Set via entrepreneur_rebrand_corp.';
COMMENT ON COLUMN entrepreneur_corps.custom_logo_url IS
    'Public URL of the corp''s uploaded logo (party-logos bucket). NULL = monogram fallback. Set via entrepreneur_rebrand_corp.';
COMMENT ON COLUMN entrepreneur_corps.rebrand_cooldown_until_tick IS
    'Rebrand is blocked until shard.current_tick reaches this value (12-tick cooldown). NULL/0 = no cooldown.';

-- These drive a paid action ($1M + cooldown + unique ticker), so the
-- owner must NOT be able to set them via the 20270139 owner-writes RLS
-- policy directly from the client (which would bypass the fee/cooldown).
-- Same column-write-revoke as treasury_cash (20270144) / freighters_owned
-- (20270181). Mutable only via the SECURITY DEFINER RPC below.
REVOKE UPDATE (ticker, custom_logo_url, rebrand_cooldown_until_tick)
    ON entrepreneur_corps FROM PUBLIC, anon, authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS idx_entrepreneur_corps_ticker
    ON entrepreneur_corps (ticker) WHERE ticker IS NOT NULL;

-- ── entrepreneur_rebrand_corp ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.entrepreneur_rebrand_corp(
    p_corp_id  uuid,
    p_name     text,
    p_ticker   text,
    p_logo_url text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid     uuid := auth.uid();
    v_corp    entrepreneur_corps%ROWTYPE;
    v_fac     factions%ROWTYPE;
    v_name    text   := btrim(COALESCE(p_name, ''));
    v_ticker  text   := upper(btrim(COALESCE(p_ticker, '')));
    v_logo    text   := NULLIF(btrim(COALESCE(p_logo_url, '')), '');
    v_tick    int;
    v_cost    constant bigint := 1000000;
    v_treas   numeric;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
    END IF;
    IF p_corp_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
    END IF;

    SELECT * INTO v_corp FROM entrepreneur_corps WHERE id = p_corp_id FOR UPDATE;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'corp_not_found');
    END IF;

    -- Caller must own the corp.
    SELECT * INTO v_fac FROM factions
     WHERE faction_type = 'entrepreneur'
       AND abandoned_at IS NULL
       AND (id = v_uid OR linked_user_id = v_uid)
     ORDER BY created_at ASC LIMIT 1
     FOR UPDATE;
    IF v_fac.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'reason', 'no_entrepreneur');
    END IF;
    IF v_corp.owner_faction_id <> v_fac.id THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
    END IF;

    IF length(v_name) < 2 OR length(v_name) > 80 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_name');
    END IF;
    IF v_ticker !~ '^[A-Z0-9]{2,4}$' THEN
        RETURN jsonb_build_object('success', false, 'reason', 'invalid_ticker');
    END IF;

    SELECT current_tick INTO v_tick FROM shard WHERE name = 'Alpha Shard' LIMIT 1;
    v_tick := COALESCE(v_tick, 0);

    IF COALESCE(v_corp.rebrand_cooldown_until_tick, 0) > v_tick THEN
        RETURN jsonb_build_object('success', false, 'reason', 'cooldown_active',
            'remaining', v_corp.rebrand_cooldown_until_tick - v_tick);
    END IF;

    v_treas := COALESCE(v_corp.treasury_cash, 0);
    IF v_treas < v_cost THEN
        RETURN jsonb_build_object('success', false, 'reason', 'insufficient_funds',
            'have', v_treas::bigint, 'need', v_cost);
    END IF;

    -- Ticker uniqueness (pre-check for a clean error; the unique index is
    -- the backstop against a concurrent race, caught below).
    IF EXISTS (SELECT 1 FROM entrepreneur_corps
                WHERE ticker = v_ticker AND id <> p_corp_id) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'ticker_taken', 'ticker', v_ticker);
    END IF;

    BEGIN
        UPDATE entrepreneur_corps
           SET name                        = v_name,
               ticker                      = v_ticker,
               custom_logo_url             = COALESCE(v_logo, custom_logo_url),
               treasury_cash               = COALESCE(treasury_cash, 0) - v_cost,
               rebrand_cooldown_until_tick = v_tick + 12,
               updated_at                  = now()
         WHERE id = p_corp_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'reason', 'ticker_taken', 'ticker', v_ticker);
    END;

    INSERT INTO event_log (
        nation_id, faction_id, event_name, description_used,
        category, trigger_key, effects_applied, fired_at_tick
    ) VALUES (
        v_corp.hq_nation_id, v_fac.id,
        'Corporation Rebranded',
        format('%s rebrands as %s (%s) for $1M.', v_corp.name, v_name, v_ticker),
        'corporate', 'corp_rebrand',
        jsonb_build_object(
            'corp_id',    p_corp_id,
            'old_name',   v_corp.name,
            'new_name',   v_name,
            'ticker',     v_ticker,
            'logo_set',   (v_logo IS NOT NULL),
            'cost',       v_cost
        ),
        v_tick
    );

    RETURN jsonb_build_object(
        'success',          true,
        'corp_id',          p_corp_id,
        'name',             v_name,
        'ticker',           v_ticker,
        'logo_url',         COALESCE(v_logo, v_corp.custom_logo_url),
        'treasury_after',   (v_treas - v_cost)::bigint,
        'cooldown_until',   v_tick + 12
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.entrepreneur_rebrand_corp(uuid, text, text, text) TO authenticated;

COMMENT ON FUNCTION public.entrepreneur_rebrand_corp(uuid, text, text, text) IS
    'Owner rebrands their entrepreneur corp: name (2-80), ticker (2-4 uppercase, unique among entrepreneur corps), optional logo URL. Costs $1M from the corp''s treasury_cash; 12-tick cooldown (rebrand_cooldown_until_tick). p_logo_url NULL/blank leaves the existing logo. Owner-gated, SECURITY DEFINER.';

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ── ROLLBACK ──
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.entrepreneur_rebrand_corp(uuid, text, text, text);
-- DROP INDEX IF EXISTS idx_entrepreneur_corps_ticker;
-- ALTER TABLE entrepreneur_corps
--   DROP COLUMN IF EXISTS rebrand_cooldown_until_tick,
--   DROP COLUMN IF EXISTS custom_logo_url,
--   DROP COLUMN IF EXISTS ticker;
-- COMMIT;
