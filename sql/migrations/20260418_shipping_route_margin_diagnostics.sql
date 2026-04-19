-- Persist per-tick shipping route margin diagnostics for active claims.
-- Stores modeled gross revenue vs direct operating costs (fuel, maintenance,
-- incident reserve) by route+corp so UI/admin can inspect structural lane health.

CREATE TABLE IF NOT EXISTS public.shipping_route_margin_ticks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tick integer NOT NULL,
    route_id uuid NOT NULL REFERENCES public.shipping_routes(id) ON DELETE CASCADE,
    corp_id uuid NOT NULL REFERENCES public.factions(id) ON DELETE CASCADE,
    claim_id uuid NULL REFERENCES public.shipping_claims(id) ON DELETE SET NULL,
    vessel_id uuid NULL REFERENCES public.corp_vessels(id) ON DELETE SET NULL,
    vessel_class text NULL,
    vessel_status text NULL,
    gross_revenue numeric(14,2) NOT NULL DEFAULT 0,
    fuel_cost numeric(14,2) NOT NULL DEFAULT 0,
    maintenance_cost numeric(14,2) NOT NULL DEFAULT 0,
    incident_reserve numeric(14,2) NOT NULL DEFAULT 0,
    net_margin numeric(14,2) NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tick, route_id, corp_id)
);

CREATE INDEX IF NOT EXISTS idx_shipping_route_margin_ticks_tick
    ON public.shipping_route_margin_ticks (tick DESC);

CREATE INDEX IF NOT EXISTS idx_shipping_route_margin_ticks_corp_tick
    ON public.shipping_route_margin_ticks (corp_id, tick DESC);

ALTER TABLE public.shipping_route_margin_ticks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shipping_route_margin_ticks_service_role_only" ON public.shipping_route_margin_ticks;
CREATE POLICY "shipping_route_margin_ticks_service_role_only"
ON public.shipping_route_margin_ticks
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
