// formation.js — the formation-window decision, computed in ONE place and read
// by both the Government page (which renders the choice card) and the Home page
// (which shows the "form your government" banner). This mirrors the server
// guards in coalition_renege / coalition_install for visibility only; those RPCs
// stay authoritative and re-check everything.
import { supabase, currentTick } from '/supabase.js';

// Given the signed-in player's party ({ id, nation_id }), return
// { canRenege, postRenege, negId }. Everything is false/null unless the party is
// the formateur of a government still inside its formation tick (the tick it
// formed) with the one-per-term choice unspent:
//   canRenege  — active coalition, not yet reshuffled, not dismissed → honour vs renege
//   postRenege — reneged this tick (now a minority) → build + install a replacement
export async function formationState(party) {
  const out = { canRenege: false, postRenege: false, negId: null };
  if (!party || !party.id || !party.nation_id) return out;
  try {
    const { data: govt } = await supabase.from('governments')
      .select('id, type, formed_tick, formateur_party_id')
      .eq('nation_id', party.nation_id).eq('status', 'active').maybeSingle();
    if (!govt || govt.formateur_party_id !== party.id) return out;   // not the formateur

    const tick = await currentTick();
    if (govt.formed_tick !== tick) return out;                       // window closed

    // One reshuffle per term: any government already retired this tick means the
    // choice has been spent (a prior renege/install).
    const { data: rs } = await supabase.from('governments')
      .select('id').eq('nation_id', party.nation_id).eq('status', 'replaced').eq('formed_tick', tick).limit(1);
    const reshuffled = !!(rs && rs.length);

    // KNOWN LIMITATION: a coalition seated mid-term via coalition_form_government
    // also stamps formed_tick = the current tick, so it surfaces this election-framed
    // renege card the same turn it forms. Harmless (reneging just drops back to a
    // minority, no penalty) but the copy reads as if an election just happened.
    // A clean fix needs a persistent "from_election" flag on governments — deferred.
    if (govt.type === 'coalition' && !reshuffled && sessionStorage.getItem('govConfirmed') !== govt.id) {
      out.canRenege = true;
    } else if (govt.type === 'minority' && reshuffled) {
      out.postRenege = true;
      const { data: neg } = await supabase.from('negotiations')
        .select('id').eq('nation_id', party.nation_id).eq('host_party_id', party.id).eq('status', 'committed').maybeSingle();
      out.negId = neg ? neg.id : null;
    }
  } catch (err) { /* on any failure show no decision — the RPCs remain the gate */ }
  return out;
}
