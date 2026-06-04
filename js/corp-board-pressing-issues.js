/**
 * corp-board-pressing-issues.js — Pressing-Issues mount for pending
 * entrepreneur Board-Join votes (Phase B).
 *
 * Surfaces every pending corp_board_requests where the viewer is in
 * the snapshot pool (CEO + every director at the time of application).
 * Shows the applicant's name + four ent_* stats and a single YES
 * button — non-voters are counted as NO at expiry by the tick
 * processor (finalize_expired_board_requests), so explicit NO isn't
 * a separate UI action; the voter just doesn't click.
 *
 * Mirrors the structural pattern of js/lawsuit-pressing-issues.js /
 * js/petition-pressing-issues.js. Self-contained `bp-*` CSS so the
 * cards render the same whether they're hosted on the dashboard or
 * the corp page.
 *
 * Usage:
 *   import { mountBoardPressingIssues } from './js/corp-board-pressing-issues.js';
 *   const ctl = mountBoardPressingIssues({
 *       supabase, faction, host: document.getElementById('ent-pi-host'),
 *       currentTick: () => Number(shard?.current_tick) || 0,
 *   });
 *   // ctl.refresh()  — re-fetch on demand (after a vote, etc.)
 *   // ctl.getCount() — number of open requests the viewer can vote on
 */

const STYLE_ID = 'bp-board-pressing-styles';

const CSS = `
.bp-card { background:#1a1a17; border:1px solid rgba(255,255,255,0.06);
  border-left:3px solid #8aaa6a; padding:16px 18px; margin-bottom:12px; }
.bp-row1 { display:flex; align-items:baseline; justify-content:space-between; gap:10px; margin-bottom:10px; }
.bp-row1 .ti { font-size:13px; font-weight:500; color:#fff; }
.bp-row1 .ti em { font-style:italic; color:#8aaa6a; font-weight:400; }
.bp-row1 .clock { font-size:10px; color:#888; letter-spacing:0.06em; }
.bp-app { display:grid; grid-template-columns:1fr auto; gap:12px; align-items:center;
  padding:12px 14px; background:#0f120e; border:0.5px solid rgba(138,170,106,0.15);
  border-radius:4px; margin-bottom:10px; }
.bp-app .nm { font-size:12px; font-weight:500; color:#fff; }
.bp-app .role { font-size:9px; color:#8aaa6a; letter-spacing:0.12em; margin-top:3px; }
.bp-stats { display:grid; grid-auto-flow:column; grid-auto-columns:max-content;
  gap:18px; font-variant-numeric:tabular-nums; }
.bp-stats .s { text-align:center; }
.bp-stats .s .lab { font-size:8px; color:#666; letter-spacing:0.14em; }
.bp-stats .s .v   { font-size:14px; color:#fff; font-weight:500; margin-top:2px; line-height:1; }
.bp-status { display:flex; justify-content:space-between; align-items:center; gap:12px;
  font-size:11px; color:#888; padding:8px 0; }
.bp-status .yc { color:#8aaa6a; font-weight:500; }
.bp-actions { display:flex; gap:10px; justify-content:flex-end; }
.bp-btn { padding:8px 16px; border-radius:3px; font-size:11px; letter-spacing:0.06em;
  font-weight:500; cursor:pointer; border:0.5px solid; background:transparent; font-family:inherit; }
.bp-btn.yes { background:#1f2a1a; border-color:#8aaa6a; color:#8aaa6a; }
.bp-btn.yes:hover:not(:disabled) { background:#243a1f; }
.bp-btn.no { background:#2a1a1a; border-color:#aa6a6a; color:#aa6a6a; }
.bp-btn.no:hover:not(:disabled) { background:#3a1f1f; }
.bp-btn.sec { border-color:rgba(255,255,255,0.15); color:#888; }
.bp-btn.sec:hover:not(:disabled) { color:#d4d4d4; }
.bp-btn:disabled { opacity:0.45; cursor:not-allowed; }
.bp-msg { font-size:11px; margin-top:8px; }
.bp-msg.err { color:#c47a7a; }
.bp-msg.ok  { color:#8aaa6a; }
`;

function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
}

function ownerName(f) {
    const a = (f?.leader_first_name || '').trim();
    const b = (f?.leader_last_name  || '').trim();
    const joined = (a + ' ' + b).trim();
    return joined || f?.faction_name || 'An entrepreneur';
}

function escText(s) { return String(s == null ? '' : s); }

