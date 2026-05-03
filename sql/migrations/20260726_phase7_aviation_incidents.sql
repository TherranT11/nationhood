-- 20260726_phase7_aviation_incidents.sql
--
-- Phase 7 — Aviation Incidents & Crisis Events.
--
-- Replaces the Phase 6 single-roll incident_stub with a three-tier
-- system: Minor / Moderate / Major. Each route, each tick, rolls all
-- three tiers independently. On a hit, picks an OS-eligible incident
-- type from that tier and creates an aviation_incidents row + event_log
-- entry + applies cost / op_safety damage / route grounding.
--
-- The corp must respond via Pressing Issues with one of three options:
--   • Issue press statement   −$0.5M       op_safety  0       reputation 0
--   • Compensate families     −10% of cost op_safety +0.5     reputation +1.0
--   • Refuse comment             $0        op_safety -0.5     reputation -1.5
--
-- Auto-refuse after 6 ticks of inactivity (treated as Refuse Comment).
--
-- If the initial incident cost > corp cash, declare_corp_bankruptcy
-- fires automatically (Q7 = B).
--
-- Compensation requires sufficient cash; server returns error if not.
-- Player must take a loan first (the warning UI surfaces this BEFORE
-- they click).

BEGIN;


-- ── 1. airline_routes.grounded_until_tick ───────────────────────
ALTER TABLE public.airline_routes
    ADD COLUMN IF NOT EXISTS grounded_until_tick INTEGER;

COMMENT ON COLUMN public.airline_routes.grounded_until_tick IS
    'If set and current_tick < this, the route is grounded — the tick processor skips pax/revenue/cost calculation entirely. Set by Phase 7 incidents that ground a route for N ticks; auto-released when the tick rolls past.';


-- ── 2. aviation_incident_types catalog ──────────────────────────
-- Seeded with 15 incident definitions per the Phase 7 spec. Each row
-- captures the cost, op_safety hit, route-grounding duration, and the
-- OS-eligibility range. Description templates are an array of
-- variant strings — the firing helper picks one randomly and
-- substitutes {corp}, {origin}, {dest}.
CREATE TABLE IF NOT EXISTS public.aviation_incident_types (
    incident_key         TEXT     PRIMARY KEY,
    severity             TEXT     NOT NULL CHECK (severity IN ('minor','moderate','major')),
    label                TEXT     NOT NULL,
    cost                 BIGINT   NOT NULL CHECK (cost >= 0),
    op_safety_delta      NUMERIC  NOT NULL,
    route_grounded_ticks INTEGER  NOT NULL DEFAULT 0 CHECK (route_grounded_ticks >= 0),
    os_min               INTEGER  NOT NULL CHECK (os_min >= 0 AND os_min <= 10),
    os_max               INTEGER  NOT NULL CHECK (os_max >= 0 AND os_max <= 10),
    description_templates TEXT[]  NOT NULL CHECK (array_length(description_templates, 1) >= 1),
    CHECK (os_min <= os_max)
);

ALTER TABLE public.aviation_incident_types ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
         WHERE schemaname = 'public'
           AND tablename  = 'aviation_incident_types'
           AND policyname = 'Anyone can read aviation_incident_types'
    ) THEN
        CREATE POLICY "Anyone can read aviation_incident_types"
            ON public.aviation_incident_types
            FOR SELECT USING (true);
    END IF;
END $$;

INSERT INTO public.aviation_incident_types
    (incident_key, severity, label, cost, op_safety_delta, route_grounded_ticks, os_min, os_max, description_templates)
