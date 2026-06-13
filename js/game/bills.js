/**
 * bills.js — Bill support, vote tallies, ideology shifts, resolution engine, foundational bills
 * Extracted from game-common.js
 */

import { GAME_CONFIG, FOUNDATIONAL_REPEAL_DEFAULTS, initGameConfigForNation, getPresidentialTermTicks, getPresidentialTermLimit } from './config.js';
import { hasElectedPresident, getCurrentConstitutionalSystem, isAbsoluteMonarchy, MINISTRY_OFFICE_NAMES } from './government-types.js';
import { DIPLOMACY_CONFIG, resolveTransferEndpoints } from './diplomacy-constants.js';
import { TRADE_SECTOR_MAP } from './trade-constants.js';
import { adjustGovernmentApprovalEvent, adjustCredibility } from './momentum.js';
import { MINISTER_APPROVAL_CONFIG, buildMinistryBaselines } from './stats.js';

import { fetchActiveCoalition } from './government-structure.js';
import { resolveNoConfidence } from './elections.js';
import { RAW_PER_ABSTRACT, scalePolicyOngoingCost } from './budget.js';
import { computeTaxArticleEffects, computeTaxArticleOngoingCost, validateTaxArticlePayload, TAX_RATE_MIN, TAX_RATE_MAX, TAX_EFFECT_NATION_COLUMNS } from './tax-articles.js';
import { MILITARY_LOYALTY_POLICY_KEY, onMilitaryLoyaltyEnacted } from './military-loyalty.js';
import { getNationNames, isFemaleName, installHOG } from './political-actions.js';
import { repealActiveLaw } from './repeal-helper.js';
import { fireBillEvent } from './event-helpers.js';
import { computeSectorShifts, sumSectorEffects } from './sectors.js';

const _BILL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
function _billTickToDate(tick) {
    if (tick == null) return null;
    return `${_BILL_MONTHS[tick % 12]}, ${2000 + Math.floor(tick / 12)}`;
}

async function _logAdministrationIntegrityIssue(supabase, nationId, contextLabel) {
    const [{ data: openRows }, { data: missingEndedTickRows }] = await Promise.all([
        supabase.from('administrations').select('id').eq('nation_id', nationId).is('ended_at_tick', null),
        supabase.from('administrations').select('id').eq('nation_id', nationId).not('ended_at_date', 'is', null).is('ended_at_tick', null)
    ]);

    if ((openRows || []).length !== 1 || (missingEndedTickRows || []).length > 0) {
        console.warn('[enactFoundationalBill] administration integrity check warning', {
            context: contextLabel,
            nation_id: nationId,
            open_count: (openRows || []).length,
            open_admin_ids: (openRows || []).map(r => r.id),
            ended_missing_tick_ids: (missingEndedTickRows || []).map(r => r.id)
        });
    }
}

// ==================== BILL SUPPORT ====================

export function calculateBillSupport(billSupport, sponsorPartyId, allPartySeats) {
    const sponsorSeats = allPartySeats[sponsorPartyId] || 0;
    const acceptedSeats = (billSupport || [])
        .filter(s => s.stance === 'accept' && s.faction_id !== sponsorPartyId)
        .reduce((sum, s) => sum + (allPartySeats[s.faction_id] || s.seat_count || 0), 0);
    const totalSupport = sponsorSeats + acceptedSeats;
    const percent = Math.round((totalSupport / GAME_CONFIG.TOTAL_SEATS) * 100);
    return { sponsorSeats, acceptedSeats, totalSupport, percent };
}


// ==================== BILL COST TOTALS ====================

/**
 * Sum upfront + ongoing cost across a bill's articles.
 *
 * Returns { upfront, ongoingMonthly, ongoingYearly }. ongoingMonthly is
 * per-tick (1 tick = 1 month); ongoingYearly = ongoingMonthly × 12.
 *
 * Article handling (matches bill.html's per-article render):
 *   1. Funding-data (BUDGET): fd.discretionary → upfront. Per-institution
 *      slider math used to add Σ base_cost × Δpct to monthly ongoing;
 *      institutions are removed and that branch is gone.
 *   2. Repeal: subtract the repealed policy's scaled ongoing (negative
 *      monthly) — repealing saves what the law was spending.
 *   3. Policy: scaled upfront_cost + scaled (ongoing_cost_per_tick ||
 *      ongoing_base_cost).
 *   4. Text / entrenchment / anything without a policies join: zero.
 */
export function computeBillCostTotals(bill, nation, activeLaws = []) {
    const articles = bill?.bill_articles || [];
    let upfront = 0;
    let ongoingMonthly = 0;

    for (const art of articles) {
        // (1) Funding-data (BUDGET) article — discretionary grants only.
        // Per-institution slider math used to live here; institutions are
        // removed and that branch is gone.
        const fd = art.funding_data;
        if (fd) {
            upfront += Number(fd.discretionary || 0);
            continue;
        }

        // (1b) Tax Article — projected revenue change. Cuts are an ongoing
        // cost to the budget (revenue forgone); hikes are an ongoing relief.
        // SSoT for the math is computeTaxArticleOngoingCost in tax-articles.js,
        // which derives the delta from calculateNationalBudget.
        const ed = art.effect_data;
        if (ed && (ed.type === 'TAX_CHANGE' || ed.type === 'INCOME_TAX_CHANGE')) {
            const taxKey = ed.tax_key || (ed.type === 'INCOME_TAX_CHANGE' ? 'income_tax' : null);
            if (taxKey) {
                ongoingMonthly += computeTaxArticleOngoingCost(taxKey, ed.new_rate, nation);
            }
            continue;
        }

        const p = art.policies;
        if (!p) continue; // text-only / entrenchment / missing join

        // Cost + scaling stat live on policy_options now (policy-level cost
        // cols were dropped). Read from the chosen option.
        // (2) Repeal article — saves the repealed law's ongoing cost, which
        // lives on that law's selected option (needs activeLaws to resolve).
        if (art.repeal_active_law_id) {
            const repOpt = activeLaws.find(l => l.id === art.repeal_active_law_id)?.selected_option || null;
            const onCost = scalePolicyOngoingCost(repOpt?.ongoing_base_cost || 0, repOpt?.ongoing_scaling_stat, nation);
            ongoingMonthly -= onCost;
            continue;
        }

        // (3) Policy article — cost from the article's chosen option.
        const opt = art.selected_option || null;
        upfront += scalePolicyOngoingCost(opt?.upfront_cost || 0, opt?.upfront_scaling_stat, nation);
        ongoingMonthly += scalePolicyOngoingCost(opt?.ongoing_base_cost || 0, opt?.ongoing_scaling_stat, nation);
    }

    return { upfront, ongoingMonthly, ongoingYearly: ongoingMonthly * 12 };
}


// ==================== VOTE TALLY SYNC ====================

export async function syncVoteTallies(supabase, billId) {
    const { data: allVotes } = await supabase
        .from('bill_support')
        .select('stance, seat_count')
        .eq('bill_id', billId);

    let votesFor = 0, votesAgainst = 0, votesAbstain = 0;
    (allVotes || []).forEach(v => {
        const st = v.stance === 'accept' ? 'yes' : v.stance === 'reject' ? 'no' : v.stance;
        if (st === 'yes')            votesFor += (v.seat_count || 0);
        else if (st === 'no')        votesAgainst += (v.seat_count || 0);
        else if (st === 'abstain')   votesAbstain += (v.seat_count || 0);
    });

    const { error } = await supabase.from('bills').update({
        votes_for: votesFor,
        votes_against: votesAgainst,
        votes_abstain: votesAbstain
    }).eq('id', billId);

    // Fallback: if votes_abstain column doesn't exist yet (PGRST204), update without it
    if (error && error.code === 'PGRST204' && error.message.includes('votes_abstain')) {
        console.warn('[syncVoteTallies] votes_abstain column not found, updating without it');
        await supabase.from('bills').update({
            votes_for: votesFor,
            votes_against: votesAgainst
        }).eq('id', billId);
    }

    return { votesFor, votesAgainst, votesAbstain };
}




// ==================== NO-VOTE PENALTY ====================

/**
 * Penalize factions that did not cast any vote (YES/NO/ABSTAIN) on a bill.
 * - Party approval: -1d3 (1-3)
 * - Visibility: -5
 * - Credibility: -5 (i.e. -0.05 on the modifier)
 *
 * @param {object} supabase
 * @param {object} bill - Full bill row with bill_articles (with policies) and bill_support
 * @param {string} nationId
 */
export async function applyNoVotePenalty(supabase, bill, nationId, currentTick = 0) {
    const VISIBILITY_PENALTY = -5;
    const CREDIBILITY_PENALTY = -0.05; // -5 on the 0-100 display scale

    // 1. Get all party factions in this nation
    const { data: allFactions } = await supabase
        .from('factions')
        .select('id, faction_name')
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (!allFactions || allFactions.length === 0) return [];

    // 2. Determine which factions voted (have a bill_support row)
    const votedFactionIds = new Set();
    // Sponsor always counts as having voted (they implicitly support their own bill)
    if (bill.proposed_by) votedFactionIds.add(bill.proposed_by);
    for (const s of (bill.bill_support || [])) {
        if (s.faction_id) votedFactionIds.add(s.faction_id);
    }

    // 3. Find non-voters
    const nonVoters = allFactions.filter(f => !votedFactionIds.has(f.id));
    if (nonVoters.length === 0) return [];

    // 4. Apply penalties to each non-voter
    const penalized = [];
    for (const faction of nonVoters) {
        // Flat -2 momentum for not voting
        await supabase.rpc('adjust_momentum', {
            p_faction_id: faction.id, p_delta: -2,
            p_label: 'Absent from vote (-2)', p_tick: currentTick || 0
        });

        // Visibility and credibility writes removed — 3-pillar election system.
        // No-vote penalty is handled server-side via adjustFactionMomentum.

        penalized.push({
            factionId: faction.id,
            factionName: faction.faction_name,
            approvalLoss,
            visibilityLoss: VISIBILITY_PENALTY,
            credibilityLoss: VISIBILITY_PENALTY,
        });
    }

    return penalized;
}


// ==================== STATIC IDEOLOGY PENALTY (LEGACY) ====================

export function calculateIdeologyPenalty(stage, opposedCount, polarization) {
    if (opposedCount === 0) return 0;

    const pol = polarization || 0;
    let penalty = 0;

    if (stage === 'floor') {
        if (pol >= 50) {
            penalty = -1 * opposedCount;
        } else {
            penalty = -1 * Math.floor(opposedCount / 2);
        }
    } else if (stage === 'passed') {
        penalty = -1 * opposedCount;
        if (pol >= 75) {
            penalty += -2 * opposedCount;
        }
    }

    return penalty;
}


// ==================== BLOC APPROVAL HELPERS ====================

/**
 * Legacy bloc-weighted approval recalculation (no longer used).
 * Approval is now tracked in faction_electoral_standing.party_approval.
 */
export async function recalcDerivedApproval(supabase, factionId, blocRows) {
    // Legacy bloc-weighted approval removed — electorate engine handles vote share now
    return null;
}

export async function ensureBlocApprovals(supabase, factionId, nationId) {
    // Legacy bloc approval seeding removed — electorate engine handles vote share now
    return null;
}



/**
 * Apply per-faction sector popularity changes from terminal bill resolutions.
 *
 * Vote-aligned model (Phase 2 design):
 *   * passed:  sponsor + YES voters get +change_tenths per sector;
 *              NO voters get -change_tenths; abstain unaffected.
 *   * failed:  sponsor takes -change_tenths (full inverse); other voters
 *              unaffected — proposer "owns" the failed bill alone.
 *   * Other terminal states (expired_committee, withdrawn,
 *     failed_proposer_disbanded, etc.) are administrative outcomes, not
 *     political defeats, so they skip — no popularity moves.
 *
 * Mirrors processIdeologyShifts in shape: load bills with bill_articles,
 * policies, and bill_support; build voter stance map; delegate the math to
 * the pure helpers in sectors.js (computeSectorShifts + sumSectorEffects);
 * aggregate per (faction, sector); upsert with 0..100 clamp.
 *
 * Sector lookup is per-nation: a bill's effects reference sector_key, but
 * popularity rows reference sector_id. Effects naming a sector_key the
 * nation doesn't have silently no-op (forward-compatible with custom
 * per-nation sectors).
 */
export async function processSectorShifts(supabase, nationId, resolutions) {
    if (!resolutions || resolutions.length === 0) return;

    // ── Failed-bill rapport (target-based options) ──
    // A FAILED bill still moves voters by alignment, at a reduced
    // magnitude, against the option it WOULD have enacted vs the one
    // currently in force: YES voters take +delta × FAILED_BILL_RAPPORT_
    // MULTIPLIER, NO voters the inverse. (Passed bills apply full-magnitude
    // rapport in enactBill, which still holds the pre-enactment baseline —
    // by the time this runs the active_law has already been overwritten.)
    // Only genuine political defeats count; administrative outcomes skip.
    const failedBillIds = resolutions
        .filter(r => r?.billId && (r.result === 'failed' || r.result === 'rejected'))
        .map(r => r.billId);
    if (failedBillIds.length > 0) {
        const { data: failedBills, error: fbErr } = await supabase
            .from('bills')
            .select('id, nation_id, proposed_by, bill_type, bill_articles(policy_id, selected_option_id, repeal_active_law_id), bill_support(faction_id, stance)')
            .in('id', failedBillIds);
        if (fbErr) {
            console.error('[processSectorShifts] failed-bill rapport load failed', { nationId, error: fbErr.message });
        } else {
            for (const bill of (failedBills || [])) {
                if (['no_confidence', 'minister_confirmation', 'governor_confirmation', 'foundational', 'veto_override'].includes(bill.bill_type)) continue;
                for (const art of (bill.bill_articles || [])) {
                    if (!art?.selected_option_id || art.repeal_active_law_id) continue;
                    // prev = the option currently in force for this policy (the
                    // status quo the failed bill would have changed); [] if none.
                    let prevRapport = [];
                    if (art.policy_id) {
                        const { data: activeLaw } = await supabase
                            .from('active_laws')
                            .select('selected_option:policy_options!selected_option_id(sector_rapport_targets)')
                            .eq('nation_id', bill.nation_id)
                            .eq('policy_id', art.policy_id)
                            .maybeSingle();
                        prevRapport = activeLaw?.selected_option?.sector_rapport_targets || [];
                    }
                    await applyOptionRapportToVoters(supabase, bill, art, prevRapport, FAILED_BILL_RAPPORT_MULTIPLIER);
                }
            }
        }
    }

    // Map every resolution to passed/failed/skip. Only passed and failed
    // move popularity; everything else (deferred, withdrawn, committee
    // expirations, proposer-disbanded) is administrative.
    function normalizeResult(r) {
        if (r === 'passed' || r === 'approved') return 'passed';
        if (r === 'failed' || r === 'rejected') return 'failed';
        return null;
    }
    const actionable = resolutions
        .map(r => ({ billId: r.billId, result: normalizeResult(r.result) }))
        .filter(r => r.billId && r.result);
    if (actionable.length === 0) return;

    const billIds = actionable.map(r => r.billId);
    // Each bill_article carries its sector_effects via the chosen
    // policy_option (selected_option_id FK). policies.sector_effects was
    // dropped in the alpha refactor — the option is now the single source.
    const { data: bills, error: billErr } = await supabase
        .from('bills')
        .select('id, nation_id, proposed_by, bill_type, bill_articles(*, selected_option:policy_options!selected_option_id(sector_effects)), bill_support(faction_id, stance)')
        .in('id', billIds);
    if (billErr) {
        console.error('[processSectorShifts] failed to load bills', { nationId, error: billErr.message });
        return;
    }
    if (!bills || bills.length === 0) return;

    // Match the legislative-bills filter from processIdeologyShifts. Non-
    // legislative bills (no_confidence, confirmations, foundational, veto
    // override) are political-process votes, not policy outcomes — they
    // don't carry sector effects.
    const legislative = bills.filter(b =>
        !['no_confidence', 'minister_confirmation', 'governor_confirmation', 'foundational', 'veto_override'].includes(b.bill_type)
    );
    if (legislative.length === 0) return;

    const resultByBill = new Map(actionable.map(r => [r.billId, r.result]));

    // Load active sectors for this nation once so we can translate
    // sector_key (in policies) to sector_id (in faction_sector_popularity).
    const { data: sectors, error: secErr } = await supabase
        .from('sectors')
        .select('id, sector_key')
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (secErr) {
        console.error('[processSectorShifts] failed to load sectors', { nationId, error: secErr.message });
        return;
    }
    const sectorIdByKey = new Map((sectors || []).map(s => [s.sector_key, s.id]));
    if (sectorIdByKey.size === 0) return; // nation has no sectors yet

    // Aggregate deltas across every bill in this batch. A faction can be
    // shifted multiple times in one tick if multiple bills affect them.
    const aggregatedDeltas = new Map(); // key: `${factionId}:${sectorId}` -> total delta
    for (const bill of legislative) {
        const result = resultByBill.get(bill.id);
        if (!result) continue;

        const articleEffects = (bill.bill_articles || [])
            .map(art => art?.selected_option?.sector_effects)
            .filter(e => Array.isArray(e) && e.length > 0);
        if (articleEffects.length === 0) continue;
        const summed = sumSectorEffects(articleEffects);
        if (summed.length === 0) continue;

        // Build voter stance map (normalize committee 'accept'/'reject').
        const voters = new Map();
        for (const s of (bill.bill_support || [])) {
            const stance = s.stance === 'accept' ? 'yes'
                         : s.stance === 'reject' ? 'no'
                         : s.stance;
            if (stance === 'yes' || stance === 'no' || stance === 'abstain') {
                voters.set(s.faction_id, stance);
            }
        }

        const shiftRows = computeSectorShifts({
            effects: summed,
            voters,
            sponsorId: bill.proposed_by,
            result,
        });
        for (const row of shiftRows) {
            const sectorId = sectorIdByKey.get(row.sector_key);
            if (!sectorId) continue; // sector not present in this nation
            const key = `${row.factionId}:${sectorId}`;
            aggregatedDeltas.set(key, (aggregatedDeltas.get(key) || 0) + row.delta_tenths);
        }
    }
    if (aggregatedDeltas.size === 0) return;

    // Fetch current popularity for every (faction, sector) pair we'll write.
    const factionIds = new Set();
    const sectorIds  = new Set();
    for (const key of aggregatedDeltas.keys()) {
        const [fid, sid] = key.split(':');
        factionIds.add(fid);
        sectorIds.add(sid);
    }
    const { data: currentRows, error: curErr } = await supabase
        .from('faction_sector_popularity')
        .select('faction_id, sector_id, popularity')
        .in('faction_id', [...factionIds])
        .in('sector_id',  [...sectorIds]);
    if (curErr) {
        console.error('[processSectorShifts] failed to load current popularities', { nationId, error: curErr.message });
        return;
    }
    const currentByKey = new Map();
    for (const r of (currentRows || [])) {
        currentByKey.set(`${r.faction_id}:${r.sector_id}`, Number(r.popularity) || 0);
    }

    // Build clamped upserts. Skip rows where the clamp produces no change
    // (e.g., already at 100 with a positive delta) so the network round-trip
    // only carries actual writes. Math.round defends against fractional
    // change_tenths slipping in from a malformed policy: the CHECK constraint
    // requires change_tenths to be a JSON number but doesn't enforce integer,
    // and faction_sector_popularity.popularity is smallint.
    const upserts = [];
    for (const [key, delta] of aggregatedDeltas) {
        const [factionId, sectorId] = key.split(':');
        const current = currentByKey.get(key) ?? 0;
        const next = Math.max(0, Math.min(100, Math.round(current + delta)));
        if (next === current) continue;
        upserts.push({ faction_id: factionId, sector_id: sectorId, popularity: next });
    }
    if (upserts.length === 0) return;

    const { error: upsertErr } = await supabase
        .from('faction_sector_popularity')
        .upsert(upserts, { onConflict: 'faction_id,sector_id' });
    if (upsertErr) {
        console.error('[processSectorShifts] upsert failed', {
            nationId,
            count: upserts.length,
            error: upsertErr.message,
        });
    }
}


// Phase 4.3: charge a policy_option's upfront_cost against the nation's
// treasury. The option stores cost in $M; we scale by the option's
// upfront_scaling_stat (when defined and present on the nations row),
// convert to raw dollars, then draw from nation.budget (treasury) first
// and overflow to debt — same pattern as the government-bailout
// enactment. Negative upfront values represent revenue and credit
// treasury. Zero / null values are no-ops.
//
// Unit boundary: nation.budget is abstract (1 = $1B), `dollars` and
// nation.debt are raw. Convert via 1e9 so the floor + overflow math
// stays in raw and only the persisted budget value is converted back.
async function chargePolicyUpfrontCost(supabase, nationId, option) {
    if (!option) return;
    const base = Number(option.upfront_cost || 0);
    if (!Number.isFinite(base) || base === 0) return;

    const { data: nation, error: nErr } = await supabase
        .from('nations')
        .select('*')
        .eq('id', nationId)
        .single();
    if (nErr || !nation) {
        console.error('[chargePolicyUpfrontCost] failed to load nation', { nationId, error: nErr?.message });
        return;
    }

    const scaledM = scalePolicyOngoingCost(base, option.upfront_scaling_stat, nation);
    const dollars = Math.round(scaledM * 1_000_000); // option.upfront_cost is stored in $M
    if (dollars === 0) return;

    // Unit bridge: dollars is raw ($M base × 1M). nation.budget + nation.debt
    // are both abstract integers (1 = $1M raw). RAW_PER_ABSTRACT imported
    // from budget.js is the single source of truth.
    const budgetAbstract = Number(nation.budget || 0);
    const budgetRaw = budgetAbstract * RAW_PER_ABSTRACT;
    const debt = Number(nation.debt || 0);

    if (dollars > 0) {
        // Cost: pull from treasury, overflow to debt.
        const drawBudget = Math.max(0, Math.min(dollars, budgetRaw));
        const drawDebt   = dollars - drawBudget;
        const newBudget  = Math.max(0, budgetRaw - drawBudget) / RAW_PER_ABSTRACT;
        const newDebt    = Math.max(0, Math.round(debt + drawDebt / RAW_PER_ABSTRACT));
        const { error } = await supabase
            .from('nations')
            .update({ budget: newBudget, debt: newDebt })
            .eq('id', nationId);
        if (error) {
            console.error('[chargePolicyUpfrontCost] cost update failed', { nationId, error: error.message });
            return;
        }
        console.log(`[chargePolicyUpfrontCost] cost: $${Math.round(dollars / 1e6)}M (budget: -$${Math.round(drawBudget / 1e6)}M, debt: +$${Math.round(drawDebt / 1e6)}M) on nation ${nationId}`);
    } else {
        // Revenue: credit treasury.
        const credit = Math.abs(dollars);
        const newBudget = budgetAbstract + (credit / RAW_PER_ABSTRACT);
        const { error } = await supabase
            .from('nations')
            .update({ budget: newBudget })
            .eq('id', nationId);
        if (error) {
            console.error('[chargePolicyUpfrontCost] revenue update failed', { nationId, error: error.message });
            return;
        }
        console.log(`[chargePolicyUpfrontCost] revenue: +$${Math.round(credit / 1e6)}M to treasury on nation ${nationId}`);
    }
}

// Phase 4.2: apply the inverse of a list of sector_effects to a single
// faction's popularity. Used by enactBill when a policy article switches
// the nation from one option to another — the bill's sponsor "takes the
// inverse" of the old option's popularity shift, mirroring the bill-fail
// rule that already lives in computeSectorShifts. Reads / writes the same
// faction_sector_popularity table that processSectorShifts touches and
// applies the same 0–100 clamp.
async function applyInverseSectorEffectsToFaction(supabase, nationId, factionId, sectorEffects) {
    if (!nationId || !factionId) return;
    if (!Array.isArray(sectorEffects) || sectorEffects.length === 0) return;

    const { data: sectors, error: secErr } = await supabase
        .from('sectors')
        .select('id, sector_key')
        .eq('nation_id', nationId)
        .eq('is_active', true);
    if (secErr) {
        console.error('[applyInverseSectorEffectsToFaction] failed to load sectors', { nationId, error: secErr.message });
        return;
    }
    const sectorIdByKey = new Map((sectors || []).map(s => [s.sector_key, s.id]));
    if (sectorIdByKey.size === 0) return;

    const inverseDeltas = sectorEffects
        .filter(e => e && e.sector_key && Number.isFinite(Number(e.change_tenths)) && Number(e.change_tenths) !== 0)
        .map(e => ({
            sector_id: sectorIdByKey.get(e.sector_key),
            delta: -(parseInt(e.change_tenths, 10) || 0),
        }))
        .filter(d => d.sector_id);
    if (inverseDeltas.length === 0) return;

    const { data: current, error: curErr } = await supabase
        .from('faction_sector_popularity')
        .select('sector_id, popularity')
        .eq('faction_id', factionId)
        .in('sector_id', inverseDeltas.map(d => d.sector_id));
    if (curErr) {
        console.error('[applyInverseSectorEffectsToFaction] failed to load current popularities', { factionId, error: curErr.message });
        return;
    }
    const currentBySectorId = new Map((current || []).map(r => [r.sector_id, Number(r.popularity) || 0]));

    const upserts = [];
    for (const d of inverseDeltas) {
        const cur = currentBySectorId.get(d.sector_id) ?? 0;
        const next = Math.max(0, Math.min(100, Math.round(cur + d.delta)));
        if (next === cur) continue;
        upserts.push({ faction_id: factionId, sector_id: d.sector_id, popularity: next });
    }
    if (upserts.length === 0) return;

    const { error: upsertErr } = await supabase
        .from('faction_sector_popularity')
        .upsert(upserts, { onConflict: 'faction_id,sector_id' });
    if (upsertErr) {
        console.error('[applyInverseSectorEffectsToFaction] upsert failed', { factionId, count: upserts.length, error: upsertErr.message });
    }
}

// ════════════════════════════════════════════════════════════════
// Target-based policy: one-shot rapport apply at bill-pass time.
//
// `sector_rapport_targets` describes Voter Bloc Standing — where
// each option places voters' feelings about the policy on a
// −10..+10 scale. When a passing bill enacts (or switches to) an
// option, every YES voter takes the *difference* between the new
// option's standing and the previously-active option's standing
// against their faction_sector_popularity, once.
//
// Why level-based instead of an absolute delta: passing
// "Means-Tested Pensions" should feel great to retirees if the old
// law was "No Pensions" and bad if the old law was "Generous
// Pensions". With per-option Standing values, the engine subtracts
// what was already in place (or 0 if first enactment) so the same
// option produces opposite reactions depending on what it
// replaced.
//
// Why one-shot: an earlier per-tick accumulator pinned every
// participating party at 0 or max within ~100 ticks. Treating the
// move between standings as a single political payout is more
// honest about "you backed this swap, you wear the consequences."
//
// Mapping:
//   delta_rapport = standing_new − standing_prev (each in −10..+10)
//   → displayed-popularity delta on the same 0..10 scale
//   → stored as integer tenths (0..100). delta_stored
//   = round(delta_rapport * 10), clamped after add to [0, 100].
//
// YES voters:
//   - The bill's proposed_by faction (sponsor implicitly votes yes).
//   - Every bill_support row whose stance normalizes to 'yes'
//     (committee 'accept' and floor 'yes' both qualify).
//
// Skips:
//   - Repeal articles (no option to enact). Repeal currently leaves
//     prior standing in place; a future change could move it back
//     toward 0 if "no policy" should mean "no standing."
//   - Articles with no selected_option_id.
//   - Options with is_target_based = FALSE.
//   - Sector keys that don't exist in this nation's sectors table.
//   - Faction rows that don't have a faction_sector_popularity row
//     for the sector (sector wasn't seeded for them — no row to
//     nudge; create-on-write would diverge from the rest of the
//     popularity pipeline which only ever read-modify-writes).
// ════════════════════════════════════════════════════════════════

// Canonicalize a bill_support stance to one of 'yes' | 'no' | 'abstain'
// (or whatever was already set if it doesn't normalize). Committee rows
// use 'accept'/'reject'; floor rows use 'yes'/'no'. This helper lets
// new code stay agnostic; the seven other sites in this file that do
// the same conditional inline pre-date the helper and aren't in scope
// for this changeset.
function normalizeSupportStance(stance) {
    if (stance === 'accept') return 'yes';
    if (stance === 'reject') return 'no';
    return stance;
}

// Helper: turn a `[{ sector_key, rapport }]` list into a Map keyed by
// sector_key. Hostile inputs (NaN, missing fields) silently drop.
function _rapportListToMap(list) {
    const out = new Map();
    if (!Array.isArray(list)) return out;
    for (const r of list) {
        if (!r?.sector_key) continue;
        const v = Number(r.rapport);
        if (!Number.isFinite(v)) continue;
        out.set(r.sector_key, v);
    }
    return out;
}

