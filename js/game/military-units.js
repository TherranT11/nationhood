// Army units lifecycle — Phase 1.
//
// A unit created via the create_unit RPC starts 'Forming' with
// forming_until_tick = created_tick + 2. This global per-tick sweep
// flips it to 'Active' once that window elapses. Single set-based
// UPDATE — idempotent (re-running finds no eligible rows) and
// non-fatal (logs + returns 0 on error).

// Army-type upkeep modifier (per unit, per tick). Guard formations
// cost +$1, paramilitaries −$1; regular/unassigned units are unchanged.
// Single source — create_army's army_type drives this everywhere.
export function armyUpkeepModifier(armyType) {
    if (armyType === 'guard') return 1;
    if (armyType === 'paramilitary') return -1;
    return 0;
}

// Per-unit per-tick maintenance: 25% of construction_cost (stored on
// the /1e6 scale), floored, with a hard $1/tick minimum, then the
// army-type modifier (re-floored at $1). SINGLE SOURCE OF TRUTH —
// budget.js (the nation expenditure sum), government.html, advance-tick
// and the Order of Battle "(-$X)" readout all import this, so the
// per-unit figure can never drift from the budget total. armyType is
// optional: undefined/null = no modifier (regular / unassigned units).
export function unitUpkeepPerTick(constructionCost, armyType) {
    const cc = Number(constructionCost) || 0;
    const base = Math.max(1, Math.floor(cc / 1_000_000 * 0.25));
    return Math.max(1, base + armyUpkeepModifier(armyType));
}

export async function processFormingUnits(supabase, currentTick) {
    const { data, error } = await supabase
        .from('army_units')
        .update({ status: 'Active' })
        .eq('status', 'Forming')
        .lte('forming_until_tick', currentTick)
        .select('id');
    if (error) {
        console.error('[processFormingUnits] activation update failed:', error.message);
        return { activated: 0 };
    }
    return { activated: (data || []).length };
}

// Per-brigade supply cost, ON TOP of the 1-per-1,000-manpower base. Support
// brigades are the logistics tail — they REDUCE the requirement. Light/regular
// infantry add nothing beyond their manpower.
const BRIGADE_SUPPLY = { mechanized: 2, armor: 3, artillery: 1, support: -3 };
// Cohesion lost per tick by an army faction with any under-supplied army. Tunable.
const UNDERSUPPLY_COHESION_DRAIN = 5;

