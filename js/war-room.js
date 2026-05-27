// War Room — read-only view of the player's active wars (Phase 1).
//
// Renders, per war the viewer's nation is in: a header (auto-titled "The X–Y
// War" + duration), the three land fronts each as their capital→border→capital
// sector chain coloured by owner with any armies + supply on them, the air-war
// spectrum (war_fronts.air_status, shown from the viewer's POV), and a greyed
// naval row when there's no sea front. Combat numbers/timelines come in Phase 2
// once the combat engine exists — this only reflects state we already store.

import { _supabase } from './supabase-client.js';
import { escapeHtml, escapeAttr, tickToDate } from './utils.js';

let _stylesInjected = false;
let _orderBusy = false;   // guards the inline ASSAULT/DEFEND order buttons
function ensureStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    const css = `
    .wr-empty{padding:40px 20px;text-align:center;color:#666;font-family:var(--font-mono,monospace);font-size:12px;}
    .wr-war{background:#0a0a0a;border:0.5px solid rgba(255,255,255,0.08);border-radius:8px;padding:20px;margin-bottom:18px;}
    .wr-head{text-align:center;margin-bottom:20px;}
    .wr-eyebrow{font-size:10px;letter-spacing:0.2em;color:#7a4a4a;margin-bottom:6px;}
    .wr-title{font-size:24px;font-weight:500;color:#fff;}
    .wr-dates{margin-top:8px;font-size:11px;color:#888;letter-spacing:0.04em;}
    .wr-score{margin-top:8px;font-size:12px;font-weight:700;letter-spacing:0.04em;color:#888;}
    .wr-score .mine{color:#c87a7a;} .wr-score .theirs{color:#7a9aab;}
    .wr-sec{font-size:10px;letter-spacing:0.16em;color:#666;margin:18px 0 10px;padding-bottom:6px;border-bottom:0.5px solid rgba(255,255,255,0.08);}
    .wr-front{background:#0d0d0d;border:0.5px solid rgba(255,255,255,0.08);border-radius:5px;padding:12px 14px;margin-bottom:10px;}
    .wr-front-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;}
    .wr-front-name{font-size:13px;font-weight:600;color:#fff;}
    .wr-front-sub{font-size:9px;letter-spacing:0.06em;color:#666;}
    .wr-chain{display:flex;gap:4px;overflow-x:auto;padding-bottom:4px;}
    .wr-cell{flex:1;min-width:78px;background:#111;border:0.5px solid rgba(255,255,255,0.08);border-radius:4px;padding:8px;border-top-width:3px;}
    .wr-cell.mine{border-top-color:#c87a7a;}
    .wr-cell.theirs{border-top-color:#7a9aab;}
    .wr-cell.cap{background:#161013;}
    .wr-cell.contested{box-shadow:inset 0 0 0 1px rgba(200,158,110,0.6);}
    .wr-cell .cn{font-size:11px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .wr-cell .ct{font-size:8px;letter-spacing:0.08em;color:#777;margin-top:2px;}
    .wr-cell .cm{font-size:7px;letter-spacing:0.1em;margin-top:4px;}
    .wr-cell .cm.cap{color:#c89e6e;} .wr-cell .cm.border{color:#c87a7a;}
    .wr-army{font-size:9px;margin-top:5px;display:flex;align-items:center;gap:4px;}
    .wr-army .dot{width:6px;height:6px;border-radius:50%;flex:none;}
    .wr-army.mine .dot{background:#c87a7a;} .wr-army.theirs .dot{background:#7a9aab;}
    .wr-army .nm{color:#bbb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .wr-army .sup{margin-left:auto;font-weight:700;flex:none;}
    .wr-army .sup.ok{color:#46c46a;} .wr-army .sup.short{color:#e5534b;}
    .wr-spectrum{display:flex;border-radius:4px;overflow:hidden;border:0.5px solid rgba(255,255,255,0.08);}
    .wr-seg{flex:1;padding:8px 6px;text-align:center;font-size:9px;letter-spacing:0.03em;color:#666;border-right:0.5px solid rgba(255,255,255,0.05);}
    .wr-seg:last-child{border-right:none;}
    .wr-seg.you{background:#1f1313;color:#c87a7a;} .wr-seg.them{background:#11181f;color:#7a9aab;}
    .wr-seg.active{font-weight:700;box-shadow:inset 0 0 0 1px currentColor;}
    .wr-naval{background:#0d0d0d;border:0.5px solid rgba(255,255,255,0.08);border-radius:5px;padding:12px 14px;opacity:0.45;font-size:11px;color:#888;}
    .wr-orders{display:flex;align-items:center;gap:6px;margin-top:10px;}
    .wr-ord-lab{font-size:8px;letter-spacing:0.12em;color:#666;margin-right:4px;}
    .wr-ord{font-size:9px;font-weight:700;letter-spacing:0.06em;padding:5px 12px;border-radius:3px;cursor:pointer;background:transparent;border:0.5px solid rgba(255,255,255,0.15);color:#888;font-family:inherit;}
    .wr-ord:hover{border-color:rgba(255,255,255,0.3);}
    .wr-ord.on{border-color:#b6533f;background:rgba(182,83,63,0.14);color:#e0a090;}`;
    const el = document.createElement('style');
    el.id = 'war-room-styles';
    el.textContent = css;
    document.head.appendChild(el);
}