// Magnitude of the rapport payout on a FAILED bill, relative to a pass.
// A failed bill still moves voters by their alignment (YES toward the
// policy's standing, NO away from it) but at a fraction — the sector saw
// the attempt, not the delivered policy. Tunable.
const FAILED_BILL_RAPPORT_MULTIPLIER = 0.5;

// Apply a target-based option's Voter Bloc Standing to the bill's voters,
// scaled by `multiplier` (1 on pass, FAILED_BILL_RAPPORT_MULTIPLIER on
// fail). YES voters (sponsor + 'yes'/'accept') move by +delta; NO voters
// ('no'/'reject') move by −delta; abstain/non-voters are untouched. delta
// is Standing(new) − Standing(prev) per sector, so the move is level-based
// (the same option reacts differently depending on what it replaced).
async function applyOptionRapportToVoters(supabase, bill, art, previousRapport = [], multiplier = 1) {
    if (!bill?.id || !bill?.nation_id) return;
    if (!art?.selected_option_id || art?.repeal_active_law_id) return;
    if (!(multiplier > 0)) return;

    // Fetch the new option's rapport config fresh — callers pass `bill`
    // with varying joins, so we don't trust art.selected_option to
    // carry is_target_based + sector_rapport_targets reliably.
    const { data: opt, error: optErr } = await supabase
        .from('policy_options')
        .select('is_target_based, sector_rapport_targets')
        .eq('id', art.selected_option_id)
        .maybeSingle();
    if (optErr) {
        console.warn(`[applyOptionRapportToVoters] option fetch failed for ${art.selected_option_id}:`, optErr.message);
        return;
    }
    if (!opt?.is_target_based) return;

    // Compute Standing(new) − Standing(prev) per sector_key. Sectors only
    // listed on one side of the swap take their full magnitude (the other
    // side's standing is implicitly 0). Sectors on both sides take the
    // difference. Sectors on neither side are absent from the map.
    const newMap  = _rapportListToMap(opt.sector_rapport_targets);
    const prevMap = _rapportListToMap(previousRapport);
    const deltas  = []; // [{ sector_key, delta }]
    const allKeys = new Set([...newMap.keys(), ...prevMap.keys()]);
    for (const key of allKeys) {
        const delta = (newMap.get(key) || 0) - (prevMap.get(key) || 0);
        if (delta !== 0) deltas.push({ sector_key: key, delta });
    }
    if (deltas.length === 0) return;

    // Build the voter-sign map: YES → +1, NO → −1, abstain skipped.
    // Sponsor always counts as YES and outranks a (contradictory) support
    // row. Prefer the bill_support rows already joined on the bill; fall
    // back to a fresh fetch otherwise.
    const voterSign = new Map();
    if (bill.proposed_by) voterSign.set(bill.proposed_by, 1);

    let supportRows = Array.isArray(bill.bill_support) ? bill.bill_support : null;
    if (!supportRows) {
        const { data, error } = await supabase
            .from('bill_support')
            .select('faction_id, stance')
            .eq('bill_id', bill.id);
        if (error) {
            console.warn(`[applyOptionRapportToVoters] bill_support fetch failed for bill ${bill.id}:`, error.message);
            return;
        }
        supportRows = data || [];
    }
    for (const s of supportRows) {
        if (!s?.faction_id) continue;
        if (voterSign.get(s.faction_id) === 1 && s.faction_id === bill.proposed_by) continue; // sponsor stays YES
        const st = normalizeSupportStance(s.stance);
        if (st === 'yes') voterSign.set(s.faction_id, 1);
        else if (st === 'no') voterSign.set(s.faction_id, -1);
        // abstain (or anything else) → no popularity move
    }
    if (voterSign.size === 0) return;

    // Resolve the listed sector_keys to sector_ids for this nation.
    const sectorKeys = [...new Set(deltas.map(d => d.sector_key))];
    const { data: sectorRows, error: secErr } = await supabase
        .from('sectors')
        .select('id, sector_key')
        .eq('nation_id', bill.nation_id)
        .eq('is_active', true)
        .in('sector_key', sectorKeys);
    if (secErr) {
        console.warn(`[applyOptionRapportToVoters] sectors fetch failed for nation ${bill.nation_id}:`, secErr.message);
        return;
    }
    const sectorIdByKey = new Map((sectorRows || []).map(s => [s.sector_key, s.id]));
    if (sectorIdByKey.size === 0) return;

    // Apply delta once per (voter, sector), scaled by sign × multiplier.
    // Read-modify-write through the existing popularity row; skip silently
    // if the sector wasn't seeded for this faction.
    const factionIds = [...voterSign.keys()];
    const sectorIds  = [...sectorIdByKey.values()];
    const { data: popRows, error: popErr } = await supabase
        .from('faction_sector_popularity')
        .select('id, faction_id, sector_id, popularity')
        .in('faction_id', factionIds)
        .in('sector_id', sectorIds);
    if (popErr) {
        console.warn(`[applyOptionRapportToVoters] popularity fetch failed:`, popErr.message);
        return;
    }
    const rowByKey = new Map((popRows || []).map(r => [`${r.faction_id}|${r.sector_id}`, r]));

    for (const factionId of factionIds) {
        const sign = voterSign.get(factionId);
        for (const d of deltas) {
            const sectorId = sectorIdByKey.get(d.sector_key);
            if (!sectorId) continue;
            const row = rowByKey.get(`${factionId}|${sectorId}`);
            if (!row) continue;

            // delta is on the displayed 0..10 popularity scale; storage is
            // tenths 0..100 → ×10. Apply the voter's sign + the pass/fail
            // multiplier, then round.
            const deltaStored = Math.round(d.delta * 10 * sign * multiplier);
            if (deltaStored === 0) continue;
            const before = Number(row.popularity) || 0;
            const after = Math.max(0, Math.min(100, before + deltaStored));
            if (after === before) continue;

            const { error: updErr } = await supabase
                .from('faction_sector_popularity')
                .update({ popularity: after, updated_at: new Date().toISOString() })
                .eq('id', row.id);
            if (updErr) {
                console.warn(`[applyOptionRapportToVoters] popularity update failed (${factionId}/${d.sector_key}):`, updErr.message);
            }
        }
    }
}

// ==================== BILL RESOLUTION ENGINE ====================

/**
 * Single source of truth for bill-type threshold categorization.
 *
 * Every path that asks "is this bill type X/Y/Z?" — getRequiredSeats,
 * isSimpleMajorityBill, evaluateBillVote, resolveBillVote, resolveExpiredVotes,
 * and any future resolver — routes through getBillTypeSpec() and the named
 * predicates below. Bill types not listed here (ordinary, ratification,
 * confirmation, minister_confirmation, etc.) fall through to 'simple'
 * threshold with quorum.
 *
 * Kinds:
 *   'supermajority' — 2/3 of TOTAL_SEATS (foundational, default_resolution,
 *                     impeachment_conviction). Nation flags may raise/lower
 *                     this in the evaluate/resolve functions; the registry
 *                     owns the default.
 *   'veto_override' — VETO_OVERRIDE_THRESHOLD of TOTAL_SEATS (currently 2/3
 *                     but kept distinct from 'supermajority' so the two can
 *                     diverge without a registry rewrite).
 *   'absolute'      — Math.floor(TOTAL_SEATS / 2) + 1 (no_confidence,
 *                     impeachment_motion). No quorum. Nation flags may raise.
 *   'simple'        — YES > NO of votes cast, with 50% participation quorum.
 *                     Default for unlisted bill types.
 */
const BILL_TYPE_SPECS = Object.freeze({
    foundational:           { threshold: 'supermajority' },
    default_resolution:     { threshold: 'supermajority' },
    veto_override:          { threshold: 'veto_override' },
    impeachment_conviction: { threshold: 'supermajority' },
    no_confidence:          { threshold: 'absolute' },
    impeachment_motion:     { threshold: 'absolute' },
});

/**
 * Look up the threshold spec for a bill type. Unlisted types return
 * { threshold: 'simple' } — covers ordinary, ratification,
 * minister_confirmation, etc.
 */
export function getBillTypeSpec(billType) {
    return BILL_TYPE_SPECS[billType] || { threshold: 'simple' };
}

/** foundational / default_resolution / veto_override / impeachment_conviction */
export function isSupermajorityBill(billType) {
    const k = getBillTypeSpec(billType).threshold;
    return k === 'supermajority' || k === 'veto_override';
}

/** no_confidence / impeachment_motion */
export function isAbsoluteMajorityBill(billType) {
    return getBillTypeSpec(billType).threshold === 'absolute';
}

/**
 * Returns true if this bill type uses quorum + simple majority (YES > NO of
 * votes cast) rather than an absolute seat threshold. Default for every
 * bill type not in BILL_TYPE_SPECS.
 */
export function isSimpleMajorityBill(billType) {
    return getBillTypeSpec(billType).threshold === 'simple';
}

/**
 * Get the number of YES seats required for a bill to pass.
 *
 * For supermajority / veto_override bills the threshold is a fixed
 * fraction of TOTAL_SEATS.
 * For absolute-majority bills (no_confidence, impeachment_motion) the
 * threshold is floor(TOTAL_SEATS / 2) + 1.
 * For simple-majority bills the rule is YES > NO — with votesAgainst
 * supplied we return votesAgainst + 1 so the display updates live; without
 * it we fall back to MAJORITY_SEATS for backward compat.
 */
export function getRequiredSeats(billType, votesAgainst) {
    const spec = getBillTypeSpec(billType);
    if (spec.threshold === 'supermajority')
        return Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.SUPERMAJORITY_THRESHOLD);
    if (spec.threshold === 'veto_override')
        return Math.ceil(GAME_CONFIG.TOTAL_SEATS * GAME_CONFIG.VETO_OVERRIDE_THRESHOLD);
    if (spec.threshold === 'absolute')
        return Math.floor(GAME_CONFIG.TOTAL_SEATS / 2) + 1;
    // simple majority of votes cast
    if (votesAgainst != null) return votesAgainst + 1;
    return GAME_CONFIG.MAJORITY_SEATS;
}

/**
 * Evaluate the current state of a bill vote using the two-step quorum + majority system.
 *
 * Returns an object describing the vote status:
 *   { status, reason, quorumMet, quorumNeeded, quorumCurrent, thresholdNeeded, ... }
 *
 * Status values:
 *   'will_pass'      — mathematically locked in, cannot change
 *   'will_fail'      — mathematically impossible to pass
 *   'passing'        — quorum met, yes currently leads, but not locked
 *   'failing'        — quorum met, no currently leads, but not locked
 *   'tied'           — quorum met, yes === no
 *   'quorum_not_met' — not enough participation yet
 *   'pending'        — for absolute-threshold bills, in progress
 *
 * @param {object} bill - Bill with votes_for, votes_against, votes_abstain, bill_type
 * @param {number} totalSeats - Total parliamentary seats (from nation)
 * @param {object} [nationFlags] - Optional nation flags affecting thresholds
 * @param {boolean} [nationFlags.judicial_appointment_politicization] - If true, raises impeachment conviction to 75% and no confidence to 60%
 */
