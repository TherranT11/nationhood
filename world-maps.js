// Fetching "the current world" means the same thing everywhere it happens:
// the most recently saved rf_world_maps row. /maptool (on open, to resume
// the last save) and /found/seat (to render the real map for placement)
// both need exactly this query — one function, so the two can't drift.
import { supabase } from './supabase.js';

export function loadLatestWorldMap(){
  return supabase.from("rf_world_maps").select("*").order("updated_at", { ascending:false }).limit(1).maybeSingle();
}
