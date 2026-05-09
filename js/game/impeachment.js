/**
 * impeachment.js — Shared impeachment trigger flow.
 *
 * Extracted from government.html so the action can be invoked from
 * any page that has the necessary context. Owns the charge
 * pre-checks, the charge-selection modal, and all of the writes
 * required to file an impeachment_motion bill: impeachment_proceedings
 * row, bill row, motion_bill_id link, race guard, auto-cast YES vote,
 * event_log row, and final redirect to the bill page.
 *
 * Resolution side (motion → trial → conviction) lives in
 * js/game/bills.js (resolveImpeachmentMotionBill) and the tick
 * processor — this module only handles the trigger.
 */

import { GAME_CONFIG } from './config.js';

/**
 * Build the list of impeachment charges with availability flags.
 * Pure-fetch — takes nation + president as args so callers don't
 * have to thread page-local state through.
 *
 * Returns an array of { type, label, available, reason }.
 */
export async function buildImpeachmentCharges(supabase, nation, president) {
    const charges = [];

    // 1. Abuse of Power — presidential overreach ≥ threshold
    const overreachCount = nation.overreach_count ?? 0;
    const abuseAvail = overreachCount >= GAME_CONFIG.IMPEACHMENT_ABUSE_OVERREACH_THRESHOLD;
    charges.push({
        type: 'abuse_of_power',
        label: 'Abuse of Power',
        available: abuseAvail,
        reason: abuseAvail ? '' : `Requires presidential overreach ≥ ${GAME_CONFIG.IMPEACHMENT_ABUSE_OVERREACH_THRESHOLD} (currently ${overreachCount})`,
    });

    // 2. Gross Incompetence — unlocks via either path:
    //    (a) gov_approval ≤ threshold for N consecutive ticks (chronic
    //        unpopularity), or
    //    (b) the president's own party has gone inactive — abandoned,
    //        detached from its nation, or banned. A head of state with
    //        no functioning party machinery is structurally unfit to
    //        govern; "incompetence" is the natural ground.
    const govApproval = nation.gov_approval ?? 40;
    const requiredTicks = GAME_CONFIG.IMPEACHMENT_INCOMPETENCE_TICKS;

    let partyInactive = false;
    let partyInactiveDetail = '';
    if (president && president.faction_id) {
        const { data: prezParty } = await supabase
            .from('factions')
            .select('nation_id, abandoned_at, is_banned')
            .eq('id', president.faction_id)
            .maybeSingle();
        if (prezParty) {
            if (prezParty.abandoned_at)      { partyInactive = true; partyInactiveDetail = 'abandoned'; }
            else if (!prezParty.nation_id)   { partyInactive = true; partyInactiveDetail = 'unassigned to any nation'; }
            else if (prezParty.is_banned)    { partyInactive = true; partyInactiveDetail = 'banned'; }
        }
    }

    let approvalPath = false;
    let consecutiveCount = 0;
    if (govApproval <= GAME_CONFIG.IMPEACHMENT_INCOMPETENCE_THRESHOLD) {
        const { data: history } = await supabase
            .from('nations_history')
            .select('tick, gov_approval')
            .eq('nation_id', nation.id)
            .order('tick', { ascending: false })
            .limit(requiredTicks);
        consecutiveCount = (history || []).filter(h => h.gov_approval <= GAME_CONFIG.IMPEACHMENT_INCOMPETENCE_THRESHOLD).length;
        approvalPath = history && history.length >= requiredTicks && consecutiveCount >= requiredTicks;
    }

    const incompAvail = partyInactive || approvalPath;
    let incompLabel = 'Gross Incompetence';
    let incompReason = '';
    if (incompAvail) {
        if (partyInactive) {
            incompLabel = `Gross Incompetence (party ${partyInactiveDetail})`;
        }
    } else {
        incompReason = `Requires gov approval ≤ ${GAME_CONFIG.IMPEACHMENT_INCOMPETENCE_THRESHOLD} for ${requiredTicks} consecutive ticks (${consecutiveCount}/${requiredTicks} met, currently ${Math.round(govApproval)}), or the president's party to become inactive`;
    }
    charges.push({
        type: 'incompetence',
        label: incompLabel,
        available: incompAvail,
        reason: incompReason,
    });

    // 3. Constitutional Violation — president has vetoed N+ bills with ⅔ support
    let vetoAbuseCount = 0;
    if (president) {
        const { data: vetoedBills } = await supabase
            .from('bills')
            .select('id, bill_support(stance, seat_count)')
            .eq('nation_id', nation.id)
            .eq('president_action', 'vetoed')
            .gte('president_action_tick', president.elected_tick || 0);
        const supermajoritySeats = Math.ceil(GAME_CONFIG.TOTAL_SEATS * (2 / 3));
        for (const bill of (vetoedBills || [])) {
            let votesFor = 0;
            for (const s of (bill.bill_support || [])) {
                const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
                if (stance === 'yes') votesFor += (s.seat_count || 0);
            }
            if (votesFor >= supermajoritySeats) vetoAbuseCount++;
        }
    }
    const constViolAvail = vetoAbuseCount >= GAME_CONFIG.IMPEACHMENT_VETO_ABUSE_COUNT;
    charges.push({
        type: 'constitutional_violation',
        label: 'Constitutional Violation',
        available: constViolAvail,
        reason: constViolAvail ? '' : `Requires ≥ ${GAME_CONFIG.IMPEACHMENT_VETO_ABUSE_COUNT} vetoed bills with ⅔ support (currently ${vetoAbuseCount})`,
    });

    return charges;
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

/**
 * Run the full impeachment trigger flow: pre-flight checks, charge
 * selection modal, all DB writes, redirect. Returns
 * { ok: boolean, billId? } so the caller can update its UI.
 *
 * ctx: { faction, nation, president, isPresidentParty, mySeats, currentTick }
 */
export async function openImpeachmentTrigger(supabase, ctx) {
    const { faction, nation, president, isPresidentParty, mySeats, currentTick } = ctx || {};

    if (!faction || !nation || !president) return { ok: false };

    if ((mySeats || 0) < 1) {
        alert('Need at least 1 seat in the legislature to file impeachment.');
        return { ok: false };
    }
    if (isPresidentParty) {
        alert("The president's own party cannot file impeachment.");
        return { ok: false };
    }

    // No existing active proceeding for this nation
    const { data: existingProceeding } = await supabase
        .from('impeachment_proceedings')
        .select('id')
        .eq('nation_id', nation.id)
        .neq('phase', 'resolved')
        .limit(1)
        .maybeSingle();
    if (existingProceeding) {
        alert('An impeachment proceeding is already active.');
        return { ok: false };
    }

    // Nation-level cooldown
    if (nation.impeachment_cooldown_until_tick && currentTick < nation.impeachment_cooldown_until_tick) {
        const remaining = nation.impeachment_cooldown_until_tick - currentTick;
        alert(`Impeachment cooldown: ${remaining} tick${remaining !== 1 ? 's' : ''} remaining.`);
        return { ok: false };
    }

    // Build charge options
    const charges = await buildImpeachmentCharges(supabase, nation, president);
    if (!charges.some(c => c.available)) {
        alert('No impeachment charges are currently available. All charges require specific preconditions to be met.');
        return { ok: false };
    }

    const chargeCheckboxes = charges.map(c => {
        const disabled = !c.available ? 'disabled' : '';
        const opacity  = !c.available ? 'opacity:0.4;' : '';
        const tooltip  = c.reason ? ` title="${escapeHtml(c.reason)}"` : '';
        return `<label style="display:block;margin:8px 0;${opacity}"${tooltip}>
            <input type="checkbox" name="impeach-charge" value="${escapeHtml(c.type)}" ${disabled} style="margin-right:8px;">
            <strong>${escapeHtml(c.label)}</strong>${c.reason ? ` <span style="font-size:0.7rem;color:var(--text-secondary);">(${escapeHtml(c.reason)})</span>` : ''}
        </label>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
        <div style="background:var(--bg-panel);border:1px solid var(--border-0);border-radius:3px;padding:24px;max-width:440px;width:90%;max-height:80vh;overflow-y:auto;">
            <div style="font-family:var(--font-mono);font-size:11px;font-weight:600;color:var(--red);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.1em;">⚖ IMPEACH PRESIDENT</div>
            <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;">
                President ${escapeHtml(president.first_name)} ${escapeHtml(president.last_name)}
            </div>
            <div style="font-size:0.8rem;color:var(--text-primary);margin-bottom:12px;">Select at least one charge:</div>
            <div id="impeach-charges-list">${chargeCheckboxes}</div>
            <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border-hair);font-size:0.75rem;color:var(--text-secondary);line-height:1.5;">
                <div>Cost: <strong style="color:var(--amber);">FREE</strong></div>
                <div>Committee debate: ${GAME_CONFIG.IMPEACHMENT_COMMITTEE_TICKS} ticks → Floor vote: ${GAME_CONFIG.IMPEACHMENT_MOTION_VOTING_TICKS} ticks</div>
                <div>Requires <strong style="color:var(--green);">simple majority</strong> (50%+1 of all seats) to impeach</div>
                <div style="margin-top:6px;">If impeached → Trial: ${GAME_CONFIG.IMPEACHMENT_TRIAL_TICKS}-tick conviction vote (⅔ supermajority)</div>
            </div>
            <div style="display:flex;gap:12px;margin-top:20px;">
                <button id="impeach-cancel-btn" style="flex:1;padding:10px;background:var(--bg-card);color:var(--text-secondary);border:1px solid var(--border-0);border-radius:3px;cursor:pointer;font-family:var(--font-mono);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Cancel</button>
                <button id="impeach-confirm-btn" style="flex:1;padding:10px;background:var(--red);color:#fff;border:none;border-radius:3px;cursor:pointer;font-family:var(--font-mono);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">File Impeachment</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    const result = await new Promise(resolve => {
        overlay.querySelector('#impeach-cancel-btn').addEventListener('click', () => resolve(null));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) resolve(null); });
        overlay.querySelector('#impeach-confirm-btn').addEventListener('click', () => {
            const checked = [...overlay.querySelectorAll('input[name="impeach-charge"]:checked')].map(cb => cb.value);
            if (checked.length === 0) { alert('Select at least one charge.'); return; }
            resolve(checked);
        });
    });
    overlay.remove();
    if (!result) return { ok: false };

    const selectedCharges = result.map(type => {
        const c = charges.find(ch => ch.type === type);
        return { type, label: c.label };
    });

    const presName = `${president.first_name} ${president.last_name}`;
    const motionName = `Articles of Impeachment Against President ${presName}`;
    const chargesList = selectedCharges.map(c => c.label).join(', ');

    try {
        const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        const tick = shard?.current_tick || 0;

        const { data: proceeding, error: procError } = await supabase.from('impeachment_proceedings').insert({
            nation_id: nation.id,
            president_id: president.id,
            initiated_by_faction_id: faction.id,
            charges: selectedCharges,
            phase: 'motion_committee',
            created_at_tick: tick,
        }).select().single();
        if (procError) throw procError;

        const { data: bill, error: billError } = await supabase.from('bills').insert({
            nation_id: nation.id,
            proposed_by: faction.id,
            proposed_tick: tick,
            bill_name: motionName,
            bill_type: 'impeachment_motion',
            status: 'committee',
            impeachment_id: proceeding.id,
            proposer_name: faction.faction_name,
            proposer_color: faction.party_color,
            preamble: `This motion, filed by the ${faction.faction_name}, calls for the impeachment of President ${presName} on the following charges: ${chargesList}. After ${GAME_CONFIG.IMPEACHMENT_COMMITTEE_TICKS} ticks of committee debate, the motion will proceed to a floor vote requiring an absolute majority (${GAME_CONFIG.MAJORITY_SEATS} of ${GAME_CONFIG.TOTAL_SEATS} seats) to pass.`,
        }).select().single();
        if (billError) throw billError;

        await supabase.from('impeachment_proceedings')
            .update({ motion_bill_id: bill.id })
            .eq('id', proceeding.id);

        // Race-condition guard: if another proceeding was created concurrently,
        // delete ours so the nation only has one active impeachment.
        const { count: procCount } = await supabase.from('impeachment_proceedings')
            .select('id', { count: 'exact', head: true })
            .eq('nation_id', nation.id)
            .neq('phase', 'resolved');
        if (procCount > 1) {
            await supabase.from('bills').delete().eq('id', bill.id);
            await supabase.from('impeachment_proceedings').delete().eq('id', proceeding.id);
            alert('Another impeachment proceeding was just filed. Please refresh.');
            return { ok: false };
        }

        await supabase.from('bill_support').upsert({
            bill_id: bill.id,
            faction_id: faction.id,
            stance: 'yes',
            seat_count: mySeats,
        }, { onConflict: 'bill_id,faction_id' });

        // event_log uses the canonical column set: event_name, category,
        // trigger_key, description_chosen, fired_at_tick. The original
        // fileImpeachment in government.html used (event_type, headline,
        // body, metadata, tick) which don't exist on this schema — every
        // insert silently failed because the original code didn't check
        // the error. Fixed here while we're at it.
        const { error: eventErr } = await supabase.from('event_log').insert({
            nation_id:          nation.id,
            event_name:         `Impeachment Motion Filed Against President ${presName}`,
            category:           'government',
            trigger_key:        'impeachment_motion_filed',
            description_chosen: `The ${faction.faction_name} has filed articles of impeachment against President ${presName}. Charges: ${chargesList}. A ${GAME_CONFIG.IMPEACHMENT_COMMITTEE_TICKS}-tick committee debate will precede the floor vote.`,
            fired_at_tick:      tick,
        });
        if (eventErr) {
            // Non-blocking — the bill + proceeding rows are already
            // written; losing the world-news entry isn't worth aborting.
            console.warn('[impeachment] event_log insert failed:', eventErr.message);
        }

        alert(`⚖ "${motionName}" has been filed!\n\n${GAME_CONFIG.IMPEACHMENT_COMMITTEE_TICKS}-tick committee debate begins now. The motion will then proceed to a floor vote.`);
        window.location.href = `bill.html?id=${bill.id}`;
        return { ok: true, billId: bill.id };
    } catch (e) {
        console.error('[impeachment] file failed:', e?.message || e);
        alert('Error: ' + (e?.message || e));
        return { ok: false };
    }
}