// air_status is stored from nation_a's POV (a_domination … b_domination). Render
// the spectrum from the VIEWER's POV: their side always on the left.
const AIR_INDEX = { a_domination: 0, a_superiority: 1, contested: 2, b_superiority: 3, b_domination: 4 };

export async function mountWarRoom(container, nation) {
    if (!container) return;
    ensureStyles();
    if (!nation?.id) { container.innerHTML = `<div class="wr-empty">No nation context.</div>`; return; }
    container.innerHTML = `<div class="wr-empty">Loading wars…</div>`;

    let wars = [];
    try {
        const { data, error } = await _supabase.from('diplomatic_relations')
            .select('nation_a_id, nation_b_id, war_declared_at_tick, war_justification, war_score_a, war_score_b')
            .eq('relation_type', 'war')
            .or(`nation_a_id.eq.${nation.id},nation_b_id.eq.${nation.id}`);
        if (error) throw error;
        wars = data || [];
    } catch (e) {
        console.warn('[war-room] load failed:', e?.message || e);
        container.innerHTML = `<div class="wr-empty">Could not load wars.</div>`;
        return;
    }
    if (!wars.length) {
        container.innerHTML = `<div class="wr-empty">No active wars. When a state of war exists, it appears here.</div>`;
        return;
    }

    try {
        const enemyIds = [...new Set(wars.map(w => w.nation_a_id === nation.id ? w.nation_b_id : w.nation_a_id))];
        const { data: nats } = await _supabase.from('nations').select('id, name').in('id', enemyIds);
        const nameById = new Map((nats || []).map(n => [n.id, n.name]));

        // Order controls show only if THIS user commands this nation's army
        // faction; set_front_action remains the server-side authority. Isolated
        // so a failed command check just hides the buttons, never blanks the room.
        let commandable = false;
        try {
            const { data: auth } = await _supabase.auth.getUser();
            const uid = auth?.user?.id;
            if (uid) {
                const { data: myArmy } = await _supabase.from('factions').select('id')
                    .eq('faction_type', 'military').eq('branch', 'army').eq('nation_id', nation.id)
                    .or(`id.eq.${uid},linked_user_id.eq.${uid}`).limit(1);
                commandable = !!(myArmy && myArmy.length);
            }
        } catch (e) {
            console.warn('[war-room] command check failed:', e?.message || e);
        }

        const blocks = [];
        for (const w of wars) blocks.push(await renderWar(w, nation, nameById, commandable));
        container.innerHTML = blocks.join('');

        // Inline ASSAULT/DEFEND order buttons → set_front_action, then re-mount.
        container.onclick = async (e) => {
            const btn = e.target.closest('[data-wr-order]');
            if (!btn || _orderBusy) return;
            const [frontId, action] = btn.getAttribute('data-wr-order').split('|');
            _orderBusy = true;
            try {
                const { data, error } = await _supabase.rpc('set_front_action', { p_front_id: frontId, p_action: action });
                if (error || (data && data.success === false)) {
                    console.warn('[war-room] set order failed:', (data && data.error) || error?.message);
                }
            } catch (ex) {
                console.warn('[war-room] set order failed:', ex?.message || ex);
            } finally {
                _orderBusy = false;
            }
            mountWarRoom(container, nation);
        };
    } catch (e) {
        console.warn('[war-room] render failed:', e?.message || e);
        container.innerHTML = `<div class="wr-empty">Could not render the war room.</div>`;
    }
}