// Per-tick supply pass for armies of nations at war. Places a newly-at-war army
// at its capital-adjacent sector, computes supply needed vs delivered (generation
// capped by logistics, minus per-sector transit loss from the capital), writes
// armies.supply_balance, and drains army_cohesion for any faction left short.
// Global, idempotent, non-fatal.
export async function processArmySupply(supabase, currentTick) {
    const { data: warRels, error: relErr } = await supabase
        .from('diplomatic_relations').select('nation_a_id, nation_b_id').eq('relation_type', 'war');
    if (relErr) { console.error('[processArmySupply] war relations load failed:', relErr.message); return { supplied: 0 }; }
    const atWar = new Set();
    const enemiesByNation = new Map();   // nationId → Set(enemy nationIds)
    for (const r of (warRels || [])) {
        atWar.add(r.nation_a_id); atWar.add(r.nation_b_id);
        if (!enemiesByNation.has(r.nation_a_id)) enemiesByNation.set(r.nation_a_id, new Set());
        if (!enemiesByNation.has(r.nation_b_id)) enemiesByNation.set(r.nation_b_id, new Set());
        enemiesByNation.get(r.nation_a_id).add(r.nation_b_id);
        enemiesByNation.get(r.nation_b_id).add(r.nation_a_id);
    }
    if (atWar.size === 0) return { supplied: 0 };

    const { data: armies, error: aErr } = await supabase
        .from('armies').select('id, faction_id, nation_id, assigned_front_id, army_type, current_sector_id')
        .in('nation_id', [...atWar]).not('assigned_front_id', 'is', null);
    if (aErr) { console.error('[processArmySupply] armies load failed:', aErr.message); return { supplied: 0 }; }
    if (!armies || armies.length === 0) return { supplied: 0 };

    const frontIds = [...new Set(armies.map(a => a.assigned_front_id))];
    const armyIds = armies.map(a => a.id);
    const factionIds = [...new Set(armies.map(a => a.faction_id))];

    const [frontsRes, sectorsRes, unitsRes, facsRes] = await Promise.all([
        supabase.from('war_fronts').select('id, nation_a_id, sector_count').in('id', frontIds),
        supabase.from('war_sectors').select('id, front_id, nation_id, position, is_capital_adjacent').in('front_id', frontIds),
        supabase.from('army_units').select('army_id, total_manpower, brigades').in('army_id', armyIds).neq('status', 'Decommissioned'),
        supabase.from('factions').select('id, army_supplies, army_logistics, army_cohesion').in('id', factionIds),
    ]);
    // Bail on incomplete core data rather than apply effects on partial reads
    // (e.g. a failed factions fetch would read every army's supply as 0 and
    // wrongly drain cohesion across the board).
    if (frontsRes.error || sectorsRes.error || unitsRes.error || facsRes.error) {
        console.error('[processArmySupply] core load failed:',
            (frontsRes.error || sectorsRes.error || unitsRes.error || facsRes.error).message);
        return { supplied: 0 };
    }
    const fronts = new Map((frontsRes.data || []).map(f => [f.id, f]));
    const sectors = sectorsRes.data || [];
    const sectorById = new Map(sectors.map(s => [s.id, s]));
    const facById = new Map((facsRes.data || []).map(f => [f.id, f]));

    // Aggregate each army's committed units → total manpower + brigade supply cost.
    const perArmy = new Map();
    for (const u of (unitsRes.data || [])) {
        let e = perArmy.get(u.army_id);
        if (!e) { e = { manpower: 0, brigCost: 0 }; perArmy.set(u.army_id, e); }
        e.manpower += Number(u.total_manpower) || 0;
        const brigs = Array.isArray(u.brigades) ? u.brigades : [];
        for (const b of brigs) e.brigCost += (BRIGADE_SUPPLY[b] || 0);
    }

    const underSupplied = new Set();
    let supplied = 0;

    for (const a of armies) {
        const front = fronts.get(a.assigned_front_id);
        if (!front) continue;
        // Only fronts between this nation and a nation it's actually at war with
        // are active — an army parked on a peaceful neighbour's front sits idle.
        const neighbour = a.nation_id === front.nation_a_id ? front.nation_b_id : front.nation_a_id;
        if (!enemiesByNation.get(a.nation_id)?.has(neighbour)) continue;

        // Lazy placement: a newly-at-war army starts at its capital-adjacent sector.
        let sector = a.current_sector_id ? sectorById.get(a.current_sector_id) : null;
        if (!sector) {
            sector = sectors.find(s => s.front_id === a.assigned_front_id && s.nation_id === a.nation_id && s.is_capital_adjacent) || null;
            if (sector) await supabase.from('armies').update({ current_sector_id: sector.id }).eq('id', a.id);
        }
        if (!sector) continue;  // front not generated yet — nothing to supply

        const n = front.sector_count || 0;
        // Sectors traversed from the capital to this sector (−1 supply each).
        const pathCost = (a.nation_id === front.nation_a_id)
            ? sector.position
            : (n - sector.position + 1);

        const agg = perArmy.get(a.id) || { manpower: 0, brigCost: 0 };
        const formation = a.army_type === 'guard' ? 1 : a.army_type === 'paramilitary' ? -1 : 0;
        const needed = Math.max(0, Math.round(agg.manpower / 1000) + agg.brigCost + formation);

        const fac = facById.get(a.faction_id) || {};
        const generated = (Number(fac.army_supplies) || 0) * 5;
        const transportCap = (Number(fac.army_logistics) || 0) * 4;
        const delivered = Math.max(0, Math.min(generated, transportCap) - pathCost);
        const balance = delivered - needed;

        await supabase.from('armies').update({ supply_balance: balance }).eq('id', a.id);
        if (balance < 0) underSupplied.add(a.faction_id);
        supplied++;
    }

    // Under-supply consequence: drain Cohesion once per affected army faction.
    for (const fid of underSupplied) {
        const fac = facById.get(fid);
        const newCoh = Math.max(0, (Number(fac?.army_cohesion) || 0) - UNDERSUPPLY_COHESION_DRAIN);
        await supabase.from('factions').update({ army_cohesion: newCoh }).eq('id', fid);
    }

    return { supplied, underSupplied: underSupplied.size };
}