export function evaluateBillVote(bill, totalSeats, nationFlags = {}) {
    const forSeats = bill.votes_for || 0;
    const againstSeats = bill.votes_against || 0;
    const abstainSeats = bill.votes_abstain || 0;
    const participating = forSeats + againstSeats + abstainSeats;
    const undeclaredSeats = totalSeats - participating;
    // Legislative Quorum Reform: use override if active (40/30/25%), else default 50%
    const quorumPct = (nationFlags.legislative_quorum_override > 0) ? (nationFlags.legislative_quorum_override / 100) : GAME_CONFIG.QUORUM_THRESHOLD;
    const quorumThreshold = Math.ceil(totalSeats * quorumPct);
    const judicialPoliticized = !!nationFlags.judicial_appointment_politicization;

    // ── Entrenchment clause: elevates ordinary bills to supermajority thresholds ──
    if (bill.entrenchment_tier && bill.bill_type !== 'foundational') {
        let ratio;
        if (bill.entrenchment_tier === 'protected') ratio = GAME_CONFIG.PROTECTED_THRESHOLD; // 60%
        else ratio = GAME_CONFIG.SUPERMAJORITY_THRESHOLD; // 67% for entrenched & enshrined
        const threshold = Math.ceil(totalSeats * ratio);
        if (forSeats >= threshold) {
            return { status: 'will_pass', reason: 'supermajority_reached', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating, entrenchmentTier: bill.entrenchment_tier };
        }
        if (forSeats + undeclaredSeats < threshold) {
            return { status: 'will_fail', reason: 'supermajority_impossible', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating, entrenchmentTier: bill.entrenchment_tier };
        }
        return { status: 'pending', reason: 'supermajority_in_progress', thresholdNeeded: threshold, neededFor: threshold - forSeats, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating, entrenchmentTier: bill.entrenchment_tier };
    }

    // ── Foundational / default_resolution / veto_override / impeachment_conviction: supermajority, no quorum ──
    if (isSupermajorityBill(bill.bill_type)) {
        // Determine supermajority ratio:
        // - Impeachment conviction + judicial politicization: 75%
        // - Foundational + constitutional streamlining active (but NOT the streamlining bill itself): 55%
        // - Everything else: 67%
        let ratio = 2 / 3; // default 67%
        if (bill.bill_type === 'impeachment_conviction' && judicialPoliticized) {
            ratio = 0.75;
        } else if (bill.bill_type === 'foundational' && nationFlags.constitutional_amendment_streamlining
                   && !bill.proposed_constitutional_amendment_streamlining) {
            ratio = 0.55; // streamlining active, and this isn't the streamlining bill itself
        }
        const threshold = Math.ceil(totalSeats * ratio);
        if (forSeats >= threshold) {
            return { status: 'will_pass', reason: 'supermajority_reached', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
        }
        if (forSeats + undeclaredSeats < threshold) {
            return { status: 'will_fail', reason: 'supermajority_impossible', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
        }
        return { status: 'pending', reason: 'supermajority_in_progress', thresholdNeeded: threshold, neededFor: threshold - forSeats, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }

    // ── Impeachment motion / no confidence: absolute majority, no quorum ──
    if (isAbsoluteMajorityBill(bill.bill_type)) {
        // No confidence: 60% if courts are captured, otherwise 50%+1
        const threshold = (bill.bill_type === 'no_confidence' && judicialPoliticized)
            ? Math.ceil(totalSeats * 0.6)
            : Math.floor(totalSeats / 2) + 1;
        if (forSeats >= threshold) {
            return { status: 'will_pass', reason: 'absolute_majority_reached', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
        }
        if (forSeats + undeclaredSeats < threshold) {
            return { status: 'will_fail', reason: 'absolute_majority_impossible', thresholdNeeded: threshold, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
        }
        return { status: 'pending', reason: 'absolute_majority_in_progress', thresholdNeeded: threshold, neededFor: threshold - forSeats, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }

    // ── Ordinary bills: quorum (50% participation) + simple majority of votes cast ──
    const quorumMet = participating >= quorumThreshold;

    if (!quorumMet) {
        // Check if quorum is even possible
        if (participating + undeclaredSeats < quorumThreshold) {
            return { status: 'will_fail', reason: 'quorum_impossible', quorumMet: false, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
        }
        return { status: 'quorum_not_met', reason: 'awaiting_quorum', quorumMet: false, quorumThreshold, quorumCurrent: participating, quorumNeeded: quorumThreshold - participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }

    // Quorum met — check simple majority of votes cast (yes vs no, abstain excluded)
    // "Will Pass": yes > no AND yes > no + all_undeclared (locked)
    if (forSeats > againstSeats + undeclaredSeats) {
        return { status: 'will_pass', reason: 'majority_locked', quorumMet: true, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }
    // "Will Fail": against >= for + all_undeclared (locked) — even all undeclared voting yes can't flip it
    if (againstSeats >= forSeats + undeclaredSeats) {
        return { status: 'will_fail', reason: 'defeat_locked', quorumMet: true, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }
    // Not locked — show current leader
    if (forSeats > againstSeats) {
        return { status: 'passing', reason: 'majority_current', quorumMet: true, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }
    if (againstSeats > forSeats) {
        return { status: 'failing', reason: 'minority_current', quorumMet: true, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
    }
    // Exact tie: bill will fail unless more yes votes are cast
    return { status: 'tied', reason: 'tied_votes', quorumMet: true, quorumThreshold, quorumCurrent: participating, forSeats, againstSeats, abstainSeats, undeclaredSeats, participating };
}

/**
 * Resolve a bill vote at deadline (or early resolution).
 * Returns: 'passed', 'failed', 'failed_no_quorum', or 'deferred'.
 *
 * @param {object} bill - Bill row with votes_for, votes_against, votes_abstain, bill_type, quorum_failures
 * @param {number} totalSeats - Total parliamentary seats
 */
export function resolveBillVote(bill, totalSeats, nationFlags = {}) {
    const forSeats = bill.votes_for || 0;
    const againstSeats = bill.votes_against || 0;
    const abstainSeats = bill.votes_abstain || 0;
    const participating = forSeats + againstSeats + abstainSeats;
    const quorumPct = (nationFlags.legislative_quorum_override > 0) ? (nationFlags.legislative_quorum_override / 100) : GAME_CONFIG.QUORUM_THRESHOLD;
    const quorumThreshold = Math.ceil(totalSeats * quorumPct);
    const judicialPoliticized = !!nationFlags.judicial_appointment_politicization;

    // Entrenchment clause: elevates ordinary bills to supermajority thresholds
    if (bill.entrenchment_tier && bill.bill_type !== 'foundational') {
        const ratio = bill.entrenchment_tier === 'protected' ? GAME_CONFIG.PROTECTED_THRESHOLD : GAME_CONFIG.SUPERMAJORITY_THRESHOLD;
        const threshold = Math.ceil(totalSeats * ratio);
        return forSeats >= threshold ? 'passed' : 'failed';
    }

    // Foundational / default_resolution / veto_override / impeachment_conviction: supermajority
    if (isSupermajorityBill(bill.bill_type)) {
        let ratio = 2 / 3;
        if (bill.bill_type === 'impeachment_conviction' && judicialPoliticized) {
            ratio = 0.75;
        } else if (bill.bill_type === 'foundational' && nationFlags.constitutional_amendment_streamlining
                   && !bill.proposed_constitutional_amendment_streamlining) {
            ratio = 0.55;
        }
        const threshold = Math.ceil(totalSeats * ratio);
        return forSeats >= threshold ? 'passed' : 'failed';
    }

    // No-confidence / impeachment_motion: absolute majority
    if (isAbsoluteMajorityBill(bill.bill_type)) {
        const threshold = (bill.bill_type === 'no_confidence' && judicialPoliticized)
            ? Math.ceil(totalSeats * 0.6)
            : Math.floor(totalSeats / 2) + 1;
        return forSeats >= threshold ? 'passed' : 'failed';
    }

    // Ordinary bills: quorum + simple majority
    if (participating < quorumThreshold) {
        if ((bill.quorum_failures || 0) >= 1) {
            return 'failed_no_quorum'; // second failure, bill dies
        }
        return 'deferred'; // first failure, extend by 1 tick
    }

    // All abstain edge case: 0 yes, 0 no → bill fails (need affirmative support)
    if (forSeats === 0 && againstSeats === 0) return 'failed';

    // Ties fail — status quo wins
    return forSeats > againstSeats ? 'passed' : 'failed';
}

/**
 * Auto-expire committee bills that have been sitting for COMMITTEE_EXPIRY_TICKS
 * without being sent to the floor. Sets status to 'failed'.
 */
export async function expireCommitteeBills(supabase, nationId, currentTick) {
    const deadline = currentTick - GAME_CONFIG.COMMITTEE_EXPIRY_TICKS;
    const { data: expired, error } = await supabase
        .from('bills')
        .select('id, bill_name, proposed_by')
        .eq('nation_id', nationId)
        .eq('status', 'committee')
        .neq('bill_type', 'default_resolution')  // default resolutions skip committee
        .lte('proposed_tick', deadline);

    if (error || !expired || expired.length === 0) return [];

    // 20270767: insert_news_event RPC was a stub for the (now culled)
    // newspaper surface — never landed on the server side. Removed the
    // RPC call + the nation-name fetch that only fed it, plus the
    // debug console.log.
    const results = [];
    for (const bill of expired) {
        await supabase.from('bills').update({ status: 'failed' }).eq('id', bill.id);
        results.push({ billId: bill.id, billName: bill.bill_name, result: 'expired_committee' });
    }
    return results;
}

/**
 * Check all active floor bills for early majority (for or against).
 * If a definitive majority is detected, lock the outcome and shorten
 * voting_ends_tick to currentTick so the bill resolves immediately
 * in the same tick via resolveExpiredVotes.
 *
 * Must run BEFORE resolveExpiredVotes each tick.
 */
export async function checkEarlyMajority(supabase, nationId) {
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) return [];
    const currentTick = shard.current_tick;

    // Bills still voting, not yet locked, not yet expired
    const { data: activeBills, error } = await supabase
        .from('bills')
        .select('id, bill_name, bill_type, voting_ends_tick, proposed_tick, floor_tick, caucus_votes_withheld, proposed_constitutional_amendment_streamlining, bill_support(faction_id, stance, seat_count)')
        .eq('nation_id', nationId)
        .eq('status', 'floor')
        .is('early_resolution_status', null)
        .or(`voting_ends_tick.gt.${currentTick},voting_ends_tick.is.null`);

    console.log(`[checkEarlyMajority] nation=${nationId} currentTick=${currentTick} found ${activeBills?.length ?? 0} active floor bills (error=${error?.message || 'none'})`);

    if (error || !activeBills || activeBills.length === 0) return [];

    // Use the actual sum of faction seats as the voting denominator, not
    // total_seats.  After seat changes the nation's
    // total_seats can exceed the seats actually held by factions — those
    // vacant/unaligned seats can never vote, so including them would inflate
    // the "undeclared" count and break quorum & math-lock checks.
    const { data: factionRows } = await supabase
        .from('factions')
        .select('seats')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');
    const factionSeatSum = (factionRows || []).reduce((sum, f) => sum + (f.seats || 0), 0);
    const effectiveTotalSeats = Math.min(GAME_CONFIG.TOTAL_SEATS, Math.max(factionSeatSum, 1));

    // Check for Legislative Quorum Reform override and Constitutional Amendment Streamlining
    const { data: nationQuorum } = await supabase.from('nations').select('legislative_quorum_override, constitutional_amendment_streamlining').eq('id', nationId).single();
    const qPct = (nationQuorum?.legislative_quorum_override > 0) ? (nationQuorum.legislative_quorum_override / 100) : GAME_CONFIG.QUORUM_THRESHOLD;
    const hasStreamlining = !!nationQuorum?.constitutional_amendment_streamlining;
    const quorumSeats = Math.ceil(effectiveTotalSeats * qPct);
    const results = [];

    // Check for emergency minority government penalty (once per nation per tick)
    const earlyCoalition = await fetchActiveCoalition(supabase, nationId);
    const minorityPenalty = earlyCoalition?.formation_type === 'emergency_minority';

    for (const bill of activeBills) {
        let yesSeats = 0, noSeats = 0, abstainSeats = 0;
        (bill.bill_support || []).forEach(s => {
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') yesSeats += (s.seat_count || 0);
            else if (stance === 'no') noSeats += (s.seat_count || 0);
            else if (stance === 'abstain') abstainSeats += (s.seat_count || 0);
        });

        // Apply emergency minority penalty to effective YES votes
        let effectiveYes = yesSeats;
        if (minorityPenalty) {
            effectiveYes = Math.floor(yesSeats * 0.8);
        }

        // Apply caucus withheld votes (from opposed internal factions)
        const caucusWithheld = bill.caucus_votes_withheld || 0;
        if (caucusWithheld > 0) {
            effectiveYes = Math.max(0, effectiveYes - caucusWithheld);
        }

        let earlyStatus = null;
        const participating = yesSeats + noSeats + abstainSeats;
        const undeclaredSeats = Math.max(0, effectiveTotalSeats - participating);

        // ── Check 1: Mathematical lock (outcome impossible to change) ──
        if (isSupermajorityBill(bill.bill_type)) {
            // Supermajority threshold — must match resolveBillVote logic:
            // - Veto override uses VETO_OVERRIDE_THRESHOLD
            // - Foundational + streamlining active (not the streamlining bill itself): 55%
            // - Everything else: 67%
            let ratio = GAME_CONFIG.SUPERMAJORITY_THRESHOLD;
            if (bill.bill_type === 'veto_override') {
                ratio = GAME_CONFIG.VETO_OVERRIDE_THRESHOLD;
            } else if (bill.bill_type === 'foundational' && hasStreamlining && !bill.proposed_constitutional_amendment_streamlining) {
                ratio = 0.55;
            }
            const requiredSeats = Math.ceil(effectiveTotalSeats * ratio);
            if (effectiveYes >= requiredSeats) {
                earlyStatus = 'majority_reached';
            } else if (effectiveYes + undeclaredSeats < requiredSeats) {
                earlyStatus = 'majority_opposed';
            }
        } else if (isAbsoluteMajorityBill(bill.bill_type)) {
            // Absolute majority: 50%+1 of total seats, no quorum
            const threshold = Math.floor(effectiveTotalSeats / 2) + 1;
            if (effectiveYes >= threshold) {
                earlyStatus = 'majority_reached';
            } else if (effectiveYes + undeclaredSeats < threshold) {
                earlyStatus = 'majority_opposed';
            }
        } else {
            // Ordinary bill: quorum (50% participation) + simple majority of votes cast
            // Math-lock: YES wins even if all undeclared vote NO
            if (effectiveYes > noSeats + undeclaredSeats) {
                earlyStatus = 'majority_reached';
            // Math-lock: NO wins/ties even if all undeclared vote YES
            } else if (minorityPenalty
                ? noSeats >= Math.floor((yesSeats + undeclaredSeats) * 0.8)
                : noSeats >= yesSeats + undeclaredSeats) {
                earlyStatus = 'majority_opposed';
            }
        }

        // ── Check 2: Quorum-based early resolution (ordinary bills only) ──
        // If not math-locked but quorum is met and a clear majority exists,
        // trigger early resolution with a 1-tick grace period.
        if (!earlyStatus && participating >= quorumSeats) {
            if (bill.bill_type !== 'foundational' && bill.bill_type !== 'default_resolution'
                && bill.bill_type !== 'veto_override'
                && bill.bill_type !== 'no_confidence' && bill.bill_type !== 'impeachment_motion'
                && bill.bill_type !== 'impeachment_conviction') {
                // Ordinary bill: simple majority of votes cast
                if (effectiveYes > noSeats) {
                    earlyStatus = 'quorum_reached';
                } else if (noSeats > effectiveYes) {
                    earlyStatus = 'quorum_opposed';
                }
                // Exact tie at quorum: wait for more votes or deadline
            }
        }

        if (earlyStatus) {
            // Resolve immediately this tick (no grace period)
            const resolveAtTick = Math.min(currentTick, bill.voting_ends_tick);

            await supabase.from('bills').update({
                early_resolution_status: earlyStatus,
                early_resolution_tick: currentTick,
                voting_ends_tick: resolveAtTick,
                votes_for: yesSeats,
                votes_against: noSeats,
                votes_abstain: abstainSeats
            }).eq('id', bill.id);

            const resolveType = earlyStatus.startsWith('quorum') ? 'QUORUM' : 'MATH-LOCK';
            console.log(`[checkEarlyMajority] ${bill.bill_name}: ${earlyStatus} [${resolveType}] (YES=${yesSeats}, NO=${noSeats}, quorum=${quorumSeats}, voted=${participating}, effectiveTotal=${effectiveTotalSeats}, configTotal=${GAME_CONFIG.TOTAL_SEATS}). Resolves tick ${resolveAtTick}`);
            results.push({ billId: bill.id, billName: bill.bill_name, status: earlyStatus, yesSeats, noSeats });
        }
    }

    return results;
}

// ── Constitutional Referendum Resolution ──
// Resolves pending referendums 1+ ticks after referendum_start_tick.
// YES > 50% → bill moves to referendum_approved (sponsor can send to floor).
// NO ≥ 50% → bill fails.
export async function resolveReferendums(supabase, nation, currentTick) {
    const { data: pendingBills, error } = await supabase
        .from('bills')
        .select('id, bill_name, proposed_by, referendum_start_tick, bill_type, proposed_seats, proposed_term_length, proposed_constitutional_reform, proposed_constitutional_amendment_streamlining, entrenchment_tier')
        .eq('nation_id', nation.id)
        .eq('status', 'referendum_pending')
        .eq('referendum_status', 'pending')
        .lte('referendum_start_tick', currentTick - 1);

    if (error || !pendingBills || pendingBills.length === 0) return [];

    const results = [];

    for (const bill of pendingBills) {
        if (bill.proposed_by) {
            const { data: proposer } = await supabase.from('factions').select('id').eq('id', bill.proposed_by).maybeSingle();
            if (!proposer) {
                await supabase.from('bills').update({ status: 'failed', referendum_status: 'resolved', referendum_yes_pct: 0, referendum_no_pct: 100, referendum_turnout_pct: 0 }).eq('id', bill.id);
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed_proposer_disbanded' });
                continue;
            }
        }

        // ── Live nation stats (alpha-refactor canonical names) ─────
        // Replaces the pre-alpha column names that were dropped in
        // 20260430_alpha_stats_phase9 (stability/civil_unrest/polarization/
        // happiness/control-as-stability) — those reads were silently
        // falling to defaults so 4 of 9 sentiment terms contributed nothing.
        var publicApproval     = Number(nation.public_approval ?? 50);
        var unrest             = Number(nation.unrest ?? 50);
        var stateApparatus     = Number(nation.state_apparatus ?? 50);
        var crownAuthority     = nation.crown_authority != null ? Number(nation.crown_authority) : null;
        var budget             = Number(nation.budget ?? 50);
        var debt               = Number(nation.debt ?? 50);
        var sol                = Number(nation.standard_of_living ?? 50);
        var costOfLiving       = Number(nation.cost_of_living ?? 50);
        var gdpGrowth          = Number(nation.gdp_growth ?? 50);
        var wages              = Number(nation.wages ?? 50);
        var health             = Number(nation.health ?? 50);
        var education          = Number(nation.education ?? 50);
        var energy             = Number(nation.energy ?? 50);
        var infrastructure     = Number(nation.infrastructure ?? 50);
        var industry           = Number(nation.industry ?? 50);
        var farmland           = Number(nation.farmland ?? 50);
        var serviceSector      = Number(nation.service_sector ?? 50);
        var minerals           = Number(nation.minerals ?? 50);
        var globalImage        = Number(nation.global_image ?? 50);
        var crime              = Number(nation.crime ?? 50);
        var corruption         = Number(nation.corruption ?? 50);
        var immigration        = Number(nation.immigration ?? 50);
        var skilledWorkers     = Number(nation.skilled_workers ?? 50);
        var unskilledWorkers   = Number(nation.unskilled_workers ?? 50);
        // Tax stats are on the alpha 0-10 scale (down-scaled in
        // 20260430_alpha_stats_phase8_5_1). Threshold is 5, not 50.
        var incomeTax          = Number(nation.income_tax ?? 5);
        var corporateTax       = Number(nation.corporate_tax ?? 5);
        var workforceImbalance = Math.abs(skilledWorkers - unskilledWorkers);

        var crisisCount = 0;
        try {
            const { count } = await supabase
                .from('incidents')
                .select('id', { count: 'exact', head: true })
                .or(`nation_a_id.eq.${nation.id},nation_b_id.eq.${nation.id}`)
                .in('status', ['active', 'mediating']);
            crisisCount = count || 0;
        } catch (_) {}

        var proposerApproval = 50;
        if (bill.proposed_by) {
            try {
                const { data: standing } = await supabase
                    .from('faction_electoral_standing')
                    .select('party_approval')
                    .eq('faction_id', bill.proposed_by)
                    .maybeSingle();
                if (standing) proposerApproval = Number(standing.party_approval ?? 50);
            } catch (_) {}
        }

        var fatiguePenalty = 0;
        try {
            const { count: recentCount } = await supabase
                .from('bills')
                .select('id', { count: 'exact', head: true })
                .eq('nation_id', nation.id)
                .eq('referendum_status', 'resolved')
                .gte('referendum_start_tick', currentTick - 24);
            if (recentCount && recentCount > 0) fatiguePenalty = 10;
        } catch (_) {}

        var yesPct = 50;

        // ── PUSH signals: citizens want change ────────────────────
        // Public mood
        yesPct += Math.max(0, 50 - publicApproval)  * 0.30;
        yesPct += Math.max(0, unrest - 50)          * 0.25;
        // Cost-of-living + fiscal pressure
        yesPct += Math.max(0, costOfLiving - 50)    * 0.15;
        yesPct += Math.max(0, debt - 50)            * 0.10;
        // Institutional decay
        yesPct += Math.max(0, crime - 50)           * 0.10;
        yesPct += Math.max(0, corruption - 50)      * 0.10;
        // Tax burden (0-10 scale, weight ×10 vs 0-100 stats)
        yesPct += Math.max(0, incomeTax - 5)        * 0.50;
        yesPct += Math.max(0, corporateTax - 5)     * 0.50;
        // Quality-of-life deficits
        yesPct += Math.max(0, 50 - sol)             * 0.15;
        yesPct += Math.max(0, 50 - wages)           * 0.10;
        yesPct += Math.max(0, 50 - health)          * 0.05;
        yesPct += Math.max(0, 50 - education)       * 0.05;
        yesPct += Math.max(0, 50 - energy)          * 0.05;
        yesPct += Math.max(0, 50 - infrastructure)  * 0.05;
        // Workforce + demographic pressure
        yesPct += workforceImbalance                * 0.05;
        yesPct += Math.max(0, immigration - 50)     * 0.03;
        // External — proposer popularity, active crises
        yesPct += (proposerApproval - 50)           * 0.20;
        yesPct += crisisCount * 5;

        // ── RESIST signals: status quo holds ──────────────────────
        // Strong state apparatus + growing economy resist change
        yesPct -= Math.max(0, stateApparatus - 50)  * 0.20;
        yesPct -= Math.max(0, gdpGrowth - 50)       * 0.20;
        // Monarchies: healthy crown authority resists. Null = not a
        // monarchy, term skipped.
        if (crownAuthority !== null) {
            yesPct -= Math.max(0, crownAuthority - 50) * 0.15;
        }
        // Fiscal strength, prestige, prosperity
        yesPct -= Math.max(0, budget - 50)          * 0.10;
        yesPct -= Math.max(0, sol - 50)             * 0.10;
        yesPct -= Math.max(0, globalImage - 50)     * 0.10;
        // Economic sector strength
        yesPct -= Math.max(0, industry - 50)        * 0.05;
        yesPct -= Math.max(0, farmland - 50)        * 0.05;
        yesPct -= Math.max(0, serviceSector - 50)   * 0.05;
        yesPct -= Math.max(0, minerals - 50)        * 0.05;
        // Recent referendum fatigue
        yesPct -= fatiguePenalty;

        yesPct = Math.max(15, Math.min(85, yesPct));
        yesPct += (Math.random() - 0.5) * 10;
        yesPct = Math.round(Math.max(5, Math.min(95, yesPct)) * 10) / 10;
        var noPct = Math.round((100 - yesPct) * 10) / 10;

        // Turnout: unrest + dissatisfaction + active crises drive
        // engagement. Polarization was dropped in alpha phase 9 so
        // we use public_approval deficit as the closest live proxy
        // for "people care enough to show up."
        var turnout = 30;
        turnout += Math.max(0, unrest - 50)            * 0.20;
        turnout += crisisCount * 3;
        turnout += Math.max(0, 50 - publicApproval)    * 0.10;
        turnout = Math.max(20, Math.min(45, turnout));
        turnout = Math.round((turnout + (Math.random() - 0.5) * 4) * 10) / 10;
        turnout = Math.max(15, Math.min(50, turnout));

        var passed = yesPct > 50;

        console.log(`[resolveReferendums] ${bill.bill_name}: YES=${yesPct}% NO=${noPct}% turnout=${turnout}% → ${passed ? 'APPROVED' : 'REJECTED'}`);

        if (passed) {
            await supabase.from('bills').update({
                status: 'referendum_approved',
                referendum_status: 'resolved',
                referendum_yes_pct: yesPct,
                referendum_no_pct: noPct,
                referendum_turnout_pct: turnout
            }).eq('id', bill.id);
        } else {
            await supabase.from('bills').update({
                status: 'failed',
                referendum_status: 'resolved',
                referendum_yes_pct: yesPct,
                referendum_no_pct: noPct,
                referendum_turnout_pct: turnout
            }).eq('id', bill.id);
        }

        results.push({ billId: bill.id, billName: bill.bill_name, result: passed ? 'approved' : 'rejected', yesPct, noPct, turnout });
    }

    return results;
}

// ═════════════════════════════════════════════════════════════════════════════
// BILL-TYPE RESOLVERS
//
// Each resolver handles one bill_type branch that used to live as an
// if/else-if inside resolveExpiredVotes. Extracted incrementally (R3, R4, …);
// resolveExpiredVotes will eventually dispatch to these via a map.
//
// Every resolver has the same signature:
//   resolveXBill(supabase, bill, ctx) → Promise<resultEntry>
// where ctx = { passed, currentTick, nation, votesFor, votesAgainst, votesAbstain }
// and resultEntry is the row pushed onto the resolveExpiredVotes results array.
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Resolve a passed/failed minister_confirmation bill (presidential
 * cabinet confirmations). Reads the nominee from
 * bill.metadata.pending_minister (sole source of truth); installs the
 * confirmed minister into ministries; for PM bills also syncs
 * government_formations.ministry_assignments and installs head_of_government.
 *
 * Force-fails (overrides ctx.passed) when:
 *   - bill.metadata.pending_minister is missing
 *   - the nominee's own party voted NO
 */
export async function resolveMinisterConfirmationBill(supabase, bill, ctx) {
    const { currentTick, nation, votesFor, votesAgainst, votesAbstain } = ctx;
    let passed = ctx.passed;

    const mKey = bill.ministry_key;
    const pm = bill.metadata?.pending_minister || null;

    // Fetch the (possibly absent) ministry row — used to know whether to
    // UPDATE or INSERT, and to preserve is_acting for the failed-bill restore
    // path. Never the source of truth for the nominee.
    // Look up without filtering on is_active — see the comment in
    // presidential.js nominateMinister for the rationale (same fix
    // pattern as 20261119_finalize_formation_drop_is_active_filter).
    // The update path below sets is_active = true so an inactive row
    // gets reactivated in place; the insert path only fires for true
    // first-time rows.
    const { data: ministry } = await supabase.from('ministries')
        .select('id, is_acting')
        .eq('nation_id', bill.nation_id).eq('ministry_key', mKey)
        .maybeSingle();

    if (!pm) {
        console.error(`[resolveMinisterConfirmation] bill ${bill.id} (${mKey}) missing bill.metadata.pending_minister. Failing.`);
        passed = false;
    }

    // Auto-fail if the nominee's party itself voted NO.
    const minNomineeVotedNo = pm?.party_id && (bill.bill_support || []).some(s => {
        const st = s.stance === 'reject' ? 'no' : s.stance;
        return s.faction_id === pm.party_id && st === 'no';
    });
    if (minNomineeVotedNo) passed = false;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

        const { data: fullNation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();
        const ministryFields = {
            is_active: true,
            party_id: pm.party_id,
            minister_first_name: pm.first_name,
            minister_last_name: pm.last_name,
            minister_age: pm.age,
            minister_approval: MINISTER_APPROVAL_CONFIG.NEW_MINISTER_APPROVAL,
            ministry_name: MINISTRY_OFFICE_NAMES[mKey] || mKey,
            confirmation_status: 'confirmed',
            pending_minister: null,
            stat_baselines: fullNation ? buildMinistryBaselines(mKey, fullNation) : {},
        };

        if (ministry) {
            const { error: updErr } = await supabase.from('ministries').update(ministryFields).eq('id', ministry.id);
            if (updErr) console.error(`[resolveMinisterConfirmation] ministries update failed for ${mKey}:`, updErr.message);
        } else {
            const { error: insErr } = await supabase.from('ministries').insert({
                nation_id: bill.nation_id,
                ministry_key: mKey,
                is_active: true,
                ...ministryFields,
            });
            if (insErr) console.error(`[resolveMinisterConfirmation] ministries insert failed for ${mKey}:`, insErr.message);
        }

        if (mKey === 'prime_minister') {
            try {
                const { data: activeGovFormation } = await supabase.from('government_formations')
                    .select('id, ministry_assignments')
                    .eq('nation_id', bill.nation_id)
                    .in('status', ['formed', 'active', 'caretaker'])
                    .order('formed_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (activeGovFormation) {
                    const updatedAssignments = { ...(activeGovFormation.ministry_assignments || {}), prime_minister: pm.party_id };
                    await supabase.from('government_formations')
                        .update({ ministry_assignments: updatedAssignments })
                        .eq('id', activeGovFormation.id);
                    console.log(`[resolveMinisterConfirmation] Updated government_formations PM assignment to ${pm.party_id}`);
                }
            } catch (gfErr) { console.warn('[resolveMinisterConfirmation] Failed to update government_formations PM:', gfErr); }

            try {
                await installHOG(supabase, {
                    nationId: bill.nation_id,
                    factionId: pm.party_id,
                    firstName: pm.first_name,
                    lastName: pm.last_name,
                    age: pm.age,
                    currentTick,
                });
                console.log(`[resolveMinisterConfirmation] Installed HOG for confirmed PM ${pm.first_name} ${pm.last_name} (party ${pm.party_id})`);
            } catch (hogErr) {
                console.error('[resolveMinisterConfirmation] HOG install failed:', hogErr.message || hogErr);
            }
        }

        await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, articleCount: 0 });
    } else {
        await failBill(supabase, bill);

        if (ministry) {
            await supabase.from('ministries').update({
                confirmation_status: ministry.is_acting ? 'acting' : 'rejected',
                pending_minister: null,
            }).eq('id', ministry.id);
        }

        await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
    }

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'minister_confirmation',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed governor_confirmation bill (parliamentary
 * confirmation of the Governor of the Central Bank). Reads the nominee from
 * bill.metadata.pending_governor.party_id (sole source of truth); on pass
 * installs the party into the nation's central_bank_governor_* columns. The
 * 8-year (96-tick) term starts when the seat is taken (this tick), not when
 * the nomination was filed.
 *
 * Force-fails (overrides ctx.passed) when:
 *   - bill.metadata.pending_governor is missing
 *   - the nominee's own party voted NO
 */
export async function resolveGovernorConfirmationBill(supabase, bill, ctx) {
    const { currentTick, nation, votesFor, votesAgainst, votesAbstain } = ctx;
    let passed = ctx.passed;

    const pg = bill.metadata?.pending_governor || null;
    if (!pg?.party_id) {
        console.error(`[resolveGovernorConfirmation] bill ${bill.id} missing bill.metadata.pending_governor. Failing.`);
        passed = false;
    }

    // Auto-fail if the nominee's party itself voted NO.
    const nomineeVotedNo = pg?.party_id && (bill.bill_support || []).some(s => {
        const st = s.stance === 'reject' ? 'no' : s.stance;
        return s.faction_id === pg.party_id && st === 'no';
    });
    if (nomineeVotedNo) passed = false;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
        const { error: updErr } = await supabase.from('nations').update({
            central_bank_governor_party_id: pg.party_id,
            central_bank_governor_term_end_tick: currentTick + 96,
        }).eq('id', bill.nation_id);
        if (updErr) console.error('[resolveGovernorConfirmation] nation update failed:', updErr.message);
        await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, articleCount: 0 });
    } else {
        await failBill(supabase, bill);
        await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
    }

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'governor_confirmation',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed no_confidence bill. Thin wrapper around the
 * elections.js domain handler (resolveNoConfidence) plus the standard
 * bills.update / failBill + result-entry bookkeeping.
 */
export async function resolveNoConfidenceBill(supabase, bill, ctx) {
    const { passed, currentTick, votesFor, votesAgainst } = ctx;
    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
    } else {
        await failBill(supabase, bill);
    }
    await resolveNoConfidence(supabase, bill, passed, votesFor, votesAgainst, currentTick);
    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'no_confidence',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed impeachment_motion bill (Phase 1 of impeachment).
 *
 * On pass: advances proceedings to 'trial', applies immediate approval +
 * credibility hits on the president, auto-spawns the Phase 2 conviction
 * bill with a trial voting window, fires PRESIDENT IMPEACHED event.
 *
 * On fail: marks proceeding motion_result='failed', sets the nation-wide
 * impeachment-motion cooldown, penalizes the filer, grants the president
 * vindication bonuses, records a campaign_action row for cooldown tracking,
 * fires IMPEACHMENT MOTION FAILS event.
 */
export async function resolveImpeachmentMotionBill(supabase, bill, ctx) {
    const { passed, currentTick, votesFor, votesAgainst, totalSeats } = ctx;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

        // Motion passed — advance the proceeding to the trial phase.
        await supabase.from('impeachment_proceedings').update({
            phase: 'trial',
            motion_result: 'passed',
        }).eq('id', bill.impeachment_id);

        // Immediate momentum + credibility hit on the president for being impeached.
        const { data: proceedingData } = await supabase.from('impeachment_proceedings')
            .select('president_id').eq('id', bill.impeachment_id).single();
        if (proceedingData) {
            const { data: presidentRow } = await supabase.from('presidents')
                .select('faction_id').eq('id', proceedingData.president_id).single();
            if (presidentRow) {
                await supabase.rpc('adjust_momentum', { p_faction_id: presidentRow.faction_id, p_delta: -5, p_label: 'Impeachment passed (-5)', p_tick: currentTick });
                await adjustCredibility(supabase, presidentRow.faction_id, bill.nation_id, -0.15, 12, currentTick, { source: 'impeachment:passed' });
            }
        }

        // Auto-spawn the conviction bill (Phase 2) — goes straight to floor.
        const seats = totalSeats || GAME_CONFIG.TOTAL_SEATS;
        const { data: convictionBill } = await supabase.from('bills').insert({
            nation_id: bill.nation_id,
            proposed_by: bill.proposed_by,
            proposed_tick: currentTick,
            bill_name: bill.bill_name.replace('Impeachment of', 'Conviction of'),
            bill_type: 'impeachment_conviction',
            status: 'floor',
            voting_ends_tick: currentTick + GAME_CONFIG.IMPEACHMENT_TRIAL_TICKS,
            impeachment_id: bill.impeachment_id,
            preamble: 'The President has been impeached. Parliament must now vote on removal. A 2/3 supermajority (' + Math.ceil(seats * 2 / 3) + ' of ' + seats + ' seats) is required for conviction and removal from office.',
        }).select('id').single();

        if (convictionBill) {
            await supabase.from('impeachment_proceedings').update({
                conviction_bill_id: convictionBill.id,
            }).eq('id', bill.impeachment_id);
        }

        try {
            await supabase.from('event_log').insert({
                nation_id: bill.nation_id,
                event_name: 'PRESIDENT IMPEACHED',
                event_type: 'impeachment',
                category: 'government',
                description_chosen: `Parliament has voted to impeach the President. The motion passed ${votesFor} to ${votesAgainst}. A trial period begins — a 2/3 supermajority vote is required for removal.`,
                fired_at_tick: currentTick,
                effects_applied: { impeachment_id: bill.impeachment_id, votes_for: votesFor, votes_against: votesAgainst },
            });
        } catch (e) { /* non-blocking */ }
    } else {
        await failBill(supabase, bill);

        // Motion failed — close proceeding + apply nation-wide cooldown.
        await supabase.from('impeachment_proceedings').update({
            phase: 'resolved',
            motion_result: 'failed',
            resolved_at_tick: currentTick,
        }).eq('id', bill.impeachment_id);

        await supabase.from('nations').update({
            impeachment_cooldown_until_tick: currentTick + GAME_CONFIG.IMPEACHMENT_MOTION_COOLDOWN_TICKS,
        }).eq('id', bill.nation_id);

        // Filer: partisan-overreach penalty.
        await supabase.rpc('adjust_momentum', { p_faction_id: bill.proposed_by, p_delta: -2, p_label: 'Impeachment failed — initiator (-2)', p_tick: currentTick });
        await adjustCredibility(supabase, bill.proposed_by, bill.nation_id, -0.05, 0, currentTick, { source: 'impeachment:motion_failed' });

        // President: vindication bonus.
        const { data: proc } = await supabase.from('impeachment_proceedings')
            .select('president_id').eq('id', bill.impeachment_id).single();
        if (proc) {
            const { data: presRow } = await supabase.from('presidents')
                .select('faction_id').eq('id', proc.president_id).single();
            if (presRow) {
                await supabase.rpc('adjust_momentum', { p_faction_id: presRow.faction_id, p_delta: 2, p_label: 'Impeachment failed — president vindicated (+2)', p_tick: currentTick });
                await adjustCredibility(supabase, presRow.faction_id, bill.nation_id, 0.03, 0, currentTick, { source: 'impeachment:motion_failed:vindicated' });
            }
        }

        await supabase.from('campaign_actions').insert({
            nation_id: bill.nation_id,
            party_id: bill.proposed_by,
            action_type: 'impeachment_failed',
            tick_performed: currentTick,
            result: { impeachment_id: bill.impeachment_id },
        });

        try {
            await supabase.from('event_log').insert({
                nation_id: bill.nation_id,
                event_name: 'IMPEACHMENT MOTION FAILS',
                event_type: 'impeachment',
                category: 'government',
                description_chosen: `The impeachment motion has failed ${votesFor} to ${votesAgainst}. The President remains in office.`,
                fired_at_tick: currentTick,
                effects_applied: { impeachment_id: bill.impeachment_id, votes_for: votesFor, votes_against: votesAgainst, cooldown_ticks: GAME_CONFIG.IMPEACHMENT_MOTION_COOLDOWN_TICKS },
            });
        } catch (e) { /* non-blocking */ }
    }

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'impeachment_motion',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed impeachment_conviction bill (Phase 2 of impeachment).
 *
 * On pass (convicted): marks proceeding conviction_result='convicted'. Actual
 * presidential removal is handled by processImpeachmentConviction in the
 * tick handler (which needs cross-nation + scheduling context the resolver
 * doesn't have).
 *
 * On fail (acquitted): marks proceeding acquitted, sets long acquittal
 * cooldown, grants the president survived-trial bonuses, boosts national
 * stability, penalizes parties that voted YES on conviction (plus the
 * filer), fires PRESIDENT ACQUITTED event.
 */
export async function resolveImpeachmentConvictionBill(supabase, bill, ctx) {
    const { passed, currentTick, votesFor, votesAgainst, totalSeats } = ctx;
    const seats = totalSeats || GAME_CONFIG.TOTAL_SEATS;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
        await supabase.from('impeachment_proceedings').update({
            phase: 'resolved',
            conviction_result: 'convicted',
            resolved_at_tick: currentTick,
        }).eq('id', bill.impeachment_id);
    } else {
        await failBill(supabase, bill);

        // Acquitted — close proceeding + long cooldown.
        await supabase.from('impeachment_proceedings').update({
            phase: 'resolved',
            conviction_result: 'acquitted',
            resolved_at_tick: currentTick,
        }).eq('id', bill.impeachment_id);

        await supabase.from('nations').update({
            impeachment_cooldown_until_tick: currentTick + GAME_CONFIG.IMPEACHMENT_ACQUITTAL_COOLDOWN_TICKS,
        }).eq('id', bill.nation_id);

        // President: survived-trial bonuses.
        const { data: proc } = await supabase.from('impeachment_proceedings')
            .select('president_id').eq('id', bill.impeachment_id).single();
        if (proc) {
            const { data: presRow } = await supabase.from('presidents')
                .select('faction_id').eq('id', proc.president_id).single();
            if (presRow) {
                await supabase.rpc('adjust_momentum', { p_faction_id: presRow.faction_id, p_delta: 3, p_label: 'Survived impeachment (+3)', p_tick: currentTick });
                await adjustCredibility(supabase, presRow.faction_id, bill.nation_id, 0.05, 0, currentTick, { source: 'impeachment:survived' });
            }
        }

        // Stability recovers +3.
        const { data: natRow } = await supabase.from('nations').select('state_apparatus').eq('id', bill.nation_id).single();
        if (natRow) {
            await supabase.from('nations').update({
                state_apparatus: Math.min(100, Math.round(Number(natRow.state_apparatus || 0) + 3)),
            }).eq('id', bill.nation_id);
        }

        // Parties that voted YES on conviction take -1 approval.
        const yesVoters = (bill.bill_support || []).filter(s => s.stance === 'yes' || s.stance === 'accept');
        for (const v of yesVoters) {
            if (v.faction_id !== bill.proposed_by) {
                await supabase.rpc('adjust_momentum', { p_faction_id: v.faction_id, p_delta: -1, p_label: 'Impeachment survived — yes voter (-1)', p_tick: currentTick });
                await adjustCredibility(supabase, v.faction_id, bill.nation_id, -0.03, 0, currentTick, { source: 'impeachment:survived:accuser' });
            }
        }
        await supabase.rpc('adjust_momentum', { p_faction_id: bill.proposed_by, p_delta: -1, p_label: 'Impeachment survived — initiator (-1)', p_tick: currentTick });
        await adjustCredibility(supabase, bill.proposed_by, bill.nation_id, -0.03, 0, currentTick, { source: 'impeachment:survived:accuser' });

        try {
            await supabase.from('event_log').insert({
                nation_id: bill.nation_id,
                event_name: 'PRESIDENT ACQUITTED',
                event_type: 'impeachment',
                category: 'government',
                description_chosen: `The President has been acquitted. The conviction vote failed ${votesFor} to ${votesAgainst} (needed ${Math.ceil(seats * 2 / 3)}). Full presidential powers are restored.`,
                fired_at_tick: currentTick,
                effects_applied: { impeachment_id: bill.impeachment_id, votes_for: votesFor, votes_against: votesAgainst, cooldown_ticks: GAME_CONFIG.IMPEACHMENT_ACQUITTAL_COOLDOWN_TICKS },
            });
        } catch (e) { /* non-blocking */ }
    }

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'impeachment_conviction',
        earlyResolution: bill.early_resolution_status || null,
    };
}


/**
 * Resolve a passed/failed trade-negotiation ratification bill. Bilateral:
 * waits for the other nation's twin bill; once both pass, creates the
 * trade_agreements row (+ aid_agreement_state for economic aid) and marks
 * the negotiation concluded. On failure: marks negotiation ratification_failed.
 */
export async function resolveTradeRatificationBill(supabase, bill, ctx) {
    const { passed, currentTick, nation, votesFor, votesAgainst, votesAbstain } = ctx;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

        const { data: neg } = await supabase.from('trade_negotiations')
            .select('*').eq('id', bill.trade_negotiation_id).single();

        if (neg) {
            const isNationA = bill.nation_id === neg.nation_a_id;
            const otherBillId = isNationA ? neg.bill_b_id : neg.bill_a_id;

            let otherPassed = false;
            if (otherBillId) {
                const { data: otherBill } = await supabase.from('bills')
                    .select('status').eq('id', otherBillId).single();
                otherPassed = otherBill?.status === 'passed';
            }

            if (otherPassed) {
                const articles = neg.draft_articles || [];
                const durationArt = articles.find(a => a.type === 'duration');
                const durData = durationArt?.data || {};
                const isPermanent = durData.duration_type === 'permanent';
                const durationTicks = durData.duration_ticks || null;
                const autoRenew = durData.auto_renew || false;
                const withdrawalNotice = durData.withdrawal_notice_ticks || 3;

                const nA = neg.nation_a_id < neg.nation_b_id ? neg.nation_a_id : neg.nation_b_id;
                const nB = neg.nation_a_id < neg.nation_b_id ? neg.nation_b_id : neg.nation_a_id;

                const { data: newAgreement, error: taInsertErr } = await supabase.from('trade_agreements').insert({
                    nation_a_id: nA,
                    nation_b_id: nB,
                    negotiation_id: neg.id,
                    bill_a_id: neg.bill_a_id,
                    bill_b_id: neg.bill_b_id,
                    agreement_type: neg.agreement_type,
                    agreement_name: neg.agreement_name || 'Trade Agreement',
                    articles,
                    duration_type: isPermanent ? 'permanent' : 'fixed',
                    duration_ticks: isPermanent ? null : durationTicks,
                    auto_renew: autoRenew,
                    withdrawal_notice_ticks: withdrawalNotice,
                    status: 'active',
                    enacted_at_tick: currentTick,
                    expires_at_tick: isPermanent ? null : (durationTicks ? currentTick + durationTicks : null),
                }).select('id').single();
                if (taInsertErr) console.error('[resolveTradeRatification] trade_agreements insert failed:', taInsertErr.message);

                // Execute one-time `transfer` articles. Previously these were stored
                // in the agreement row but never read, so payments like "Vostia shall
                // make a one-time transfer of $5B to Dravka" silently never landed.
                // Recurring transfers (transfer_type === 'recurring') are intentionally
                // skipped here — they need a per-tick processor (not yet implemented).
                if (newAgreement) {
                    let articlesMutated = false;
                    const agreementForResolve = { nation_a_id: nA, nation_b_id: nB };
                    for (const article of articles) {
                        const data = article?.data || {};
                        // Caller-side filters: only one-time, only unpaid.
                        if (data.transfer_type === 'recurring') continue;
                        if (data.executed_at_tick != null) continue; // idempotent
                        // Endpoint resolution is shared across callsites
                        // (see js/game/diplomacy-constants.js).
                        const endpoints = resolveTransferEndpoints(article, agreementForResolve);
                        if (!endpoints) {
                            if (article?.type === 'transfer' || article?.article_type === 'transfer') {
                                console.error('[resolveTradeRatification] transfer article malformed; skipping', article);
                            }
                            continue;
                        }
                        const { fromNation, toNation, amount } = endpoints;

                        // The agreement is binding: receiver always gets the
                        // full amount. Sender pays from treasury first; any
                        // shortfall becomes debt (matches the discretionary-
                        // grant pattern at bills.js#3543 — money has to come
                        // from somewhere).
                        //
                        // Unit boundary: nation.budget and nation.debt are
                        // abstract integers (1 = $1M raw). `amount` is raw
                        // dollars. Bridge through the imported
                        // RAW_PER_ABSTRACT so comparisons land in raw and
                        // the shortfall lands back in the abstract debt
                        // column.
                        const { data: rows } = await supabase.from('nations')
                            .select('id, budget, debt').in('id', [fromNation, toNation]);
                        const budgets = {};   // abstract
                        const debts = {};     // abstract
                        for (const r of (rows || [])) {
                            budgets[r.id] = Number(r.budget || 0);
                            debts[r.id]   = Number(r.debt   || 0);
                        }
                        const fromBudgetRaw = (budgets[fromNation] ?? 0) * RAW_PER_ABSTRACT;
                        const fromAfter     = Math.max(0, fromBudgetRaw - amount) / RAW_PER_ABSTRACT;
                        const shortfall     = Math.max(0, amount - fromBudgetRaw);
                        const toAfter       = (budgets[toNation] ?? 0) + (amount / RAW_PER_ABSTRACT);
                        const fromDebtAfter = (debts[fromNation] ?? 0) + (shortfall / RAW_PER_ABSTRACT);

                        const { error: fromErr } = await supabase.from('nations')
                            .update({ budget: fromAfter, debt: fromDebtAfter }).eq('id', fromNation);
                        if (fromErr) {
                            console.error('[resolveTradeRatification] transfer debit failed for', fromNation, fromErr.message);
                            continue;
                        }
                        const { error: toErr } = await supabase.from('nations')
                            .update({ budget: toAfter }).eq('id', toNation);
                        if (toErr) {
                            console.error('[resolveTradeRatification] transfer credit failed for', toNation, toErr.message);
                            // Best-effort rollback so the sender doesn't eat the debt without the receiver getting paid.
                            await supabase.from('nations').update({
                                budget: budgets[fromNation] ?? 0,
                                debt:   debts[fromNation]   ?? 0
                            }).eq('id', fromNation);
                            continue;
                        }

                        // Mark as executed in the article so this never fires twice.
                        article.data = { ...data, executed_at_tick: currentTick, executed_amount: amount, executed_via_debt: shortfall };
                        articlesMutated = true;
                        console.log(`[resolveTradeRatification] transfer executed: ${fromNation} → ${toNation}, $${(amount/1e9).toFixed(2)}B (debt portion: $${(shortfall/1e9).toFixed(2)}B)`);
                    }
                    if (articlesMutated) {
                        await supabase.from('trade_agreements').update({ articles }).eq('id', newAgreement.id);
                    }
                }

                if (neg.agreement_type === 'economic_aid' && newAgreement) {
                    const aidTerms = articles.find(a => a.type === 'aid_terms');
                    if (aidTerms) {
                        const donorId = aidTerms.data.donor_nation_id;
                        if (donorId !== nA && donorId !== nB) {
                            console.error(`[resolveTradeRatification] Invalid donor_nation_id ${donorId} — not a party to agreement [${nA}, ${nB}]. Skipping aid_agreement_state.`);
                        } else {
                            const recipientId = donorId === nA ? nB : nA;
                            const annualAmount = Number(aidTerms.data.annual_amount || 0);
                            const { error: aidStateError } = await supabase.from('aid_agreement_state').insert({
                                agreement_id: newAgreement.id,
                                donor_nation_id: donorId,
                                recipient_nation_id: recipientId,
                                current_annual_amount: annualAmount,
                                original_annual_amount: annualAmount,
                                next_review_tick: currentTick + DIPLOMACY_CONFIG.AID_ANNUAL_REVIEW_INTERVAL,
                                condition_failures: {},
                            });
                            if (aidStateError) {
                                console.error('[resolveTradeRatification] Failed to create aid_agreement_state:', aidStateError.message);
                            } else {
                                console.log(`[resolveTradeRatification] Economic aid agreement activated: donor=${donorId}, recipient=${recipientId}, amount=$${(annualAmount/1e9).toFixed(2)}B`);
                            }
                        }
                    }
                }

                const { error: negUpdateErr } = await supabase.from('trade_negotiations')
                    .update({ status: 'concluded', concluded_at_tick: currentTick })
                    .eq('id', neg.id);
                if (negUpdateErr) console.error('[resolveTradeRatification] trade_negotiations concluded update failed:', negUpdateErr.message);
                else console.log('[resolveTradeRatification] Trade agreement activated — negotiation', neg.id, 'marked concluded');

                const { data: rel } = await supabase.from('diplomatic_relations')
                    .select('id, relation_score, active_treaties')
                    .eq('nation_a_id', nA).eq('nation_b_id', nB).maybeSingle();
                if (rel) {
                    const bonus = neg.agreement_type === 'economic_aid' ? DIPLOMACY_CONFIG.AID_RELATION_BONUS : 5;
                    const newScore = Math.max(-100, Math.min(100, (rel.relation_score || 0) + bonus));
                    await supabase.from('diplomatic_relations')
                        .update({ relation_score: newScore }).eq('id', rel.id);
                }

                // Fire the "signed" event — only now, when both ratification
                // bills have passed. The event used to fire client-side at
                // negotiation-approval time (diplomacy.html), which lied to
                // players that the agreement was binding before parliament
                // had voted.
                try {
                    const { data: nationRows } = await supabase.from('nations')
                        .select('id, name').in('id', [nA, nB]);
                    const nameById = {};
                    for (const r of (nationRows || [])) nameById[r.id] = r.name || 'Unknown';
                    const nameA = nameById[nA] || 'Unknown';
                    const nameB = nameById[nB] || 'Unknown';

                    // Goods text: list trade-flow articles' commodities.
                    const tradeGoods = (articles || [])
                        .filter(a => a.article_type === 'trade_flow' && a.data?.commodity)
                        .map(a => TRADE_SECTOR_MAP[a.data.commodity]?.label || a.data.commodity);
                    const uniqueGoods = [...new Set(tradeGoods)];
                    const goodsText = uniqueGoods.length > 0
                        ? ' which involved trade of ' + uniqueGoods.join(', ')
                            + (uniqueGoods.length < (articles || []).length ? ' and other goods' : '')
                        : '';
                    const agreementName = neg.agreement_name || 'Trade Agreement';
                    const signingDesc = nameA + ' and ' + nameB + ' came together and signed the '
                        + agreementName + goodsText + '.';

                    const { error: signedEvtErr } = await supabase.from('event_log').insert(
                        [nA, nB].map(nid => ({
                            nation_id: nid,
                            event_name: agreementName + ' — Signed',
                            trigger_key: 'trade_agreement_signed',
                            category: 'trade',
                            description_chosen: signingDesc,
                            fired_at_tick: currentTick,
                        }))
                    );
                    if (signedEvtErr) {
                        console.warn('[resolveTradeRatification] signed event_log insert failed (non-fatal):', signedEvtErr.message);
                    }
                } catch (sigEvtErr) {
                    console.warn('[resolveTradeRatification] signed-event side effect failed (non-fatal):', sigEvtErr?.message || sigEvtErr);
                }
            }
            // If only one side ratified so far, just leave the negotiation in 'ratification' status.
        }

        await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
    } else {
        await failBill(supabase, bill);
        await supabase.from('trade_negotiations')
            .update({ status: 'ratification_failed' })
            .eq('id', bill.trade_negotiation_id);
        await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
    }

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'trade_ratification',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed retaliatory-tariff ratification bill. Unilateral —
 * imposer nation parliament only. On pass: creates an active trade_agreement
 * row (imposer = nation_a), applies a diplomatic penalty proportional to the
 * max surcharge, fires an enactment event in the target nation. On fail:
 * plain failBill.
 */
export async function resolveRetaliatoryTariffRatificationBill(supabase, bill, ctx) {
    const { passed, currentTick, nation, votesFor, votesAgainst, votesAbstain } = ctx;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

        const rtData = bill.trade_agreement_data;
        const imposerId = rtData.imposer_nation_id;
        const targetId = rtData.target_nation_id;
        const isPermanent = rtData.duration_type === 'permanent';
        const durationTicks = rtData.duration_ticks || null;

        await supabase.from('trade_agreements').insert({
            nation_a_id: imposerId,
            nation_b_id: targetId,
            bill_a_id: bill.id,
            agreement_type: 'retaliatory_tariff',
            agreement_name: rtData.agreement_name || 'Retaliatory Tariff',
            articles: rtData.articles || [],
            duration_type: isPermanent ? 'permanent' : 'fixed',
            duration_ticks: isPermanent ? null : durationTicks,
            auto_renew: false,
            withdrawal_notice_ticks: 1,
            status: 'active',
            enacted_at_tick: currentTick,
            expires_at_tick: isPermanent ? null : (durationTicks ? currentTick + durationTicks : null),
        });

        let maxSurcharge = 0;
        const articles = rtData.articles || [];
        for (const art of articles) {
            if (art.type === 'tariff_surcharge') {
                maxSurcharge = Math.max(maxSurcharge, art.data.surcharge_pct || 0);
            }
        }
        const relPenalty = Math.round(maxSurcharge / 2);

        if (relPenalty > 0) {
            const relA = imposerId < targetId ? imposerId : targetId;
            const relB = imposerId < targetId ? targetId : imposerId;
            const { data: rel } = await supabase.from('diplomatic_relations')
                .select('id, relation_score')
                .eq('nation_a_id', relA).eq('nation_b_id', relB).maybeSingle();
            if (rel) {
                const newScore = Math.max(-100, Math.min(100, (rel.relation_score || 0) - relPenalty));
                await supabase.from('diplomatic_relations')
                    .update({ relation_score: newScore }).eq('id', rel.id);
            }
        }

        try {
            const { data: imposerNation } = await supabase.from('nations').select('name').eq('id', imposerId).single();
            const imposerName = imposerNation?.name || 'Unknown';
            await supabase.from('event_log').insert({
                nation_id: targetId,
                event_name: 'Retaliatory Tariff Enacted',
                trigger_key: 'sanctions_imposed',
                category: 'Trade',
                description_chosen: imposerName + ' has enacted a retaliatory tariff on your exports. Relations have decreased by ' + relPenalty + '.',
                fired_at_tick: currentTick,
            });
        } catch (e) { /* non-blocking */ }

        await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
    } else {
        await failBill(supabase, bill);
        await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
    }

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'retaliatory_tariff',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed embargo ratification bill. Unilateral — imposer
 * nation parliament only. On pass: creates an active trade_agreement row,
 * applies a diplomatic penalty (20 + 5 per embargoed sector), fires an
 * enactment event in the target nation. On fail: plain failBill.
 */
export async function resolveEmbargoRatificationBill(supabase, bill, ctx) {
    const { passed, currentTick, nation, votesFor, votesAgainst, votesAbstain } = ctx;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);

        const embData = bill.trade_agreement_data;
        const imposerId = embData.imposer_nation_id;
        const targetId = embData.target_nation_id;
        const durationTicks = embData.duration_ticks || 12;

        await supabase.from('trade_agreements').insert({
            nation_a_id: imposerId,
            nation_b_id: targetId,
            bill_a_id: bill.id,
            agreement_type: 'impose_embargo',
            agreement_name: embData.agreement_name || 'Embargo',
            articles: embData.articles || [],
            duration_type: 'fixed',
            duration_ticks: durationTicks,
            auto_renew: false,
            withdrawal_notice_ticks: 1,
            status: 'active',
            enacted_at_tick: currentTick,
            expires_at_tick: currentTick + durationTicks,
        });

        const embargoedSectors = (embData.articles || []).filter(a => a.type === 'embargo_sector').length;
        const relPenalty = Math.round(20 + embargoedSectors * 5);

        if (relPenalty > 0) {
            const relA = imposerId < targetId ? imposerId : targetId;
            const relB = imposerId < targetId ? targetId : imposerId;
            const { data: rel } = await supabase.from('diplomatic_relations')
                .select('id, relation_score')
                .eq('nation_a_id', relA).eq('nation_b_id', relB).maybeSingle();
            if (rel) {
                const newScore = Math.max(-100, Math.min(100, (rel.relation_score || 0) - relPenalty));
                await supabase.from('diplomatic_relations')
                    .update({ relation_score: newScore }).eq('id', rel.id);
            }
        }

        try {
            const { data: imposerNation } = await supabase.from('nations').select('name').eq('id', imposerId).single();
            const imposerName = imposerNation?.name || 'Unknown';
            await supabase.from('event_log').insert({
                nation_id: targetId,
                event_name: 'Embargo Enacted',
                trigger_key: 'sanctions_imposed',
                category: 'Trade',
                description_chosen: imposerName + ' has imposed an embargo on your trade. Relations have decreased by ' + relPenalty + '.',
                fired_at_tick: currentTick,
            });
        } catch (e) { /* non-blocking */ }

        await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
    } else {
        await failBill(supabase, bill);
        await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
    }

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'impose_embargo',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed sovereign-default_resolution bill.
 *
 * Thin dispatcher: the heavy economic effects (cross-nation contagion,
 * creditor payouts, credit-rating updates) live in handler-template.ts
 * (enactSovereignDefault / handleFailedDefaultResolution) because they
 * need cross-nation + tick-scheduling context the resolver lacks. The
 * typeof guard means client-side callers that don't bundle those
 * functions (admin.html, laws.html) see a no-op enactment while the
 * tick handler owns the real consequences.
 */
export async function resolveDefaultResolutionBill(supabase, bill, ctx) {
    const { passed, currentTick, nation, votesFor, votesAgainst } = ctx;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
        if (typeof enactSovereignDefault === 'function') {
            try {
                await enactSovereignDefault(supabase, bill, currentTick);
            } catch (defaultErr) {
                console.error(`[resolveDefaultResolution] enactSovereignDefault failed for bill ${bill.id}:`, defaultErr);
            }
        }
    } else {
        await failBill(supabase, bill);
        if (typeof handleFailedDefaultResolution === 'function') {
            try {
                await handleFailedDefaultResolution(supabase, bill, currentTick);
            } catch (failErr) {
                console.error(`[resolveDefaultResolution] handleFailedDefaultResolution failed for bill ${bill.id}:`, failErr);
            }
        }
    }
    await fireBillEvent(supabase, passed ? 'bill_passed' : 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, articleCount: 0 });

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'default_resolution',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed veto_override bill (Presidential systems).
 *
 * On pass: marks this bill passed and ENACTS the ORIGINAL (vetoed) bill
 * via enactBill, bypassing the president's desk entirely. If the
 * original's enactment fails, both bills are marked failed with an
 * explanatory event on the original. On fail: the veto holds —
 * the original stays failed forever (cannot be re-vetoed-overridden).
 */
export async function resolveVetoOverrideBill(supabase, bill, ctx) {
    const { passed, currentTick, nation, votesFor, votesAgainst, votesAbstain } = ctx;

    if (passed) {
        await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
        // Enact the ORIGINAL vetoed bill — bypasses president's desk.
        const { data: originalBill } = await supabase.from('bills')
            .select('*, factions(faction_name), bill_articles(*, policies(*), selected_option:policy_options!selected_option_id(*)), bill_support(*, factions(faction_name))')
            .eq('id', bill.original_bill_id).single();
        if (originalBill) {
            await supabase.from('bills').update({ president_action: 'overridden' }).eq('id', originalBill.id);
            const enactment = await enactBill(supabase, originalBill, currentTick);
            if (!enactment?.success) {
                await markBillEnactmentFailed(supabase, originalBill, currentTick, enactment?.error || 'Unknown enactment failure');
                await fireBillEvent(supabase, 'bill_failed', originalBill, { currentTick, nationName: nation?.name, votesFor: 0, votesAgainst: 0, billNameOverride: `${originalBill.bill_name} (override enactment failed)` });
            }
        }
        await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: 0 });
    } else {
        await failBill(supabase, bill);
        // Original bill dies with the override — it can never pass now.
        if (bill.original_bill_id) {
            await supabase.from('bills').update({ status: 'failed', passed_tick: currentTick }).eq('id', bill.original_bill_id);
        }
        await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
    }

    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: passed ? 'passed' : 'failed',
        votesFor,
        votesAgainst,
        type: 'veto_override',
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve a passed/failed foundational bill (constitutional amendments,
 * electoral reform, etc.).
 *
 * Three outcomes:
 *   - passed vote + enactment succeeds → result='passed'
 *   - passed vote + enactment fails → warn, result='failed', NO failBill call
 *     (enactFoundationalBill is responsible for whatever cleanup it needs;
 *     the bill row may stay in whatever intermediate state it left behind)
 *   - failed vote → failBill, result='failed'
 *
 * The heavy lifting — constitutional-system transitions, HOG deactivation,
 * election scheduling, stat side-effects — lives inside enactFoundationalBill.
 */
export async function resolveFoundationalBill(supabase, bill, ctx) {
    const { passed, currentTick, nation, votesFor, votesAgainst, votesAbstain } = ctx;

    // Vote failed → mark + fire generic bill_failed.
    if (!passed) {
        await failBill(supabase, bill);
        await fireBillEvent(supabase, 'bill_failed', bill, {
            currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain,
            articleCount: 0,
        });
        return {
            billId: bill.id, billName: bill.bill_name, result: 'failed',
            votesFor, votesAgainst, type: 'foundational',
            earlyResolution: bill.early_resolution_status || null,
        };
    }

    // Vote passed — try to enact. Wrap in try/catch so a thrown
    // exception still produces a clean failed_enactment outcome
    // (mirrors resolveOrdinaryBill's parliamentary branch).
    let enacted = false;
    let enactError = null;
    try {
        enacted = await enactFoundationalBill(supabase, bill, currentTick);
    } catch (enactErr) {
        console.error(`[resolveFoundationalBill] enactFoundationalBill threw for bill ${bill.id} ("${bill.bill_name}"):`, enactErr);
        enactError = `enactFoundationalBill threw: ${enactErr?.message || enactErr}`;
        enacted = false;
    }

    if (enacted) {
        await fireBillEvent(supabase, 'bill_passed', bill, {
            currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain,
            articleCount: 0,
        });
        return {
            billId: bill.id, billName: bill.bill_name, result: 'passed',
            votesFor, votesAgainst, type: 'foundational',
            earlyResolution: bill.early_resolution_status || null,
        };
    }

    // Vote passed but enactment failed. Mark bill failed with a clear
    // status so /bills filtering works, and fire bill_failed with an
    // override label so the news feed says "X (enactment failed)"
    // instead of the misleading plain "Bill Failed". Each enactor
    // already console.warn/console.error's the specific reason; the
    // edge-function logs are the next debug surface.
    console.warn(`[resolveFoundationalBill] Foundational bill ${bill.id} ("${bill.bill_name}") had enough votes but enactment failed.${enactError ? ' ' + enactError : ''}`);
    await markBillEnactmentFailed(supabase, bill, currentTick, enactError || 'Enactor returned false');
    await fireBillEvent(supabase, 'bill_failed', bill, {
        currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain,
        articleCount: 0,
        billNameOverride: `${bill.bill_name} (enactment failed)`,
    });
    return {
        billId: bill.id, billName: bill.bill_name, result: 'failed_enactment',
        votesFor, votesAgainst, type: 'foundational',
        error: enactError,
        earlyResolution: bill.early_resolution_status || null,
    };
}

/**
 * Resolve an ordinary bill (the catch-all: regular policy bills, repeals,
 * everything not matched by a specialized resolver).
 *
 * Branches:
 *   - Presidential (hasElectedPresident): route to president's desk —
 *     bills.update status='president_desk' with a deadline. The president's
 *     desk processor picks it up for sign/veto/auto-sign.
 *   - Parliamentary (no elected president): enact immediately via enactBill.
 *     If enactment fails, the bill is marked failed_enactment with an
 *     explanatory event; otherwise status=passed and effects applied.
 *   - Failed: plain failBill + event.
 *
 * Note: the absolute-monarchy early-continue for passed ordinary bills
 * (awaiting_royal_assent) is handled upstream in resolveExpiredVotes —
 * those bills never reach this resolver.
 *
 * Return entry lacks a `type` field (no existing consumer sets one for
 * ordinary bills), and the pass path may yield result='president_desk',
 * 'passed', or 'failed_enactment' depending on the sub-branch taken.
 */
export async function resolveOrdinaryBill(supabase, bill, ctx) {
    const { passed, currentTick, nation, votesFor, votesAgainst, votesAbstain } = ctx;

    if (passed) {
        if (hasElectedPresident(nation)) {
            await supabase.from('bills').update({
                status: 'president_desk',
                passed_tick: currentTick,
                president_desk_deadline: currentTick + GAME_CONFIG.PRESIDENT_DESK_TICKS,
            }).eq('id', bill.id);
            await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, articleCount: (bill.bill_articles || []).length });
            return {
                billId: bill.id,
                billName: bill.bill_name,
                result: 'president_desk',
                votesFor,
                votesAgainst,
                earlyResolution: bill.early_resolution_status || null,
            };
        }
        // Parliamentary: enact immediately. Wrap enactBill in try/catch so a
        // thrown exception still produces a clean failed_enactment result.
        let enactment;
        try {
            enactment = await enactBill(supabase, bill, currentTick);
        } catch (enactErr) {
            console.error(`[resolveOrdinaryBill] enactBill threw for bill ${bill.id} ("${bill.bill_name}"):`, enactErr);
            enactment = { success: false, error: `enactBill threw: ${enactErr?.message || enactErr}` };
        }
        if (!enactment?.success) {
            await markBillEnactmentFailed(supabase, bill, currentTick, enactment?.error || 'Unknown enactment failure');
            await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, billNameOverride: `${bill.bill_name} (enactment failed)` });
            return {
                billId: bill.id,
                billName: bill.bill_name,
                result: 'failed_enactment',
                votesFor,
                votesAgainst,
                error: enactment?.error,
                earlyResolution: bill.early_resolution_status || null,
            };
        }
        await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, articleCount: (bill.bill_articles || []).length });
        return {
            billId: bill.id,
            billName: bill.bill_name,
            result: 'passed',
            votesFor,
            votesAgainst,
            earlyResolution: bill.early_resolution_status || null,
        };
    }
    // Failed
    await failBill(supabase, bill);
    await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
    return {
        billId: bill.id,
        billName: bill.bill_name,
        result: 'failed',
        votesFor,
        votesAgainst,
        earlyResolution: bill.early_resolution_status || null,
    };
}


