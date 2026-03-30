-- Add IPO chat table to Supabase Realtime publication so that
-- postgres_changes subscriptions receive INSERT events.
-- Without this, the ipo_chat realtime channel silently receives nothing
-- and sent messages only appear after a page refresh.

ALTER PUBLICATION supabase_realtime ADD TABLE ipo_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE ipo_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE ipo_ballots;
ALTER PUBLICATION supabase_realtime ADD TABLE ipo_members;
ALTER PUBLICATION supabase_realtime ADD TABLE international_orgs;
