-- Unilateral Tariff Reduction: a one-sided tariff cut on a specific nation.
-- Stored as a trade_agreement row with agreement_type = 'unilateral_tariff_reduction'.
-- nation_a_id = the issuer (nation cutting tariffs), nation_b_id = the target (beneficiary).
-- No negotiation required. Can be revoked by the issuer at any time.

-- Add the new agreement type to the check constraint (if one exists)
-- Most setups use a permissive text column, so this is informational only.

-- The trade_agreements table already supports this — no schema changes needed.
-- The agreement_type value 'unilateral_tariff_reduction' is simply a new valid string.
