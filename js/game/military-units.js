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
