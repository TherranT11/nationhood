-- Fix op_eds body length constraint: original migration capped at 800 chars,
-- but the UI allows 8000 and the reward system encourages 1000+ word articles.
-- This was causing "violates check constraint op_eds_body_check" errors.

ALTER TABLE op_eds DROP CONSTRAINT IF EXISTS op_eds_body_check;
ALTER TABLE op_eds ADD CONSTRAINT op_eds_body_check
    CHECK (char_length(body) >= 30 AND char_length(body) <= 8000);
