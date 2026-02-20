-- ==================== PHASE 1: THREE-PILLAR VOTING SYSTEM ====================
-- Adds columns for the new preference calculation engine:
--   preference = (ideology_alignment × 0.40)
--              + (performance_perception × 0.40)
--              + (momentum × 0.20)
--
-- Per faction-bloc pair:
--   ideology_alignment     — how well party ideology matches bloc values (0-100)
--   performance_perception — stat trends × ministry ownership credit/blame (0-100)
--   momentum               — action bonuses, scandal effects, decays 20%/tick
--   preference_score        — the combined three-pillar score (0-100)
--   vote_share              — softmax output: probability this bloc votes for this party (0-1)
--
-- Per voter bloc:
--   k_value — softmax temperature (7-15, higher = more random voting)
--
-- Per faction:
--   national_vote_share — population-weighted aggregate of per-bloc vote shares (0-100)

-- 1. faction_bloc_approval: three-pillar columns
ALTER TABLE faction_bloc_approval ADD COLUMN IF NOT EXISTS ideology_alignment     NUMERIC(6,2) DEFAULT 50;
ALTER TABLE faction_bloc_approval ADD COLUMN IF NOT EXISTS performance_perception NUMERIC(6,2) DEFAULT 50;
ALTER TABLE faction_bloc_approval ADD COLUMN IF NOT EXISTS momentum              NUMERIC(8,2) DEFAULT 0;
ALTER TABLE faction_bloc_approval ADD COLUMN IF NOT EXISTS preference_score      NUMERIC(6,2) DEFAULT 50;
ALTER TABLE faction_bloc_approval ADD COLUMN IF NOT EXISTS vote_share            NUMERIC(8,6) DEFAULT 0;

-- 2. voter_blocs: softmax temperature
ALTER TABLE voter_blocs ADD COLUMN IF NOT EXISTS k_value NUMERIC(4,1) DEFAULT 10;

-- 3. factions: national vote share
ALTER TABLE factions ADD COLUMN IF NOT EXISTS national_vote_share NUMERIC(6,2) DEFAULT 0;