VALUES
    -- ── MINOR (5) ────────────────────────────────────────────────
    ('hard_landing', 'minor', 'Hard Landing',
     2000000, -1, 0, 5, 10,
     ARRAY[
        '{corp} flight makes hard landing at {dest} — minor passenger injuries reported. Aircraft cleared for service after inspection.',
        '{corp} pilot misjudges descent into {dest} — three passengers seek medical evaluation, no serious injuries.',
        '{corp} aircraft slams onto runway at {dest} — internal cabin damage, twelve passengers shaken but uninjured.'
     ]),
    ('bird_strike', 'minor', 'Bird Strike During Takeoff',
     1000000, -1, 0, 4, 10,
     ARRAY[
        'Bird strike forces emergency return at {origin} — one engine inspected, {corp} aircraft cleared after eight-hour delay.',
        'Migratory flock collides with {corp} flight on takeoff from {origin} — windshield cracked, pilots return to gate without incident.',
        'Geese ingested into engine of {corp} aircraft at {origin} — engine replaced, route delayed two days.'
     ]),
    ('mechanical_diversion', 'minor', 'In-Flight Mechanical Diversion',
     3000000, -1, 0, 5, 9,
     ARRAY[
        'Mechanical issue forces {corp} flight to divert from the {origin}–{dest} route — all passengers safe, rebooked overnight.',
        'Hydraulic warning triggers unscheduled landing for {corp} en route to {dest} — passengers stranded sixteen hours awaiting replacement aircraft.',
        '{corp} cockpit instrumentation fault prompts diversion en route to {dest} — flight crew commended for professional response, aircraft grounded for repair.'
     ]),
    ('cabin_pressurization', 'minor', 'Cabin Pressurization Issue',
     2000000, -1, 0, 5, 9,
     ARRAY[
        'Cabin pressure incident causes minor passenger injuries on {corp} flight — pilots descend to safe altitude, return to {origin}.',
        'Slow pressurization leak detected at cruise altitude on {corp} {origin}–{dest} flight — emergency descent ordered, six passengers seek medical attention for ear trauma.',
        '{corp} pressurization control failure forces widebody to land at unscheduled airport — fleet-wide inspection ordered.'
     ]),
    ('runway_excursion', 'minor', 'Runway Excursion (Slow Speed)',
     3000000, -1, 0, 4, 8,
     ARRAY[
        '{corp} aircraft slides off runway at {dest} — taxiway closed for two hours, no injuries reported.',
        'Wet runway conditions cause {corp} aircraft to overrun stopping point at {dest} — landing gear damage, passengers evacuated normally.',
        'Crosswind forces {corp} flight off centerline at {dest} — aircraft into infield grass, no injuries but news photos circulate widely.'
     ]),

    -- ── MODERATE (5) ─────────────────────────────────────────────
    ('engine_failure', 'moderate', 'Engine Failure In-Flight',
     10000000, -2, 1, 4, 8,
     ARRAY[
        'Engine failure forces emergency landing — {corp} aircraft involved, manufacturer''s quality record under scrutiny.',
        'Catastrophic engine shutdown on {corp} flight from {origin} — pilots land on remaining engine, three passengers injured during rapid descent.',
        '{corp} widebody loses engine at cruise on {origin}–{dest} route — emergency declared, regulators announce fleet-wide inspection of similar aircraft.'
     ]),
    ('severe_turbulence', 'moderate', 'Severe Turbulence Injuries',
     8000000, -1, 0, 5, 9,
     ARRAY[
        'Fifteen passengers injured in severe turbulence on {corp} flight — multiple lawsuits filed against carrier.',
        'Unexpected wake turbulence causes broken bones aboard {corp} flight from {origin} — flight attendants hospitalized.',
        'Storm cell encounter injures eight on {corp} aircraft — questions raised about flight planning and dispatcher decision-making.'
     ]),
    ('cargo_fire', 'moderate', 'Cargo Fire on Approach',
     15000000, -2, 2, 4, 7,
     ARRAY[
        'Cargo hold fire forces {corp} emergency landing at {dest} — investigation launched into mishandled lithium battery shipment.',
        'Smoke detected from cargo bay during final approach — {corp} aircraft severely damaged in landing, no fatalities.',
        'Flammable goods shipment ignites mid-flight on {corp} {origin}–{dest} route — crew commended, aircraft written off.'
     ]),
    ('near_miss', 'moderate', 'Near-Miss with Other Aircraft',
     5000000, -2, 0, 4, 7,
     ARRAY[
        'Near-miss between {corp} and another aircraft over national airspace — pilot error suspected, cockpit voice recorders being examined.',
        '{corp} flight comes within 200 feet of military training aircraft near {origin} — diplomatic incident threatens to escalate.',
        'Automated collision avoidance prevents disaster between {corp} and another carrier near {dest} — air traffic control failure investigated.'
     ]),
    ('aborted_takeoff', 'moderate', 'Aborted Takeoff at High Speed',
     12000000, -2, 1, 4, 8,
     ARRAY[
        'High-speed abort damages {corp} aircraft at {origin} — runway shut down for six hours, all passengers evacuated via emergency slides.',
        'Engine warning prompts takeoff rejection at 130 knots — {corp} aircraft skids at {origin}, blows tires, runway closed overnight.',
        '{corp} pilots abort takeoff after fire warning — landing gear collapse, no injuries but extensive aircraft damage.'
     ]),

    -- ── MAJOR (5) ────────────────────────────────────────────────
    ('cfit_survivable', 'major', 'Controlled Flight into Terrain (Survivable)',
     45000000, -5, 3, 3, 6,
     ARRAY[
        '{corp} aircraft impacts mountain ridge on approach to {dest} — 12 fatalities, 80 survive. Investigators focus on crew fatigue and missed procedures.',
        '{corp} flight strikes terrain in poor weather en route to {dest} — pilots failed to follow approach charts. 9 dead, 95 survivors.',
        '{corp} aircraft impacts ridgeline near {dest} — 14 fatalities, investigation reveals deferred altimeter maintenance.'
     ]),
    ('engine_disintegration', 'major', 'Engine Disintegration with Fuselage Damage',
     50000000, -5, 3, 3, 6,
     ARRAY[
        'Engine explosion damages fuselage on {corp} flight — 4 fatalities, manufacturer faces grounding of similar models.',
        'Catastrophic engine failure sends shrapnel through {corp} widebody cabin — 7 dead, regulators ground manufacturer''s full production.',
        '{corp} engine disintegrates at altitude on {origin}–{dest} route — fuselage ruptured, 3 passengers ejected, manufacturer''s certification under review.'
     ]),
    ('midair_collision', 'major', 'Mid-Air Collision (Catastrophic)',
     100000000, -7, 5, 2, 5,
     ARRAY[
        'Two aircraft collide over national territory — over 200 fatalities, criminal investigation launched against {corp} and ATC.',
        '{corp} flight strikes another carrier''s aircraft over shared airspace — 187 dead, no survivors. Diplomatic crisis ensues.',
        '{corp} widebody collides with regional aircraft on approach to {dest} — all 220 aboard killed, cause traced to dispatcher error and pilot fatigue.'
     ]),
    ('runway_overrun_fatal', 'major', 'Runway Overrun with Fatalities',
     40000000, -4, 2, 3, 6,
     ARRAY[
        '{corp} aircraft overruns runway at {dest}, breaks apart — 8 fatalities, dozens injured. Investigation reveals deferred braking system maintenance.',
        '{corp} flight fails to stop on rain-soaked runway at {dest} — plunges into ravine, 11 dead among 156 aboard.',
        '{corp} widebody overruns at {dest} — aircraft fragmented, 6 fatalities, 89 injured. Pilot training records subpoenaed.'
     ]),
    ('structural_failure', 'major', 'Catastrophic Structural Failure',
     80000000, -6, 5, 2, 5,
     ARRAY[
        '{corp} aircraft breaks apart in flight on {origin}–{dest} route — no survivors among 180 aboard. Investigation reveals systematic manufacturing flaw.',
        '{corp} widebody disintegrates at altitude — 220 dead. Cumulative damage from skipped maintenance cited as cause.',
        '{corp} aircraft suffers wing structural failure on approach to {dest} — 165 fatalities, manufacturer faces existential lawsuit, all similar aircraft grounded worldwide.'
     ])
