-- ===========================================================================
-- 193 · Influence can never go negative. Ever.
--
-- Influence is the party's card-bidding currency (parties.influence, schema/20). Every spend path
-- gates on sufficient balance before charging, and every grant already caps at 100 with least(100, …)
-- — but those checks are scattered across a dozen RPCs (card_bid, the auction escrow/refunds, the
-- reform surcharge, and any stale copy still live on a deployed database). One arithmetic slip or an
-- out-of-date RPC and the balance drifts below zero, which the topbar then shows as "-1".
--
-- This makes the invariant structural instead of relying on every caller getting it right: a single
-- BEFORE INSERT OR UPDATE trigger clamps influence into [0, 100] on the way into the row. It is the
-- one authoritative floor (and ceiling) — no writer can push the column outside the band, whatever it
-- attempts. The existing least(100, …) guards remain correct and harmless (idempotent with the clamp).
--
-- Depends on: 20 (parties). Idempotent.
-- ===========================================================================

-- Repair any row that is already out of band (e.g. the -1 that prompted this).
update public.parties set influence = greatest(0, least(100, influence))
 where influence < 0 or influence > 100;

create or replace function public._clamp_party_influence()
returns trigger language plpgsql as $$
begin
  -- Floor at 0 (never negative) and cap at 100 (the bank limit). NULL is left alone so the column
  -- default still applies on insert.
  if new.influence is not null then
    new.influence := greatest(0, least(100, new.influence));
  end if;
  return new;
end $$;

drop trigger if exists clamp_party_influence on public.parties;
create trigger clamp_party_influence
  before insert or update of influence on public.parties
  for each row execute function public._clamp_party_influence();

notify pgrst, 'reload schema';