async function renderWar(w, nation, nameById, commandable) {
    const a = w.nation_a_id, b = w.nation_b_id;   // canonical (a<b)
    const enemyId = a === nation.id ? b : a;
    const enemyName = nameById.get(enemyId) || 'the enemy';
    const youAreA = nation.id === a;

    const { data: fronts } = await _supabase.from('war_fronts')
        .select('id, front_type, label, sector_count, air_status, line_position, action_a, action_b')
        .eq('nation_a_id', a).eq('nation_b_id', b);
    const land = (fronts || []).filter(f => f.front_type === 'land').sort((x, y) => String(x.label).localeCompare(String(y.label)));
    const air = (fronts || []).find(f => f.front_type === 'air');
    const hasSea = (fronts || []).some(f => f.front_type === 'sea');

    // Sectors of the land fronts + capital nodes (front_id NULL) for the two
    // nations, plus the armies on each front (placed at the line, not a sector).
    const landIds = land.map(f => f.id);
    const sectorsByFront = new Map();
    const armiesByFront = new Map();   // front_id → { a:[], b:[] }
    let capByNation = new Map();
    if (landIds.length) {
        const { data: secs } = await _supabase.from('war_sectors')
            .select('id, front_id, position, name, type, nation_id, is_capital, is_border, is_capital_adjacent')
            .in('front_id', landIds);
        for (const s of (secs || [])) {
            if (!sectorsByFront.has(s.front_id)) sectorsByFront.set(s.front_id, []);
            sectorsByFront.get(s.front_id).push(s);
        }
        for (const arr of sectorsByFront.values()) arr.sort((x, y) => (x.position || 0) - (y.position || 0));

        const { data: caps } = await _supabase.from('war_sectors')
            .select('id, name, type, nation_id, is_capital')
            .is('front_id', null).eq('is_capital', true).in('nation_id', [a, b]);
        capByNation = new Map((caps || []).map(c => [c.nation_id, c]));

        const { data: arms } = await _supabase.from('armies')
            .select('id, name, nation_id, assigned_front_id, supply_balance')
            .in('assigned_front_id', landIds);
        for (const f of land) armiesByFront.set(f.id, { a: [], b: [] });
        for (const ar of (arms || [])) {
            const bucket = armiesByFront.get(ar.assigned_front_id);
            if (bucket) (ar.nation_id === a ? bucket.a : bucket.b).push(ar);
        }
    }

    // The chain is always laid out nation_a (left) → nation_b (right); label it
    // in that same order so a nation_b viewer isn't mis-oriented.
    const leftName = youAreA ? nation.name : enemyName;
    const rightName = youAreA ? enemyName : nation.name;

    // Land fronts. Ownership/contested are derived from the live line_position
    // (sectors 1..line = nation_a, the rest = nation_b); fall back to each
    // sector's static owner before combat has initialised the line.
    const actionLabel = (x) => x === 'assault' ? 'ASSAULT' : 'DEFEND';
    const frontsHtml = land.length ? land.map(f => {
        const secs = sectorsByFront.get(f.id) || [];
        const N = Number(f.sector_count) || secs.length;
        const line = (f.line_position === null || f.line_position === undefined) ? null : Number(f.line_position);
        const controllerOf = (s) => line === null ? s.nation_id : (s.position <= line ? a : b);
        const contestedAt = (p) => line !== null && (p === line || p === line + 1);
        // Each side's armies sit at its frontline sector (a at `line`, b at line+1).
        const fa = armiesByFront.get(f.id) || { a: [], b: [] };
        const armiesAt = (p) => line === null ? [] : (p === line ? fa.a : p === line + 1 ? fa.b : []);

        const cells = [];
        const capA = capByNation.get(a), capB = capByNation.get(b);
        if (capA) cells.push(cellHtml(capA, nation, [], true, line !== null && line <= 0 ? b : a, false));
        for (const s of secs) cells.push(cellHtml(s, nation, armiesAt(s.position), false, controllerOf(s), contestedAt(s.position)));
        if (capB) cells.push(cellHtml(capB, nation, [], true, line !== null && line >= N ? a : b, false));

        // Your side's order (set_front_action picks the side from the army faction).
        const myAction = (youAreA ? f.action_a : f.action_b) === 'assault' ? 'assault' : 'defend';
        const orders = commandable ? `<div class="wr-orders">
                <span class="wr-ord-lab">YOUR ORDERS</span>
                <button class="wr-ord ${myAction === 'assault' ? 'on' : ''}" data-wr-order="${escapeAttr(f.id)}|assault">ASSAULT</button>
                <button class="wr-ord ${myAction === 'defend' ? 'on' : ''}" data-wr-order="${escapeAttr(f.id)}|defend">DEFEND</button>
            </div>` : '';

        return `<div class="wr-front">
            <div class="wr-front-head"><span class="wr-front-name">Front ${escapeHtml(f.label || '')}</span><span class="wr-front-sub">${N} sectors · ${escapeHtml(leftName)} ${actionLabel(f.action_a)} ← → ${actionLabel(f.action_b)} ${escapeHtml(rightName)}</span></div>
            <div class="wr-chain">${cells.join('')}</div>
            ${orders}
        </div>`;
    }).join('') : `<div class="wr-empty">No land fronts generated for this war yet.</div>`;

    // Air spectrum (viewer POV)
    const rawIdx = air ? (AIR_INDEX[air.air_status] ?? 2) : 2;
    const activeIdx = youAreA ? rawIdx : 4 - rawIdx;
    const segLabels = [`${nation.name} Domination`, `${nation.name} Superiority`, 'Contested', `${enemyName} Superiority`, `${enemyName} Domination`];
    const segClass = ['you', 'you', '', 'them', 'them'];
    const airHtml = `<div class="wr-spectrum">${segLabels.map((l, i) =>
        `<div class="wr-seg ${segClass[i]} ${i === activeIdx ? 'active' : ''}">${escapeHtml(l)}</div>`).join('')}</div>`;

    const navalHtml = hasSea ? '' : `<div class="wr-naval">⚓ Naval War — no contested coastline; not applicable to this war.</div>`;

    const myScore = youAreA ? (Number(w.war_score_a) || 0) : (Number(w.war_score_b) || 0);
    const enemyScore = youAreA ? (Number(w.war_score_b) || 0) : (Number(w.war_score_a) || 0);
    return `<div class="wr-war">
        <div class="wr-head">
            <div class="wr-eyebrow">— ACTIVE CONFLICT —</div>
            <div class="wr-title">The ${escapeHtml(nation.name)}–${escapeHtml(enemyName)} War</div>
            <div class="wr-dates">Began ${escapeHtml(tickToDate(Number(w.war_declared_at_tick)) || '—')}${w.war_justification ? ` · ${escapeHtml(w.war_justification)}` : ''}</div>
            <div class="wr-score">Conquest Points — <span class="mine">${escapeHtml(nation.name)} ${myScore}</span> · <span class="theirs">${escapeHtml(enemyName)} ${enemyScore}</span></div>
        </div>
        <div class="wr-sec">LAND FRONTS</div>
        ${frontsHtml}
        <div class="wr-sec">AIR WAR</div>
        ${airHtml}
        <div class="wr-sec">NAVAL</div>
        ${navalHtml || '<div class="wr-naval">⚓ Naval War — active sea front.</div>'}
    </div>`;
}

