// Job interview chat — the shared modal both sides of the table use.
// The interviewer (corp owner) opens it from an applicant's
// [INTERVIEW] button on business-corp.html and gets [HIRE] /
// [CLOSE OUT]; the interviewee opens it from their career page and
// can only chat. One module so the two pages can't drift.
import { _supabase } from './supabase-client.js';
import { escapeHtml as esc } from './utils.js';

const POLL_MS = 4000;

const CSS = `
  #ivc-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:300;
    align-items:center; justify-content:center; }
  #ivc-overlay.open { display:flex; }
  .ivc-modal { width:560px; max-width:92vw; max-height:84vh; display:flex; flex-direction:column;
    background:#101010; border:0.5px solid rgba(255,255,255,0.14); border-radius:6px;
    padding:18px 20px; }
  .ivc-head { display:flex; align-items:baseline; gap:10px; }
  .ivc-title { font-family:var(--font-mono); font-size:11px; letter-spacing:0.16em; color:#aac88a;
    font-weight:700; }
  .ivc-x { margin-left:auto; background:none; border:none; color:#666; font-size:16px;
    cursor:pointer; line-height:1; }
  .ivc-x:hover { color:#fff; }
  .ivc-msgs { flex:1; min-height:200px; max-height:46vh; overflow-y:auto; margin:14px 0 10px;
    padding:12px; background:#0a0a0a; border:0.5px solid rgba(255,255,255,0.08); border-radius:4px; }
  .ivc-empty { text-align:center; color:#555; font-size:11.5px; font-style:italic; padding:30px 0; }
  .ivc-msg { margin-bottom:10px; }
  .ivc-msg .who { font-family:var(--font-mono); font-size:9px; letter-spacing:0.1em; color:#888;
    font-weight:700; }
  .ivc-msg.mine .who { color:#8aaa6a; }
  .ivc-msg .body { font-size:12.5px; color:#ddd; margin-top:2px; white-space:pre-wrap;
    overflow-wrap:break-word; }
  .ivc-note { font-family:var(--font-mono); font-size:9.5px; color:#c8a96a; margin-bottom:8px; }
  .ivc-inrow { display:flex; gap:8px; }
  .ivc-input { flex:1; padding:10px 12px; background:#0a0a0a; border:1px solid rgba(255,255,255,0.1);
    border-radius:4px; color:#fff; font-size:12px; }
  .ivc-send { padding:10px 14px; background:rgba(138,170,106,0.08); border:0.5px solid #4a6a4a;
    border-radius:4px; color:#8aaa6a; font-family:var(--font-mono); font-size:9px;
    letter-spacing:0.12em; font-weight:700; cursor:pointer; }
  .ivc-send:disabled, .ivc-input:disabled { opacity:0.4; cursor:default; }
  .ivc-actions { display:flex; gap:8px; margin-top:12px; }
  .ivc-hire { padding:8px 14px; background:rgba(138,170,106,0.12); border:0.5px solid #4a6a4a;
    border-radius:4px; color:#aac88a; font-family:var(--font-mono); font-size:9px;
    letter-spacing:0.12em; font-weight:700; cursor:pointer; }
  .ivc-closeout { padding:8px 14px; background:transparent; border:0.5px solid #5a3030;
    border-radius:4px; color:#c87a7a; font-family:var(--font-mono); font-size:9px;
    letter-spacing:0.12em; font-weight:700; cursor:pointer; }
`;

let poll = null;

function ensureDom() {
  if (document.getElementById('ivc-overlay')) return;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const host = document.createElement('div');
  host.id = 'ivc-overlay';
  host.innerHTML = `
    <div class="ivc-modal">
      <div class="ivc-head">
        <div class="ivc-title" id="ivc-title">JOB INTERVIEW</div>
        <button type="button" class="ivc-x" id="ivc-x" title="Close window">&times;</button>
      </div>
      <div class="ivc-msgs" id="ivc-msgs"><div class="ivc-empty">Loading…</div></div>
      <div class="ivc-note" id="ivc-note" style="display:none;"></div>
      <div class="ivc-inrow">
        <input class="ivc-input" id="ivc-input" maxlength="2000" placeholder="Say something…">
        <button type="button" class="ivc-send" id="ivc-send">SEND</button>
      </div>
      <div class="ivc-actions" id="ivc-actions" style="display:none;">
        <button type="button" class="ivc-hire" id="ivc-hire">HIRE</button>
        <button type="button" class="ivc-closeout" id="ivc-closeout">CLOSE OUT</button>
      </div>
    </div>`;
  document.body.appendChild(host);
}

function teardown() {
  if (poll) { clearInterval(poll); poll = null; }
  document.getElementById('ivc-overlay').classList.remove('open');
}

