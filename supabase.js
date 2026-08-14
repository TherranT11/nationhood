// Shared Supabase client. The anon key below is public by design — it ships in
// every page that imports this module — and access is governed by Row Level
// Security policies on each table, not by hiding the key. The secret/service
// key must never appear in client code.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://enxrxbcozjlvktuummbw.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVueHJ4YmNvempsdmt0dXVtbWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NTY5NDMsImV4cCI6MjA5NzIzMjk0M30.v_spdANfLFz9QcxOBB_43fF_rnE-XmVhNalcEL33nt8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
