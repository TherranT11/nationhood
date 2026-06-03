import { _supabase } from './supabase-client.js';
import { isFactionInactive } from './game/factions.js';
import { renderMilitaryTopBar } from './military-topbar.js';

// Single source of truth for the army-page bootstrap shared by every
// army-*.html page: auth gate → owning army-faction lookup + active
// gate → the parallel nation/shard/all-factions fetch → military top
// bar. Returns { faction, nation, shard, allUserFactions } on success,
// or null if it already issued a redirect (callers just `return`).
// Page-specific work (officer lazy-gen, render) stays in the page.
//
// `faction.__nation_name` is attached for the pages whose header shows
// it; pages that don't reference it simply ignore it.

const DEFAULT_FACTION_COLS =
  'id, faction_type, faction_name, nation_id, abandoned_at, is_banned, branch, party_funds';

export async function bootstrapArmyPage({ activeTab, factionSelect = DEFAULT_FACTION_COLS }) {
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return null; }

  const { data: faction, error: factionErr } = await _supabase
    .from('factions')
    .select(factionSelect)
    .or(`id.eq.${user.id},linked_user_id.eq.${user.id}`)
    .eq('faction_type', 'military')
    .eq('branch', 'army')
    .is('abandoned_at', null)
    .maybeSingle();

  if (factionErr) { console.warn('Army faction lookup failed:', factionErr.message); window.location.href = 'dashboard.html'; return null; }
  if (!faction || isFactionInactive(faction)) { window.location.href = 'dashboard.html'; return null; }

  const [nationRes, shardRes, allFactionsRes] = await Promise.all([
    _supabase.from('nations').select('name, capital, flag_url, nation_profiles(flag_url)').eq('id', faction.nation_id).maybeSingle(),
    _supabase.from('shard').select('current_date, current_tick, next_tick_at').eq('name', 'Alpha Shard').maybeSingle(),
    _supabase.from('factions').select('id, faction_type, faction_name, abbreviation, branch, abandoned_at, is_banned, nation_id, linked_user_id, bar_admitted_nation_id, politician_office, politician_ministry, politician_experienced_advocate_at_tick, politician_magistrate_at_tick, politician_state_prosecutor_at_tick').or(`id.eq.${user.id},linked_user_id.eq.${user.id}`),
  ]);
  if (nationRes.error)      console.warn('Nation lookup failed:', nationRes.error.message);
  if (shardRes.error)       console.warn('Shard lookup failed:', shardRes.error.message);
  if (allFactionsRes.error) console.warn('Factions lookup failed:', allFactionsRes.error.message);
  const nation = nationRes.data || null;
  const shard = shardRes.data || null;
  const allUserFactions = (allFactionsRes.data || []).filter(f => !isFactionInactive(f));
  faction.__nation_name = nation?.name || '';

  const np = nation?.nation_profiles;
  const profileFlag = Array.isArray(np) ? np[0]?.flag_url : np?.flag_url;
  const flagUrl = profileFlag || nation?.flag_url || (nation?.name ? `assets/flags/${nation.name}.png` : '');
  renderMilitaryTopBar(document.getElementById('mil-topbar-host'), {
    faction, nation, shard, allUserFactions, activeTab, flagUrl,
  });

  // Messaging bubble — same lazy mount Party (common.js) and Corp
  // (corp-topbar.js) use; covers army-actions / army-procurement /
  // army-operations, which all bootstrap through here.
  (typeof requestIdleCallback === 'function' ? requestIdleCallback : setTimeout)(() => {
    import('./messaging.js')
      .then(m => m.initMessaging(faction, nation, shard))
      .catch(err => console.warn('[army-page] messaging init failed:', err));
  });

  return { faction, nation, shard, allUserFactions };
}