// ─── Bill resolver dispatch ─────────────────────────────────────────────────
//
// Single source of truth for "which resolver handles which bill_type".
// Each entry is a selector (bill) → resolver | null. A null return means
// the bill_type is recognized but the specific sub-shape isn't — fall back
// to resolveOrdinaryBill.
//
// This mirrors BILL_TYPE_SPECS (threshold side, R2) on the dispatch side.
const BILL_RESOLVERS = Object.freeze({
    no_confidence:          ()  => resolveNoConfidenceBill,
    foundational:           ()  => resolveFoundationalBill,
    default_resolution:     ()  => resolveDefaultResolutionBill,
    minister_confirmation:  (b) => b.ministry_key       ? resolveMinisterConfirmationBill   : null,
    governor_confirmation:  (b) => b.metadata?.pending_governor ? resolveGovernorConfirmationBill : null,
    veto_override:          (b) => b.original_bill_id   ? resolveVetoOverrideBill           : null,
    impeachment_motion:     (b) => b.impeachment_id     ? resolveImpeachmentMotionBill      : null,
    impeachment_conviction: (b) => b.impeachment_id     ? resolveImpeachmentConvictionBill  : null,
    ratification:           (b) => {
        if (b.trade_negotiation_id)                                return resolveTradeRatificationBill;
        if (b.trade_agreement_data?.type === 'retaliatory_tariff') return resolveRetaliatoryTariffRatificationBill;
        if (b.trade_agreement_data?.type === 'impose_embargo')     return resolveEmbargoRatificationBill;
        return null;
    },
});

export function selectBillResolver(bill) {
    const selector = BILL_RESOLVERS[bill?.bill_type];
    const resolver = selector ? selector(bill) : null;
    return resolver || resolveOrdinaryBill;
}

