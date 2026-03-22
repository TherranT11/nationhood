-- Change relation_score from INT to DECIMAL to support fractional decay (-0.1/tick).
-- The range remains -100 to +100.

ALTER TABLE diplomatic_relations
    ALTER COLUMN relation_score TYPE DECIMAL(6,2) USING relation_score::DECIMAL(6,2);

ALTER TABLE diplomatic_relations
    ALTER COLUMN relation_score SET DEFAULT 30;
