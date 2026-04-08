-- Update starting workforce for new corporations: 500 total (375/100/25)
-- Also updates existing corps if they still have the old 2250/600/150 split
UPDATE factions
SET corp_general_workforce = 375,
    corp_skilled_workforce = 100,
    corp_innovative_workforce = 25
WHERE faction_type = 'corporation'
  AND corp_general_workforce = 2250
  AND corp_skilled_workforce = 600
  AND corp_innovative_workforce = 150;
