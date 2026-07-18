// wiki-editor.js — the structured Nationpedia article editor. ONE source for authoring, shared by
// the admin tool (adminsetup) and the player editor (/play/wiki/edit). It renders the form into a
// host element, manages the draft, previews through /wiki.js, uploads infobox art to the
// wiki-images bucket, and saves to wiki_articles. The DB RLS (schema/105) is the real gate on who
// may write what — this is just the form.

import { injectWikiCSS, articleHTML } from '/wiki.js';
import { uploadToStorage } from '/upload.js';

var WK_KINDS = ['Nation', 'Political party', 'Politician', 'Place', 'Organization', 'Event'];

// Attribute-safe escape (also escapes quotes for value="…"); plain-text escape for chip labels.
function wkAttr(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function splitComma(x) { return String(x || '').split(',').map(function (t) { return t.trim(); }).filter(Boolean); }
function blankDraft() { return { title: '', kind: 'Nation', hat: '', ibTitle: '', image: null, ibCap: '', rows: [], lead: '', secs: [], refs: [], see: '', cats: '' }; }

const EDITOR_CSS = `
.wk-editor label{display:block;font-size:12px;font-weight:700;letter-spacing:.02em;color:var(--muted);margin:0 0 5px}
.wk-editor input[type=text],.wk-editor select,.wk-editor textarea{width:100%;box-sizing:border-box;background:var(--field);border:1px solid var(--line2);border-radius:8px;padding:9px 11px;font-family:'Archivo',sans-serif;font-size:13.5px;color:var(--ink)}
.wk-editor input:focus,.wk-editor select:focus,.wk-editor textarea:focus{outline:none;border-color:var(--indigo)}
.wk-editor textarea{resize:vertical;min-height:74px;line-height:1.55}
.wk-editor .grp{border:1px solid var(--line);border-radius:13px;padding:16px 17px;background:var(--surface);margin-bottom:14px}
.wk-editor .grp-h{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--soft);margin-bottom:13px}
.wk-editor .f{margin-bottom:12px}.wk-editor .f:last-child{margin-bottom:0}
.wk-editor .wkhint{color:var(--soft);font-weight:400;font-size:10.5px;font-family:'Space Mono',monospace;text-transform:none;letter-spacing:0}
.wk-editor .minirow{display:flex;gap:8px;align-items:flex-start;margin-bottom:8px}
.wk-editor .minirow input{flex:1}.wk-editor .minirow .k{flex:0 0 38%}
.wk-editor .minirow .rn{font-family:'Space Mono',monospace;font-size:12px;color:var(--soft);padding-top:10px;flex:none}
.wk-editor .rm{background:var(--chip);border:1px solid var(--line2);color:var(--soft);border-radius:7px;width:32px;height:34px;flex:none;cursor:pointer;font-size:14px}
.wk-editor .rm:hover{color:var(--red);border-color:var(--red)}
.wk-editor .addbtn{background:transparent;border:1px dashed var(--line2);color:var(--muted);border-radius:8px;padding:8px 12px;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.03em;font-weight:700;cursor:pointer;width:100%}
.wk-editor .addbtn:hover{border-color:var(--indigo);color:var(--indigo)}
.wk-editor .sec-edit{border:1px solid var(--line2);border-radius:10px;padding:11px;margin-bottom:9px;background:var(--field)}
.wk-editor .sec-edit .stop{display:flex;gap:8px;margin-bottom:7px}.wk-editor .sec-edit .lvl{flex:0 0 64px}
.wk-editor .uploader{border:1px dashed var(--line2);border-radius:10px;background:var(--field);cursor:pointer}
.wk-editor .uploader:hover{border-color:var(--indigo)}
.wk-editor .up-empty{display:flex;flex-direction:column;align-items:center;gap:5px;padding:22px 14px;color:var(--soft);text-align:center}
.wk-editor .up-empty svg{width:30px;height:30px;stroke:currentColor;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.wk-editor .up-empty span{font-size:12.5px;font-weight:700;color:var(--muted)}.wk-editor .up-empty small{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.04em}
.wk-editor .up-has{display:flex;flex-direction:column;align-items:center;gap:9px;padding:14px}
.wk-editor .up-has img{max-width:160px;max-height:140px;border:1px solid var(--line2);border-radius:5px;display:block}
.wk-editor .up-remove{background:var(--chip);border:1px solid var(--line2);color:var(--soft);border-radius:7px;padding:6px 12px;font-family:'Space Mono',monospace;font-size:10px;cursor:pointer}
.wk-editor .up-remove:hover{color:var(--red);border-color:var(--red)}
.wk-editor .wkbtns{display:flex;gap:10px;align-items:center}
.wk-editor .wksave{font-family:'Space Mono',monospace;font-size:12px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;color:var(--surface);background:var(--ink);border:none;border-radius:11px;padding:13px 18px;cursor:pointer}
.wk-editor .wksave:hover{filter:brightness(1.15)}.wk-editor .wksave:disabled{opacity:.5;cursor:not-allowed}
.wk-editor .wkdel{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;color:var(--red);background:var(--red-soft);border:1px solid transparent;border-radius:10px;padding:12px 16px;cursor:pointer}
.wk-editor .note{margin-top:14px;font-size:13.5px;color:var(--muted);min-height:18px}
.wk-editor .note.error{color:var(--red)}.wk-editor .note.ok{color:var(--green)}
`;
function injectEditorCSS() { if (document.getElementById('wk-editor-style')) return; var s = document.createElement('style'); s.id = 'wk-editor-style'; s.textContent = EDITOR_CSS; document.head.appendChild(s); }

function formHTML() {
  return ''
    + '<div class="grp"><div class="grp-h">Basics</div>'
    + '<div class="f"><label>Title</label><input type="text" id="fTitle" placeholder="Republic of Sessau"></div>'
    + '<div class="f"><label>Kind</label><select id="fKind"></select></div>'
    + '<div class="f"><label>Hatnote <span class="wkhint">italic note at the top, optional</span></label><input type="text" id="fHat"></div></div>'
    + '<div class="grp"><div class="grp-h">Infobox</div>'
    + '<div class="f"><label>Heading <span class="wkhint">defaults to the title</span></label><input type="text" id="fIbTitle"></div>'
    + '<div class="f"><label>Image</label><div class="uploader" id="wkUploader"><input type="file" id="fImageInput" accept="image/*" hidden>'
    + '<div class="up-empty" id="upEmpty"><svg viewBox="0 0 24 24"><path d="M4 16l5-5 4 4 3-3 4 4"/><circle cx="9" cy="8" r="1.6"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg><span>Click to upload an image</span><small>PNG, JPG, SVG · 2 MB</small></div>'
    + '<div class="up-has" id="upHas" style="display:none"><img id="upPreview" alt="preview"><button type="button" class="up-remove" id="upRemove">Remove</button></div></div><div class="note" id="wkImgNote"></div></div>'
    + '<div class="f"><label>Caption <span class="wkhint">under the image</span></label><input type="text" id="fIbCap"></div>'
    + '<div class="f"><label>Fact rows</label><div id="rowsBox"></div><button class="addbtn" id="addRow" type="button">+ Add fact row</button></div></div>'
    + '<div class="grp"><div class="grp-h">Lead</div><div class="f"><label>Opening paragraph</label><textarea id="fLead" placeholder="The **Republic of Sessau** is a nation in [[Meridia]]…"></textarea></div></div>'
    + '<div class="grp"><div class="grp-h">Sections</div><div id="secsBox"></div><button class="addbtn" id="addSec" type="button">+ Add section</button></div>'
    + '<div class="grp"><div class="grp-h">References</div><div id="refsBox"></div><button class="addbtn" id="addRef" type="button">+ Add reference</button></div>'
    + '<div class="grp"><div class="grp-h">Links &amp; categories</div>'
    + '<div class="f"><label>See also <span class="wkhint">comma-separated titles</span></label><input type="text" id="fSee"></div>'
    + '<div class="f"><label>Categories <span class="wkhint">comma-separated</span></label><input type="text" id="fCats"></div></div>'
    + '<div class="wkbtns"><button class="wksave" id="wkSave" type="button">Save article</button><button class="wkdel" id="wkDel" type="button" hidden>Delete</button></div>'
    + '<div class="note" id="wkNote" role="status" aria-live="polite"></div>';
}

// Mount the editor. opts: { supabase, host, previewEl, knownTitles(), onSaved(title), userId, canDelete }.
// Returns { newArticle(), loadRow(row) } for the host to drive (its list / its "new" button).
export function mountWikiEditor(opts) {
  injectWikiCSS(); injectEditorCSS();
  var supabase = opts.supabase, host = opts.host, previewEl = opts.previewEl;
  var known = opts.knownTitles || function () { return new Set(); };
  host.classList.add('wk-editor');
  host.innerHTML = formHTML();
  var S = blankDraft(), editingId = null;
  var byId = function (id) { return host.querySelector('#' + id); };

  function setNote(t, k) { var n = byId('wkNote'); n.textContent = t || ''; n.className = 'note' + (k ? ' ' + k : ''); }
  function buildArticle() {
    return {
      title: S.title, kind: S.kind, hat: S.hat,
      box: { heading: S.ibTitle, image: S.image ? { url: S.image } : null, cap: S.ibCap, rows: S.rows.filter(function (r) { return r[0] || r[1]; }) },
      lead: S.lead,
      sections: S.secs.filter(function (s) { return s.h || s.b; }).map(function (s) { return { lvl: s.lvl, h: s.h, b: s.b }; }),
      refs: S.refs.filter(Boolean), see: splitComma(S.see), cats: splitComma(S.cats)
    };
  }
  function preview() {
    if (!previewEl) return;
    if (!S.title.trim()) { previewEl.innerHTML = '<div class="wk-empty">Enter a title to preview…</div>'; return; }
    var set = known(); set.add(S.title.toLowerCase());
    previewEl.innerHTML = articleHTML(buildArticle(), set);
  }

  function renderRows() {
    byId('rowsBox').innerHTML = S.rows.map(function (r, i) {
      return '<div class="minirow"><input class="k" data-ri="' + i + '" data-f="0" value="' + wkAttr(r[0]) + '" placeholder="Label"><input data-ri="' + i + '" data-f="1" value="' + wkAttr(r[1]) + '" placeholder="Value"><button class="rm" type="button" data-rmrow="' + i + '">×</button></div>';
    }).join('');
    host.querySelectorAll('#rowsBox [data-ri]').forEach(function (el) { el.oninput = function () { S.rows[+el.dataset.ri][+el.dataset.f] = el.value; preview(); }; });
    host.querySelectorAll('#rowsBox [data-rmrow]').forEach(function (b) { b.onclick = function () { S.rows.splice(+b.dataset.rmrow, 1); renderRows(); preview(); }; });
  }
  function renderSecs() {
    byId('secsBox').innerHTML = S.secs.map(function (s, i) {
      return '<div class="sec-edit"><div class="stop">'
        + '<select class="lvl" data-si="' + i + '" data-f="lvl"><option value="2"' + (s.lvl == 2 ? ' selected' : '') + '>H2</option><option value="3"' + (s.lvl == 3 ? ' selected' : '') + '>H3</option></select>'
        + '<input data-si="' + i + '" data-f="h" value="' + wkAttr(s.h) + '" placeholder="Section heading">'
        + '<button class="rm" type="button" data-rmsec="' + i + '">×</button></div>'
        + '<textarea data-si="' + i + '" data-f="b" placeholder="Section text… [[link]], **bold**, [1]">' + wkAttr(s.b) + '</textarea></div>';
    }).join('');
    host.querySelectorAll('#secsBox [data-si]').forEach(function (el) {
      var ev = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(ev, function () { var f = el.dataset.f; S.secs[+el.dataset.si][f] = (f === 'lvl') ? +el.value : el.value; preview(); });
    });
    host.querySelectorAll('#secsBox [data-rmsec]').forEach(function (b) { b.onclick = function () { S.secs.splice(+b.dataset.rmsec, 1); renderSecs(); preview(); }; });
  }
  function renderRefs() {
    byId('refsBox').innerHTML = S.refs.map(function (r, i) {
      return '<div class="minirow"><span class="rn">[' + (i + 1) + ']</span><input data-refi="' + i + '" value="' + wkAttr(r) + '" placeholder="Citation"><button class="rm" type="button" data-rmref="' + i + '">×</button></div>';
    }).join('');
    host.querySelectorAll('#refsBox [data-refi]').forEach(function (el) { el.oninput = function () { S.refs[+el.dataset.refi] = el.value; preview(); }; });
    host.querySelectorAll('#refsBox [data-rmref]').forEach(function (b) { b.onclick = function () { S.refs.splice(+b.dataset.rmref, 1); renderRefs(); preview(); }; });
  }

  function showUpload() {
    var has = !!S.image;
    byId('upEmpty').style.display = has ? 'none' : '';
    byId('upHas').style.display = has ? '' : 'none';
    if (has) byId('upPreview').src = S.image;
  }
  async function upload(file) {
    var note = byId('wkImgNote');
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { note.textContent = 'That image is over 2 MB.'; return; }
    note.textContent = 'Uploading…';
    try {
      S.image = await uploadToStorage('wiki-images', '', file, 0);   // size already checked above; one source: upload.js
      note.textContent = 'Image uploaded.'; showUpload(); preview();
    } catch (e) { note.textContent = 'Upload failed: ' + (e.message || e); }
  }

  function ensureKindOption(kind) {
    var sel = byId('fKind');
    if (kind && !Array.prototype.some.call(sel.options, function (o) { return o.value === kind; })) {
      var o = document.createElement('option'); o.value = kind; o.textContent = kind; sel.appendChild(o);
    }
  }
  function syncForm() {
    byId('fTitle').value = S.title;
    ensureKindOption(S.kind); byId('fKind').value = S.kind;
    byId('fHat').value = S.hat; byId('fIbTitle').value = S.ibTitle; byId('fIbCap').value = S.ibCap;
    byId('fLead').value = S.lead; byId('fSee').value = S.see; byId('fCats').value = S.cats;
    byId('wkImgNote').textContent = '';
    renderRows(); renderSecs(); renderRefs(); showUpload();
  }
  function newArticle() {
    editingId = null; S = blankDraft();
    byId('wkDel').hidden = true;
    setNote(''); syncForm(); preview();
  }
  function loadRow(row) {
    var d = row.definition || {}, box = d.box || {};
    editingId = row.id;
    S = {
      title: row.title || '', kind: row.kind || 'Nation', hat: d.hat || '',
      ibTitle: box.heading || '', image: (box.image && box.image.url) || null, ibCap: box.cap || '',
      rows: (box.rows || []).map(function (x) { return [x[0] || '', x[1] || '']; }),
      lead: d.lead || '',
      secs: (d.sections || []).map(function (s) { return { lvl: s.lvl === 3 ? 3 : 2, h: s.h || '', b: s.b || '' }; }),
      refs: (d.refs || []).slice(),
      see: (d.see || []).join(', '), cats: (d.cats || []).join(', ')
    };
    byId('wkDel').hidden = !opts.canDelete;
    setNote(''); syncForm(); preview();
  }

  async function save() {
    if (!S.title.trim()) { setNote('Enter a title.', 'error'); return; }
    var btn = byId('wkSave'); btn.disabled = true; setNote('Saving…');
    try {
      var art = buildArticle();
      var def = { hat: art.hat, box: art.box, lead: art.lead, sections: art.sections, refs: art.refs, see: art.see, cats: art.cats };
      var row = { title: S.title.trim(), kind: S.kind || 'Article', definition: def, updated_at: new Date().toISOString() };
      var res;
      if (editingId) { res = await supabase.from('wiki_articles').update(row).eq('id', editingId); }
      else { row.author_id = opts.userId || null; res = await supabase.from('wiki_articles').insert(row); }
      if (res.error) throw res.error;
      setNote('Saved “' + row.title + '”.', 'ok');
      if (opts.onSaved) opts.onSaved(row.title);
    } catch (e) {
      if (e && e.code === '23505') setNote('An article with that title already exists.', 'error');
      else if (e && (e.code === '42501' || /row-level security/i.test(e.message || ''))) setNote('You can only edit articles you created.', 'error');
      else setNote('Save failed: ' + (e.message || e), 'error');
    }
    finally { btn.disabled = false; }
  }
  async function remove() {
    if (!editingId || !opts.canDelete) return;
    if (!confirm('Delete this article? This cannot be undone.')) return;
    var btn = byId('wkDel'); btn.disabled = true;
    try {
      var res = await supabase.from('wiki_articles').delete().eq('id', editingId);
      if (res.error) throw res.error;
      newArticle(); if (opts.onSaved) opts.onSaved(null);
    } catch (e) { setNote('Delete failed: ' + (e.message || e), 'error'); }
    finally { btn.disabled = false; }
  }

  // wire static fields + buttons (once)
  byId('fKind').innerHTML = WK_KINDS.map(function (k) { return '<option value="' + wkAttr(k) + '">' + wkAttr(k) + '</option>'; }).join('');
  function bind(id, key) { byId(id).addEventListener('input', function () { S[key] = this.value; preview(); }); }
  bind('fTitle', 'title'); bind('fHat', 'hat'); bind('fIbTitle', 'ibTitle'); bind('fIbCap', 'ibCap');
  bind('fLead', 'lead'); bind('fSee', 'see'); bind('fCats', 'cats');
  byId('fKind').addEventListener('change', function () { S.kind = this.value; preview(); });
  var fileInput = byId('fImageInput');
  byId('wkUploader').addEventListener('click', function (e) { if (e.target.id !== 'upRemove') fileInput.click(); });
  fileInput.addEventListener('change', function () { if (this.files[0]) upload(this.files[0]); this.value = ''; });
  byId('upRemove').addEventListener('click', function (e) { e.stopPropagation(); S.image = null; showUpload(); preview(); });
  byId('addRow').onclick = function () { S.rows.push(['', '']); renderRows(); preview(); };
  byId('addSec').onclick = function () { S.secs.push({ lvl: 2, h: '', b: '' }); renderSecs(); preview(); };
  byId('addRef').onclick = function () { S.refs.push(''); renderRefs(); preview(); };
  byId('wkSave').onclick = save;
  byId('wkDel').onclick = remove;

  newArticle();
  return { newArticle: newArticle, loadRow: loadRow };
}
