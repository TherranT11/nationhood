-- Allow authenticated users to update their own broadcasts
DO $$ BEGIN
  CREATE POLICY "Users can update own radio_broadcasts" ON radio_broadcasts
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
