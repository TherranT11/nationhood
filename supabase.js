// Shared Supabase browser client — the single source of truth for the
// project URL and publishable key. Both /signup and /home import it.
//
// The publishable key (sb_publishable_...) is safe to ship in client code:
// access is governed by Row Level Security in the database, not by hiding
// this key. Never put the secret (sb_secret_...) key here.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://enxrxbcozjlvktuummbw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-sTPXsMaU81zU-pJtktSpA_yR0tS8CM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// True once real credentials have been filled in, so pages can show a clear
// message instead of failing with a cryptic network error.
export const isConfigured =
  !SUPABASE_URL.includes('YOUR-PROJECT-REF') &&
  !SUPABASE_PUBLISHABLE_KEY.includes('YOUR-');
