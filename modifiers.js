// Client gateway for a nation's active National Modifiers — shared by the Home and
// Government pages so the fetch + display live in ONE place. Player-facing view:
// the modifier's name + description, colour-coded (the mechanical effects are
// enforced server-side in schema/70 and surfaced to the admin tool, not here).
import { supabase } from '/supabase.js';
import { esc } from '/util.js';

const CSS = `
.nmod{border:1px solid var(--line);border-left:4px solid var(--nmc,#E0820E);border-radius:11px;padding:12px 14px;margin-bottom:10px;background:var(--surface)}
.nmod:last-child{margin-bottom:0}
.nmod.red{--nmc:#C42B2B} .nmod.yellow{--nmc:#E0820E} .nmod.green{--nmc:#16915a}
.nmod__name{font-weight:800;font-size:15px;letter-spacing:-.01em}
.nmod__desc{font-size:13px;color:var(--muted);margin-top:5px;line-height:1.45}
.nmod-empty{color:var(--soft);font-size:13px;font-style:italic}
`;
function injectCss(){
  if (document.getElementById('nmod-css')) return;
  var s = document.createElement('style'); s.id = 'nmod-css'; s.textContent = CSS;
  document.head.appendChild(s);
}

// A nation's active modifiers (definition rows: name/colour/description), oldest
// first. Resilient — returns [] on any read failure so callers never break.
export async function fetchNationModifiers(nationId){
  try {
    const { data: links } = await supabase.from('nation_modifiers').select('modifier_id').eq('nation_id', nationId);
    const ids = (links || []).map(function (l) { return l.modifier_id; });
    if (!ids.length) return [];
    const { data: mods } = await supabase.from('national_modifiers')
      .select('id, name, color, description').in('id', ids).order('created_at');
    return mods || [];
  } catch (e) { return []; }
}

// Render the modifiers into `el` — one colour-coded card each, or an empty message.
export function renderNationModifiers(el, mods, emptyMsg){
  if (!el) return;
  injectCss();
  if (!mods || !mods.length) { el.innerHTML = '<p class="nmod-empty">' + (emptyMsg || 'No active modifiers.') + '</p>'; return; }
  el.innerHTML = mods.map(function (m) {
    return '<div class="nmod ' + esc(m.color || 'yellow') + '"><div class="nmod__name">' + esc(m.name) + '</div>' +
      (m.description ? '<div class="nmod__desc">' + esc(m.description) + '</div>' : '') + '</div>';
  }).join('');
}
