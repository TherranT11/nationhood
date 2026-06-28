-- ===========================================================================
-- 116 · World Trade Ledger — accumulated bilateral trade flows for the year.
-- Depends on: 10 (nations), 114 (economy_import). Run after 115.
--
-- Each import records ONE flow: the seller exports `value` of `resource` to the buyer.
-- The per-nation totals, the bilateral matrix and the headline figures on the Economy
-- page are all DERIVED from this table (one source) — nothing is stored twice. The
-- ledger covers the current year only: _advance_tick wipes it at the January tick
-- (schema/60), so it resets annually. World-readable; only economy_import writes it.
-- ===========================================================================

create table if not exists public.trade_flows (
  exporter_id text not null references public.nations (id) on delete cascade,
  importer_id text not null references public.nations (id) on delete cascade,
  resource    text not null,                    -- energy | food | minerals | goods | services | military
  value       numeric not null default 0,       -- $B that crossed the border this year (seller's net receipt)
  primary key (exporter_id, importer_id, resource)
);

alter table public.trade_flows enable row level security;
drop policy if exists "trade_flows_select_all" on public.trade_flows;
create policy "trade_flows_select_all" on public.trade_flows for select using (true);
-- No write policy: only economy_import (security definer) records flows.

-- Accumulate one flow (seller exports `value` of `resource` to the buyer). Summed into the
-- running year-to-date total for that exporter/importer/resource. ONE writer for the ledger.
create or replace function public._record_trade_flow(p_exporter text, p_importer text, p_resource text, p_value numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_value, 0) = 0 then return; end if;
  insert into public.trade_flows (exporter_id, importer_id, resource, value)
    values (p_exporter, p_importer, p_resource, p_value)
    on conflict (exporter_id, importer_id, resource)
      do update set value = public.trade_flows.value + excluded.value;
end $$;
revoke all on function public._record_trade_flow(text, text, text, numeric) from public, anon, authenticated;

notify pgrst, 'reload schema';