export async function resolveExpiredVotes(supabase, nationId) {
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) return [];
    const currentTick = shard.current_tick;

    // Load nation flags for authoritarian law threshold overrides
    const { data: nationForFlags } = await supabase.from('nations').select('legislative_quorum_override, judicial_appointment_politicization, constitutional_amendment_streamlining').eq('id', nationId).single();
    const effectiveQuorumPct = (nationForFlags?.legislative_quorum_override > 0) ? (nationForFlags.legislative_quorum_override / 100) : GAME_CONFIG.QUORUM_THRESHOLD;
    const nationFlags = {
        judicial_appointment_politicization: !!nationForFlags?.judicial_appointment_politicization,
        legislative_quorum_override: nationForFlags?.legislative_quorum_override || 0,
        constitutional_amendment_streamlining: !!nationForFlags?.constitutional_amendment_streamlining
    };

    const { data: expiredBills, error } = await supabase
        .from('bills')
        // Simplified query: bill_support only needs faction_id/stance/seat_count for vote
        // tallying. Nesting factions() inside bill_support adds a FK join that can cause
        // the entire query to fail silently in PostgREST, leaving all bills stuck on floor.
        // Phase 4.1: also embed the chosen option for every policy article so
        // enactBill knows which option's effects to fire downstream.
        .select('*, factions(faction_name), bill_articles(*, policies(*), selected_option:policy_options!selected_option_id(*)), bill_support(faction_id, stance, seat_count)')
        .eq('nation_id', nationId)
        .eq('status', 'floor')
        .lte('voting_ends_tick', currentTick);

    console.log(`[resolveExpiredVotes] nation=${nationId} currentTick=${currentTick} query returned ${expiredBills?.length ?? 0} bills (error=${error?.message || 'none'})`);
    if (expiredBills && expiredBills.length > 0) {
        for (const b of expiredBills) {
            console.log(`[resolveExpiredVotes]   bill=${b.id} "${b.bill_name}" type=${b.bill_type} voting_ends=${b.voting_ends_tick} early_status=${b.early_resolution_status} support_count=${(b.bill_support||[]).length}`);
        }
    }

    if (error || !expiredBills || expiredBills.length === 0) return [];

    const results = [];

    // Compute the actual sum of faction-held seats — only these can vote.
    // After seat changes total_seats can exceed the
    // seats held by factions; including vacant/unaligned seats inflates
    // quorum and makes bills impossible to pass.
    const { data: factionRowsForResolve } = await supabase
        .from('factions')
        .select('seats')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');
    const resolveFactionSeatSum = (factionRowsForResolve || []).reduce((sum, f) => sum + (f.seats || 0), 0);

    for (const bill of expiredBills) {
      try {
        const { data: nation } = await supabase
            .from('nations')
            .select('name, government_type, total_seats')
            .eq('id', bill.nation_id)
            .single();
        const nominalTotalSeats = nation?.total_seats || GAME_CONFIG.TOTAL_SEATS;
        const totalSeats = Math.min(nominalTotalSeats, Math.max(resolveFactionSeatSum, 1));
        let votesFor = 0, votesAgainst = 0, votesAbstain = 0;

        (bill.bill_support || []).forEach(s => {
            // Normalize committee stances: 'accept' → 'yes', 'reject' → 'no'
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') votesFor += (s.seat_count || 0);
            else if (stance === 'no') votesAgainst += (s.seat_count || 0);
            else if (stance === 'abstain') votesAbstain += (s.seat_count || 0);
        });

        // Sync vote tallies to bills table (client-side syncVoteTallies only
        // runs on manual votes — tick processor must persist tallies too)
        await supabase.from('bills').update({
            votes_for: votesFor,
            votes_against: votesAgainst,
            votes_abstain: votesAbstain
        }).eq('id', bill.id);

        // Emergency minority government penalty: -20% effective YES votes
        const activeCoalition = await fetchActiveCoalition(supabase, bill.nation_id);
        let effectiveVotesFor = votesFor;
        if (activeCoalition?.formation_type === 'emergency_minority') {
            effectiveVotesFor = Math.floor(votesFor * 0.8);
            console.log(`[MinorityPenalty] ${bill.bill_name}: votesFor ${votesFor} → ${effectiveVotesFor} (emergency minority -20%)`);
        }

        // Phase 5b: caucus system removed. Vote adjustment by opposed-caucus
        // whipping is gone with the caucus_factions / caucus_dispositions tables.

        // Determine pass/fail using new quorum + majority system
        // Build a bill-like object with effective votes for the resolve function
        const resolveBill = {
            ...bill,
            votes_for: effectiveVotesFor,
            votes_against: votesAgainst,
            votes_abstain: votesAbstain,
            quorum_failures: bill.quorum_failures || 0
        };
        const resolution = resolveBillVote(resolveBill, totalSeats, nationFlags);
        console.log(`[resolveExpiredVotes] bill=${bill.id} votes yes=${votesFor} no=${votesAgainst} abstain=${votesAbstain} effective_yes=${effectiveVotesFor} totalSeats=${totalSeats} resolution=${resolution}`);

        // Handle quorum deferral: extend vote by 1 tick
        if (resolution === 'deferred') {
            const newDeadline = currentTick + 1;
            await supabase.from('bills').update({
                quorum_failures: (bill.quorum_failures || 0) + 1,
                voting_ends_tick: newDeadline
            }).eq('id', bill.id);

            // Notify all party leaders about quorum failure
            const quorumThreshold = Math.ceil(totalSeats * effectiveQuorumPct);
            const participating = votesFor + votesAgainst + votesAbstain;
            try {
                await supabase.rpc('fire_system_event', {
                    p_trigger_key: 'quorum_failed',
                    p_nation_id: bill.nation_id,
                    p_tick: currentTick,
                    p_placeholders: {
                        bill_name: bill.bill_name,
                        participating: String(participating),
                        quorum_needed: String(quorumThreshold),
                        nation: nation?.name || 'Unknown'
                    }
                });
            } catch (e) { /* non-blocking if event key doesn't exist yet */ }

            console.log(`[resolveExpiredVotes] ${bill.bill_name}: quorum not met (${participating}/${quorumThreshold}), deferred to tick ${newDeadline}`);
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'deferred', votesFor, votesAgainst, votesAbstain, type: bill.bill_type });
            continue;
        }

        // Handle second quorum failure: bill dies
        if (resolution === 'failed_no_quorum') {
            await failBill(supabase, bill);
            await syncFailedMinisterConfirmationBill(supabase, bill);
            const quorumThreshold = Math.ceil(totalSeats * effectiveQuorumPct);
            const participating = votesFor + votesAgainst + votesAbstain;
            await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, extra: { reason: `quorum not met after two attempts (${participating}/${quorumThreshold} participating)` } });
            console.log(`[resolveExpiredVotes] ${bill.bill_name}: quorum failed twice (${participating}/${quorumThreshold}), bill dies`);
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed_no_quorum', votesFor, votesAgainst, votesAbstain, type: bill.bill_type });
            continue;
        }

        let passed = resolution === 'passed';
        const isNoConfidence = bill.bill_type === 'no_confidence';
        const isFoundational = bill.bill_type === 'foundational';

        // Absolute Monarchy: ordinary bills that pass go to royal assent instead of auto-enacting.
        // The royal_assent_deadline gives processRoyalAssent (advance-tick) a tick
        // to auto-enact if the Monarch never acts — without it, an inactive
        // Monarch could freeze every passed bill in the nation indefinitely.
        //
        // 'ratification' is excluded: bilateral by design (trade negotiations,
        // diplomatic proposals, retaliatory tariffs, embargos all need both
        // parliaments to flip status='passed' on the same tick so each side's
        // resolveX_RatificationBill can see the other side as 'passed' and
        // create the trade_agreements / activate the pipeline). Routing
        // through royal assent parks the bill in 'awaiting_royal_assent' for
        // ROYAL_ASSENT_TICKS, during which the OTHER parliament's mirror bill
        // resolves, sees the stale status, and bails out of the bilateral
        // activation. By the time the monarch decides, neither side's
        // resolver runs and the agreement silently never lands. Domestic
        // policy bills still go through royal assent — only the bilateral
        // ratification path bypasses, which matches real-world constitutional
        // convention (parliaments ratify treaties; sovereigns sign laws).
        const isMonarchy = isAbsoluteMonarchy(nation);
        const isOrdinaryBill = !isNoConfidence && !isFoundational
            && bill.bill_type !== 'impeachment_motion' && bill.bill_type !== 'impeachment_conviction'
            && bill.bill_type !== 'veto_override' && bill.bill_type !== 'default_resolution'
            && bill.bill_type !== 'ratification';
        if (isMonarchy && passed && isOrdinaryBill) {
            await supabase.from('bills').update({
                status: 'awaiting_royal_assent',
                votes_for: votesFor,
                votes_against: votesAgainst,
                votes_abstain: votesAbstain,
                royal_assent_deadline: currentTick + GAME_CONFIG.ROYAL_ASSENT_TICKS,
            }).eq('id', bill.id);
            results.push({ billId: bill.id, billName: bill.bill_name, resolution: 'awaiting_royal_assent', votesFor, votesAgainst });
            continue; // skip normal enactment — monarch decides
        }

        // Dispatch to the per-bill-type resolver. BILL_RESOLVERS is the single
        // source of truth for routing; selectBillResolver falls back to
        // resolveOrdinaryBill for unknown types or sub-shapes that don't match.
        const resolver = selectBillResolver(bill);
        const entry = await resolver(supabase, bill, {
            passed, currentTick, nation, votesFor, votesAgainst, votesAbstain, totalSeats,
        });
        results.push(entry);

        // ── Bill momentum: award momentum to YES/NO voters based on outcome ──
        // Sponsor: +1 on passage. YES voters: +2/article on pass, -1 on fail.
        // NO voters: +2/article on fail. Abstain: nothing.
        // Skip momentum for special bill types and presidential desk (not yet enacted)
        const lastResult = results[results.length - 1];
        const skipMomentum = ['no_confidence', 'minister_confirmation', 'governor_confirmation', 'impeachment_conviction'].includes(bill.bill_type)
            || lastResult?.result === 'president_desk';
        if (!skipMomentum) {
            try {
                const billPassed = lastResult?.result === 'passed';
                const supports = bill.bill_support || [];

                for (const s of supports) {
                    const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
                    let delta = 0;
                    let label = '';

                    if (stance === 'yes' && billPassed) {
                        delta = 1;
                        label = `Bill passed: ${(bill.bill_name || '').slice(0, 25)}… (+1)`;
                    } else if (stance === 'yes' && !billPassed) {
                        delta = -1;
                        label = `Bill failed: ${(bill.bill_name || '').slice(0, 25)}… (-1)`;
                    } else if (stance === 'no' && !billPassed) {
                        delta = 1;
                        label = `Bill failed: ${(bill.bill_name || '').slice(0, 25)}… (+1)`;
                    }
                    // NO voters on passing bills: no penalty (removed — opposition shouldn't be punished for opposing)

                    if (delta !== 0) {
                        await supabase.rpc('adjust_momentum', {
                            p_faction_id: s.faction_id,
                            p_delta: delta,
                            p_label: label,
                            p_tick: currentTick
                        });
                    }
                }

                // Sponsor bonus: +1 on passage (opposition only), -2 on failure
                // Government sponsors get +0 — they already benefit from legislative success
                if (billPassed && bill.proposed_by) {
                    const sponsorCoalition = await fetchActiveCoalition(supabase, bill.nation_id);
                    const isGovSponsor = sponsorCoalition?.party_ids?.includes(bill.proposed_by);
                    if (!isGovSponsor) {
                        await supabase.rpc('adjust_momentum', {
                            p_faction_id: bill.proposed_by,
                            p_delta: 1,
                            p_label: `Sponsored bill passed (opposition): ${(bill.bill_name || '').slice(0, 25)}… (+1)`,
                            p_tick: currentTick
                        });
                    }
                } else if (!billPassed && bill.proposed_by) {
                    await supabase.rpc('adjust_momentum', {
                        p_faction_id: bill.proposed_by,
                        p_delta: -2,
                        p_label: `Sponsored bill failed: ${(bill.bill_name || '').slice(0, 25)}… (-2)`,
                        p_tick: currentTick
                    });
                }
            } catch (momErr) {
                console.warn(`[resolveExpiredVotes] Momentum awards failed for bill ${bill.id}:`, momErr.message);
            }
        }

        // Guardrail: resolved bills must not remain on the floor after this function.
        // If any branch forgets to persist status, fail closed so the bill leaves the active queue.
        try {
            const { data: persistedBill, error: persistedErr } = await supabase
                .from('bills')
                .select('id, status, voting_ends_tick')
                .eq('id', bill.id)
                .single();
            if (persistedErr) {
                throw new Error(`post-resolution read failed: ${persistedErr.message}`);
            }
            if (persistedBill && persistedBill.status === 'floor' && persistedBill.voting_ends_tick != null && persistedBill.voting_ends_tick <= currentTick) {
                throw new Error(`bill ${bill.id} remained on floor after resolution (voting_ends_tick=${persistedBill.voting_ends_tick}, tick=${currentTick})`);
            }
        } catch (persistCheckErr) {
            console.error('[resolveExpiredVotes] Persistence guard tripped:', persistCheckErr);
            throw persistCheckErr;
        }

        // ── Bloc vote-cohesion check ──
        // Route every resolved bill through the one RPC that knows how to
        // detect within-bloc YES-vs-NO splits, bump dissent_count, and
        // dissolve at 3. Abstains and no-votes don't count. Safe to fail —
        // resolveExpiredVotes won't re-pick this bill (status moved off
        // 'floor' in the resolver above), so a transient failure here
        // misses ONE bill's cohesion check rather than double-counting it.
        try {
            await supabase.rpc('process_bloc_vote_cohesion', { p_bill_id: bill.id });
        } catch (cohErr) {
            console.warn(`[resolveExpiredVotes] Bloc vote-cohesion failed for bill ${bill.id}:`, cohErr?.message || cohErr);
        }

        // ── No-vote penalty: punish factions that didn't cast any vote ──
        try {
            const penalized = await applyNoVotePenalty(supabase, bill, bill.nation_id, currentTick);
            if (penalized.length > 0) {
                const names = penalized.map(p => `${p.factionName} (${p.approvalLoss} approval, ${p.visibilityLoss} vis, ${p.credibilityLoss} cred)`).join(', ');
                console.log(`[resolveExpiredVotes] No-vote penalty on "${bill.bill_name}": ${names}`);
                try {
                    await supabase.rpc('fire_system_event', {
                        p_trigger_key: 'no_vote_penalty',
                        p_nation_id: bill.nation_id,
                        p_tick: currentTick,
                        p_placeholders: {
                            bill_name: bill.bill_name,
                            party_names: penalized.map(p => p.factionName).join(', '),
                            party_count: String(penalized.length)
                        }
                    });
                } catch (e) { /* non-blocking if event key doesn't exist yet */ }
            }
        } catch (penaltyErr) {
            console.error(`[resolveExpiredVotes] No-vote penalty failed for bill ${bill.id}:`, penaltyErr.message);
        }

        // Phase 5b: caucus relationship updates removed (caucus tables gone).
      } catch (billErr) {
        // Per-bill error handler: prevents one bill's failure from blocking all others
        console.error(`[resolveExpiredVotes] UNHANDLED error processing bill ${bill.id} ("${bill.bill_name}"):`, billErr);
        try {
            await markBillEnactmentFailed(supabase, bill, currentTick, `Unhandled error: ${billErr?.message || billErr}`);
        } catch (_) {
            // Even the fallback failed — bill stays on floor, will retry next tick
            console.error(`[resolveExpiredVotes] Failed to mark bill ${bill.id} as failed after unhandled error`);
        }
        results.push({ billId: bill.id, billName: bill.bill_name, result: 'error', error: String(billErr) });
      }
    }

    // ── Cleanup orphaned vetoed bills ──
    // If a vetoed bill has no pending override vote (the override was already
    // resolved or was never created), fail the vetoed bill so its policies
    // are freed for reuse. Runs every tick as a safety net.
    try {
        const { data: orphanedVetoes } = await supabase
            .from('bills')
            .select('id')
            .eq('nation_id', nationId)
            .eq('status', 'vetoed');

        for (const vb of (orphanedVetoes || [])) {
            const { data: pendingOverride } = await supabase
                .from('bills')
                .select('id')
                .eq('original_bill_id', vb.id)
                .eq('bill_type', 'veto_override')
                .in('status', ['floor', 'committee'])
                .limit(1)
                .maybeSingle();

            if (!pendingOverride) {
                await supabase.from('bills')
                    .update({ status: 'failed', passed_tick: currentTick })
                    .eq('id', vb.id);
                console.log(`[resolveExpiredVotes] Orphaned vetoed bill ${vb.id} marked as failed`);
            }
        }
    } catch (orphanErr) {
        console.warn('[resolveExpiredVotes] Orphan veto cleanup failed (non-fatal):', orphanErr);
    }

    return results;
}

/**
 * Safety net: catch trade negotiations stuck in 'ratification' where both bills have passed.
 * This handles the race condition where both ratification bills resolve in the same tick
 * and the first-processed bill doesn't see the other as passed yet.
 */
export async function resolveStuckRatifications(supabase, nationId) {
    try {
        const { data: stuckNegs } = await supabase
            .from('trade_negotiations')
            .select('id, bill_a_id, bill_b_id, nation_a_id, nation_b_id, agreement_type, agreement_name, draft_articles')
            .eq('status', 'ratification')
            .or(`nation_a_id.eq.${nationId},nation_b_id.eq.${nationId}`);

        if (!stuckNegs || stuckNegs.length === 0) return;

        const { data: shard } = await supabase.from('shard').select('current_tick').eq('name', 'Alpha Shard').single();
        const currentTick = shard?.current_tick || 0;

        for (const neg of stuckNegs) {
            // If bill IDs are missing, the negotiation is orphaned — fail it
            if (!neg.bill_a_id || !neg.bill_b_id) {
                await supabase.from('trade_negotiations')
                    .update({ status: 'ratification_failed' })
                    .eq('id', neg.id);
                console.log(`[resolveStuckRatifications] Negotiation ${neg.id} failed — missing bill IDs`);
                continue;
            }

            const [billARes, billBRes] = await Promise.all([
                supabase.from('bills').select('status').eq('id', neg.bill_a_id).single(),
                supabase.from('bills').select('status').eq('id', neg.bill_b_id).single(),
            ]);

            const aStatus = billARes.data?.status;
            const bStatus = billBRes.data?.status;

            if (aStatus === 'passed' && bStatus === 'passed') {
                console.log(`[resolveStuckRatifications] Both bills passed for negotiation ${neg.id} — activating trade agreement`);

                const articles = neg.draft_articles || [];
                const durationArt = articles.find(a => a.type === 'duration');
                const durData = durationArt?.data || {};
                const isPermanent = durData.duration_type === 'permanent';
                const durationTicks = durData.duration_ticks || null;
                const autoRenew = durData.auto_renew || false;
                const withdrawalNotice = durData.withdrawal_notice_ticks || 3;
                const nA = neg.nation_a_id < neg.nation_b_id ? neg.nation_a_id : neg.nation_b_id;
                const nB = neg.nation_a_id < neg.nation_b_id ? neg.nation_b_id : neg.nation_a_id;

                // Check if agreement already exists (avoid duplicate)
                const { data: existing } = await supabase.from('trade_agreements')
                    .select('id').eq('negotiation_id', neg.id).maybeSingle();
                if (!existing) {
                    await supabase.from('trade_agreements').insert({
                        nation_a_id: nA, nation_b_id: nB,
                        negotiation_id: neg.id,
                        bill_a_id: neg.bill_a_id, bill_b_id: neg.bill_b_id,
                        agreement_type: neg.agreement_type,
                        agreement_name: neg.agreement_name || 'Trade Agreement',
                        articles, duration_type: isPermanent ? 'permanent' : 'fixed',
                        duration_ticks: isPermanent ? null : durationTicks,
                        auto_renew: autoRenew, withdrawal_notice_ticks: withdrawalNotice,
                        status: 'active', enacted_at_tick: currentTick,
                        expires_at_tick: isPermanent ? null : (durationTicks ? currentTick + durationTicks : null),
                    });
                }

                await supabase.from('trade_negotiations')
                    .update({ status: 'concluded', concluded_at_tick: currentTick })
                    .eq('id', neg.id);

                console.log(`[resolveStuckRatifications] Negotiation ${neg.id} activated via safety net`);
            } else if (['failed', 'expired', 'vetoed'].includes(aStatus) || ['failed', 'expired', 'vetoed'].includes(bStatus) || !aStatus || !bStatus) {
                // One or both ratification bills failed, expired, or were deleted — negotiation is dead
                await supabase.from('trade_negotiations')
                    .update({ status: 'ratification_failed' })
                    .eq('id', neg.id);
                console.log(`[resolveStuckRatifications] Negotiation ${neg.id} failed — bill statuses: A=${aStatus}, B=${bStatus}`);
            }
        }
    } catch (err) {
        console.error('[resolveStuckRatifications] Error:', err.message);
    }
}

/**
 * Safety net: catch any bills still stuck on the floor past their voting deadline.
 *
 * resolveExpiredVotes uses a multi-join query that can silently fail
 * (returning an error and early-returning []).  When that happens every bill
 * for the nation is skipped and stays on the floor forever.
 *
 * This function runs AFTER resolveExpiredVotes with deliberately simple
 * queries (no complex joins) so a single broken FK or query timeout cannot
 * block all bills.
 */
export async function resolveStuckFloorBills(supabase, nationId) {
    const { data: shard } = await supabase
        .from('shard')
        .select('current_tick')
        .eq('name', 'Alpha Shard')
        .single();
    if (!shard) return [];
    const currentTick = shard.current_tick;

    // Simple query — no joins that can break
    const { data: stuckBills, error: stuckErr } = await supabase
        .from('bills')
        .select('id, bill_name, bill_type, nation_id, voting_ends_tick, quorum_failures')
        .eq('nation_id', nationId)
        .eq('status', 'floor')
        .lte('voting_ends_tick', currentTick);

    if (stuckErr || !stuckBills || stuckBills.length === 0) return [];

    console.warn(`[resolveStuckFloorBills] nation=${nationId} found ${stuckBills.length} bills still on floor past deadline — resolving individually`);

    const { data: factionRows } = await supabase
        .from('factions')
        .select('seats')
        .eq('nation_id', nationId)
        .eq('faction_type', 'party');
    const factionSeatSum = (factionRows || []).reduce((sum, f) => sum + (f.seats || 0), 0);

    const { data: nation } = await supabase
        .from('nations')
        .select('name, government_type, total_seats, judicial_appointment_politicization, legislative_quorum_override, constitutional_amendment_streamlining')
        .eq('id', nationId)
        .single();
    const nominalTotalSeats = nation?.total_seats || GAME_CONFIG.TOTAL_SEATS;
    const totalSeats = Math.min(nominalTotalSeats, Math.max(factionSeatSum, 1));
    const stuckNationFlags = {
        judicial_appointment_politicization: !!nation?.judicial_appointment_politicization,
        legislative_quorum_override: nation?.legislative_quorum_override || 0,
        constitutional_amendment_streamlining: !!nation?.constitutional_amendment_streamlining
    };

    const specialTypes = new Set(['no_confidence', 'foundational', 'default_resolution', 'veto_override', 'impeachment_motion', 'impeachment_conviction', 'ratification', 'minister_confirmation', 'governor_confirmation']);
    const results = [];

    for (const bill of stuckBills) {
      try {
        if (specialTypes.has(bill.bill_type)) {
            console.warn(`[resolveStuckFloorBills] Skipping special bill type "${bill.bill_type}" for bill ${bill.id} "${bill.bill_name}" — needs resolveExpiredVotes`);
            await failBill(supabase, bill);
            await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor: 0, votesAgainst: 0, extra: { reason: `safety net: special type ${bill.bill_type} could not be resolved normally` } });
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed_safety_net', billType: bill.bill_type });
        } else {
        // Load support data individually — simple query, no nested joins
        const { data: supportRows } = await supabase
            .from('bill_support')
            .select('faction_id, stance, seat_count')
            .eq('bill_id', bill.id);

        let votesFor = 0, votesAgainst = 0, votesAbstain = 0;
        (supportRows || []).forEach(s => {
            const stance = s.stance === 'accept' ? 'yes' : s.stance === 'reject' ? 'no' : s.stance;
            if (stance === 'yes') votesFor += (s.seat_count || 0);
            else if (stance === 'no') votesAgainst += (s.seat_count || 0);
            else if (stance === 'abstain') votesAbstain += (s.seat_count || 0);
        });

        // Sync vote tallies to bills table
        await supabase.from('bills').update({
            votes_for: votesFor,
            votes_against: votesAgainst,
            votes_abstain: votesAbstain
        }).eq('id', bill.id);

        const resolveBill = {
            ...bill,
            votes_for: votesFor,
            votes_against: votesAgainst,
            votes_abstain: votesAbstain,
            quorum_failures: bill.quorum_failures || 0
        };
        const resolution = resolveBillVote(resolveBill, totalSeats, stuckNationFlags);
        console.log(`[resolveStuckFloorBills] bill=${bill.id} "${bill.bill_name}" votes yes=${votesFor} no=${votesAgainst} abstain=${votesAbstain} totalSeats=${totalSeats} resolution=${resolution}`);

        if (resolution === 'deferred') {
            await supabase.from('bills').update({
                quorum_failures: (bill.quorum_failures || 0) + 1,
                voting_ends_tick: currentTick + 1
            }).eq('id', bill.id);
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'deferred' });
            continue;
        }

        if (resolution === 'failed_no_quorum') {
            await failBill(supabase, bill);
            await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain, extra: { reason: 'quorum not met (safety net)' } });
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed_no_quorum' });
            continue;
        }

        const passed = resolution === 'passed';
        if (passed) {
            if (hasElectedPresident(nation)) {
                await supabase.from('bills').update({
                    status: 'president_desk',
                    passed_tick: currentTick,
                    president_desk_deadline: currentTick + GAME_CONFIG.PRESIDENT_DESK_TICKS
                }).eq('id', bill.id);
                await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
                results.push({ billId: bill.id, billName: bill.bill_name, result: 'president_desk' });
            } else {
                // Load full bill data for enactment — use simplified join (no nested factions in bill_support).
                // Phase 4.1: include the chosen policy_option under each article.
                const { data: fullBill } = await supabase
                    .from('bills')
                    .select('*, factions(faction_name), bill_articles(*, policies(*), selected_option:policy_options!selected_option_id(*)), bill_support(faction_id, stance, seat_count)')
                    .eq('id', bill.id)
                    .single();

                let enactment;
                try {
                    enactment = await enactBill(supabase, fullBill || bill, currentTick);
                } catch (enactErr) {
                    console.error(`[resolveStuckFloorBills] enactBill threw for bill ${bill.id}:`, enactErr);
                    enactment = { success: false, error: `enactBill threw: ${enactErr?.message || enactErr}` };
                }
                if (!enactment?.success) {
                    await markBillEnactmentFailed(supabase, bill, currentTick, enactment?.error || 'Unknown enactment failure (safety net)');
                    results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed_enactment' });
                } else {
                    await fireBillEvent(supabase, 'bill_passed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst });
                    results.push({ billId: bill.id, billName: bill.bill_name, result: 'passed' });
                }
            }
        } else {
            await failBill(supabase, bill);
            await fireBillEvent(supabase, 'bill_failed', bill, { currentTick, nationName: nation?.name, votesFor, votesAgainst, votesAbstain });
            results.push({ billId: bill.id, billName: bill.bill_name, result: 'failed' });
        }
        } // end else (non-special bill type)
      } catch (billErr) {
        console.error(`[resolveStuckFloorBills] Error processing bill ${bill.id}:`, billErr);
        try {
            await markBillEnactmentFailed(supabase, bill, currentTick, `Safety net error: ${billErr?.message || billErr}`);
        } catch (_) {
            console.error(`[resolveStuckFloorBills] Failed to mark bill ${bill.id} as failed`);
        }
        results.push({ billId: bill.id, billName: bill.bill_name, result: 'error', error: String(billErr) });
      }
    }

    if (results.length > 0) {
        console.log(`[resolveStuckFloorBills] Resolved ${results.length} stuck bills for nation=${nationId}:`, JSON.stringify(results));
    }
    return results;
}

async function markBillEnactmentFailed(supabase, bill, currentTick, enactError) {
    const normalizedError = typeof enactError === 'string' ? enactError : 'Unknown enactment failure';
    const { error } = await supabase.from('bills').update({
        status: 'failed',
        passed_tick: currentTick
    }).eq('id', bill.id);
    if (error) {
        console.error(`[markBillEnactmentFailed] Failed to mark bill ${bill.id} as failed:`, error.message);
    }
}