// ── COMBAT ─────────────────────────────────────────────────────────
const COMBAT = Object.freeze({
    INTENSITY: 0.04,   // base casualty rate vs the smaller force, at parity
    COH_BASE: 4,       // base cohesion drained per tick of battle
    DEF_POWER: 1.5,    // DEFEND power multiplier
    DEF_CAS: 0.5,      // DEFEND own-casualty multiplier
    DEF_COH: 0.4,      // DEFEND own-cohesion-drain multiplier
    UNARMED: 0.3,      // effectiveness of soldiers with no rifle
    QUAL_FLOOR: 0.5,   // power floor so raw numbers always count
    ARMOR_VAL: 1500, MECH_VAL: 750,   // manpower-equivalent punch per brigade
    REGROUP_COH: 20,   // cohesion a broken side rallies back to on retreat
});
const _pairKey = (x, y) => (x < y ? `${x}|${y}` : `${y}|${x}`);

// Per-tick land combat for fronts between nations at war. Front-level: all
// armies on a front pool strength for their side. ECP = effective manpower
// (real rifles weight unarmed troops down) × stat quality × supply, + armor.
// Both sides bleed manpower + cohesion each tick; a side at 0 cohesion (or no
// troops) breaks, and if its foe ASSAULTed the line slides one sector toward
// the broken side's capital. line 0 / sector_count = a capital has fallen and
// the front is decided (combat halts). DEFEND: ×1.5 power, ½ casualties,
// 0.4× cohesion drain, cannot advance. Non-fatal; bails on partial reads.
export async function processCombat(supabase, currentTick) {
    const { data: warRels, error: relErr } = await supabase
        .from('diplomatic_relations').select('nation_a_id, nation_b_id').eq('relation_type', 'war');
    if (relErr) { console.error('[processCombat] war relations load failed:', relErr.message); return { battles: 0 }; }
    if (!warRels || !warRels.length) return { battles: 0 };
    const warPairs = new Set(warRels.map(r => _pairKey(r.nation_a_id, r.nation_b_id)));

    const { data: allFronts, error: fErr } = await supabase.from('war_fronts')
        .select('id, nation_a_id, nation_b_id, sector_count, line_position, action_a, action_b')
        .eq('front_type', 'land');
    if (fErr) { console.error('[processCombat] fronts load failed:', fErr.message); return { battles: 0 }; }
    const fronts = (allFronts || []).filter(f => warPairs.has(_pairKey(f.nation_a_id, f.nation_b_id)));
    if (!fronts.length) return { battles: 0 };

    const frontIds = fronts.map(f => f.id);
    const frontById = new Map(fronts.map(f => [f.id, f]));

    const [secRes, armyRes] = await Promise.all([
        supabase.from('war_sectors').select('front_id, nation_id').in('front_id', frontIds),
        supabase.from('armies').select('id, faction_id, nation_id, assigned_front_id, supply_balance').in('assigned_front_id', frontIds),
    ]);
    if (secRes.error || armyRes.error) {
        console.error('[processCombat] core load failed:', (secRes.error || armyRes.error).message);
        return { battles: 0 };
    }
    const aCount = new Map(fronts.map(f => [f.id, 0]));   // nation_a's static sector count (line init)
    for (const s of (secRes.data || [])) {
        const f = frontById.get(s.front_id);
        if (f && s.nation_id === f.nation_a_id) aCount.set(f.id, aCount.get(f.id) + 1);
    }

    const armies = armyRes.data || [];
    const armyIds = armies.map(a => a.id);
    const factionIds = [...new Set(armies.map(a => a.faction_id))];

    let units = [], equip = [], facs = [];
    if (armyIds.length) {
        const uRes = await supabase.from('army_units')
            .select('id, army_id, total_manpower, brigades').in('army_id', armyIds).eq('status', 'Active');
        if (uRes.error) { console.error('[processCombat] units load failed:', uRes.error.message); return { battles: 0 }; }
        units = uRes.data || [];
        const unitIds = units.map(u => u.id);
        const [eqRes, fRes] = await Promise.all([
            unitIds.length
                ? supabase.from('army_brigade_equipment').select('army_unit_id, quantity, rifle_models(soldiers_per_rifle)').in('army_unit_id', unitIds)
                : Promise.resolve({ data: [] }),
            supabase.from('factions').select('id, army_training, army_professionalism, army_cohesion').in('id', factionIds),
        ]);
        // Bail on a partial read: missing equipment would make every army read
        // as unarmed (×0.3) and silently skew casualties across the board.
        if (eqRes.error || fRes.error) {
            console.error('[processCombat] equip/faction load failed:', (eqRes.error || fRes.error).message);
            return { battles: 0 };
        }
        equip = eqRes.data || [];
        facs = fRes.data || [];
    }

    const armedByUnit = new Map();
    for (const e of equip) armedByUnit.set(e.army_unit_id, (armedByUnit.get(e.army_unit_id) || 0) + (Number(e.quantity) || 0) * (Number(e.rifle_models?.soldiers_per_rifle) || 0));
    const unitsByArmy = new Map();
    for (const u of units) { if (!unitsByArmy.has(u.army_id)) unitsByArmy.set(u.army_id, []); unitsByArmy.get(u.army_id).push(u); }
    const facById = new Map(facs.map(f => [f.id, f]));

    const armiesByFront = new Map(fronts.map(f => [f.id, { a: [], b: [] }]));
    for (const ar of armies) {
        const f = frontById.get(ar.assigned_front_id); if (!f) continue;
        const bucket = armiesByFront.get(f.id);
        if (ar.nation_id === f.nation_a_id) bucket.a.push(ar);
        else if (ar.nation_id === f.nation_b_id) bucket.b.push(ar);
    }

    // Mutable running state, flushed once at the end (a faction may fight on
    // several fronts in one tick — cohesion/manpower carry across them).
    const cohVal = new Map([...facById].map(([id, f]) => [id, Number(f.army_cohesion) || 0]));
    const unitMp = new Map(units.map(u => [u.id, Number(u.total_manpower) || 0]));
    const lineUpd = new Map();
    let battles = 0;

    for (const f of fronts) {
        const N = Number(f.sector_count) || 0;
        let line = f.line_position;
        if (line === null || line === undefined) {
            line = Math.min(Math.max(aCount.get(f.id) || Math.floor(N / 2), 1), Math.max(N - 1, 1));
            lineUpd.set(f.id, line);
        }
        if (N <= 0 || line <= 0 || line >= N) continue;   // decided / unusable

        const buckets = armiesByFront.get(f.id);
        const A = computeSide(buckets.a, unitsByArmy, armedByUnit, facById, cohVal, unitMp);
        const B = computeSide(buckets.b, unitsByArmy, armedByUnit, facById, cohVal, unitMp);
        if (A.M <= 0 && B.M <= 0) continue;

        const actA = f.action_a === 'assault' ? 'assault' : 'defend';
        const actB = f.action_b === 'assault' ? 'assault' : 'defend';
        // Nobody attacking → quiet front: no engagement, no bleed this tick.
        if (actA !== 'assault' && actB !== 'assault') continue;

        const ecpA = A.ecp * (actA === 'defend' ? COMBAT.DEF_POWER : 1);
        const ecpB = B.ecp * (actB === 'defend' ? COMBAT.DEF_POWER : 1);
        const total = ecpA + ecpB;
        if (total <= 0) continue;

        const minM = Math.min(A.M || B.M, B.M || A.M);
        applyCasualties(A, COMBAT.INTENSITY * minM * (ecpB / total) * 2 * (actA === 'defend' ? COMBAT.DEF_CAS : 1), unitMp);
        applyCasualties(B, COMBAT.INTENSITY * minM * (ecpA / total) * 2 * (actB === 'defend' ? COMBAT.DEF_CAS : 1), unitMp);

        const cohA = COMBAT.COH_BASE * (ecpB / total) * 2 * (actA === 'defend' ? COMBAT.DEF_COH : 1);
        const cohB = COMBAT.COH_BASE * (ecpA / total) * 2 * (actB === 'defend' ? COMBAT.DEF_COH : 1);
        for (const fid of A.facIds) cohVal.set(fid, Math.max(0, (cohVal.get(fid) || 0) - cohA));
        for (const fid of B.facIds) cohVal.set(fid, Math.max(0, (cohVal.get(fid) || 0) - cohB));

        const aBroke = A.M <= 0 || sideCohesion(A, cohVal) <= 0;
        const bBroke = B.M <= 0 || sideCohesion(B, cohVal) <= 0;
        if (bBroke && !aBroke && actA === 'assault') {
            line = Math.min(N, line + 1);
            for (const fid of B.facIds) cohVal.set(fid, Math.max(cohVal.get(fid) || 0, COMBAT.REGROUP_COH));
            lineUpd.set(f.id, line);
        } else if (aBroke && !bBroke && actB === 'assault') {
            line = Math.max(0, line - 1);
            for (const fid of A.facIds) cohVal.set(fid, Math.max(cohVal.get(fid) || 0, COMBAT.REGROUP_COH));
            lineUpd.set(f.id, line);
        }
        battles++;
    }

    // Flush.
    for (const [fid, line] of lineUpd) await supabase.from('war_fronts').update({ line_position: line }).eq('id', fid);
    for (const u of units) {
        const nm = Math.round(unitMp.get(u.id));
        if (nm !== (Number(u.total_manpower) || 0)) {
            const patch = nm <= 0 ? { total_manpower: 0, status: 'Decommissioned' } : { total_manpower: nm };
            await supabase.from('army_units').update(patch).eq('id', u.id);
        }
    }
    for (const [fid, f] of facById) {
        const nc = Math.round(cohVal.get(fid));
        if (nc !== (Number(f.army_cohesion) || 0)) await supabase.from('factions').update({ army_cohesion: nc }).eq('id', fid);
    }

    return { battles };
}