function cellHtml(s, nation, armies, isCapital, controllerId, contested) {
    const mine = (controllerId !== undefined ? controllerId : s.nation_id) === nation.id;
    const marker = s.is_capital ? `<div class="cm cap">★ CAPITAL</div>`
        : contested ? `<div class="cm border">⚔ FRONT LINE</div>`
        : s.is_capital_adjacent ? `<div class="cm">⌂ REAR</div>` : '';
    const armiesHtml = (armies || []).map(ar => {
        const am = ar.nation_id === nation.id;
        const sb = ar.supply_balance;
        const sup = (sb === null || sb === undefined) ? ''
            : (Number(sb) < 0 ? `<span class="sup short">⚠${Number(sb)}</span>` : `<span class="sup ok">+${Number(sb)}</span>`);
        return `<div class="wr-army ${am ? 'mine' : 'theirs'}"><span class="dot"></span><span class="nm">${escapeHtml(ar.name || 'Army')}</span>${sup}</div>`;
    }).join('');
    return `<div class="wr-cell ${mine ? 'mine' : 'theirs'} ${isCapital ? 'cap' : ''} ${contested ? 'contested' : ''}">
        <div class="cn">${escapeHtml(s.name || '—')}</div>
        <div class="ct">${escapeHtml((s.type || '').toUpperCase())}</div>
        ${marker}
        ${armiesHtml}
    </div>`;
}