export async function enactBill(supabase, bill, currentTick) {
    let enactError = null;
    const logContext = {
        billId: bill?.id,
        billStatus: bill?.status,
        billNationId: bill?.nation_id,
        presidentFactionId: null
    };
    console.log('[enactBill] stage=preflight_context', logContext);

    console.log('[enactBill] stage=load_nation attempt', logContext);
    const { data: nation } = await supabase
        .from('nations')
        .select('*')
        .eq('id', bill.nation_id)
        .single();
    if (!nation) {
        console.error('[enactBill] stage=load_nation result=failed_nation_not_found', logContext);
        console.error('[enactBill] stage=terminal_result result=failed_nation_not_found', logContext);
        return { success: false, error: `Nation ${bill.nation_id} not found` };
    }
    console.log('[enactBill] stage=load_nation result=success', logContext);

    console.log('[enactBill] stage=load_active_laws attempt', logContext);
    const { data: currentActiveLaws } = await supabase
        .from('active_laws')
        .select('*, policies(*)')
        .eq('nation_id', bill.nation_id);
    console.log('[enactBill] stage=load_active_laws result=success', {
        ...logContext,
        activeLawCount: (currentActiveLaws || []).length
    });

    // ── Repeal bill handling ──
    if (bill.bill_type === 'repeal') {
        console.log('[enactBill] stage=repeal_bill attempt', logContext);
        const repealResult = await repealActiveLaw({
            supabase,
            nation,
            currentTick,
            currentActiveLaws,
            reversePolicy,
            bill,
        });

        if (!repealResult.success) {
            if (repealResult.reason === 'missing_target_id') {
                enactError = 'Repeal bill has no repeal_active_law_id on bill row or articles';
            } else if (repealResult.reason === 'target_law_absent' || repealResult.reason === 'missing_target_policy') {
                enactError = `Repeal target active_law ${repealResult.targetLawId} not found or missing policy`;
            } else if (repealResult.reason === 'delete_failed') {
                enactError = `Repeal target ${repealResult.targetLawId} could not be deleted: ${repealResult.error}`;
            } else if (repealResult.reason === 'clear_bill_references_failed' || repealResult.reason === 'clear_article_references_failed') {
                enactError = `Repeal target ${repealResult.targetLawId} FK cleanup failed: ${repealResult.error}`;
            } else {
                enactError = `Unknown repeal failure (${repealResult.reason})`;
            }
            console.error('[enactBill] stage=repeal_bill result=failed_enactment', {
                ...logContext,
                error: enactError,
                reason: repealResult.reason,
                targetLawId: repealResult.targetLawId || null
            });
            console.error('[enactBill] stage=terminal_result result=failed_enactment', {
                ...logContext,
                error: enactError
            });
            return { success: false, error: enactError, repealResult };
        }

        console.log('[enactBill] stage=repeal_bill result=success', {
            ...logContext,
            targetLawId: repealResult.targetLawId,
            policyName: repealResult.policyName
        });
    } else if (bill.bill_type === 'entrenchment_upgrade' && bill.entrenchment_upgrade_law_id) {
        // Entrenchment upgrade: update the target active_law's entrenchment tier
        const targetTier = bill.entrenchment_tier;
        const updateData = { entrenchment_tier: targetTier };
        if (targetTier === 'entrenched') {
            updateData.entrenchment_cooldown_until_tick = currentTick + GAME_CONFIG.ENTRENCHED_COOLDOWN_TICKS;
        } else if (targetTier === 'enshrined') {
            updateData.entrenchment_cooldown_until_tick = null;
        }
        const { error: upgradeErr } = await supabase.from('active_laws')
            .update(updateData)
            .eq('id', bill.entrenchment_upgrade_law_id);
        if (upgradeErr) {
            console.error('[enactBill] stage=entrenchment_upgrade result=failed', { ...logContext, error: upgradeErr.message });
            return { success: false, error: `Entrenchment upgrade failed: ${upgradeErr.message}` };
        }
        console.log('[enactBill] stage=entrenchment_upgrade result=success', { ...logContext, targetTier, lawId: bill.entrenchment_upgrade_law_id });
    } else {
        const articles = (bill.bill_articles || []).filter(a => a.policy_id);

        for (const art of articles) {
            const policy = art.policies;
            if (!policy) continue;

            // Repeal article — reverse and delete the targeted active law
            if (art.repeal_active_law_id) {
                console.log('[enactBill] stage=repeal_article attempt', {
                    ...logContext,
                    articleId: art.id,
                    repealActiveLawId: art.repeal_active_law_id
                });
                const repealResult = await repealActiveLaw({
                    supabase,
                    nation,
                    currentTick,
                    currentActiveLaws,
                    reversePolicy,
                    article: art,
                });
                if (!repealResult.success) {
                    console.error('[enactBill] stage=repeal_article result=failed_enactment', {
                        ...logContext,
                        articleId: art.id,
                        reason: repealResult.reason,
                        targetLawId: repealResult.targetLawId || null
                    });
                } else {
                    console.log('[enactBill] stage=repeal_article result=success', {
                        ...logContext,
                        articleId: art.id,
                        targetLawId: repealResult.targetLawId,
                        policyName: repealResult.policyName
                    });
                }
                continue;
            }

            // Reverse any opposed policies — use fresh DB lookup instead of stale snapshot
            if (policy.opposed_policy_ids && Array.isArray(policy.opposed_policy_ids)) {
                for (const opposedId of policy.opposed_policy_ids) {
                    const { data: freshLaw } = await supabase.from('active_laws')
                        .select('id, policy_id, passed_tick, policies(*)')
                        .eq('nation_id', bill.nation_id)
                        .eq('policy_id', opposedId)
                        .maybeSingle();
                    if (freshLaw && freshLaw.policies) {
                        await reversePolicy(supabase, nation, freshLaw.policies, freshLaw.passed_tick, currentTick);
                    }
                }
            }

            // Clear FK references before upserting the new active_law.
            // Phase 4.2: also pull the currently-selected option (if any) so
            // we can detect option switches and revert the old option's
            // sector_effects below.
            const { data: existingActiveLaw } = await supabase.from('active_laws')
                .select('id, selected_option_id, selected_option:policy_options!selected_option_id(sector_effects, sector_rapport_targets)')
                .eq('nation_id', bill.nation_id)
                .eq('policy_id', policy.id)
                .maybeSingle();
            if (existingActiveLaw) {
                await supabase.from('bills').update({ repeal_active_law_id: null }).eq('repeal_active_law_id', existingActiveLaw.id);
                await supabase.from('bill_articles').update({ repeal_active_law_id: null }).eq('repeal_active_law_id', existingActiveLaw.id);
            }

            // Phase 4.2-fix: option-switch sector revert moves to after the
            // upsert success below. Capturing the old sector_effects here so
            // we still have them once the upsert lands — the existingActiveLaw
            // row gets overwritten by the upsert and the inline join is gone.
            const isOptionSwitch =
                !!existingActiveLaw &&
                !!existingActiveLaw.selected_option_id &&
                !!art.selected_option_id &&
                existingActiveLaw.selected_option_id !== art.selected_option_id;
            const oldOptionSectorEffects = isOptionSwitch
                ? (existingActiveLaw.selected_option?.sector_effects || null)
                : null;
            // Capture the previously-active option's rapport so the helper
            // below can compute Standing(new) − Standing(prev) instead of
            // applying an absolute delta. Falls back to [] when this is the
            // first enactment of the policy (no prior level → baseline 0).
            const previousOptionRapport = existingActiveLaw?.selected_option?.sector_rapport_targets || [];
            console.log('[enactBill] stage=upsert_active_law attempt', {
                ...logContext,
                policyId: policy.id,
                policyName: policy.policy_name
            });
            const activeLawRow = {
                    nation_id: bill.nation_id,
                    policy_id: policy.id,
                    passed_tick: currentTick,
                    proposed_by: bill.proposed_by,
                    effects_applied_through_tick: currentTick - 1
                };
            // Phase 4.1: stamp the chosen option from the bill_article so the
            // tick processor (Phase 4.4) and bill-pass effects (Phase 4.3)
            // can read this nation's per-option configuration. Persists null
            // for legacy / orphaned policies that have no policy_options
            // (matches the pre-multi-option behaviour where stat_effects
            // came directly off the policies row).
            if (art.selected_option_id) {
                activeLawRow.selected_option_id = art.selected_option_id;
            }
            // Stamp entrenchment from bill
            if (bill.entrenchment_tier) {
                activeLawRow.entrenchment_tier = bill.entrenchment_tier;
                if (bill.entrenchment_tier === 'entrenched') {
                    activeLawRow.entrenchment_cooldown_until_tick = currentTick + GAME_CONFIG.ENTRENCHED_COOLDOWN_TICKS;
                }
            }
            const { error: activeLawError } = await supabase.from('active_laws')
                .upsert(activeLawRow, { onConflict: 'nation_id,policy_id' });
            if (activeLawError) {
                console.error('[enactBill] stage=upsert_active_law result=rls_blocked', {
                    ...logContext,
                    policyId: policy.id,
                    policyName: policy.policy_name,
                    error: activeLawError.message
                });
                console.error('[enactBill] stage=terminal_result result=rls_blocked', {
                    ...logContext,
                    error: activeLawError.message
                });
                return { success: false, error: `Active law upsert failed for policy ${policy.policy_name || policy.id}: ${activeLawError.message}` };
            }
            console.log('[enactBill] stage=upsert_active_law result=success', {
                ...logContext,
                policyId: policy.id,
                policyName: policy.policy_name
            });

            // Forced Corporate Exodus hook — if the new option is the
            // State Apparatus → State Run Economy combo, flag every corp
            // HQ'd in this nation as displaced (Pressing Issue + trigger
            // block until they relocate). Implementation lives in SQL
            // (sql/migrations/20261122_state_run_economy_corp_exodus.sql);
            // this RPC is a name-match no-op for every other policy or
            // option, so it's safe to call unconditionally.
            if (art.selected_option_id) {
                try {
                    const { error: sreErr } = await supabase.rpc('maybe_trigger_state_run_economy_exodus', {
                        p_nation_id: bill.nation_id,
                        p_policy_id: policy.id,
                        p_option_id: art.selected_option_id,
                    });
                    if (sreErr) console.warn('[enactBill] State Run Economy exodus hook failed (non-fatal):', sreErr.message);
                } catch (sreEx) {
                    console.warn('[enactBill] State Run Economy exodus hook threw (non-fatal):', sreEx);
                }
            }

            // Phase 4.2-fix: revert the OLD option's sector_effects against
            // the bill sponsor only after the active_law upsert has actually
            // landed. If the upsert had failed, the early-return above would
            // have skipped this revert — without that guard, we'd have
            // already mutated faction popularity for a switch that never
            // happened. Captured oldOptionSectorEffects above before the
            // upsert overwrote the existingActiveLaw row.
            if (oldOptionSectorEffects && Array.isArray(oldOptionSectorEffects) && oldOptionSectorEffects.length > 0) {
                await applyInverseSectorEffectsToFaction(
                    supabase,
                    bill.nation_id,
                    bill.proposed_by,
                    oldOptionSectorEffects
                );
            }

            // Phase 4.3: charge the new option's upfront cost. Fires whether
            // this is a fresh enactment or an option switch — every passing
            // bill that activates an option pays its implementation cost.
            // Skipped for orphaned policies that have no policy_options
            // (no option attached to the article means no upfront to charge).
            if (art.selected_option) {
                await chargePolicyUpfrontCost(supabase, bill.nation_id, art.selected_option);
            }

            // One-shot rapport apply for target-based options at full
            // magnitude (pass). YES voters (sponsor + 'accept'/'yes') take
            // +[Standing(new) − Standing(prev)] per sector; NO voters take
            // the inverse. First-time enactment ⇒ prev is [] ⇒ delta == new.
            // Internal no-op for non-target-based options.
            await applyOptionRapportToVoters(supabase, bill, art, previousOptionRapport, 1);

            // MLA enact hook: cancel pending defense-minister confirmations
            // so they don't collide with the forced per-tick sync.
            if (policy.policy_key === MILITARY_LOYALTY_POLICY_KEY) {
                await onMilitaryLoyaltyEnacted(supabase, bill.nation_id, currentTick);
            }
        }
    }

    // ── Apply effect_data articles (e.g. tax rate changes) ──
    // sales_tax was dropped from nations in 20260430_alpha_stats_phase9;
    // bills with stale sales_tax payloads silently no-op via this filter.
    const VALID_TAX_KEYS = new Set(['income_tax', 'corporate_tax']);
    const taxUpdates = {};

    for (const art of (bill.bill_articles || [])) {
        const effect = art.effect_data;
        if (!effect) continue;

        if (effect.type === 'TAX_RATE_CHANGE' && VALID_TAX_KEYS.has(effect.tax_key)) {
            const newRate = Math.max(0, Math.min(50, Number(effect.new_rate)));
            taxUpdates[effect.tax_key] = newRate;
            console.log(`[enactBill] Tax rate change: ${effect.tax_key} ${effect.old_rate}% → ${newRate}%`);
        } else if (effect.type === 'TAX_CHANGE' || effect.type === 'INCOME_TAX_CHANGE') {
            // Stepped Tax Article. Rate change + per-step side effects on
            // gov_approval / credit / gdp_growth / inflation, all keyed by
            // tax_key (income_tax / corporate_tax / ...). Effects scaled
            // linearly by step count; payload validated at draft time and
            // re-validated here for safety (rate clamped defensively).
            //
            // INCOME_TAX_CHANGE accepted for legacy bills drafted before the
            // type was renamed to TAX_CHANGE; treated as tax_key='income_tax'.
            const taxKey = effect.tax_key || (effect.type === 'INCOME_TAX_CHANGE' ? 'income_tax' : null);
            const val = taxKey ? validateTaxArticlePayload(taxKey, effect.old_rate, effect.new_rate) : { valid: false, reason: 'missing tax_key' };
            if (!val.valid) {
                console.warn(`[enactBill] TAX_CHANGE rejected: ${val.reason}`);
            } else {
                const newRate = Math.max(TAX_RATE_MIN, Math.min(TAX_RATE_MAX, Number(effect.new_rate)));
                taxUpdates[taxKey] = newRate;
                const fx = computeTaxArticleEffects(taxKey, val.direction, val.steps);
                // Generic effect-key application: read only the nation
                // columns this tax actually moves (per fx + the canonical
                // TAX_EFFECT_NATION_COLUMNS list), apply clamped deltas,
                // write back. Adding a new effect dimension means adding
                // it to TAX_EFFECT_NATION_COLUMNS — no surgery here.
                const statKeys = TAX_EFFECT_NATION_COLUMNS.filter(k => Number.isFinite(fx[k]) && fx[k] !== 0);
                if (statKeys.length > 0) {
                    const { data: nRow, error: nErr } = await supabase.from('nations')
                        .select(statKeys.join(', ')).eq('id', bill.nation_id).single();
                    if (nErr) {
                        console.error(`[enactBill] TAX_CHANGE (${taxKey}) read failed:`, nErr.message);
                    } else {
                        const updates = {};
                        for (const k of statKeys) {
                            updates[k] = Math.max(0, Math.min(100, Number(nRow[k] ?? 50) + fx[k]));
                        }
                        const { error: upErr } = await supabase.from('nations').update(updates).eq('id', bill.nation_id);
                        if (upErr) console.error(`[enactBill] TAX_CHANGE (${taxKey}) stat update failed:`, upErr.message);
                    }
                }
                if (Number.isFinite(fx.gov_approval) && fx.gov_approval !== 0) {
                    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, fx.gov_approval, `${taxKey}_article`);
                }
                console.log(`[enactBill] TAX_CHANGE ${taxKey} ${val.direction} ×${val.steps}: rate ${effect.old_rate}→${newRate}%, ` +
                    Object.entries(fx).map(([k, v]) => `${k} ${v >= 0 ? '+' : ''}${v}`).join(', '));
            }
        } else if (effect.type === 'gov_bailout' && effect.corp_id && Number.isFinite(effect.amount) && effect.amount > 0) {
            // Government Bailout (entrepreneur corps): effect_data { corp_id, amount }.
            // Re-validate the corp, recompute its book value via the shared
            // entrepreneur_corp_book_value fn, cap the grant at 3× valuation,
            // fund from budget → debt, +0.1 gdp_growth, then -50 momentum and
            // -20 gov_approval event per yes voter.
            try {
                const corpId = effect.corp_id;
                const requested = Math.max(0, Number(effect.amount));
                const { data: corp } = await supabase.from('entrepreneur_corps')
                    .select('id, name, hq_nation_id, treasury_cash')
                    .eq('id', corpId).single();
                // A dissolved corp is deleted (declare_bankruptcy), so a null row
                // covers the dissolved case; also require it to still HQ here.
                if (!corp || corp.hq_nation_id !== bill.nation_id) {
                    console.log(`[enactBill] gov_bailout voided: corp ${corpId} missing or not HQ'd in this nation`);
                } else {
                    // Book value (treasury + Σ building cost − outstanding debt):
                    // one source, the same SQL fn the lawsuit + sell-equity use.
                    const { data: bookVal } = await supabase.rpc('entrepreneur_corp_book_value', { p_corp_id: corpId });
                    const valuation = Math.max(0, Number(bookVal || 0));
                    const cap = 3 * valuation;
                    const payout = Math.min(requested, cap);
                    if (payout > 0) {
                        // Pay out from nation.budget; overflow becomes debt.
                        // budget + debt are abstract integers (1 = $1M); payout
                        // is raw dollars. RAW_PER_ABSTRACT bridges, same pattern
                        // as chargePolicyUpfrontCost.
                        const { data: nation } = await supabase.from('nations')
                            .select('budget, debt, gdp_growth').eq('id', bill.nation_id).single();
                        const budgetAbstract = Number(nation?.budget || 0);
                        const budgetRaw      = budgetAbstract * RAW_PER_ABSTRACT;
                        const drawBudget     = Math.max(0, Math.min(payout, budgetRaw));
                        const drawDebt       = payout - drawBudget;
                        const currentGdp = Number(nation?.gdp_growth ?? 50);
                        const newGdp = Math.round(Math.max(0, Math.min(100, currentGdp + 0.1)) * 10) / 10;
                        await supabase.from('nations').update({
                            budget: Math.max(0, budgetRaw - drawBudget) / RAW_PER_ABSTRACT,
                            debt:   Math.round(Number(nation?.debt || 0) + drawDebt / RAW_PER_ABSTRACT),
                            gdp_growth: newGdp,
                        }).eq('id', bill.nation_id);
                        // Pay into the corp treasury directly — entrepreneur corps
                        // key on entrepreneur_corps.treasury_cash, not the legacy
                        // faction-corp corp_cash_events ledger.
                        await supabase.from('entrepreneur_corps')
                            .update({ treasury_cash: Number(corp.treasury_cash || 0) + payout, updated_at: new Date().toISOString() })
                            .eq('id', corpId);
                        console.log(`[enactBill] gov_bailout: $${Math.round(payout / 1e6)}M to ${corp.name} (budget: -$${Math.round(drawBudget / 1e6)}M, debt: +$${Math.round(drawDebt / 1e6)}M, gdp_growth: ${currentGdp} → ${newGdp})`);
                    } else {
                        console.log(`[enactBill] gov_bailout: payout capped to 0 (valuation $${Math.round(valuation / 1e6)}M)`);
                    }
                    const yesVoters = (bill.bill_support || []).filter(s => s.stance === 'accept' || s.stance === 'yes');
                    for (const v of yesVoters) {
                        await supabase.rpc('adjust_momentum', { p_faction_id: v.faction_id, p_delta: -50 });
                        await adjustGovernmentApprovalEvent(supabase, bill.nation_id, -20, 'gov_bailout');
                    }
                }
            } catch (e) {
                console.error('[enactBill] gov_bailout failed:', e?.message || e);
            }
        } else if (typeof effect.target_stat === 'string' && typeof effect.delta === 'number') {
            // Backward compatibility: parse legacy stat_effect-like payloads
            const key = effect.target_stat.toLowerCase();
            const newRate = Math.max(0, Math.min(50, Number(effect.delta)));
            const taxKey = key === 'income_tax' ? 'income_tax'
                : key === 'sales_tax' ? 'sales_tax'
                    : key === 'corporate_tax' ? 'corporate_tax'
                        : null;
            if (taxKey) {
                taxUpdates[taxKey] = newRate;
                console.log(`[enactBill] Tax rate change (parsed): ${taxKey} → ${newRate}%`);
            }
        }
    }

    // Backward compat: parse tax changes from article text for bills filed before effect_data existed
    if (Object.keys(taxUpdates).length === 0) {
        for (const art of (bill.bill_articles || [])) {
            if (art.policy_id || art.effect_data) continue;
            const title = art.article_title || '';
            if (!title.endsWith('Rate Change')) continue;
            const text = art.article_text || '';
            const match = text.match(/change\s+(.+?)\s+from\s+(\d+(?:\.\d+)?)%?\s+to\s+(\d+(?:\.\d+)?)%/i);
            if (!match) continue;
            const taxName = match[1].trim();
            const newRate = Math.max(0, Math.min(50, Number(match[3])));
            const taxKey = taxName === 'Income Tax' ? 'income_tax'
                : taxName === 'Sales Tax' ? 'sales_tax'
                : taxName === 'Corporate Tax' ? 'corporate_tax'
                : null;
            if (taxKey) {
                taxUpdates[taxKey] = newRate;
                console.log(`[enactBill] Tax rate change (parsed): ${taxKey} → ${newRate}%`);
            }
        }
    }

    if (Object.keys(taxUpdates).length > 0) {
        console.log('[enactBill] stage=apply_tax_updates attempt', {
            ...logContext,
            taxUpdates
        });
        const { error: taxErr } = await supabase.from('nations')
            .update(taxUpdates)
            .eq('id', bill.nation_id);
        if (taxErr) {
            console.error('[enactBill] stage=apply_tax_updates result=rls_blocked', {
                ...logContext,
                error: taxErr.message
            });
            console.error('[enactBill] stage=terminal_result result=rls_blocked', {
                ...logContext,
                error: taxErr.message
            });
            return { success: false, error: `Tax rate update failed: ${taxErr.message}` };
        }
        console.log('[enactBill] stage=apply_tax_updates result=success', {
            ...logContext,
            taxUpdates
        });

        // ── Apply tax-change approval effects to gov_approval_events ──
        // Tax increases hurt approval, tax cuts boost it.
        // Crisis sunset (Phase 2): the "−20% approval gain per active
        // crisis" multiplier is gone. If the dampening is wanted back,
        // count active_modifiers with severity='red' here and scale by
        // 1 − Math.min(1, count * 0.20).
        if (bill.proposed_by) {
            for (const [taxKey, newRate] of Object.entries(taxUpdates)) {
                const oldRate = Number(nation[taxKey] ?? 0);
                const rateDiff = newRate - oldRate;
                if (rateDiff === 0) continue;

                // Tax increase: -2 per point raised. Tax cut: +1 per point lowered.
                const approvalImpact = rateDiff > 0 ? rateDiff * -2 : Math.abs(rateDiff) * 1;
                if (approvalImpact !== 0) {
                    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, approvalImpact, `tax:${taxKey}`);
                    console.log(`[enactBill] ${taxKey} gov_approval_events: ${approvalImpact}`);
                }
            }
        }
    }

    // ── Apply funding articles (discretionary grants only) ──
    // Per-institution funding changes used to live here (sliders that wrote
    // budget_item_allocations + a weighted-average ministry funding_level
    // update). Institutions are removed; the funding-bill framework stays
    // for discretionary grants and the rework will add new article shapes.
    for (const art of (bill.bill_articles || [])) {
        const fd = art.funding_data;
        if (!fd || !fd.ministry_key) continue;

        // Discretionary funds: credit ministry balance and add cost to national debt
        // fd.discretionary is in $M — convert to raw dollars for the balance column.
        // Positive = parliament allocating funds. Negative = parliament withdrawing funds.
        const grantAmountM = Number(fd.discretionary) || 0;
        if (grantAmountM !== 0) {
            const grantRaw = grantAmountM * 1_000_000;
            if (fd.ministry_key === 'central_bank') {
                // Central Bank pool lives on nations.central_bank_discretionary
                // (raw dollars, same unit as ministry balances), not a
                // ministries row. Credit/debit it; budget/debt below is shared.
                const { data: cbNation, error: cbReadErr } = await supabase.from('nations')
                    .select('central_bank_discretionary')
                    .eq('id', bill.nation_id)
                    .maybeSingle();
                if (cbReadErr) {
                    console.error('[enactBill] failed to read central_bank_discretionary:', cbReadErr.message);
                }
                const curBalance = Number(cbNation?.central_bank_discretionary || 0);
                const newBalance = Math.max(0, curBalance + grantRaw);
                const { error: cbWriteErr } = await supabase.from('nations')
                    .update({ central_bank_discretionary: newBalance })
                    .eq('id', bill.nation_id);
                if (cbWriteErr) {
                    console.error('[enactBill] failed to update central_bank_discretionary:', cbWriteErr.message);
                }
                console.log(`[enactBill] central_bank discretionary ${curBalance} → ${newBalance} (${grantAmountM > 0 ? '+' : ''}${grantAmountM}M)`);
            } else {
            // Credit (or debit) the ministry's discretionary_balance
            const { data: curMinistry, error: balReadErr } = await supabase.from('ministries')
                .select('discretionary_balance')
                .eq('nation_id', bill.nation_id)
                .eq('ministry_key', fd.ministry_key)
                .eq('is_active', true)
                .maybeSingle();
            if (balReadErr) {
                console.error(`[enactBill] failed to read discretionary_balance for ${fd.ministry_key}:`, balReadErr.message);
            }
            const curBalance = Number(curMinistry?.discretionary_balance || 0);
            const newBalance = Math.max(0, curBalance + grantRaw);
            const { error: balWriteErr } = await supabase.from('ministries')
                .update({ discretionary_balance: newBalance })
                .eq('nation_id', bill.nation_id)
                .eq('ministry_key', fd.ministry_key)
                .eq('is_active', true);
            if (balWriteErr) {
                console.error(`[enactBill] failed to update discretionary_balance for ${fd.ministry_key}:`, balWriteErr.message);
            }
            console.log(`[enactBill] discretionary: ${fd.ministry_key} balance ${curBalance} → ${newBalance} (${grantAmountM > 0 ? '+' : ''}${grantAmountM}M)`);
            }

            // Fund the grant from the treasury first; only the shortfall
            // becomes debt. Mirrors chargePolicyUpfrontCost ("Cost: pull
            // from treasury, overflow to debt") and the trade-transfer
            // pattern at bills.js:1877 so every money path moves funds the
            // same way. nation.budget, nation.debt and grantAmountM are all
            // abstract $M (1 = $1M raw) — no unit bridge needed here.
            const curBudget = Number(nation.budget) || 0;
            const curDebt   = Number(nation.debt)   || 0;
            let newBudget, newDebt;
            if (grantAmountM > 0) {
                const fromBudget = Math.max(0, Math.min(grantAmountM, curBudget));
                const fromDebt   = grantAmountM - fromBudget;
                newBudget = Math.max(0, curBudget - fromBudget);
                newDebt   = Math.max(0, Math.round(curDebt + fromDebt));
            } else {
                // Withdrawal: funds return to the treasury (symmetric with
                // the funding path, so a fund→withdraw cycle conserves money
                // and can't mint debt relief out of nothing).
                newBudget = curBudget + Math.abs(grantAmountM);
                newDebt   = curDebt;
            }
            const { error: debtUpdErr } = await supabase.from('nations')
                .update({ budget: newBudget, debt: newDebt }).eq('id', bill.nation_id);
            if (debtUpdErr) {
                console.error(`[enactBill] budget/debt update failed for ${fd.ministry_key} grant ${grantAmountM}M:`, debtUpdErr.message);
            } else {
                nation.budget = newBudget;
                nation.debt   = newDebt;
                console.log(`[enactBill] discretionary ${grantAmountM > 0 ? 'grant' : 'withdrawal'}: ${fd.ministry_key} ${grantAmountM > 0 ? '+' : ''}${grantAmountM}M → budget ${curBudget}→${newBudget}, debt ${curDebt}→${newDebt}`);
            }
        }
    }

    console.log('[enactBill] stage=update_bill_status attempt', logContext);
    const { error: billUpdateErr } = await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);
    if (billUpdateErr) {
        console.error('[enactBill] stage=update_bill_status error=rls_blocked', {
            ...logContext,
            error: billUpdateErr.message
        });
        console.error('[enactBill] stage=terminal_result result=rls_blocked', {
            ...logContext,
            error: billUpdateErr.message
        });
        return { success: false, error: `Bill status update failed: ${billUpdateErr.message}` };
    }
    console.log('[enactBill] stage=update_bill_status result=success', logContext);

    // Legislative activity: boost gov_approval_events
    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');

    // Authoritarian crisis bonus mechanic removed by alpha stats refactor
    // (Phase 7d). The detection signal — bills decreasing freedom_index /
    // press_freedom / judicial_independence — relied on three columns
    // that were deleted with no replacement. Reintroduce against
    // alpha-19 (e.g., a `policy.flags.authoritarian` attribute) if the
    // mechanic is wanted back.

    console.log('[enactBill] stage=terminal_result result=success', logContext);
    return { success: true };
}

/**
 * Auto-enact bills whose royal_assent_deadline has passed without the
 * Monarch acting. Mirrors processPresidentDesk for the parallel
 * presidential auto-sign path.
 *
 * Default behavior on timeout: ENACT (apply policy effects via enactBill,
 * status flips to 'passed' inside enactBill itself). No legitimacy
 * delta is applied — the +1/-1/-3 deltas are tied to active engagement
 * via the Royal Assent panel and would reward absentee monarchs
 * if granted automatically.
 *
 * Bail early for non-monarchy nations so the function is safe to call
 * unconditionally each tick from advance-tick.
 */
export async function processRoyalAssent(supabase, nation, currentTick) {
    if (!isAbsoluteMonarchy(nation)) return [];

    const { data: expiredAssent, error: assentErr } = await supabase.from('bills')
        .select('*, factions(faction_name), bill_articles(*, policies(*), selected_option:policy_options!selected_option_id(*)), bill_support(*, factions(faction_name))')
        .eq('nation_id', nation.id)
        .eq('status', 'awaiting_royal_assent')
        .lte('royal_assent_deadline', currentTick);

    if (assentErr) {
        console.warn(`[processRoyalAssent] select failed for nation ${nation.id}: ${assentErr.message}`);
        return [];
    }
    if (!expiredAssent || expiredAssent.length === 0) return [];

    const results = [];
    for (const bill of expiredAssent) {
        // enactBill handles status='passed' + active_laws upsert + stat
        // effects + every other downstream side-effect. Single source of
        // truth for ordinary-bill enactment.
        const enactment = await enactBill(supabase, bill, currentTick);
        if (!enactment?.success) {
            console.error(`[processRoyalAssent] Enactment failed for bill ${bill.id}: ${enactment?.error}`);
            // result: 'failed_enactment' so processSectorShifts skips
            // (normalizeResult only acts on 'passed' / 'failed').
            results.push({ billId: bill.id, billName: bill.bill_name, action: 'auto_enacted', result: 'failed_enactment', enactFailed: true, error: enactment?.error });
            continue;
        }

        try {
            await fireBillEvent(supabase, 'bill_passed', bill, {
                currentTick,
                nationId: nation.id,
                nationName: nation.name,
                votesFor: bill.votes_for || 0,
                votesAgainst: bill.votes_against || 0,
                votesAbstain: bill.votes_abstain || 0,
                articleCount: (bill.bill_articles || []).length,
                billNameOverride: bill.bill_name + ' (auto-enacted — Royal Assent deadline expired)',
            });
        } catch (evErr) {
            console.warn(`[processRoyalAssent] fireBillEvent failed (non-fatal):`, evErr?.message || evErr);
        }

        // result: 'passed' so the orchestrator can merge this entry
        // into the resolutions array passed to processSectorShifts.
        // Without it, royal-assent auto-enactments skip sector shifts
        // (the legacy resolveExpiredVotes path emits 'awaiting_royal_assent'
        // not 'passed' on the floor-resolution tick).
        results.push({ billId: bill.id, billName: bill.bill_name, action: 'auto_enacted', result: 'passed' });
    }
    return results;
}


// Authoritarian Crisis Bonus mechanic deleted by alpha stats refactor
// (Phase 7d). Detected bills via stat_effects on freedom_index /
// press_freedom / judicial_independence — all three columns deleted
// with no replacement. To reintroduce, build detection off explicit
// policy metadata (e.g., a `policy.flags.authoritarian = true`
// attribute) rather than re-mining alpha-19 stat_effects.

export async function reversePolicy(supabase, nation, policy, passedTick, currentTick) {
    const ticksActive = currentTick - (passedTick || 0);
    if (ticksActive <= 0) {
        console.log(`[reversePolicy] Skipping reversal for ${policy.policy_name || policy.id}: ticksActive=${ticksActive} (enacted same tick)`);
        return;
    }

    const sourceEffects = [];
    if (policy.stat_effects && Array.isArray(policy.stat_effects) && policy.stat_effects.length > 0) {
        sourceEffects.push(...policy.stat_effects);
    } else if (policy.target_stat) {
        sourceEffects.push({
            stat_key: policy.target_stat,
            direction: (policy.stat_direction || 'UP').toLowerCase(),
            rate: policy.stat_change_per_tick || 1,
            delay_ticks: 0,
            duration_ticks: policy.duration_months || 12
        });
    }

    if (sourceEffects.length === 0) return;

    const reversalEffects = [];

    for (const eff of sourceEffects) {
        const delay = eff.delay_ticks || 0;
        const duration = eff.duration_ticks || 12;

        let effectiveTicks = 0;
        if (ticksActive > delay) {
            effectiveTicks = Math.min(ticksActive - delay, duration);
        }

        if (effectiveTicks <= 0) continue;

        reversalEffects.push({
            stat_key: eff.stat_key,
            direction: eff.direction === 'up' ? 'down' : 'up',
            rate: eff.rate || 1,
            delay_ticks: 0,
            duration_ticks: effectiveTicks
        });
    }

    if (reversalEffects.length === 0) return;

    // FK references are already cleared by repealActiveLaw() before calling this.
    // For the opposed-policy auto-reversal path (bills.js:2369), the original
    // active_law row is replaced by upsert so no FK cleanup is needed there either.
    const { error: reversalInsertError } = await supabase.from('active_laws')
        .upsert({
            nation_id: nation.id,
            policy_id: policy.id,
            passed_tick: currentTick,
            proposed_by: null,
            effects_applied_through_tick: currentTick - 1,
            is_reversal: true,
            reversal_effects: reversalEffects
        }, { onConflict: 'nation_id,policy_id' });
    if (reversalInsertError) {
        console.error(`[reversePolicy] Failed to upsert reversal active_law for policy ${policy.id}:`, reversalInsertError.message);
    }
}

