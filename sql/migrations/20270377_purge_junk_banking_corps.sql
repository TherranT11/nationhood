-- ═══════════════════════════════════════════════════════════════════════════════
-- ONE-OFF CLEANUP — purge Joaquín Carrasco's junk banking corps
-- ═══════════════════════════════════════════════════════════════════════════════
-- A batch of throwaway test corps surfaced in the corporations list — all
-- owned by Joaquín Carrasco, all industry='banking', all sitting at the
-- same $14,074,809 valuation. Names from the screenshot:
--
--   AvH, AH, VV2, Famy, KNG, CRWN, 51MG, ICG, OVO, 22, HajjCorp,
--   VASTAP, ASAP-V2
--
-- Every dependent table FK to entrepreneur_corps is either ON DELETE
-- CASCADE (corp_ownership, corp_share_price_history, corp_loans,
-- corp_board_seats, corp_buildings as builder, ent_construction_bids,
-- ent_aircraft_designs, ent_engine_inventory, ent_production_runs, etc.)
-- or ON DELETE SET NULL (corp_buildings.owner_corp_id, broker_corp_id,
-- winner_corp_id on construction contracts / RFPs). So a single DELETE on
-- entrepreneur_corps will reap every share, treasury_cash row, loan,
-- board seat, building they built, aircraft design, engine inventory,
-- production run, etc. that traces back through their id. Historical
-- records that pointed at them (e.g. completed contracts they won)
-- survive with a NULL pointer rather than disappearing.
--
-- Triple-narrowed by name AND industry AND owner so a legitimately-
-- named corp on another player can't accidentally match.
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

DELETE FROM entrepreneur_corps ec
 USING factions f
 WHERE ec.owner_faction_id = f.id
   AND LOWER(TRIM(COALESCE(f.leader_first_name, '') || ' ' || COALESCE(f.leader_last_name, ''))) = LOWER('Joaquín Carrasco')
   AND ec.industry = 'banking'
   AND ec.name IN (
       'AvH', 'AH', 'VV2', 'Famy', 'KNG', 'CRWN', '51MG',
       'ICG', 'OVO', '22', 'HajjCorp', 'VASTAP', 'ASAP-V2'
   );

COMMIT;

-- ── Verification (run after) ──
--
--   SELECT ec.name, ec.industry, f.leader_first_name, f.leader_last_name
--     FROM entrepreneur_corps ec
--     JOIN factions f ON f.id = ec.owner_faction_id
--    WHERE LOWER(TRIM(COALESCE(f.leader_first_name,'') || ' ' || COALESCE(f.leader_last_name,'')))
--          = LOWER('Joaquín Carrasco')
--      AND ec.industry = 'banking';
--
-- Expected: zero rows for the names above. Any legitimate Carrasco banking
-- corps not in the list (if such a thing exists) survive untouched.