// One side's pooled strength. ECP per army: effective manpower (real rifles
// weight unarmed troops to 30%) × (floor + stat quality) × supply, + armor punch.
function computeSide(armies, unitsByArmy, armedByUnit, facById, cohVal, unitMp) {
    let M = 0, ecp = 0;
    const facIds = new Set();
    const unitIds = [];
    for (const ar of armies) {
        facIds.add(ar.faction_id);
        const fac = facById.get(ar.faction_id) || {};
        let aM = 0, armed = 0, armor = 0, mech = 0;
        for (const u of (unitsByArmy.get(ar.id) || [])) {
            const mp = unitMp.get(u.id) || 0;
            aM += mp;
            armed += Math.min(mp, armedByUnit.get(u.id) || 0);
            for (const bk of (Array.isArray(u.brigades) ? u.brigades : [])) {
                if (bk === 'armor') armor++; else if (bk === 'mechanized') mech++;
            }
            unitIds.push(u.id);
        }
        M += aM;
        const quality = ((Number(fac.army_training) || 0) + (Number(fac.army_professionalism) || 0) + (cohVal.get(ar.faction_id) || 0)) / 300;
        const effM = armed + COMBAT.UNARMED * (aM - armed);
        const supplyMlt = (Number(ar.supply_balance) || 0) >= 0 ? 1 : 0.6;
        ecp += effM * (COMBAT.QUAL_FLOOR + quality) * supplyMlt + armor * COMBAT.ARMOR_VAL + mech * COMBAT.MECH_VAL;
    }
    return { M, ecp, facIds, unitIds };
}

// Average cohesion of a side's factions (typically one) — the break gauge.
function sideCohesion(side, cohVal) {
    if (!side.facIds.size) return 0;
    let sum = 0;
    for (const fid of side.facIds) sum += cohVal.get(fid) || 0;
    return sum / side.facIds.size;
}

// Distribute a side's casualties across its units in proportion to manpower.
function applyCasualties(side, cas, unitMp) {
    if (cas <= 0 || !side.unitIds.length) return;
    let total = 0;
    for (const id of side.unitIds) total += unitMp.get(id) || 0;
    if (total <= 0) return;
    for (const id of side.unitIds) {
        const mp = unitMp.get(id) || 0;
        unitMp.set(id, Math.max(0, mp - cas * (mp / total)));
    }
}