// ==================== FOUNDATIONAL BILL ENACTMENT ====================

// ─── Foundational reform subtype registry ───────────────────────────────────
//
// Single source of truth for dispatching enactFoundationalBill to a subtype.
// Each entry is { matches: bill => bool, enact: async fn }. The first entry
// whose `matches` predicate returns true wins; if none match, the fallthrough
// `enactElectoralMakeup` runs (proposed_seats or preamble-recovered).
//
// Precedence is deliberate — it mirrors the legacy if-cascade order so that
// bills with multiple `proposed_*` fields resolve identically to before.
const FOUNDATIONAL_REFORMS = Object.freeze([
    { matches: b => b.proposed_term_length != null, enact: enactPresidentialTermLength },
    { matches: b => b.proposed_parliamentary_term_length != null, enact: enactLegislativeTermLength },
    { matches: b => b.proposed_term_limit != null, enact: enactPresidentialTermLimits },
    { matches: b => !!b.proposed_constitutional_reform, enact: enactConstitutionalReform },
    { matches: b => !!b.proposed_hos_election_method, enact: enactHosElectionMethod },
    { matches: b => !!b.proposed_hos_title, enact: enactHosTitle },
    { matches: b => !!b.proposed_judicial_appointment_politicization, enact: enactJudicialPoliticization },
    { matches: b => !!b.proposed_electoral_commission_reform, enact: enactElectoralCommissionReform },
    { matches: b => !!b.proposed_party_registration_threshold, enact: enactPartyRegistrationReform },
    { matches: b => !!b.proposed_legislative_quorum_override, enact: enactLegislativeQuorumReform },
    { matches: b => !!b.proposed_constitutional_amendment_streamlining, enact: enactConstitutionalStreamlining },
    { matches: b => !!b.proposed_monarchy_reform, enact: enactMonarchyReform },
]);

export async function enactFoundationalBill(supabase, bill, currentTick) {
    if (bill.is_foundational_repeal) return enactFoundationalRepeal(supabase, bill, currentTick);
    for (const { matches, enact } of FOUNDATIONAL_REFORMS) {
        if (matches(bill)) return enact(supabase, bill, currentTick);
    }
    return enactElectoralMakeup(supabase, bill, currentTick);
}

// Repeal of a Group A foundational law: revert the one nation column
// this subtype set back to its hardcoded default (per
// FOUNDATIONAL_REPEAL_DEFAULTS — single source of truth). A bare reset
// by design: it does NOT re-run the proposal's side effects (election
// reschedules, stat nudges, monarch artifacts). Marking the bill
// 'passed' makes it the most recent passed bill of this subtype, so
// the cooldown query in laws.html naturally resets the cooldown.
async function enactFoundationalRepeal(supabase, bill, currentTick) {
    const subtype = bill.foundational_repeal_subtype;
    const spec = subtype && FOUNDATIONAL_REPEAL_DEFAULTS[subtype];
    if (!spec) {
        console.warn(`[enactFoundationalRepeal] Bill ${bill.id} has unknown foundational_repeal_subtype: ${subtype}. Marking as failed.`);
        await supabase.from('bills').update({ status: 'failed', passed_tick: currentTick }).eq('id', bill.id);
        return false;
    }

    // Revert the nation column FIRST — only mark the bill passed once the
    // revert succeeded, so a failed update can't leave the bill in a
    // 'passed' state the resolver then reports as failed enactment.
    const { error: nationErr } = await supabase.from('nations')
        .update({ [spec.column]: spec.value })
        .eq('id', bill.nation_id);
    if (nationErr) {
        console.error(`[enactFoundationalRepeal] Failed to revert ${spec.column} for nation ${bill.nation_id}:`, nationErr.message);
        return false;
    }

    const { error: billErr } = await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);
    if (billErr) {
        console.error(`[enactFoundationalRepeal] Failed to mark bill ${bill.id} as passed:`, billErr.message);
        return false;
    }

    console.log(`[enactFoundationalRepeal] Nation ${bill.nation_id}: ${subtype} repealed — ${spec.column} reset to default (${spec.value}).`);
    return true;
}



async function enactPresidentialTermLength(supabase, bill, currentTick) {
    const newTermTicks = bill.proposed_term_length;
    const validOptions = GAME_CONFIG.TERM_LENGTH_OPTIONS || [24, 36, 48, 60, 72, 84];
    if (!validOptions.includes(newTermTicks)) {
        console.warn(`[enactFoundationalBill] Bill ${bill.id} has invalid proposed_term_length: ${newTermTicks}. Marking as failed.`);
        await supabase.from('bills').update({ status: 'failed', passed_tick: currentTick }).eq('id', bill.id);
        return false;
    }

    // Check if a presidential election is imminent (within TERM_LENGTH_DEFER_WINDOW ticks)
    const deferWindow = GAME_CONFIG.TERM_LENGTH_DEFER_WINDOW || 10;
    const { data: imminentElection } = await supabase
        .from('elections')
        .select('id, election_tick')
        .eq('nation_id', bill.nation_id)
        .eq('election_type', 'presidential')
        .eq('status', 'scheduled')
        .gt('election_tick', currentTick)
        .lte('election_tick', currentTick + deferWindow)
        .limit(1)
        .maybeSingle();

    // Get current nation data BEFORE update (for stat effect comparison)
    const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();
    const oldTermTicks = getPresidentialTermTicks(nation);
    const ticksPerYear = GAME_CONFIG.TICKS_PER_YEAR || 12;

    // Mark bill as passed
    const { error: billErr } = await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);
    if (billErr) {
        console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message);
        return false;
    }

    // Update nation's presidential_term_ticks
    const { error: nationErr } = await supabase.from('nations').update({
        presidential_term_ticks: newTermTicks
    }).eq('id', bill.nation_id);
    if (nationErr) {
        console.error(`[enactFoundationalBill] Failed to update presidential_term_ticks for nation ${bill.nation_id}:`, nationErr.message);
    }

    // Apply mechanical effects based on whether terms got shorter or longer.
    // Alpha refactor: polarization + political_engagement columns are gone
    // (the latter never existed on nations); legitimacy → authority,
    // stability → control. Term-shortened path now writes nothing column-
    // wise but the log line is kept for event traceability.
    if (newTermTicks < oldTermTicks) {
        console.log(`[enactFoundationalBill] Term shortened (polarization + political_engagement effects retired by alpha refactor)`);
    } else if (newTermTicks > oldTermTicks) {
        const newAuthority = Math.max(0, (nation?.public_approval || 50) - 3);
        const newStateApparatus = Math.min(100, (nation?.state_apparatus || 50) + 2);
        const { error: extErr } = await supabase.from('nations').update({
            public_approval: newAuthority,
            state_apparatus: newStateApparatus
        }).eq('id', bill.nation_id);
        if (extErr) console.error(`[enactFoundationalBill] Term extended stat update failed:`, extErr.message);
        else console.log(`[enactFoundationalBill] Term extended: public_approval -3, state_apparatus +2`);
    }

    // If no imminent election, reschedule the next presidential election with the new term length
    if (!imminentElection) {
        // Find the active president to calculate when their term should end
        const { data: activePresident } = await supabase
            .from('presidents')
            .select('elected_tick')
            .eq('nation_id', bill.nation_id)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

        if (activePresident) {
            // Ensure the new term end is in the future (if shortening makes it past, schedule next tick)
            const newTermEnd = Math.max(currentTick + 1, activePresident.elected_tick + newTermTicks);
            // Update the scheduled presidential election to reflect new term length
            const { data: futureElection } = await supabase
                .from('elections')
                .select('id')
                .eq('nation_id', bill.nation_id)
                .eq('election_type', 'presidential')
                .eq('status', 'scheduled')
                .gt('election_tick', currentTick)
                .order('election_tick', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (futureElection) {
                const { error: reschedErr } = await supabase.from('elections').update({
                    election_tick: newTermEnd
                }).eq('id', futureElection.id);
                if (reschedErr) console.error(`[enactFoundationalBill] Failed to reschedule election:`, reschedErr.message);
                else console.log(`[enactFoundationalBill] Rescheduled presidential election to tick ${newTermEnd}`);
            }
        }
    } else {
        console.log(`[enactFoundationalBill] Presidential election imminent (tick ${imminentElection.election_tick}), term length change deferred to next cycle.`);
    }

    const newYears = newTermTicks / ticksPerYear;
    console.log(`[enactFoundationalBill] Nation ${bill.nation_id} presidential term set to ${newYears} years (${newTermTicks} ticks).`);
    return true;
}

async function enactLegislativeTermLength(supabase, bill, currentTick) {
    const newParlTermTicks = bill.proposed_parliamentary_term_length;
    const validOptions = GAME_CONFIG.PARLIAMENTARY_TERM_LENGTH_OPTIONS || [24, 36, 48, 60, 72];
    if (!validOptions.includes(newParlTermTicks)) {
        console.warn(`[enactFoundationalBill] Bill ${bill.id} has invalid proposed_parliamentary_term_length: ${newParlTermTicks}. Marking as failed.`);
        await supabase.from('bills').update({ status: 'failed', passed_tick: currentTick }).eq('id', bill.id);
        return false;
    }

    // Get current nation data BEFORE update
    const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();
    const oldParlTermTicks = nation?.parliamentary_term_ticks || GAME_CONFIG.PARLIAMENTARY_TERM_TICKS;
    const ticksPerYear = GAME_CONFIG.TICKS_PER_YEAR || 12;

    // Mark bill as passed
    const { error: billErr } = await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);
    if (billErr) {
        console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message);
        return false;
    }

    // Update nation's parliamentary_term_ticks
    const { error: nationErr } = await supabase.from('nations').update({
        parliamentary_term_ticks: newParlTermTicks
    }).eq('id', bill.nation_id);
    if (nationErr) {
        console.error(`[enactFoundationalBill] Failed to update parliamentary_term_ticks for nation ${bill.nation_id}:`, nationErr.message);
    }

    // Apply mechanical effects based on whether terms got shorter or longer.
    // Alpha refactor: see the parallel presidential-term block above for
    // rationale (polarization + political_engagement retired).
    if (newParlTermTicks < oldParlTermTicks) {
        console.log(`[enactFoundationalBill] Legislative term shortened (polarization + political_engagement effects retired by alpha refactor)`);
    } else if (newParlTermTicks > oldParlTermTicks) {
        const newAuthority = Math.max(0, (nation?.public_approval || 50) - 3);
        const newStateApparatus = Math.min(100, (nation?.state_apparatus || 50) + 2);
        const { error: extErr } = await supabase.from('nations').update({
            public_approval: newAuthority,
            state_apparatus: newStateApparatus
        }).eq('id', bill.nation_id);
        if (extErr) console.error(`[enactFoundationalBill] Legislative term extended stat update failed:`, extErr.message);
        else console.log(`[enactFoundationalBill] Legislative term extended: authority -3, control +2`);
    }

    // NOTE: We do NOT reschedule the current parliamentary election.
    // The new term length takes effect after the next election completes.

    const newYears = newParlTermTicks / ticksPerYear;
    console.log(`[enactFoundationalBill] Nation ${bill.nation_id} parliamentary term set to ${newYears} years (${newParlTermTicks} ticks).`);
    return true;
}

async function enactPresidentialTermLimits(supabase, bill, currentTick) {
    const newTermLimit = bill.proposed_term_limit;
    const validOptions = GAME_CONFIG.TERM_LIMIT_OPTIONS || [0, 1, 2, 3, 4];
    if (!validOptions.includes(newTermLimit)) {
        console.warn(`[enactFoundationalBill] Bill ${bill.id} has invalid proposed_term_limit: ${newTermLimit}. Marking as failed.`);
        await supabase.from('bills').update({ status: 'failed', passed_tick: currentTick }).eq('id', bill.id);
        return false;
    }

    // Mark bill as passed
    const { error: billErr } = await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);
    if (billErr) {
        console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message);
        return false;
    }

    // Get current nation data for comparison (BEFORE update)
    const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();
    const oldEffectiveLimit = getPresidentialTermLimit(nation); // null = no limits, number = limit
    // Update nation's presidential_term_limit
    const { error: nationErr } = await supabase.from('nations').update({
        presidential_term_limit: newTermLimit
    }).eq('id', bill.nation_id);
    if (nationErr) {
        console.error(`[enactFoundationalBill] Failed to update presidential_term_limit for nation ${bill.nation_id}:`, nationErr.message);
    }

    // Get active president for context
    const { data: activePresident } = await supabase
        .from('presidents')
        .select('terms_served, faction_id')
        .eq('nation_id', bill.nation_id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

    // Apply mechanical effects. Alpha refactor: legitimacy → authority,
    // press_freedom + judicial_independence dropped (columns gone — both
    // were positive-democracy signals already largely captured by
    // authority).
    if (newTermLimit === 0) {
        // Removing term limits
        let authorityPenalty = 6;
        const newAuthority = Math.max(0, (nation?.public_approval || 50) - authorityPenalty);
        const newUnrest = Math.min(100, (nation?.unrest || 0) + 4);
        const { error: removeErr } = await supabase.from('nations').update({
            public_approval: newAuthority,
            unrest:    newUnrest
        }).eq('id', bill.nation_id);
        if (removeErr) console.error(`[enactFoundationalBill] Failed to update stats for term limit removal:`, removeErr.message);

        // Opposition parties gain momentum
        const { data: allFactions } = await supabase
            .from('factions')
            .select('id')
            .eq('nation_id', bill.nation_id)
            .eq('faction_type', 'party')
            .neq('id', bill.proposed_by);

        if (allFactions) {
            for (const faction of allFactions) {
                // Base loves it (+3 approval) but anti-democratic (-0.1 credibility)
                await supabase.rpc('adjust_momentum', { p_faction_id: faction.id, p_delta: 3, p_label: 'Term limits abolished (+3)', p_tick: currentTick });
                await adjustCredibility(supabase, faction.id, bill.nation_id, -0.1, 0, currentTick, { source: 'bill:term_limit' });
            }
        }

        // Polarization escalation for entrenched presidents retired by
        // alpha refactor (column gone with no replacement).

        console.log(`[enactFoundationalBill] Term limits removed: authority -${authorityPenalty}, unrest +4, opposition momentum +8`);
    } else if (oldEffectiveLimit === null || newTermLimit < oldEffectiveLimit) {
        // Adding or tightening term limits — only the authority bump
        // survives; press_freedom + judicial_independence retired.
        const newAuthority = Math.min(100, (nation?.public_approval || 50) + 5);
        const { error: tightenErr } = await supabase.from('nations').update({
            public_approval: newAuthority
        }).eq('id', bill.nation_id);
        if (tightenErr) console.error(`[enactFoundationalBill] Term limits tighten stat update failed:`, tightenErr.message);
        else console.log(`[enactFoundationalBill] Term limits tightened to ${newTermLimit}: authority +5`);
    }

    const limitText = newTermLimit === 0 ? 'No Term Limits' : `${newTermLimit} Term${newTermLimit !== 1 ? 's' : ''}`;
    console.log(`[enactFoundationalBill] Nation ${bill.nation_id} presidential term limit set to: ${limitText}.`);
    return true;
}

