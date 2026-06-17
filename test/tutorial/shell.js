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

  // The subtitle starts hidden so the player never sees a placeholder before
  // their archetype loads; reveal it once we know (or cannot know) the party.
  const partyEl = document.getElementById('party');
  const reveal = () => { if (partyEl && partyEl.parentElement) partyEl.parentElement.style.visibility = 'visible'; };

  if (!isConfigured) { reveal(); return; } // keep defaults until keys are set
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '/test/login/'; return; }
    const { data, error } = await supabase
      .from('profiles')
      .select('tutorial_party, tutorial_government_formed')
      .eq('id', session.user.id)
      .single();
    if (error) { reveal(); return; }
    const tp = data && data.tutorial_party;
    const p = PARTY[tp];
    if (p && partyEl) { partyEl.textContent = p.label; partyEl.style.color = p.color; }
    reveal();
    // Let the page react to the player's state (archetype contradictions,
    // whether the government is already formed).
    window.nationhoodParty = tp;
    window.nationhoodGovernmentFormed = !!(data && data.tutorial_government_formed);
    window.dispatchEvent(new CustomEvent('nationhood:party', { detail: tp }));
    window.dispatchEvent(new CustomEvent('nationhood:gov', { detail: window.nationhoodGovernmentFormed }));
  } catch (err) {
    reveal();
  }
}

// Record that the player has formed their government. Returns true on success
// (or when there are no keys, so local dev still flows through).
export async function markGovernmentFormed() {
  if (!isConfigured) return true;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    const { error } = await supabase
      .from('profiles')
      .update({ tutorial_government_formed: true })
      .eq('id', session.user.id);
    return !error;
  } catch (err) {
    return false;
  }
}

// Sign the player out and return to the test landing page. Redirects even if
// the sign-out call fails so a stuck session never traps the player. Guards
// against a double-click firing two sign-outs before the redirect lands.
let loggingOut = false;
export async function logout() {
  if (loggingOut) return;
  loggingOut = true;
  try { if (isConfigured) await supabase.auth.signOut(); } catch (err) { /* fall through to redirect */ }
  window.location.href = '/test/';
}

// Confidence of the formed tutorial government (Front 114 + Workers' 40 = 154
// of 280) under the three standing crises. Single source of truth so the home
// screen and the Government page always agree. Depends on the player's
// archetype: a Nationalist clashes with the Communist Workers' Party.
export function formedConfidence(party) {
  const base = 50;
  const crises = -6;                                // three crises at -2
  const contra = party === 'Nationalist' ? -4 : 0;  // clash with the Communist partner
  const bonus = Math.round((((154 / 280) * 100 - 50) / 2) * 10) / 10; // seats over 50%, halved (2.5)
  const value = Math.round(base + crises + contra + bonus);
  return { value, base, crises, contra, bonus };
}