ON CONFLICT (incident_key) DO NOTHING;


-- ── 3. aviation_incidents (per-occurrence event log) ────────────
CREATE TABLE IF NOT EXISTS public.aviation_incidents (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    corp_id               UUID         NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    route_id              UUID         REFERENCES public.airline_routes(id) ON DELETE SET NULL,
    nation_id             UUID         REFERENCES public.nations(id) ON DELETE SET NULL,
    incident_key          TEXT         NOT NULL REFERENCES public.aviation_incident_types(incident_key),
    severity              TEXT         NOT NULL CHECK (severity IN ('minor','moderate','major')),
    cost                  BIGINT       NOT NULL,
    op_safety_delta       NUMERIC      NOT NULL,
    description           TEXT         NOT NULL,

    status                TEXT         NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','press_statement','compensated','refused','auto_refused')),
    response_at_tick      INTEGER,

    created_at_tick       INTEGER      NOT NULL,
    expires_at_tick       INTEGER      NOT NULL,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    event_log_id          UUID
);

CREATE INDEX IF NOT EXISTS idx_aviation_incidents_corp_status
    ON public.aviation_incidents (corp_id, status);
CREATE INDEX IF NOT EXISTS idx_aviation_incidents_pending_expiry
    ON public.aviation_incidents (expires_at_tick)
    WHERE status = 'pending';

ALTER TABLE public.aviation_incidents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
         WHERE schemaname = 'public'
           AND tablename  = 'aviation_incidents'
           AND policyname = 'Corp owners can read their own incidents'
    ) THEN
        CREATE POLICY "Corp owners can read their own incidents"
            ON public.aviation_incidents
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.factions f
                     WHERE f.id = aviation_incidents.corp_id
                       AND (f.id = auth.uid() OR f.linked_user_id = auth.uid())
                )
            );
    END IF;
END $$;