async function enactConstitutionalReform(supabase, bill, currentTick) {
    const targetSystem = bill.proposed_constitutional_reform;
    const validSystems = ['parliamentary', 'constitutional_monarchy', 'presidential'];
    if (!validSystems.includes(targetSystem)) {
        console.warn(`[enactFoundationalBill] Bill ${bill.id} has invalid proposed_constitutional_reform: ${targetSystem}. Marking as failed.`);
        const { error: failErr } = await supabase.from('bills').update({ status: 'failed', passed_tick: currentTick }).eq('id', bill.id);
        if (failErr) console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as failed:`, failErr.message);
        return false;
    }

    // Mark bill as passed
    const { error: billErr } = await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);
    if (billErr) {
        console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message);
        return false;
    }

    // Get current nation data
    const { data: nation, error: nationFetchErr } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();
    if (nationFetchErr || !nation) {
        console.error(`[enactFoundationalBill] Failed to fetch nation ${bill.nation_id} for constitutional reform:`, nationFetchErr?.message);
        return false;
    }
    const currentSystem = getCurrentConstitutionalSystem(nation);

    if (currentSystem === targetSystem) {
        console.warn(`[enactFoundationalBill] Nation ${bill.nation_id} is already ${targetSystem}. No-op.`);
        return true;
    }

    // NOTE: Active floor bills (no-confidence, impeachment, etc.) are NOT cancelled during
    // a constitutional transition. They resolve under the new government type's rules.
    // This is a known edge case — same pattern as the legacy hos_election_method block.
    console.log(`[enactFoundationalBill] Constitutional reform: ${currentSystem} → ${targetSystem} for nation ${bill.nation_id}`);

    // Determine structural changes
    const currentHasPresident = currentSystem === 'presidential';
    const targetHasPresident = targetSystem === 'presidential';
    const currentHasPM = currentSystem === 'parliamentary' || currentSystem === 'constitutional_monarchy';
    const targetHasPM = targetSystem === 'parliamentary' || targetSystem === 'constitutional_monarchy';
    const currentIsMonarchy = currentSystem === 'constitutional_monarchy';
    const targetIsMonarchy = targetSystem === 'constitutional_monarchy';

    // Build nation update
    const nationUpdate = {
        last_constitutional_reform_tick: currentTick
    };

    // Set target government_type and hos_election_method
    switch (targetSystem) {
        case 'parliamentary':
            nationUpdate.government_type = 'Democracy';
            nationUpdate.hos_election_method = 'appointed';
            break;
        case 'constitutional_monarchy':
            nationUpdate.government_type = 'Democracy';
            nationUpdate.hos_election_method = 'hereditary';
            break;
        case 'presidential':
            nationUpdate.government_type = 'Presidential';
            nationUpdate.hos_election_method = 'direct_vote';
            break;
    }

    // ── Losing president (Presidential/Semi-Pres → Parliamentary/CM) ──
    if (currentHasPresident && !targetHasPresident) {
        const { error: presErr } = await supabase.from('presidents')
            .update({ is_active: false })
            .eq('nation_id', bill.nation_id)
            .eq('is_active', true);
        if (presErr) console.error('[enactFoundationalBill] Failed to deactivate president:', presErr.message);
        // Mirror the now-vacant president seat onto the nation row.
        const { error: syncErr } = await supabase.rpc('sync_nation_head_of_state', { p_nation_id: bill.nation_id });
        if (syncErr) console.error('[enactFoundationalBill] HOS sync failed:', syncErr.message);

        const { error: delPresElErr } = await supabase.from('elections').delete()
            .eq('nation_id', bill.nation_id)
            .eq('status', 'scheduled')
            .eq('election_type', 'presidential');
        if (delPresElErr) console.error('[enactFoundationalBill] Failed to clear presidential elections:', delPresElErr.message);

        const { error: candErr } = await supabase.from('pm_candidates').delete()
            .eq('nation_id', bill.nation_id)
            .eq('candidate_type', 'presidential');
        if (candErr) console.error('[enactFoundationalBill] Failed to clean presidential candidates:', candErr.message);

        // Close administration
        const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
        const dateStr = shardData?.current_date || _billTickToDate(currentTick);
        const { error: adminErr } = await supabase.from('administrations')
            .update({ ended_at_tick: currentTick, ended_at_date: dateStr, end_reason: 'constitutional_transition' })
            .eq('nation_id', bill.nation_id)
            .is('ended_at_tick', null);
        if (adminErr) console.error('[enactFoundationalBill] Failed to close administration:', adminErr.message);
        else await _logAdministrationIntegrityIssue(supabase, bill.nation_id, 'foundational_transition_no_president');

        // Fail bills on president's desk (orphaned without a president)
        const { error: deskErr } = await supabase.from('bills')
            .update({ status: 'failed', passed_tick: currentTick })
            .eq('nation_id', bill.nation_id)
            .eq('status', 'president_desk');
        if (deskErr) console.error('[enactFoundationalBill] Failed to clear president desk bills:', deskErr.message);

        // Fail pending impeachment bills and resolve proceedings
        const { error: impeachBillErr } = await supabase.from('bills')
            .update({ status: 'failed', passed_tick: currentTick })
            .eq('nation_id', bill.nation_id)
            .in('bill_type', ['impeachment_motion', 'impeachment_conviction'])
            .in('status', ['committee', 'floor']);
        if (impeachBillErr) console.error('[enactFoundationalBill] Failed to clear impeachment bills:', impeachBillErr.message);

        const { error: impeachProcErr } = await supabase.from('impeachment_proceedings')
            .update({ phase: 'resolved', resolved_tick: currentTick, outcome: 'dismissed_constitutional_transition' })
            .eq('nation_id', bill.nation_id)
            .neq('phase', 'resolved');
        if (impeachProcErr) console.error('[enactFoundationalBill] Failed to resolve impeachment proceedings:', impeachProcErr.message);

        console.log(`[enactFoundationalBill] President deactivated, presidential elections cleared`);
    }

    // ── Losing PM (Parliamentary/CM/Semi-Pres → Presidential) ──
    if (currentHasPM && !targetHasPM) {
        // Dissolve coalition (formed + caretaker)
        const { error: coalErr } = await supabase.from('government_formations')
            .update({ status: 'dissolved' })
            .eq('nation_id', bill.nation_id)
            .in('status', ['formed', 'caretaker']);
        if (coalErr) console.error('[enactFoundationalBill] Failed to dissolve coalition:', coalErr.message);

        // Also expire any in-progress formations
        const { error: formingErr } = await supabase.from('government_formations')
            .update({ status: 'expired' })
            .eq('nation_id', bill.nation_id)
            .eq('status', 'forming');
        if (formingErr) console.error('[enactFoundationalBill] Failed to expire forming coalitions:', formingErr.message);

        const { error: hogErr } = await supabase.from('head_of_government')
            .update({ active: false })
            .eq('nation_id', bill.nation_id)
            .eq('active', true);
        if (hogErr) console.error('[enactFoundationalBill] Failed to deactivate PM:', hogErr.message);

        // Fail pending PM confirmation bills (orphaned without parliamentary system)
        const { error: pmBillErr } = await supabase.from('bills')
            .update({ status: 'failed', passed_tick: currentTick })
            .eq('nation_id', bill.nation_id)
            .eq('bill_type', 'minister_confirmation')
            .eq('ministry_key', 'prime_minister')
            .in('status', ['committee', 'floor']);
        if (pmBillErr) console.error('[enactFoundationalBill] Failed to clear PM confirmation bills:', pmBillErr.message);

        const { error: delParlElErr } = await supabase.from('elections').delete()
            .eq('nation_id', bill.nation_id)
            .eq('status', 'scheduled')
            .eq('election_type', 'parliamentary');
        if (delParlElErr) console.error('[enactFoundationalBill] Failed to clear parliamentary elections:', delParlElErr.message);

        nationUpdate.gov_approval = 50;
        nationUpdate.gov_approval_events = 0;

        console.log(`[enactFoundationalBill] PM deactivated, coalition dissolved`);
    }

    // ── Gaining president (Parliamentary/CM → Presidential/Semi-Pres) ──
    if (!currentHasPresident && targetHasPresident) {
        // Check for existing scheduled presidential election before inserting
        const { data: existingPresEl } = await supabase.from('elections')
            .select('id')
            .eq('nation_id', bill.nation_id)
            .eq('status', 'scheduled')
            .eq('election_type', 'presidential')
            .limit(1);

        if (!existingPresEl || existingPresEl.length === 0) {
            const { error: presElErr } = await supabase.from('elections').insert({
                nation_id: bill.nation_id,
                election_tick: currentTick + 3,
                status: 'scheduled',
                election_type: 'presidential'
            });
            if (presElErr) console.error('[enactFoundationalBill] Failed to schedule presidential election:', presElErr.message);
            else console.log(`[enactFoundationalBill] Presidential election scheduled at tick ${currentTick + 3}`);
        } else {
            console.log(`[enactFoundationalBill] Presidential election already scheduled, skipping`);
        }

        if (targetSystem === 'presidential') {
            const parlTermTicks = Number(nation?.parliamentary_term_ticks) || GAME_CONFIG.PARLIAMENTARY_TERM_TICKS;
            const { error: midtermErr } = await supabase.from('elections').insert({
                nation_id: bill.nation_id,
                election_tick: currentTick + parlTermTicks,
                status: 'scheduled',
                election_type: 'parliamentary'
            });
            if (midtermErr) console.error('[enactFoundationalBill] Failed to schedule midterm:', midtermErr.message);
        }
    }

    // ── Gaining PM (Presidential → Semi-Pres or Parliamentary/CM) ──
    if (!currentHasPM && targetHasPM) {
        nationUpdate.pm_nomination_attempts = 0;

        const { data: existingParlEl } = await supabase.from('elections')
            .select('id')
            .eq('nation_id', bill.nation_id)
            .eq('status', 'scheduled')
            .eq('election_type', 'parliamentary')
            .limit(1);

        if (!existingParlEl || existingParlEl.length === 0) {
            const { error: parlElErr } = await supabase.from('elections').insert({
                nation_id: bill.nation_id,
                election_tick: currentTick + 3,
                status: 'scheduled',
                election_type: 'parliamentary'
            });
            if (parlElErr) console.error('[enactFoundationalBill] Failed to schedule parliamentary election:', parlElErr.message);
            else console.log(`[enactFoundationalBill] Parliamentary election scheduled at tick ${currentTick + 3}`);
        }

        console.log(`[enactFoundationalBill] PM formation triggered`);
    }

    // ── Gaining monarchy (→ Absolute Monarchy) ──
    if (!currentIsMonarchy && targetIsMonarchy) {
        const { firstNames } = getNationNames(nation?.name);
        const monarchFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const dynastyName = bill.proposed_dynasty_name || 'Royal House';
        const dynastyLastName = dynastyName.split(/\s+/).pop() || 'Royal';
        const monarchAge = 36 + Math.floor(Math.random() * 25);

        nationUpdate.dynasty_name = dynastyName;
        nationUpdate.dynasty_established_tick = currentTick;
        if (bill.proposed_dynasty_crest_url) {
            nationUpdate.dynasty_crest_url = bill.proposed_dynasty_crest_url;
        }
        nationUpdate.head_of_state_first_name = monarchFirstName;
        nationUpdate.head_of_state_last_name = dynastyLastName;
        nationUpdate.head_of_state_age = monarchAge;
        nationUpdate.head_of_state_title = isFemaleName(monarchFirstName) ? 'Queen' : 'King';

        console.log(`[enactFoundationalBill] Monarch generated: ${nationUpdate.head_of_state_title} ${monarchFirstName} ${dynastyLastName}, age ${monarchAge}`);
    }

    // ── Losing monarchy (Absolute Monarchy → anything) ──
    if (currentIsMonarchy && !targetIsMonarchy) {
        nationUpdate.dynasty_name = null;
        nationUpdate.dynasty_established_tick = null;
        nationUpdate.dynasty_crest_url = null;
        console.log(`[enactFoundationalBill] Monarchy abolished, dynasty cleared`);
    }

    // ── Stat effects based on target system ──
    const stability = nation?.state_apparatus || 50;
    const legitimacy = nation?.public_approval || 50;
    const politicalEngagement = nation?.political_engagement || 50;
    const polarization = 0;
    const civilUnrest = nation?.unrest || 0;

    switch (targetSystem) {
        case 'parliamentary':
            nationUpdate.stability = Math.min(100, stability + 3);
            nationUpdate.legitimacy = Math.min(100, legitimacy + 2);
            break;
        case 'constitutional_monarchy':
            nationUpdate.stability = Math.min(100, stability + 5);
            nationUpdate.legitimacy = Math.max(0, legitimacy - 5);
            break;
        case 'presidential':
            nationUpdate.legitimacy = Math.min(100, legitimacy + 3);
            nationUpdate.political_engagement = Math.min(100, politicalEngagement + 3);
            nationUpdate.polarization = Math.min(100, polarization + 2);
            break;
    }

    // Major reform always causes some civil unrest
    nationUpdate.civil_unrest = Math.min(100, civilUnrest + 5);

    // Apply all nation updates
    const { error: nationErr } = await supabase.from('nations').update(nationUpdate).eq('id', bill.nation_id);
    if (nationErr) {
        console.error(`[enactFoundationalBill] Failed to update nation for constitutional reform:`, nationErr.message);
    }

    const systemLabels = {
        parliamentary: 'Parliamentary Democracy',
        constitutional_monarchy: 'Constitutional Monarchy',
        presidential: 'Presidential Republic',
    };
    console.log(`[enactFoundationalBill] Nation ${bill.nation_id} constitutional system changed to "${systemLabels[targetSystem]}".`);
    return true;
}

async function enactHosElectionMethod(supabase, bill, currentTick) {
    const newMethod = bill.proposed_hos_election_method;
    const validMethods = ['direct_vote', 'appointed', 'hereditary'];
    if (!validMethods.includes(newMethod)) {
        console.warn(`[enactFoundationalBill] Bill ${bill.id} has invalid proposed_hos_election_method: ${newMethod}. Marking as failed.`);
        await supabase.from('bills').update({ status: 'failed', passed_tick: currentTick }).eq('id', bill.id);
        return false;
    }

    // Mark bill as passed
    const { error: billErr } = await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);
    if (billErr) {
        console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message);
        return false;
    }

    // Get current nation data
    const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();

    // Update nation's hos_election_method and dynasty fields
    const nationUpdate = { hos_election_method: newMethod };
    if (newMethod === 'hereditary') {
        nationUpdate.dynasty_name = bill.proposed_dynasty_name || 'Royal House';
        nationUpdate.dynasty_established_tick = currentTick;
        if (bill.proposed_dynasty_crest_url) {
            nationUpdate.dynasty_crest_url = bill.proposed_dynasty_crest_url;
        }
        // Generate a new monarch: random first name, dynasty last name, age 36-60
        const { firstNames } = getNationNames(nation?.name);
        const monarchFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const dynastyLastName = (bill.proposed_dynasty_name || 'Royal').split(/\s+/).pop(); // Use last word of dynasty name
        const monarchAge = 36 + Math.floor(Math.random() * 25); // 36-60
        nationUpdate.head_of_state_first_name = monarchFirstName;
        nationUpdate.head_of_state_last_name = dynastyLastName;
        nationUpdate.head_of_state_age = monarchAge;
        // Set King or Queen based on the generated monarch's name
        nationUpdate.head_of_state_title = isFemaleName(monarchFirstName) ? 'Queen' : 'King';
    }

    const { error: nationErr } = await supabase.from('nations').update(nationUpdate).eq('id', bill.nation_id);
    if (nationErr) {
        console.error(`[enactFoundationalBill] Failed to update hos_election_method for nation ${bill.nation_id}:`, nationErr.message);
    }

    // Apply mechanical effects based on method. Alpha refactor:
    // polarization + political_engagement effects retired (columns gone).
    if (newMethod === 'hereditary') {
        const newStateApparatus = Math.min(100, (nation?.state_apparatus || 50) + 5);
        const newAuthority = Math.max(0, (nation?.public_approval || 50) - 5);
        const statUpdate = { state_apparatus: newStateApparatus, public_approval: newAuthority };

        const { error: statErr } = await supabase.from('nations').update(statUpdate).eq('id', bill.nation_id);
        if (statErr) console.error(`[enactFoundationalBill] Hereditary stat update failed:`, statErr.message);
        else console.log(`[enactFoundationalBill] Constitutional monarchy established: control +5, authority -5`);
    } else if (newMethod === 'direct_vote') {
        // Direct vote: authority +3 (engagement + polarization retired)
        // AND transition Parliamentary → Presidential
        const wasParliamentary = !nation?.government_type?.toLowerCase().includes('president');
        const statUpdate = {
            public_approval: Math.min(100, (nation?.public_approval || 50) + 3)
        };

        if (wasParliamentary) {
            statUpdate.government_type = 'Presidential';
            console.log(`[enactFoundationalBill] Parliamentary → Presidential transition for nation ${bill.nation_id}`);

            // Close the current coalition/government formation (PM system no longer applies)
            const { error: coalErr } = await supabase.from('government_formations')
                .update({ status: 'dissolved' })
                .eq('nation_id', bill.nation_id)
                .in('status', ['formed', 'caretaker']);
            if (coalErr) console.error('[enactFoundationalBill] Failed to dissolve coalition:', coalErr.message);

            // Deactivate parliamentary head of government (PM)
            const { error: hogErr } = await supabase.from('head_of_government')
                .update({ active: false })
                .eq('nation_id', bill.nation_id)
                .eq('active', true);
            if (hogErr) console.error('[enactFoundationalBill] Failed to deactivate PM:', hogErr.message);

            // Clear any scheduled parliamentary-only elections, keep presidential if any
            const { error: delElErr } = await supabase.from('elections').delete()
                .eq('nation_id', bill.nation_id)
                .eq('status', 'scheduled')
                .eq('election_type', 'parliamentary');
            if (delElErr) console.error('[enactFoundationalBill] Failed to clear parliamentary elections:', delElErr.message);

            // Schedule presidential election 3 ticks out (allows endorsement window)
            const { error: presElErr } = await supabase.from('elections').insert({
                nation_id: bill.nation_id,
                election_tick: currentTick + 3,
                status: 'scheduled',
                election_type: 'presidential'
            });
            if (presElErr) console.error('[enactFoundationalBill] Failed to schedule presidential election:', presElErr.message);
            else console.log(`[enactFoundationalBill] Presidential election scheduled at tick ${currentTick + 3}`);

            // Also schedule the first parliamentary midterm
            const parlTermTicks = Number(nation?.parliamentary_term_ticks) || 24;
            const { error: midtermErr } = await supabase.from('elections').insert({
                nation_id: bill.nation_id,
                election_tick: currentTick + parlTermTicks,
                status: 'scheduled',
                election_type: 'parliamentary'
            });
            if (midtermErr) console.error('[enactFoundationalBill] Failed to schedule midterm:', midtermErr.message);

            // Reset government approval for the transition
            statUpdate.gov_approval = 50;
            statUpdate.gov_approval_events = 0;
        }

        const { error: statErr } = await supabase.from('nations').update(statUpdate).eq('id', bill.nation_id);
        if (statErr) console.error(`[enactFoundationalBill] Direct vote stat update failed:`, statErr.message);
        else console.log(`[enactFoundationalBill] Direct HoS vote established: legitimacy +3, political_engagement +3, polarization +2${wasParliamentary ? ', gov type → Presidential' : ''}`);
    } else if (newMethod === 'appointed') {
        // Appointed by Parliament: transition Presidential → Parliamentary if applicable
        const wasPresidential = nation?.government_type?.toLowerCase().includes('president');

        if (wasPresidential) {
            console.log(`[enactFoundationalBill] Presidential → Parliamentary transition for nation ${bill.nation_id}`);

            // Deactivate the president
            const { error: presErr } = await supabase.from('presidents')
                .update({ is_active: false })
                .eq('nation_id', bill.nation_id)
                .eq('is_active', true);
            if (presErr) console.error('[enactFoundationalBill] Failed to deactivate president:', presErr.message);
            // Mirror the now-vacant president seat onto the nation row.
            const { error: syncErr } = await supabase.rpc('sync_nation_head_of_state', { p_nation_id: bill.nation_id });
            if (syncErr) console.error('[enactFoundationalBill] HOS sync failed:', syncErr.message);

            // Change government type
            const { error: govErr } = await supabase.from('nations').update({
                government_type: 'Democracy',
                gov_approval: 50,
                gov_approval_events: 0
            }).eq('id', bill.nation_id);
            if (govErr) console.error(`[enactFoundationalBill] Gov type update failed:`, govErr.message);

            // Clear presidential elections, schedule parliamentary
            const { error: clearElErr } = await supabase.from('elections').delete()
                .eq('nation_id', bill.nation_id)
                .eq('status', 'scheduled');
            if (clearElErr) console.error('[enactFoundationalBill] Failed to clear scheduled elections:', clearElErr.message);

            const { error: parlElErr } = await supabase.from('elections').insert({
                nation_id: bill.nation_id,
                election_tick: currentTick + 3,
                status: 'scheduled',
                election_type: 'parliamentary'
            });
            if (parlElErr) console.error('[enactFoundationalBill] Failed to schedule parliamentary election:', parlElErr.message);
            else console.log(`[enactFoundationalBill] Parliamentary election scheduled at tick ${currentTick + 3}`);

            // Clean up presidential candidates
            const { error: candErr } = await supabase.from('pm_candidates').delete()
                .eq('nation_id', bill.nation_id)
                .eq('candidate_type', 'presidential');
            if (candErr) console.error('[enactFoundationalBill] Failed to clean presidential candidates:', candErr.message);

            // Close administration for transition
            const { data: shardData } = await supabase.from('shard').select('current_date').eq('name', 'Alpha Shard').single();
            const dateStr = shardData?.current_date || _billTickToDate(currentTick);
            const { error: closeAdminErr } = await supabase.from('administrations')
                .update({ ended_at_tick: currentTick, ended_at_date: dateStr, end_reason: 'constitutional_transition' })
                .eq('nation_id', bill.nation_id)
                .is('ended_at_tick', null);
            if (closeAdminErr) console.error('[enactFoundationalBill] Failed to close administration on PM removal transition:', closeAdminErr.message);
            else await _logAdministrationIntegrityIssue(supabase, bill.nation_id, 'foundational_transition_no_pm');

            console.log(`[enactFoundationalBill] Presidential → Parliamentary Democracy, election at tick ${currentTick + 3}`);
        }
        // No stat changes for appointed (it's the default low-friction option)
    }

    const methodLabels = { direct_vote: 'Direct Popular Vote', appointed: 'Appointed by Parliament', hereditary: 'Constitutional Monarchy' };
    console.log(`[enactFoundationalBill] Nation ${bill.nation_id} HoS election method set to "${methodLabels[newMethod]}".`);
    return true;
}

async function enactHosTitle(supabase, bill, currentTick) {
    const newTitle = bill.proposed_hos_title.trim();
    if (!newTitle) {
        console.warn(`[enactFoundationalBill] Bill ${bill.id} has empty proposed_hos_title. Marking as failed.`);
        await supabase.from('bills').update({ status: 'failed', passed_tick: currentTick }).eq('id', bill.id);
        return false;
    }

    const { error: billErr } = await supabase.from('bills').update({
        status: 'passed',
        passed_tick: currentTick
    }).eq('id', bill.id);
    if (billErr) {
        console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message);
        return false;
    }

    const { error: nationErr } = await supabase.from('nations').update({
        head_of_state_title: newTitle
    }).eq('id', bill.nation_id);
    if (nationErr) {
        console.error(`[enactFoundationalBill] Failed to update HoS title for nation ${bill.nation_id}:`, nationErr.message);
    }

    console.log(`[enactFoundationalBill] Nation ${bill.nation_id} HoS title set to "${newTitle}".`);
    return true;
}

async function enactJudicialPoliticization(supabase, bill, currentTick) {
    const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();

    const { error: billErr } = await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
    if (billErr) { console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message); return false; }

    // Alpha refactor: judicial_independence + legitimacy + freedom_index
    // collapse onto authority. The authority hit absorbs all three
    // democratic-erosion signals at once. Capped to a max of 30 to
    // mirror the legacy cappedJudicial intent.
    const newAuthority = Math.min(Math.max(0, (nation?.public_approval ?? 50) - 5), 30);

    const { error: nationErr } = await supabase.from('nations').update({
        judicial_appointment_politicization: true,
        public_approval: newAuthority
    }).eq('id', bill.nation_id);
    if (nationErr) console.error(`[enactFoundationalBill] Failed to update nation for judicial politicization:`, nationErr.message);

    const isPres = hasElectedPresident(nation);
    const mechanicDesc = isPres
        ? 'Impeachment conviction now requires 75% (up from 67%). The courts no longer serve as a check on executive power.'
        : 'Votes of no confidence now require 60% (up from 50%+1). The ruling coalition is shielded from parliamentary removal.';

    await supabase.from('event_log').insert({
        nation_id: bill.nation_id,
        event_name: 'FOUNDATIONAL_LAW_PASSED',
        trigger_key: 'judicial_appointment_politicization',
        description_used: `The Judicial Appointment Politicization Act has passed. The ruling coalition now appoints judges directly. Judicial independence is permanently capped at 30. ${mechanicDesc}`,
        category: 'POLITICAL',
        effects_applied: {
            law: 'judicial_appointment_politicization',
            judicial_independence_cap: 30,
            legitimacy: -5,
            freedom_index: -3,
            threshold_change: isPres ? 'impeachment_conviction 67%→75%' : 'no_confidence 50%+1→60%'
        },
        fired_at_tick: currentTick
    });

    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');
    console.log(`[enactFoundationalBill] Judicial Appointment Politicization Act enacted for nation ${bill.nation_id}`);
    return true;
}

async function enactElectoralCommissionReform(supabase, bill, currentTick) {
    const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();

    const { error: billErr } = await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
    if (billErr) { console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message); return false; }

    // Alpha refactor: legitimacy → authority; polarization retired.
    const newAuthority = Math.max(0, (nation?.public_approval ?? 50) - 5);

    const { error: nationErr } = await supabase.from('nations').update({
        electoral_commission_reform: true,
        public_approval: newAuthority
    }).eq('id', bill.nation_id);
    if (nationErr) console.error(`[enactFoundationalBill] Failed to update nation for electoral commission reform:`, nationErr.message);

    await supabase.from('event_log').insert({
        nation_id: bill.nation_id,
        event_name: 'FOUNDATIONAL_LAW_PASSED',
        trigger_key: 'electoral_commission_reform',
        description_used: 'The Electoral Commission Reform Act has passed. The ruling coalition now controls the election commission. Parliamentary elections are tilted in favor of the governing parties — opposition parties face an administrative disadvantage in seat allocation.',
        category: 'POLITICAL',
        effects_applied: {
            law: 'electoral_commission_reform',
            legitimacy: -5,
            polarization: 3,
            seat_bonus: '5-10% random per election'
        },
        fired_at_tick: currentTick
    });

    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');
    console.log(`[enactFoundationalBill] Electoral Commission Reform Act enacted for nation ${bill.nation_id}`);
    return true;
}

async function enactPartyRegistrationReform(supabase, bill, currentTick) {
    const threshold = Number(bill.proposed_party_registration_threshold);
    if (![5, 10, 15].includes(threshold)) {
        console.error(`[enactFoundationalBill] Invalid party registration threshold: ${threshold}`);
        await supabase.from('bills').update({ status: 'failed' }).eq('id', bill.id);
        return false;
    }

    const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();

    const { error: billErr } = await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
    if (billErr) { console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message); return false; }

    // Alpha refactor: legitimacy + freedom_index → authority (combined
    // -7 hit absorbs both democratic-erosion signals); polarization retired.
    const newAuthority = Math.max(0, (nation?.public_approval ?? 50) - 7);

    const { error: nationErr } = await supabase.from('nations').update({
        party_registration_threshold: threshold,
        public_approval: newAuthority
    }).eq('id', bill.nation_id);
    if (nationErr) console.error(`[enactFoundationalBill] Failed to update nation for party registration act:`, nationErr.message);

    await supabase.from('event_log').insert({
        nation_id: bill.nation_id,
        event_name: 'FOUNDATIONAL_LAW_PASSED',
        trigger_key: 'party_registration_act',
        description_used: `The Political Party Registration Act has passed. Parties holding less than ${threshold}% of legislative seats will have their seats reallocated after elections. Affected parties cannot sponsor bills, vote, or hold ministries.`,
        category: 'POLITICAL',
        effects_applied: {
            law: 'party_registration_act',
            threshold_pct: threshold,
            legitimacy: -4,
            polarization: 5,
            freedom_index: -3
        },
        fired_at_tick: currentTick
    });

    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');
    console.log(`[enactFoundationalBill] Political Party Registration Act enacted for nation ${bill.nation_id} (threshold: ${threshold}%)`);
    return true;
}

async function enactLegislativeQuorumReform(supabase, bill, currentTick) {
    const quorumPct = Number(bill.proposed_legislative_quorum_override);
    if (![25, 30, 40].includes(quorumPct)) {
        console.error(`[enactFoundationalBill] Invalid quorum override: ${quorumPct}`);
        await supabase.from('bills').update({ status: 'failed' }).eq('id', bill.id);
        return false;
    }

    const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();

    const { error: billErr } = await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
    if (billErr) { console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message); return false; }

    // Alpha refactor: legitimacy + freedom_index → authority (combined
    // -5 hit).
    const newAuthority = Math.max(0, (nation?.public_approval ?? 50) - 5);

    const { error: nationErr } = await supabase.from('nations').update({
        legislative_quorum_override: quorumPct,
        public_approval: newAuthority
    }).eq('id', bill.nation_id);
    if (nationErr) console.error(`[enactFoundationalBill] Failed to update nation for quorum reform:`, nationErr.message);

    await supabase.from('event_log').insert({
        nation_id: bill.nation_id,
        event_name: 'FOUNDATIONAL_LAW_PASSED',
        trigger_key: 'legislative_quorum_reform',
        description_used: `The Legislative Quorum Reform Act has passed. The quorum requirement for standard bills has been lowered from 50% to ${quorumPct}%. The ruling coalition can now pass legislation with fewer participants.`,
        category: 'POLITICAL',
        effects_applied: { law: 'legislative_quorum_reform', quorum_pct: quorumPct, legitimacy: -3, freedom_index: -2 },
        fired_at_tick: currentTick
    });

    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');
    console.log(`[enactFoundationalBill] Legislative Quorum Reform Act enacted for nation ${bill.nation_id} (quorum: ${quorumPct}%)`);
    return true;
}

async function enactConstitutionalStreamlining(supabase, bill, currentTick) {
    const { data: nation } = await supabase.from('nations').select('*').eq('id', bill.nation_id).single();

    const { error: billErr } = await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
    if (billErr) { console.error(`[enactFoundationalBill] Failed to mark bill ${bill.id} as passed:`, billErr.message); return false; }

    // Alpha refactor: legitimacy + freedom_index → authority (combined
    // -13 hit absorbs both); polarization retired.
    const { error: nationErr } = await supabase.from('nations').update({
        constitutional_amendment_streamlining: true,
        public_approval: Math.max(0, (nation?.public_approval ?? 50) - 13)
    }).eq('id', bill.nation_id);
    if (nationErr) console.error(`[enactFoundationalBill] Failed to update nation for constitutional streamlining:`, nationErr.message);

    await supabase.from('event_log').insert({
        nation_id: bill.nation_id,
        event_name: 'FOUNDATIONAL_LAW_PASSED',
        trigger_key: 'constitutional_amendment_streamlining',
        description_used: 'The Constitutional Amendment Streamlining Act has passed. The supermajority threshold for foundational bills has been lowered from 67% to 55%. The constitution is now far easier to rewrite.',
        category: 'POLITICAL',
        effects_applied: { law: 'constitutional_amendment_streamlining', new_threshold: '55%', legitimacy: -8, polarization: 5, freedom_index: -5 },
        fired_at_tick: currentTick
    });

    await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');
    console.log(`[enactFoundationalBill] Constitutional Amendment Streamlining enacted for nation ${bill.nation_id}`);
    return true;
}

async function enactMonarchyReform(supabase, bill, currentTick) {
    const reformKey = bill.proposed_monarchy_reform;
    const { data: nation } = await supabase.from('nations')
        .select('id, name, government_type, monarch_faction_id, public_approval, gov_approval')
        .eq('id', bill.nation_id).single();

    if (!nation) { console.error(`[enactFoundationalBill] Nation not found for monarchy reform`); return false; }

    const { error: billErr } = await supabase.from('bills').update({ status: 'passed', passed_tick: currentTick }).eq('id', bill.id);
    if (billErr) { console.error(`[enactFoundationalBill] Failed to mark bill as passed:`, billErr.message); return false; }

    const MONARCHY_REFORMS = {
        freedom_of_press: {
            statChanges: { press_freedom: 5, freedom_index: 3, legitimacy: 2 },
            nationFlag: 'monarchy_freedom_of_press',
            eventDesc: 'The Freedom of the Press Act has been enacted. Independent media is now legal. The Crown gains legitimacy through restraint.',
        },
        right_of_assembly: {
            statChanges: { freedom_index: 3, civil_unrest: -2, stability: 2 },
            nationFlag: 'monarchy_right_of_assembly',
            eventDesc: 'The Right of Assembly Act has been enacted. Political gatherings and peaceful protest are now legal.',
        },
        independent_judiciary: {
            statChanges: { judicial_independence: 5, legitimacy: -2, corruption: -3 },
            nationFlag: 'monarchy_independent_judiciary',
            eventDesc: 'The Independent Judiciary Act has been enacted. Courts now operate free from royal interference.',
        },
        parliamentary_inquiry: {
            statChanges: { corruption: -3, legitimacy: -3, transparency: 3 },
            nationFlag: 'monarchy_parliamentary_inquiry',
            eventDesc: 'The Parliamentary Inquiry Act has been enacted. Parliament can now investigate the Crown\'s finances and decisions.',
        },
        civil_liberties_charter: {
            statChanges: { freedom_index: 5, stability: 2, legitimacy: -3, happiness: 3 },
            nationFlag: 'monarchy_civil_liberties_charter',
            eventDesc: 'The Civil Liberties Charter has been enacted. Individual rights are now codified and cannot be overridden by royal decree.',
        },
        electoral_reform: {
            statChanges: { freedom_index: 3, legitimacy: -5, political_engagement: 5 },
            nationFlag: 'monarchy_electoral_reform',
            eventDesc: 'The Electoral Reform Act has been enacted. The legal framework for democratic elections now exists. This is the point of no return.',
        },
        parliamentary_supremacy: {
            statChanges: { legitimacy: -5, stability: -3, freedom_index: 5, political_engagement: 5 },
            nationFlag: 'monarchy_parliamentary_supremacy',
            eventDesc: 'The Parliamentary Supremacy Act has been enacted. Parliament can now override royal veto with a two-thirds majority. The monarch\'s legislative power is effectively advisory.',
        },
        act_of_abdication: {
            statChanges: { stability: -5, civil_unrest: 10, freedom_index: 8, legitimacy: -10 },
            nationFlag: null,
            eventDesc: 'The Act of Abdication has been enacted. The monarchy is dissolved. Democratic elections are scheduled.',
        },
    };

    const reform = MONARCHY_REFORMS[reformKey];
    if (!reform) { console.warn(`[enactFoundationalBill] Unknown monarchy reform: ${reformKey}`); return false; }

    // Apply stat changes
    if (reform.statChanges && Object.keys(reform.statChanges).length > 0) {
        const { error: statErr } = await supabase.rpc('increment_nation_stats', {
            p_nation_id: bill.nation_id,
            p_changes: reform.statChanges,
        });
        if (statErr) console.error(`[enactFoundationalBill] Monarchy reform stat update failed:`, statErr.message);
    }

    // Set nation flag (for prerequisite tracking)
    if (reform.nationFlag) {
        await supabase.from('nations').update({ [reform.nationFlag]: true }).eq('id', bill.nation_id);
    }

    // Act of Abdication: dissolve monarchy, schedule elections
    if (reformKey === 'act_of_abdication') {
        // Clear monarch
        await supabase.from('nations').update({
            government_type: 'Democracy',
            monarch_faction_id: null,
            failed_formation_attempts: 0,
        }).eq('id', bill.nation_id);

        // Reset legitimacy and gov approval for fresh start
        await supabase.rpc('increment_nation_stats', {
            p_nation_id: bill.nation_id,
            p_changes: { legitimacy: 50 - (Number(nation.public_approval) || 50), gov_approval: 40 - (Number(nation.gov_approval) || 50) },
        }).catch(() => {});

        // Dissolve any existing coalition (canonical: government_formations).
        await supabase.from('government_formations').update({ status: 'dissolved' })
            .eq('nation_id', bill.nation_id).in('status', ['formed', 'active', 'caretaker']);

        // Deactivate PM
        await supabase.from('head_of_government').update({ active: false })
            .eq('nation_id', bill.nation_id).eq('active', true);

        // Schedule election 2 ticks from now
        await supabase.from('elections').insert({
            nation_id: bill.nation_id,
            election_tick: currentTick + 2,
            election_type: 'parliamentary',
            status: 'scheduled',
            trigger: 'abdication',
        });

        console.log(`[enactFoundationalBill] Monarchy dissolved for ${nation.name}. Election scheduled at tick ${currentTick + 2}.`);
    }

    // Log event
    await supabase.from('event_log').insert({
        nation_id: bill.nation_id,
        event_name: 'FOUNDATIONAL_LAW_PASSED',
        trigger_key: 'monarchy_reform_' + reformKey,
        description_used: reform.eventDesc,
        category: 'POLITICAL',
        effects_applied: { law: reformKey, tag: 'eroding_the_monarchy', ...reform.statChanges },
        fired_at_tick: currentTick,
    });

    console.log(`[enactFoundationalBill] [Eroding the Monarchy] ${reformKey} enacted for nation ${bill.nation_id}`);
    return true;
}

async function enactElectoralMakeup(supabase, bill, currentTick) {
// ── Electoral Makeup subtype ──
// Validate proposed_seats BEFORE marking the bill as passed
let newTotalSeats = bill.proposed_seats;

// Fallback: if proposed_seats is null (column missing or data lost), parse from preamble
if (!newTotalSeats && bill.preamble) {
    const match = bill.preamble.match(/from\s+\d+\s+to\s+(\d+)/i);
    if (match) {
        newTotalSeats = parseInt(match[1], 10);
        console.warn(`[enactFoundationalBill] proposed_seats was null, recovered ${newTotalSeats} from preamble`);
    }
}

if (!newTotalSeats || newTotalSeats < 50 || newTotalSeats > 500) {
    console.warn(`[enactFoundationalBill] Bill ${bill.id} has invalid proposed_seats: ${newTotalSeats}. Marking as failed.`);
    await supabase.from('bills').update({
        status: 'failed',
        passed_tick: currentTick
    }).eq('id', bill.id);
    return false;
}

// Validation passed — mark bill as passed
console.log(`[enactFoundationalBill] Bill ${bill.id}: proposed_seats=${newTotalSeats}. Marking as passed.`);
await supabase.from('bills').update({
    status: 'passed',
    passed_tick: currentTick
}).eq('id', bill.id);

// Get current total seats to compute delta
const { data: nationData } = await supabase
    .from('nations')
    .select('total_seats')
    .eq('id', bill.nation_id)
    .single();
const currentTotalSeats = nationData?.total_seats || GAME_CONFIG.TOTAL_SEATS;
const delta = newTotalSeats - currentTotalSeats;

// Atomic resize: enact_seat_change RPC updates nations.total_seats AND
// rescales every party's faction.seats in one transaction, so a partial
// failure can't leave us with mismatched numbers (the bug where
// total_seats=100 while parties still summed to 500). Picks election-
// vote redistribution when last-election results are available, falls
// back to proportional rescale, then even distribution.
const { data: rpcResult, error: rpcError } = await supabase.rpc('enact_seat_change', {
    p_nation_id: bill.nation_id,
    p_new_total_seats: newTotalSeats,
});
if (rpcError || !rpcResult?.success) {
    console.error('[enactFoundationalBill] enact_seat_change failed:',
        rpcError?.message || rpcResult?.error);
    return false;
}

if (delta !== 0) {
    console.log(`[enactFoundationalBill] ${currentTotalSeats} -> ${newTotalSeats} (${delta > 0 ? '+' : ''}${delta}). Method: ${rpcResult.method}.`);
} else {
    console.log(`[enactFoundationalBill] No seat change (already ${newTotalSeats}).`);
}

// Sync in-memory config so downstream logic in the same tick uses the new seat count
initGameConfigForNation({ total_seats: newTotalSeats });

// Legislative activity: boost gov_approval_events
await adjustGovernmentApprovalEvent(supabase, bill.nation_id, MINISTER_APPROVAL_CONFIG.BILL_PASSAGE_EVENT_BONUS, 'bill_passage');

return true;
}

export async function failBill(supabase, bill) {
    const { error } = await supabase.from('bills').update({
        status: 'failed'
    }).eq('id', bill.id);
    if (error) {
        console.error(`[failBill] Failed to mark bill ${bill.id} as failed:`, error.message);
    }
}

async function syncFailedMinisterConfirmationBill(supabase, bill) {
    if (!bill || bill.bill_type !== 'minister_confirmation' || !bill.ministry_key) return;

    const { data: ministry, error: fetchErr } = await supabase
        .from('ministries')
        .select('id, is_acting')
        .eq('nation_id', bill.nation_id)
        .eq('ministry_key', bill.ministry_key)
        .eq('is_active', true)
        .maybeSingle();

    if (fetchErr) {
        console.warn('[syncFailedMinisterConfirmationBill] Failed to fetch ministry row:', fetchErr.message);
        return;
    }
    if (!ministry) return;

    // If an acting minister is in place, restore 'acting' status instead of 'rejected'
    const { error: updateErr } = await supabase
        .from('ministries')
        .update({
            confirmation_status: ministry.is_acting ? 'acting' : 'rejected',
            pending_minister: null
        })
        .eq('id', ministry.id);

    if (updateErr) {
        console.warn('[syncFailedMinisterConfirmationBill] Failed to clear pending minister:', updateErr.message);
    }
}

export async function syncMinistriesForFailedConfirmationBills(supabase, failedBills) {
    if (!Array.isArray(failedBills) || failedBills.length === 0) return;

    for (const bill of failedBills) {
        await syncFailedMinisterConfirmationBill(supabase, bill);
    }
}
