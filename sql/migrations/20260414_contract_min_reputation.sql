-- Add min_reputation to construction contracts for reputation-gated access
-- Mega projects require 60+ rep, industrial requires 30+, civil has no requirement
ALTER TABLE construction_contracts
    ADD COLUMN IF NOT EXISTS min_reputation INT NOT NULL DEFAULT 0;