-- ── 4. _fire_aviation_incident (internal) ───────────────────────
-- Picks an OS-eligible incident from the requested severity, applies
-- cost / op_safety / route grounding, inserts the row + event_log
-- entry. Auto-bankrupts the corp if the cost exceeds cash (Q7 = B).
CREATE OR REPLACE FUNCTION _fire_aviation_incident(
    p_corp_id   UUID,
    p_route_id  UUID,
    p_severity  TEXT,
    p_op_safety NUMERIC,
    p_tick      INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_type        aviation_incident_types%ROWTYPE;
    v_corp        factions%ROWTYPE;
    v_route       airline_routes%ROWTYPE;
    v_origin_name TEXT;
    v_dest_name   TEXT;
    v_template    TEXT;
    v_description TEXT;
    v_incident_id UUID;
    v_event_id    UUID;
    v_os_int      INTEGER := GREATEST(0, LEAST(10, FLOOR(COALESCE(p_op_safety, 0))::INTEGER));
    v_new_os      NUMERIC;
    v_cash_after  NUMERIC;
BEGIN
    -- Pick a random eligible incident from the requested tier.
    SELECT * INTO v_type FROM aviation_incident_types
     WHERE severity = p_severity
       AND v_os_int BETWEEN os_min AND os_max
     ORDER BY random()
     LIMIT 1;

    IF v_type.incident_key IS NULL THEN
        -- No incident in this tier matches the corp's OS — silently skip.
        -- (Happens when corp has very high OS and Major-tier incidents
        -- all require OS ≤ 6.)
        RETURN jsonb_build_object('skipped', true, 'reason', 'no_eligible_incident');
    END IF;

    SELECT * INTO v_corp  FROM factions       WHERE id = p_corp_id;
    SELECT * INTO v_route FROM airline_routes WHERE id = p_route_id;

    -- Description template substitution. Pick one at random.
    v_template := v_type.description_templates[
        1 + floor(random() * array_length(v_type.description_templates, 1))::INT
    ];

    SELECT name INTO v_origin_name FROM airline_cities WHERE id = v_route.origin_city_id;
    SELECT name INTO v_dest_name   FROM airline_cities WHERE id = v_route.dest_city_id;

    v_description := replace(v_template, '{corp}',   COALESCE(v_corp.faction_name, 'Airline'));
    v_description := replace(v_description, '{origin}', COALESCE(v_origin_name, 'origin'));
    v_description := replace(v_description, '{dest}',   COALESCE(v_dest_name,   'destination'));

    -- Apply the cost. emit_corp_cash_event floors at 0; we capture the
    -- pre-event cash so we can detect the underflow case for Q7=B
    -- bankruptcy auto-trigger.
    v_cash_after := COALESCE(v_corp.corp_cash_reserves, 0) - v_type.cost;

    PERFORM emit_corp_cash_event(
        p_corp_id,
        'event_cost',
        'Aviation incident · ' || v_type.label,
        -v_type.cost,
        p_tick
    );

    -- Apply op_safety hit, clamped [0, 10].
    v_new_os := GREATEST(0, LEAST(10, COALESCE(v_corp.corp_op_safety, 0) + v_type.op_safety_delta));
    UPDATE factions
       SET corp_op_safety = v_new_os
     WHERE id = p_corp_id;

    -- Ground the route if the type prescribes it.
    IF v_type.route_grounded_ticks > 0 THEN
        UPDATE airline_routes
           SET grounded_until_tick = p_tick + v_type.route_grounded_ticks
         WHERE id = p_route_id;
    END IF;

    -- Insert the incident row (player must respond via Pressing Issues).
    INSERT INTO aviation_incidents (
        corp_id, route_id, nation_id, incident_key, severity,
        cost, op_safety_delta, description,
        created_at_tick, expires_at_tick
    ) VALUES (
        p_corp_id, p_route_id, v_route.nation_id, v_type.incident_key, p_severity,
        v_type.cost, v_type.op_safety_delta, v_description,
        p_tick, p_tick + 6
    ) RETURNING id INTO v_incident_id;

    -- News feed entry. category='business' matches existing aviation
    -- stub events from Phase 6; trigger_key tier-specific so the news
    -- system can group / style.
    INSERT INTO event_log (
        nation_id, faction_id,
        event_name, description_used,
        category, trigger_key,
        effects_applied, fired_at_tick
    ) VALUES (
        v_route.nation_id, p_corp_id,
        'Aviation Incident — ' || v_type.label,
        v_description,
        'business',
        'aviation_incident_' || p_severity,
        jsonb_build_object(
            'incident_id',     v_incident_id,
            'incident_key',    v_type.incident_key,
            'severity',        p_severity,
            'cost',            v_type.cost,
            'op_safety_delta', v_type.op_safety_delta,
            'route_grounded_ticks', v_type.route_grounded_ticks,
            'route_id',        p_route_id,
            'corp_id',         p_corp_id
        ),
        p_tick
    ) RETURNING id INTO v_event_id;

    UPDATE aviation_incidents SET event_log_id = v_event_id WHERE id = v_incident_id;

    -- Q7=B: if the cost drove cash negative, auto-trigger bankruptcy.
    -- emit_corp_cash_event already floored at 0, but the underflow is
    -- detected by comparing the pre-charge cash to the cost.
    IF v_cash_after < 0 THEN
        BEGIN
            PERFORM declare_corp_bankruptcy(p_corp_id);
        EXCEPTION WHEN OTHERS THEN
            -- Bankruptcy might fail (e.g., cooldown active) — log via
            -- system-message context but don't break the incident write.
            INSERT INTO event_log (
                nation_id, faction_id,
                event_name, description_used,
                category, trigger_key, effects_applied, fired_at_tick
            ) VALUES (
                v_route.nation_id, p_corp_id,
                'Aviation Incident — Bankruptcy Auto-Trigger Failed',
                'Incident cost exceeded cash; bankruptcy trigger raised: ' || SQLERRM,
                'business', 'aviation_incident_bankruptcy_skip',
                jsonb_build_object('incident_id', v_incident_id, 'error', SQLERRM),
                p_tick
            );
        END;
    END IF;

    RETURN jsonb_build_object(
        'incident_id', v_incident_id,
        'incident_key', v_type.incident_key,
        'severity',     p_severity,
        'cost',         v_type.cost,
        'op_safety_delta', v_type.op_safety_delta,
        'route_grounded_ticks', v_type.route_grounded_ticks,
        'auto_bankrupted', (v_cash_after < 0)
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION _fire_aviation_incident(UUID, UUID, TEXT, NUMERIC, INTEGER) FROM PUBLIC;


-- ── 5. respond_to_aviation_incident ─────────────────────────────
-- Player picks one of three responses on a Pressing Issues card.
-- Validates ownership + status='pending'.
-- For 'compensated': server-side cash check; returns error if
-- insufficient (UI surfaces the warning before click).
CREATE OR REPLACE FUNCTION respond_to_aviation_incident(
    p_incident_id  UUID,
    p_response     TEXT  -- 'press_statement' | 'compensated' | 'refused'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user           UUID := auth.uid();
    v_incident       aviation_incidents%ROWTYPE;
    v_corp           factions%ROWTYPE;
    v_tick           INTEGER := _current_tick();
    v_press_cost     CONSTANT BIGINT := 500000;
    v_compensation   BIGINT;
    v_os_delta       NUMERIC;
    v_rep_delta      NUMERIC;
    v_label          TEXT;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    IF p_response NOT IN ('press_statement', 'compensated', 'refused') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid response type');
    END IF;

    SELECT * INTO v_incident FROM aviation_incidents
     WHERE id = p_incident_id
     FOR UPDATE;
    IF v_incident.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Incident not found');
    END IF;
    IF v_incident.status <> 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Incident already resolved');
    END IF;

    SELECT * INTO v_corp FROM factions WHERE id = v_incident.corp_id;
    IF v_corp.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Corp no longer exists');
    END IF;
    IF v_corp.id <> v_user
       AND COALESCE(v_corp.linked_user_id, '00000000-0000-0000-0000-000000000000'::uuid) <> v_user THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this corporation');
    END IF;

    IF p_response = 'press_statement' THEN
        v_label := 'Press statement issued';
        v_os_delta  := 0;
        v_rep_delta := 0;
        PERFORM emit_corp_cash_event(
            v_corp.id, 'event_cost',
            'Aviation incident · press statement', -v_press_cost, v_tick
        );

    ELSIF p_response = 'compensated' THEN
        v_compensation := ROUND(v_incident.cost * 0.10);
        IF COALESCE(v_corp.corp_cash_reserves, 0) < v_compensation THEN
            RETURN jsonb_build_object('success', false,
                'error', 'Insufficient cash for compensation ($'
                    || to_char(v_compensation, 'FM999,999,999,999')
                    || ' required, $' || to_char(COALESCE(v_corp.corp_cash_reserves, 0), 'FM999,999,999,999')
                    || ' available). Take out a loan first.');
        END IF;
        v_label := 'Families compensated ($' || to_char(v_compensation, 'FM999,999,999,999') || ')';
        v_os_delta  := 0.5;
        v_rep_delta := 1.0;
        PERFORM emit_corp_cash_event(
            v_corp.id, 'event_cost',
            'Aviation incident · family compensation', -v_compensation, v_tick
        );

    ELSE  -- 'refused'
        v_label := 'Refused comment';
        v_os_delta  := -0.5;
        v_rep_delta := -1.5;
    END IF;

    -- Apply stat deltas, clamped [0, 10].
    UPDATE factions
       SET corp_op_safety = GREATEST(0, LEAST(10, COALESCE(corp_op_safety, 0) + v_os_delta)),
           corp_reputation = GREATEST(0, LEAST(10, COALESCE(corp_reputation, 0) + v_rep_delta))
     WHERE id = v_corp.id;

    UPDATE aviation_incidents
       SET status            = p_response,
           response_at_tick  = v_tick
     WHERE id = p_incident_id;

    RETURN jsonb_build_object(
        'success', true,
        'response', p_response,
        'label',    v_label,
        'op_safety_delta',  v_os_delta,
        'reputation_delta', v_rep_delta
    );
END;
$$;

GRANT EXECUTE ON FUNCTION respond_to_aviation_incident(UUID, TEXT) TO authenticated;


-- ── 6. auto_resolve_stale_incidents (service-role) ──────────────
-- Sweep incidents pending past expires_at_tick. Apply the 'refused'
-- penalty (op_safety -0.5, reputation -1.5). Called once per tick from
-- advance-corp-tick.
CREATE OR REPLACE FUNCTION auto_resolve_stale_incidents(p_tick INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inc      RECORD;
    v_swept    INTEGER := 0;
BEGIN
    FOR v_inc IN
        SELECT id, corp_id
          FROM aviation_incidents
         WHERE status = 'pending'
           AND expires_at_tick < p_tick
         FOR UPDATE
    LOOP
        UPDATE factions
           SET corp_op_safety = GREATEST(0, LEAST(10, COALESCE(corp_op_safety, 0) - 0.5)),
               corp_reputation = GREATEST(0, LEAST(10, COALESCE(corp_reputation, 0) - 1.5))
         WHERE id = v_inc.corp_id;

        UPDATE aviation_incidents
           SET status           = 'auto_refused',
               response_at_tick = p_tick
         WHERE id = v_inc.id;

        v_swept := v_swept + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'swept', v_swept);
END;
$$;

REVOKE EXECUTE ON FUNCTION auto_resolve_stale_incidents(INTEGER) FROM PUBLIC;


-- ── 7. process_airline_route_tick: 3-tier rolls + grounded skip ─
-- Replaces the Phase 6 single-roll incident stub. Three independent
-- rolls per route per tick — Minor × 1.0, Moderate × 0.3, Major × 0.05
-- — each multiplied by the maintenance-tier multiplier (basic 1.5,
-- standard 1.0, premium 0.5). Skips routes that are grounded.
CREATE OR REPLACE FUNCTION process_airline_route_tick(p_route_id UUID, p_tick INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_route        airline_routes%ROWTYPE;
    v_origin       airline_cities%ROWTYPE;
    v_dest         airline_cities%ROWTYPE;
    v_nation       nations%ROWTYPE;
    v_pop_m        NUMERIC;
    v_demand_pool  NUMERIC;
    v_total_weight NUMERIC := 0;
    v_my_weight    NUMERIC := 0;
    v_lane_share   NUMERIC;
    v_my_seats     INTEGER := 0;
    v_competitor_seats INTEGER := 0;
    v_price_mult   NUMERIC;
    v_unmet        NUMERIC;
    v_my_demand    NUMERIC;
    v_pax          INTEGER;
    v_revenue      INTEGER;
    v_ops_cost     INTEGER := 0;
    v_aircraft_count INTEGER := 0;
    v_maint_charge INTEGER := 0;
    v_is_anniversary BOOLEAN := false;
    v_corp         factions%ROWTYPE;
    v_op_safety    NUMERIC;
    v_base_risk    NUMERIC;
    v_tier_mult    NUMERIC;
    v_minor_risk   NUMERIC;
    v_mod_risk     NUMERIC;
    v_major_risk   NUMERIC;
    v_incident_log JSONB := '[]'::jsonb;
    v_pair_label   TEXT;
BEGIN
    SELECT * INTO v_route FROM airline_routes
     WHERE id = p_route_id
     FOR UPDATE;
    IF v_route.id IS NULL OR v_route.status <> 'active' THEN
        RETURN jsonb_build_object('skipped', true, 'reason', 'inactive');
    END IF;
    IF v_route.last_processed_tick = p_tick THEN
        RETURN jsonb_build_object('skipped', true, 'reason', 'already_processed');
    END IF;
    -- Phase 7: skip grounded routes entirely (no pax / revenue / ops /
    -- incident rolls). Aircraft sit idle, lender contracts continue.
    IF v_route.grounded_until_tick IS NOT NULL AND p_tick < v_route.grounded_until_tick THEN
        UPDATE airline_routes
           SET last_tick_pax       = 0,
               last_tick_revenue   = 0,
               last_tick_spend     = 0,
               last_processed_tick = p_tick
         WHERE id = p_route_id;
        RETURN jsonb_build_object('skipped', true, 'reason', 'grounded',
            'grounded_until_tick', v_route.grounded_until_tick);
    END IF;

    SELECT * INTO v_origin FROM airline_cities WHERE id = v_route.origin_city_id;
    SELECT * INTO v_dest   FROM airline_cities WHERE id = v_route.dest_city_id;
    SELECT * INTO v_nation FROM nations        WHERE id = v_origin.nation_id;
    SELECT * INTO v_corp   FROM factions       WHERE id = v_route.airline_faction_id;

    v_pop_m       := COALESCE(v_nation.population, 0) / 1000000.0;
    v_demand_pool := (COALESCE(v_nation.standard_of_living, 0) / 100.0)
                   * (COALESCE(v_nation.service_sector, 0)     / 100.0)
                   * v_pop_m
                   * 20.0;

    SELECT COALESCE(SUM(
            (a.population_pct + b.population_pct)
            * CASE WHEN a.is_capital OR b.is_capital THEN 2 ELSE 1 END
        ), 0)
      INTO v_total_weight
      FROM airline_cities a
      JOIN airline_cities b
        ON a.nation_id = b.nation_id
       AND a.id < b.id
     WHERE a.nation_id = v_nation.id;

    v_my_weight := (v_origin.population_pct + v_dest.population_pct)
                 * CASE WHEN v_origin.is_capital OR v_dest.is_capital THEN 2 ELSE 1 END;

    v_lane_share := CASE WHEN v_total_weight > 0
                         THEN v_demand_pool * (v_my_weight / v_total_weight)
                         ELSE 0
                    END;

    SELECT COALESCE(SUM(airline_aircraft_seats(aircraft_class)), 0),
           COUNT(*)::INT,
           COALESCE(SUM(airline_aircraft_ops_cost(aircraft_class)), 0)
      INTO v_my_seats, v_aircraft_count, v_ops_cost
      FROM corp_aircraft
     WHERE route_id = p_route_id;

    IF v_aircraft_count = 0 THEN
        v_my_seats := COALESCE(v_route.aircraft_regional, 0)   * 10
                    + COALESCE(v_route.aircraft_narrowbody, 0) * 25
                    + COALESCE(v_route.aircraft_widebody, 0)   * 60;
        v_aircraft_count := COALESCE(v_route.aircraft_regional, 0)
                          + COALESCE(v_route.aircraft_narrowbody, 0)
                          + COALESCE(v_route.aircraft_widebody, 0);
        v_ops_cost := COALESCE(v_route.aircraft_regional, 0)   * 500
                    + COALESCE(v_route.aircraft_narrowbody, 0) * 1200
                    + COALESCE(v_route.aircraft_widebody, 0)   * 2500;
    END IF;

    SELECT COALESCE(SUM(
        COALESCE(aircraft_regional, 0)   * 10
      + COALESCE(aircraft_narrowbody, 0) * 25
      + COALESCE(aircraft_widebody, 0)   * 60
    ), 0)
      INTO v_competitor_seats
      FROM airline_routes
     WHERE status = 'active'
       AND id <> p_route_id
       AND origin_city_id = v_route.origin_city_id
       AND dest_city_id   = v_route.dest_city_id;

    v_price_mult := GREATEST(0, 2 * (1 - v_route.ticket_price / 500.0));
    v_unmet      := GREATEST(0, v_lane_share - v_competitor_seats);
    v_my_demand  := v_unmet * v_price_mult;
    v_pax        := LEAST(GREATEST(0, FLOOR(v_my_demand))::INT, v_my_seats);
    v_revenue    := v_pax * COALESCE(v_route.ticket_price, 0);

    v_is_anniversary := (p_tick - COALESCE(v_route.opened_at_tick, p_tick)) > 0
                    AND ((p_tick - COALESCE(v_route.opened_at_tick, p_tick)) % 12) = 0;
    IF v_is_anniversary THEN
        v_maint_charge := v_aircraft_count * airline_maint_annual(v_route.maintenance_tier);
    END IF;

    v_pair_label := COALESCE(v_origin.name, '?') || ' ↔ ' || COALESCE(v_dest.name, '?');

    IF v_revenue > 0 THEN
        PERFORM emit_corp_cash_event(
            v_route.airline_faction_id, 'revenue_airline',
            v_pair_label || ' · ticket revenue', v_revenue, p_tick);
    END IF;
    IF v_ops_cost > 0 THEN
        PERFORM emit_corp_cash_event(
            v_route.airline_faction_id, 'fixed_overhead',
            v_pair_label || ' · aircraft ops', -v_ops_cost, p_tick);
    END IF;
    IF v_maint_charge > 0 THEN
        PERFORM emit_corp_cash_event(
            v_route.airline_faction_id, 'maintenance',
            v_pair_label || ' · ' || v_route.maintenance_tier || ' maintenance (annual)',
            -v_maint_charge, p_tick);
    END IF;

    -- ── Three-tier incident rolls ─────────────────────────────────
    -- Each severity: risk = (aircraft × 0.008 × maint_tier_mult)
    --                       ÷ max(0.1, op_safety/10)
    --              × tier_factor (Minor 1.0 / Moderate 0.3 / Major 0.05).
    -- An OS-eligible incident is selected within the firing tier; if
    -- the corp's OS doesn't match any incident in that tier, the roll
    -- silently no-ops.
    v_op_safety := COALESCE(v_corp.corp_op_safety, 0);
    v_tier_mult := airline_maint_risk_mult(v_route.maintenance_tier);
    v_base_risk := CASE WHEN v_aircraft_count > 0
                        THEN (v_aircraft_count * 0.008 * v_tier_mult)
                             / GREATEST(0.1, v_op_safety / 10.0)
                        ELSE 0
                   END;
    v_minor_risk := v_base_risk * 1.0;
    v_mod_risk   := v_base_risk * 0.3;
    v_major_risk := v_base_risk * 0.05;

    IF v_base_risk > 0 THEN
        IF random() < v_minor_risk THEN
            v_incident_log := v_incident_log || _fire_aviation_incident(
                v_route.airline_faction_id, p_route_id, 'minor', v_op_safety, p_tick);
            -- Refresh corp_op_safety since the fire just changed it.
            SELECT corp_op_safety INTO v_op_safety FROM factions WHERE id = v_route.airline_faction_id;
        END IF;
        IF random() < v_mod_risk THEN
            v_incident_log := v_incident_log || _fire_aviation_incident(
                v_route.airline_faction_id, p_route_id, 'moderate', v_op_safety, p_tick);
            SELECT corp_op_safety INTO v_op_safety FROM factions WHERE id = v_route.airline_faction_id;
        END IF;
        IF random() < v_major_risk THEN
            v_incident_log := v_incident_log || _fire_aviation_incident(
                v_route.airline_faction_id, p_route_id, 'major', v_op_safety, p_tick);
        END IF;
    END IF;

    UPDATE airline_routes
       SET lifetime_pax        = lifetime_pax     + v_pax,
           lifetime_revenue    = lifetime_revenue + v_revenue,
           lifetime_spend      = lifetime_spend   + v_ops_cost + v_maint_charge,
           last_tick_pax       = v_pax,
           last_tick_revenue   = v_revenue,
           last_tick_spend     = v_ops_cost + v_maint_charge,
           last_processed_tick = p_tick
     WHERE id = p_route_id;

    RETURN jsonb_build_object(
        'route_id',        p_route_id,
        'tick',            p_tick,
        'pax',             v_pax,
        'revenue',         v_revenue,
        'ops_cost',        v_ops_cost,
        'maint_charge',    v_maint_charge,
        'is_anniversary',  v_is_anniversary,
        'incidents',       v_incident_log,
        -- Read by process_airline_corp_tick to populate the per-corp
        -- summary. Replaces the boolean 'incident' field the Phase 6
        -- single-roll version returned.
        'incident_count',  jsonb_array_length(v_incident_log)
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION process_airline_route_tick(UUID, INTEGER) FROM PUBLIC;


-- ── 8. process_airline_corp_tick: read new incident_count field ─
-- Phase 6 wrapper read the boolean 'incident' field. The Phase 7
-- route processor returns 'incident_count' instead. Re-issuing the
-- wrapper so the per-corp incidents count keeps working.
CREATE OR REPLACE FUNCTION process_airline_corp_tick(p_corp_id UUID, p_tick INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_route        RECORD;
    v_route_result JSONB;
    v_total_pax    BIGINT  := 0;
    v_total_rev    BIGINT  := 0;
    v_total_spend  BIGINT  := 0;
    v_incidents    INTEGER := 0;
    v_routes       INTEGER := 0;
BEGIN
    FOR v_route IN
        SELECT id FROM airline_routes
         WHERE airline_faction_id = p_corp_id
           AND status = 'active'
           AND (last_processed_tick IS NULL OR last_processed_tick < p_tick)
         ORDER BY opened_at_tick
    LOOP
        v_route_result := process_airline_route_tick(v_route.id, p_tick);
        IF NOT COALESCE((v_route_result->>'skipped')::BOOLEAN, false) THEN
            v_routes      := v_routes      + 1;
            v_total_pax   := v_total_pax   + COALESCE((v_route_result->>'pax')::BIGINT, 0);
            v_total_rev   := v_total_rev   + COALESCE((v_route_result->>'revenue')::BIGINT, 0);
            v_total_spend := v_total_spend
                           + COALESCE((v_route_result->>'ops_cost')::BIGINT, 0)
                           + COALESCE((v_route_result->>'maint_charge')::BIGINT, 0);
            v_incidents := v_incidents + COALESCE((v_route_result->>'incident_count')::INTEGER, 0);
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'corp_id',   p_corp_id,
        'tick',      p_tick,
        'routes',    v_routes,
        'pax',       v_total_pax,
        'revenue',   v_total_rev,
        'spend',     v_total_spend,
        'incidents', v_incidents
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION process_airline_corp_tick(UUID, INTEGER) FROM PUBLIC;


COMMIT;

NOTIFY pgrst, 'reload schema';
