-- Allow tick_deadline to be NULL on fundraiser_promises.
-- Promises now start as 'pending_election' with no countdown until the faction
-- enters government after the next election, so tick_deadline is initially NULL.
ALTER TABLE fundraiser_promises ALTER COLUMN tick_deadline DROP NOT NULL;