export function mountBoardPressingIssues({
    supabase, faction, host, currentTick,
    showEmpty = true,
    onChange = null,
}) {
    if (!host) return { refresh: () => {}, getCount: () => 0 };
    ensureStyles();

    const factionId = faction?.id || null;
    let voting = false;        // double-fire lock across all vote buttons
    let count  = 0;

    async function fetchAll() {
        if (!factionId) return [];

        // 1) Request ids where the viewer is in the snapshot pool.
        const { data: poolRows, error: poolErr } = await supabase
            .from('corp_board_request_pool')
            .select('request_id')
            .eq('voter_faction_id', factionId);
        if (poolErr) { console.warn('[board-pi] pool fetch failed:', poolErr.message); return []; }
        const reqIds = (poolRows || []).map(r => r.request_id);
        if (reqIds.length === 0) return [];

        // 2) The pending requests (joined to corp + applicant for display).
        const { data: reqs, error: reqErr } = await supabase
            .from('corp_board_requests')
            .select('id, corp_id, applicant_faction_id, created_tick, expires_tick,'
                  + ' corp:entrepreneur_corps!corp_id(id, name, industry, listing),'
                  + ' applicant:factions!applicant_faction_id(faction_name, leader_first_name, leader_last_name,'
                  + ' ent_influence, ent_skill, ent_reputation)')
            .in('id', reqIds)
            .eq('status', 'pending');
        if (reqErr) { console.warn('[board-pi] requests fetch failed:', reqErr.message); return []; }
        const pending = reqs || [];
        if (pending.length === 0) return [];

        const pendingIds = pending.map(r => r.id);

        // 3) All pool rows for those requests (to compute pool_size per request).
        const { data: allPool, error: allPoolErr } = await supabase
            .from('corp_board_request_pool')
            .select('request_id')
            .in('request_id', pendingIds);
        if (allPoolErr) console.warn('[board-pi] pool-size fetch failed:', allPoolErr.message);
        const poolSize = new Map();
        for (const r of (allPool || [])) {
            poolSize.set(r.request_id, (poolSize.get(r.request_id) || 0) + 1);
        }

        // 4) All votes for those requests (for YES count + whether viewer voted).
        const { data: votes, error: voteErr } = await supabase
            .from('corp_board_request_votes')
            .select('request_id, voter_faction_id, vote')
            .in('request_id', pendingIds);
        if (voteErr) console.warn('[board-pi] votes fetch failed:', voteErr.message);
        const yesCount  = new Map();
        const yourVoted = new Set();
        for (const v of (votes || [])) {
            if (v.vote === true) yesCount.set(v.request_id, (yesCount.get(v.request_id) || 0) + 1);
            if (v.voter_faction_id === factionId) yourVoted.add(v.request_id);
        }

        return pending.map(r => ({
            req: r,
            poolSize:  poolSize.get(r.id)  || 0,
            yesCount:  yesCount.get(r.id)  || 0,
            youVoted:  yourVoted.has(r.id),
            threshold: Math.ceil((poolSize.get(r.id) || 0) * 0.51),
        }));
    }

    function renderCard(state) {
        const { req, poolSize, yesCount, youVoted, threshold } = state;
        const corp = req.corp || {};
        const app  = req.applicant || {};
        const tick = currentTick();
        const ticksLeft = Math.max(0, req.expires_tick - tick);

        const card = document.createElement('div'); card.className = 'bp-card';

        const row1 = document.createElement('div'); row1.className = 'bp-row1';
        const ti = document.createElement('div'); ti.className = 'ti';
        const tiSans = document.createElement('span'); tiSans.textContent = 'Board Application — ';
        const tiEm = document.createElement('em'); tiEm.textContent = corp.name || 'corporation';
        ti.append(tiSans, tiEm);
        const clk = document.createElement('div'); clk.className = 'clock';
        clk.textContent = (ticksLeft <= 0)
            ? 'EXPIRES THIS TICK'
            : `EXPIRES IN ${ticksLeft} TICK${ticksLeft === 1 ? '' : 'S'}`;
        row1.append(ti, clk);

        const ap = document.createElement('div'); ap.className = 'bp-app';
        const apLeft = document.createElement('div');
        const apNm = document.createElement('div'); apNm.className = 'nm'; apNm.textContent = ownerName(app);
        const apRo = document.createElement('div'); apRo.className = 'role'; apRo.textContent = 'WISHES TO JOIN AS DIRECTOR';
        apLeft.append(apNm, apRo);
        const stats = document.createElement('div'); stats.className = 'bp-stats';
        for (const [label, key] of [['REP','ent_reputation'],['INF','ent_influence'],['SKL','ent_skill']]) {
            const s  = document.createElement('div'); s.className = 's';
            const sl = document.createElement('div'); sl.className = 'lab'; sl.textContent = label;
            const sv = document.createElement('div'); sv.className = 'v'; sv.textContent = String(app[key] ?? '—');
            s.append(sl, sv);
            stats.appendChild(s);
        }
        ap.append(apLeft, stats);

        const status = document.createElement('div'); status.className = 'bp-status';
        const left = document.createElement('div');
        const yc = document.createElement('span'); yc.className = 'yc';
        yc.textContent = `${yesCount} of ${poolSize} voted YES`;
        const sep = document.createTextNode(`  ·  needs ${threshold} to accept`);
        left.append(yc, sep);
        const right = document.createElement('div');
        right.textContent = youVoted ? 'You voted' : 'Awaiting your vote';
        status.append(left, right);

        const actions = document.createElement('div'); actions.className = 'bp-actions';
        const yesBtn = document.createElement('button'); yesBtn.className = 'bp-btn yes';
        yesBtn.textContent = 'VOTE YES';
        const noBtn = document.createElement('button'); noBtn.className = 'bp-btn no';
        noBtn.textContent = 'VOTE NO';
        const msg = document.createElement('div'); msg.className = 'bp-msg';
        if (youVoted) { yesBtn.disabled = true; noBtn.disabled = true; yesBtn.textContent = 'VOTED'; }

        // One vote path for both buttons (corp_board_vote takes p_yes).
        // A NO only records the vote — rejection is finalised by the tick
        // processor at expiry — so finalised=true can only come from a YES
        // crossing the accept threshold.
        const castVote = async (pYes, btn) => {
            if (voting || btn.disabled) return;
            voting = true; yesBtn.disabled = true; noBtn.disabled = true;
            const prev = btn.textContent; btn.textContent = 'VOTING…';
            msg.className = 'bp-msg'; msg.textContent = '';
            const unlock = () => {
                voting = false; yesBtn.disabled = false; noBtn.disabled = false;
                btn.textContent = prev;
            };
            try {
                const { data, error } = await supabase.rpc('corp_board_vote',
                    { p_request_id: req.id, p_yes: pYes });
                if (error) throw error;
                if (!data || !data.success) {
                    const RM = {
                        not_authenticated:   'You are not signed in.',
                        no_entrepreneur:     'No entrepreneur faction found.',
                        invalid_arguments:   'Invalid request.',
                        request_not_found:   'Request no longer exists.',
                        request_not_pending: 'This vote has already been finalised.',
                        not_eligible_voter:  "You're not in this vote's pool.",
                        already_voted:       'You have already voted on this.',
                    };
                    msg.className = 'bp-msg err';
                    msg.textContent = RM[data?.reason] || ('Vote failed: ' + (data?.reason || 'unknown'));
                    unlock();
                    return;
                }
                msg.className = 'bp-msg ok';
                msg.textContent = data.finalised
                    ? `Accepted${data.d6 ? ` — share price +${data.d6}%` : ''}. Refreshing…`
                    : 'Vote recorded. Refreshing…';
                setTimeout(() => { voting = false; refresh(); }, 500);
            } catch (e) {
                msg.className = 'bp-msg err';
                msg.textContent = 'Vote failed: ' + (e?.message || e);
                unlock();
            }
        };
        yesBtn.addEventListener('click', () => castVote(true, yesBtn));
        noBtn.addEventListener('click', () => castVote(false, noBtn));
        actions.append(yesBtn, noBtn);

        card.append(row1, ap, status, actions, msg);
        return card;
    }

    async function refresh() {
        const items = await fetchAll();
        count = items.length;
        host.replaceChildren();
        if (items.length === 0) {
            // When showEmpty, the handler owns the empty state so callers
            // don't need to toggle a sibling element. When the page
            // coordinates several handlers in one column it passes
            // showEmpty:false and renders a single shared empty line.
            if (showEmpty) {
                const empty = document.createElement('div');
                empty.className = 'empty';
                empty.textContent = 'No pressing issues.';
                host.appendChild(empty);
            }
        } else {
            for (const it of items) host.appendChild(renderCard(it));
        }
        if (typeof onChange === 'function') {
            try { onChange(items); } catch (e) { console.warn('[board-pi] onChange threw:', e?.message || e); }
        }
    }

    refresh();   // initial mount

    return { refresh, getCount: () => count };
}
