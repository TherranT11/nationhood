// War Room — read-only view of the player's active wars (Phase 1).
//
// Renders, per war the viewer's nation is in: a header (auto-titled "The X–Y
// War" + duration), the three land fronts each as the contested front-line
// pair plus a three-column engagement panel (Forces · Combat Events · Forces),
// the air-war spectrum (war_fronts.air_status, shown from the viewer's POV),
// and a greyed naval row when there's no sea front. The Combat Events column
// is stubbed empty until the Phase 2 combat resolver writes into a per-tick
// event log; everything else reflects state we already store.

import { _supabase } from './supabase-client.js';
import { escapeHtml, escapeAttr, tickToDate } from './utils.js';
import { auComposition } from './create-unit.js';

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
    .wr-cf{margin:0 0 18px;padding:13px 16px;border-radius:6px;background:#1a160d;border:0.5px solid rgba(200,158,110,0.4);text-align:left;}
    .wr-cf.pending{background:#12120c;border-color:rgba(200,158,110,0.25);color:#c4a86a;font-size:12px;}
    .wr-cf .wr-cf-t{font-size:12px;color:#d4b87a;line-height:1.5;}
    .wr-cf .wr-cf-acts{display:flex;gap:8px;margin-top:11px;}
    .wr-cf-btn{font-family:inherit;cursor:pointer;font-size:11px;letter-spacing:0.05em;padding:8px 15px;border-radius:4px;border:0.5px solid;}
    .wr-cf-btn.accept{background:#0e1610;border-color:rgba(138,170,106,0.5);color:#8aaa6a;}
    .wr-cf-btn.reject{background:#160e0e;border-color:rgba(200,122,122,0.45);color:#c87a7a;}
    .wr-sec{font-size:10px;letter-spacing:0.16em;color:#666;margin:18px 0 10px;padding-bottom:6px;border-bottom:0.5px solid rgba(255,255,255,0.08);}
    .wr-front{background:#0d0d0d;border:0.5px solid rgba(255,255,255,0.08);border-radius:6px;padding:18px 20px;margin-bottom:14px;}
    .wr-front-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px;flex-wrap:wrap;gap:6px;}
    .wr-front-name{font-size:15px;font-weight:600;color:#fff;letter-spacing:0.02em;}
    .wr-front-sub{font-size:10px;letter-spacing:0.06em;color:#888;}
    .wr-clash{display:flex;gap:14px;align-items:stretch;justify-content:center;margin-bottom:14px;}
    .wr-cell-big{flex:1;max-width:300px;min-width:0;background:#111;border:0.5px solid rgba(255,255,255,0.08);border-radius:5px;padding:14px 16px;border-top-width:3px;}
    .wr-cell-big.mine{border-top-color:#c87a7a;}
    .wr-cell-big.theirs{border-top-color:#7a9aab;}
    .wr-cell-big .cn{font-size:14px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .wr-cell-big .ct{font-size:9px;letter-spacing:0.1em;color:#888;margin-top:4px;}
    .wr-cell-big .cm{font-size:8px;letter-spacing:0.14em;margin-top:8px;color:#c87a7a;font-weight:700;}
    .wr-clash-vs{align-self:center;font-size:20px;color:#c89e6e;flex:none;padding:0 2px;}
    .wr-engagement{display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:10px;margin-top:6px;}
    .wr-force-col,.wr-events-col{background:#0a0a0a;border:0.5px solid rgba(255,255,255,0.08);border-radius:5px;padding:12px;min-height:130px;}
    .wr-force-col.mine{border-top:2px solid #c87a7a;}
    .wr-force-col.theirs{border-top:2px solid #7a9aab;}
    .wr-events-col{border-top:2px solid #c89e6e;}
    .wr-force-head,.wr-events-head{font-size:9px;letter-spacing:0.14em;color:#888;margin-bottom:10px;text-transform:uppercase;font-weight:700;}
    .wr-army-card{padding:9px 10px;background:#111;border:0.5px solid rgba(255,255,255,0.06);border-radius:3px;margin-bottom:7px;}
    .wr-army-card:last-child{margin-bottom:0;}
    .wr-army-card .nm{font-size:11px;font-weight:600;color:#fff;}
    .wr-army-card .meta{font-size:8px;letter-spacing:0.06em;color:#888;margin-top:3px;text-transform:uppercase;}
    .wr-army-card .meta .sup{margin-left:6px;font-weight:700;}
    .wr-army-card .meta .sup.ok{color:#46c46a;} .wr-army-card .meta .sup.short{color:#e5534b;}
    .wr-army-card .unit-row{font-size:9px;color:#aaa;margin-top:5px;padding:3px 0 3px 8px;border-left:1px solid rgba(255,255,255,0.08);}
    .wr-army-card .unit-row .u-nm{color:#ccc;}
    .wr-army-card .unit-row .u-comp{color:#888;}
    .wr-events-empty{font-size:10px;color:#666;text-align:center;padding:24px 10px;font-style:italic;line-height:1.6;}
    @media (max-width:720px){
        .wr-front{padding:14px;}
        .wr-clash{flex-direction:column;align-items:stretch;gap:8px;}
        .wr-cell-big{max-width:100%;}
        .wr-clash-vs{align-self:center;padding:2px 0;}
        .wr-engagement{grid-template-columns:1fr;gap:8px;}
    }
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

    // ceasefire_offer_nation_id lands with the ceasefire migration; fall back to
    // the core columns if it isn't applied yet so the room never blanks.
    let wars = [];
    const WAR_CORE = 'nation_a_id, nation_b_id, war_declared_at_tick, war_justification, war_score_a, war_score_b';
    for (const cols of [WAR_CORE + ', ceasefire_offer_nation_id', WAR_CORE]) {
        const { data, error } = await _supabase.from('diplomatic_relations')
            .select(cols)
            .eq('relation_type', 'war')
            .or(`nation_a_id.eq.${nation.id},nation_b_id.eq.${nation.id}`);
        if (!error) { wars = data || []; break; }
        console.warn('[war-room] load failed, trying narrower columns:', error.message);
        if (cols === WAR_CORE) { container.innerHTML = `<div class="wr-empty">Could not load wars.</div>`; return; }
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

        // Only the viewer's head of government may accept/reject a ceasefire.
        let isHoG = false;
        try {
            const { data: gov } = await _supabase.rpc('dispute_actor_nation');
            isHoG = !!gov && gov === nation.id;
        } catch (e) {
            console.warn('[war-room] HoG check failed:', e?.message || e);
        }

        const blocks = [];
        for (const w of wars) blocks.push(await renderWar(w, nation, nameById, commandable, isHoG));
        container.innerHTML = blocks.join('');

        // Inline ASSAULT/DEFEND order buttons → set_front_action, then re-mount.
        container.onclick = async (e) => {
            // Ceasefire accept/reject (the enemy's head of government).
            const cf = e.target.closest('[data-ceasefire]');
            if (cf && !_orderBusy) {
                const [act, otherId] = cf.getAttribute('data-ceasefire').split('|');
                _orderBusy = true;
                try {
                    const { data, error } = await _supabase.rpc('respond_ceasefire', { p_other_nation_id: otherId, p_accept: act === 'accept' });
                    if (error || (data && data.ok === false)) console.warn('[war-room] ceasefire failed:', (data && data.message) || error?.message);
                } catch (ex) {
                    console.warn('[war-room] ceasefire failed:', ex?.message || ex);
                } finally {
                    _orderBusy = false;
                }
                mountWarRoom(container, nation);
                return;
            }
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

async function renderWar(w, nation, nameById, commandable, isHoG) {
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

    // Sectors of the land fronts + the armies assigned to each front. Capital
    // nodes are no longer fetched — the engagement layout only shows the two
    // contested sectors, and capital ownership is reflected by the war score.
    const landIds = land.map(f => f.id);
    const sectorsByFront = new Map();
    const armiesByFront = new Map();   // front_id → { a:[], b:[] }
    const unitsByArmy = new Map();     // army_id → [unit, ...]
    if (landIds.length) {
        const { data: secs } = await _supabase.from('war_sectors')
            .select('id, front_id, position, name, type, nation_id, is_border')
            .in('front_id', landIds);
        for (const s of (secs || [])) {
            if (!sectorsByFront.has(s.front_id)) sectorsByFront.set(s.front_id, []);
            sectorsByFront.get(s.front_id).push(s);
        }
        for (const arr of sectorsByFront.values()) arr.sort((x, y) => (x.position || 0) - (y.position || 0));

        const { data: arms } = await _supabase.from('armies')
            .select('id, name, nation_id, army_type, assigned_front_id, supply_balance')
            .in('assigned_front_id', landIds);
        for (const f of land) armiesByFront.set(f.id, { a: [], b: [] });
        for (const ar of (arms || [])) {
            const bucket = armiesByFront.get(ar.assigned_front_id);
            if (bucket) (ar.nation_id === a ? bucket.a : bucket.b).push(ar);
        }

        // Active units per army for the Forces columns. Forming/Decommissioned
        // are skipped — only deployed strength belongs on the engagement panel.
        const armyIds = (arms || []).map(ar => ar.id);
        if (armyIds.length) {
            const { data: units } = await _supabase.from('army_units')
                .select('id, name, brigades, total_manpower, status, army_id')
                .in('army_id', armyIds)
                .eq('status', 'Active');
            for (const u of (units || [])) {
                if (!unitsByArmy.has(u.army_id)) unitsByArmy.set(u.army_id, []);
                unitsByArmy.get(u.army_id).push(u);
            }
        }
    }

    // The engagement is always laid out nation_a (left) → nation_b (right);
    // label it in that same order so a nation_b viewer isn't mis-oriented.
    const leftName = youAreA ? nation.name : enemyName;
    const rightName = youAreA ? enemyName : nation.name;

    // Land fronts. Each front now focuses on the active engagement: the pair of
    // contested sectors at the dividing line (picked from line_position once
    // combat is live, or from the static is_border flag before initialisation),
    // followed by a three-column panel — Forces of nation_a · Combat Events ·
    // Forces of nation_b — with the events column stubbed until the resolver
    // lands. Rear sectors and capitals were dropped from this view; the
    // territorial-control summary lives in the header score line.
    const actionLabel = (x) => x === 'assault' ? 'ASSAULT' : 'DEFEND';
    const frontsHtml = land.length ? land.map(f => {
        const secs = sectorsByFront.get(f.id) || [];
        const N = Number(f.sector_count) || secs.length;
        const line = (f.line_position === null || f.line_position === undefined) ? null : Number(f.line_position);
        const controllerOf = (s) => line === null ? s.nation_id : (s.position <= line ? a : b);
        const fa = armiesByFront.get(f.id) || { a: [], b: [] };

        // The contested pair: by live line_position if set, else by is_border
        // (the static dividing pair seeded at war start). Layout is always
        // nation_a on the left so the geographic metaphor matches the chain
        // convention that the header score line still uses.
        let leftSec  = null, rightSec = null;
        if (line !== null) {
            leftSec  = secs.find(s => s.position === line) || null;
            rightSec = secs.find(s => s.position === line + 1) || null;
        } else {
            const aBorders = secs.filter(s => s.is_border && s.nation_id === a);
            const bBorders = secs.filter(s => s.is_border && s.nation_id === b);
            leftSec  = aBorders[aBorders.length - 1] || null;
            rightSec = bBorders[0] || null;
        }

        const clashHtml = (leftSec && rightSec) ? `<div class="wr-clash">
                ${bigCellHtml(leftSec, nation, controllerOf(leftSec))}
                <div class="wr-clash-vs">⚔</div>
                ${bigCellHtml(rightSec, nation, controllerOf(rightSec))}
            </div>` : `<div class="wr-events-empty" style="padding:14px;">Front line not yet established for this front.</div>`;

        const engagementHtml = `<div class="wr-engagement">
            ${forcesColumnHtml(leftName, fa.a, unitsByArmy, youAreA)}
            ${eventsColumnHtml()}
            ${forcesColumnHtml(rightName, fa.b, unitsByArmy, !youAreA)}
        </div>`;

        // Your side's order (set_front_action picks the side from the army faction).
        const myAction = (youAreA ? f.action_a : f.action_b) === 'assault' ? 'assault' : 'defend';
        const orders = commandable ? `<div class="wr-orders">
                <span class="wr-ord-lab">YOUR ORDERS</span>
                <button class="wr-ord ${myAction === 'assault' ? 'on' : ''}" data-wr-order="${escapeAttr(f.id)}|assault">ASSAULT</button>
                <button class="wr-ord ${myAction === 'defend' ? 'on' : ''}" data-wr-order="${escapeAttr(f.id)}|defend">DEFEND</button>
            </div>` : '';

        return `<div class="wr-front">
            <div class="wr-front-head"><span class="wr-front-name">Front ${escapeHtml(f.label || '')}</span><span class="wr-front-sub">${N} sectors · ${escapeHtml(leftName)} ${actionLabel(f.action_a)} ← → ${actionLabel(f.action_b)} ${escapeHtml(rightName)}</span></div>
            ${clashHtml}
            ${engagementHtml}
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

    // Ceasefire offer (white peace). Offerer's nation sees a pending note; the
    // enemy's head of government gets accept/reject; their other factions wait.
    let ceasefireHtml = '';
    const offerer = w.ceasefire_offer_nation_id || null;
    if (offerer === nation.id) {
        ceasefireHtml = `<div class="wr-cf pending">You have requested a ceasefire — awaiting ${escapeHtml(enemyName)}'s head of government.</div>`;
    } else if (offerer === enemyId) {
        ceasefireHtml = isHoG
            ? `<div class="wr-cf"><div class="wr-cf-t">${escapeHtml(enemyName)} has requested a <b>ceasefire</b> — white peace: the fighting stops and the front line holds where it stands. Accept to end the war.</div>`
              + `<div class="wr-cf-acts"><button type="button" class="wr-cf-btn accept" data-ceasefire="accept|${escapeHtml(enemyId)}">Accept ceasefire</button>`
              + `<button type="button" class="wr-cf-btn reject" data-ceasefire="reject|${escapeHtml(enemyId)}">Reject</button></div></div>`
            : `<div class="wr-cf pending">${escapeHtml(enemyName)} has requested a ceasefire — awaiting your head of government.</div>`;
    }

    return `<div class="wr-war">
        <div class="wr-head">
            <div class="wr-eyebrow">— ACTIVE CONFLICT —</div>
            <div class="wr-title">The ${escapeHtml(nation.name)}–${escapeHtml(enemyName)} War</div>
            <div class="wr-dates">Began ${escapeHtml(tickToDate(Number(w.war_declared_at_tick)) || '—')}${w.war_justification ? ` · ${escapeHtml(w.war_justification)}` : ''}</div>
            <div class="wr-score">Conquest Points — <span class="mine">${escapeHtml(nation.name)} ${myScore}</span> · <span class="theirs">${escapeHtml(enemyName)} ${enemyScore}</span></div>
        </div>
        ${ceasefireHtml}
        <div class="wr-sec">LAND FRONTS</div>
        ${frontsHtml}
        <div class="wr-sec">AIR WAR</div>
        ${airHtml}
        <div class="wr-sec">NAVAL</div>
        ${navalHtml || '<div class="wr-naval">⚓ Naval War — active sea front.</div>'}
    </div>`;
}

function bigCellHtml(s, nation, controllerId) {
    const mine = controllerId === nation.id;
    return `<div class="wr-cell-big ${mine ? 'mine' : 'theirs'}">
        <div class="cn">${escapeHtml(s.name || '—')}</div>
        <div class="ct">${escapeHtml((s.type || '').toUpperCase())}</div>
        <div class="cm">⚔ FRONT LINE</div>
    </div>`;
}

function forcesColumnHtml(nationName, armies, unitsByArmy, isMine) {
    const cards = (armies || []).map(ar => {
        const sb = ar.supply_balance;
        const sup = (sb === null || sb === undefined) ? ''
            : (Number(sb) < 0
                ? `<span class="sup short">⚠ ${Number(sb)}</span>`
                : `<span class="sup ok">+${Number(sb)}</span>`);
        const armyType = String(ar.army_type || 'regular').replace(/^./, c => c.toUpperCase());
        const units = unitsByArmy.get(ar.id) || [];
        const unitsHtml = units.length
            ? units.map(u => `<div class="unit-row">
                    <span class="u-nm">${escapeHtml(u.name || 'Unit')}</span>
                    <span class="u-comp"> — ${escapeHtml(auComposition(u.brigades))}</span>
                </div>`).join('')
            : `<div class="unit-row" style="opacity:0.55;">No active units</div>`;
        return `<div class="wr-army-card">
            <div class="nm">${escapeHtml(ar.name || 'Army')}</div>
            <div class="meta">${escapeHtml(armyType)}${sup}</div>
            ${unitsHtml}
        </div>`;
    }).join('');
    const body = cards || `<div class="wr-events-empty" style="padding:14px 6px;">No forces assigned to this front.</div>`;
    return `<div class="wr-force-col ${isMine ? 'mine' : 'theirs'}">
        <div class="wr-force-head">Forces of ${escapeHtml(nationName)}</div>
        ${body}
    </div>`;
}

function eventsColumnHtml() {
    // Phase 2 combat resolver will write into combat_events; until then,
    // this column is intentionally empty so the layout is in place when
    // the data lands.
    return `<div class="wr-events-col">
        <div class="wr-events-head">Combat Events</div>
        <div class="wr-events-empty">No engagements logged.<br/>Awaiting combat resolution.</div>
    </div>`;
}
