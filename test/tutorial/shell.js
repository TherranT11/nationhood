// Shared logic for the in-game sidebar screens (tutorial/home, tutorial/government).
// One source of truth for the party colour map and the sidebar's live bits:
// the flag fallback, the login guard, and the player's chosen-party label.
import { supabase, isConfigured } from '/test/supabase.js';

// The party a player chose in the tutorial -> sidebar label + colour.
// (Liberal is presented as "Centrist".)
export const PARTY = {
  Nationalist: { label: 'Nationalist', color: '#243b6b' }, // blue
  Labour:      { label: 'Labour',      color: '#D1342B' }, // red
  Liberal:     { label: 'Centrist',    color: '#C2890B' }, // yellow
};

// Wire up the shared sidebar: hide the flag if it is missing, require a
// signed-in player, and show their party in its colour. Call once per page.
// Expects a #flag image and a #party label in the markup.
export async function initSidebar() {
  const flag = document.getElementById('flag');
  if (flag) {
    const hide = () => { flag.style.display = 'none'; };
    flag.addEventListener('error', hide);
    if (flag.complete && flag.naturalWidth === 0) hide();
  }

  if (!isConfigured) return; // keep defaults until keys are set
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '/test/login/'; return; }
    const { data, error } = await supabase
      .from('profiles')
      .select('tutorial_party')
      .eq('id', session.user.id)
      .single();
    if (error) return;
    const partyEl = document.getElementById('party');
    const p = partyEl && PARTY[data && data.tutorial_party];
    if (p) { partyEl.textContent = p.label; partyEl.style.color = p.color; }
  } catch (err) {
    // keep defaults
  }
}
