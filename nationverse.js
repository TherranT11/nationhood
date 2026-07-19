// nationverse.js — shared constants for the new universe. ONE source for the nation stat set, used by
// the /backend Nation Creator + List of Nations AND the player-facing /nations chooser, so the stats
// (keys, labels, order) can never drift between authoring and display. Each entry: [key, label, description].
export const NV_STATS = [
  ['budget', 'Budget', 'Government finances and fiscal flexibility'],
  ['economic_growth', 'Economic Growth', 'Expansion or contraction of the economy'],
  ['inflation', 'Inflation', 'Rate at which prices rise and money loses purchasing power'],
  ['standard_of_living', 'Standard of Living', 'Average quality of life for citizens'],
  ['unrest', 'Unrest', 'Active protests, strikes, riots, insurgency, and instability'],
  ['legitimacy', 'Legitimacy', 'Public acceptance of the government and political system'],
  ['corruption', 'Corruption', 'Misuse of public office and institutional integrity'],
  ['state_capacity', 'State Capacity', 'Government ability to enforce laws, collect taxes, and implement policy'],
  ['civic_liberties', 'Civic Liberties', 'Freedom of speech, assembly, religion, and protection of individual rights from state overreach'],
  ['social_cohesion', 'Social Cohesion', 'Unity between ethnic, religious, regional, and class groups'],
  ['power_projection', 'Power Projection', 'Ability to influence events beyond national borders'],
  ['military_readiness', 'Military Readiness', 'Training, equipment, logistics, morale, and combat preparedness of the armed forces'],
  ['media_freedom', 'Media Freedom', 'Independence of the press and public access to information'],
  ['business_climate', 'Business Climate', 'Attractiveness of the country for investment and private enterprise'],
];

// Resolve a personality's party NAME from the nation's party list: the stored party name if any, else the
// legacy "Politician of Party N" slot. ONE source, used by the role chooser and the home top bar.
export function partyOf(p, parties) {
  if (!p) return null;
  if (p.party) return p.party;
  const m = /^Politician of Party (\d+)$/.exec(p.role || '');
  return m ? (((parties || [])[+m[1] - 1] || {}).name || null) : null;
}

// The declared ideology of a personality's party ('' when they belong to no party or none is set).
export function partyIdeology(p, parties) {
  const name = partyOf(p, parties);
  if (!name) return '';
  const pd = (parties || []).find(x => x && x.name === name);
  return (pd && pd.ideology) || '';
}

// A player is locked to one character. If the signed-in user has already claimed a personality, send
// them straight to that character's nation home. Returns true when it redirects (callers should then
// stop rendering). ONE source for the "you're locked to your character" routing — used by /nations and
// /nation-roles so login always lands on the home screen.
export async function redirectToMyCharacter(supabase) {
  try {
    const { data: u } = await supabase.auth.getUser();
    const uid = u && u.user ? u.user.id : null;
    if (!uid) return false;
    const { data } = await supabase.from('nationverse_personalities').select('id, nation_id').eq('claimed_by', uid).maybeSingle();
    if (data && data.nation_id) {
      window.location.replace('/nation-home/?nation=' + encodeURIComponent(data.nation_id) + '&role=' + encodeURIComponent(data.id));
      return true;
    }
  } catch (e) { /* not signed in / not connected → fall through to the normal page */ }
  return false;
}
