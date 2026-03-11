-- Fix: sanctions → beds_per_100k connection had inverted direction.
-- "sanctions below 20" meant low sanctions = bad, which is backwards.
-- Correct logic: HIGH sanctions (above 20) should hurt beds_per_100k.

UPDATE stat_connections
SET    source_dir = 'above'
WHERE  source_stat = 'sanctions'
  AND  target_stat = 'beds_per_100k'
  AND  source_dir  = 'below';
