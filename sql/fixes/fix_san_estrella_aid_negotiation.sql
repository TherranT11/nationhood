-- Fix: Cancel the "San Estrella Aid Package" trade negotiation
-- It expired at tick 61 but was never auto-cancelled because
-- processExpiredTradeNegotiations() didn't exist yet.
-- The required Minister of Trade from Avelia never joined.

UPDATE trade_negotiations
SET status = 'cancelled'
WHERE agreement_name = 'San Estrella Aid Package'
  AND status IN ('open', 'active')
;