/**
 * Opens the interview chat.
 *   interviewId   job_interviews.id
 *   applicantId   job_applicants.id (needed for HIRE; owner side only)
 *   heading       e.g. 'JOB INTERVIEW — Senior Project Manager for Vargas Construction'
 *   canManage     true for the corp owner: shows [HIRE] [CLOSE OUT]
 *   myFactionId   the viewer's faction id (aligns "mine" messages)
 *   names         { factionId: displayName } for both participants
 *   onHired       called after a successful HIRE
 */
export function openInterviewChat({ interviewId, applicantId, heading, canManage, myFactionId, names, onHired }) {
  ensureDom();
  if (poll) { clearInterval(poll); poll = null; }

  const overlay = document.getElementById('ivc-overlay');
  const msgsEl  = document.getElementById('ivc-msgs');
  const noteEl  = document.getElementById('ivc-note');
  const inputEl = document.getElementById('ivc-input');
  const sendEl  = document.getElementById('ivc-send');
  document.getElementById('ivc-title').textContent = heading;
  document.getElementById('ivc-actions').style.display = canManage ? 'flex' : 'none';
  noteEl.style.display = 'none';
  inputEl.value = '';
  inputEl.disabled = false;
  sendEl.disabled = false;
  msgsEl.innerHTML = '<div class="ivc-empty">Loading…</div>';

  let closed = false;
  function markClosed(text) {
    closed = true;
    if (poll) { clearInterval(poll); poll = null; }
    noteEl.textContent = text;
    noteEl.style.display = 'block';
    inputEl.disabled = true;
    sendEl.disabled = true;
  }

  async function refresh() {
    try {
      const [{ data: iv, error: ivErr }, { data: msgs, error: msgErr }] = await Promise.all([
        _supabase.from('job_interviews').select('status').eq('id', interviewId).maybeSingle(),
        _supabase.from('job_interview_messages')
          .select('sender_faction_id, body, created_at')
          .eq('interview_id', interviewId)
          .order('created_at'),
      ]);
      if (ivErr || msgErr) throw (ivErr || msgErr);
      const atBottom = msgsEl.scrollTop + msgsEl.clientHeight >= msgsEl.scrollHeight - 12;
      msgsEl.innerHTML = msgs?.length
        ? msgs.map(m => `
            <div class="ivc-msg${m.sender_faction_id === myFactionId ? ' mine' : ''}">
              <div class="who">${esc(names[m.sender_faction_id] || '—')}</div>
              <div class="body">${esc(m.body)}</div>
            </div>`).join('')
        : '<div class="ivc-empty">No messages yet — break the ice.</div>';
      if (atBottom) msgsEl.scrollTop = msgsEl.scrollHeight;
      if (!closed && iv && iv.status !== 'open') {
        markClosed('This interview has been closed out.');
      }
    } catch (e) {
      console.warn('[interview-chat] refresh failed:', e?.message || e);
    }
  }

  async function send() {
    const body = inputEl.value.trim();
    // sendEl.disabled doubles as the in-flight lock — the Enter-key
    // path lands here too, so this also stops double-fires.
    if (!body || closed || sendEl.disabled) return;
    sendEl.disabled = true;
    try {
      const { data, error } = await _supabase.rpc('send_interview_message',
        { p_interview_id: interviewId, p_body: body });
      if (error) throw error;
      if (!data?.success) {
        if (data?.reason === 'closed') { markClosed('This interview has been closed out.'); return; }
        throw new Error(data?.reason || 'unknown');
      }
      inputEl.value = '';
      await refresh();
      msgsEl.scrollTop = msgsEl.scrollHeight;
    } catch (e) {
      alert('Could not send: ' + (e?.message || e));
    } finally {
      sendEl.disabled = closed;
    }
  }

  sendEl.onclick = send;
  inputEl.onkeydown = (e) => { if (e.key === 'Enter') send(); };
  document.getElementById('ivc-x').onclick = teardown;
  overlay.onclick = (e) => { if (e.target === overlay) teardown(); };

  if (canManage) {
    document.getElementById('ivc-hire').onclick = async () => {
      if (!confirm('Hire this applicant? This fills the opening.')) return;
      try {
        const { data, error } = await _supabase.rpc('hire_job_applicant',
          { p_applicant_id: applicantId });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.reason || 'unknown');
        teardown();
        if (onHired) onHired(data);
      } catch (e) {
        alert('Could not hire: ' + (e?.message || e));
      }
    };
    document.getElementById('ivc-closeout').onclick = async () => {
      try {
        const { data, error } = await _supabase.rpc('close_job_interview',
          { p_interview_id: interviewId });
        if (error) throw error;
        if (!data?.success && data?.reason !== 'closed') throw new Error(data?.reason || 'unknown');
        teardown();
      } catch (e) {
        alert('Could not close out: ' + (e?.message || e));
      }
    };
  }

  overlay.classList.add('open');
  refresh();
  poll = setInterval(refresh, POLL_MS);
  inputEl.focus();
}
