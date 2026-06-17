// Shared Supabase browser client — the single source of truth for the
// project URL and anon key. Both /test/signup and /test/home import this.
//
// The anon key is a PUBLISHABLE key and is safe to ship in client code:
// access is governed by Row Level Security in the database, not by hiding
// this key. Never put the service_role key here.
//
// >>> REPLACE the two values below with your Supabase project's values:
//     Dashboard > Project Settings > API
//       - Project URL  -> SUPABASE_URL
//       - anon public  -> SUPABASE_ANON_KEY
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// True once real credentials have been filled in, so pages can show a clear
// message instead of failing with a cryptic network error.
export const isConfigured =
  !SUPABASE_URL.includes('YOUR-PROJECT-REF') &&
  !SUPABASE_ANON_KEY.includes('YOUR-ANON');
