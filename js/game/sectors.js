/**
 * sectors.js — pure calculation module for the per-nation voter sector system
 *
 * Phase 1 of the sectors rollout. Every function in this file is a pure JS
 * function: it operates on plain data and returns plain data. No DB calls,
 * no DOM, no side effects. The admin Sectors tab and (eventually) the election
 * resolver call into this module.
 *
 * Storage convention (matches sql/migrations/20260426_sectors_phase0.sql):
 *   * `sectors.weight`        — smallint 1..3
 *   * `sectors.base_turnout`  — numeric(3,2) 0.50..1.30
 *   * `faction_sector_popularity.popularity` — smallint 0..100 (integer tenths)
 *
 * All math in this file operates on integer tenths to avoid the float drift
 * the original V3 spec warned about. The display layer divides by 10.
 */

// ─── Lead-to-seats curve constants ──────────────────────────────────────────
// V3 piecewise-linear curve, calibrated for a 100-seat parliament. Returns
// the leading party's share of seats given a popularity lead. Values <= 0
// return 50 (a tie at the top of the curve).
const LEAD_CURVE_BREAKPOINTS = [
    { lead:   0, seats: 50 },
    { lead:  10, seats: 55 },
    { lead:  20, seats: 58 },
    { lead:  50, seats: 67 },
    { lead: 100, seats: 78 },
    { lead: 200, seats: 92 },
];
const LEAD_CURVE_TAIL_SLOPE = 0.14; // seats gained per +1 lead beyond 200

// ─── Total Weighted Popularity ──────────────────────────────────────────────

/**
 * Per-sector contribution breakdown for one faction. Used by the diagnostics
 * panel so admins can see exactly which sectors are pulling weight, and as
 * the single source of truth that calculateTotalWeightedPopularity sums over.
 *
 * Returns an array, one entry per ACTIVE sector (preserving the input order):
 *   { sector_id, sector_key, name, popularity, weight, base_turnout, contribution }
 *
 *   contribution = popularity * weight * base_turnout
 *
 * Inputs are arrays straight from the DB:
 *   sectors[i]         = { id, sector_key, weight, base_turnout, is_active, ... }
 *   popularityRows[i]  = { faction_id, sector_id, popularity }   (0..100)
 *
 * Inactive sectors are skipped. Missing popularity rows are treated as 0.
 */
export function calculateSectorContributions(factionId, sectors, popularityRows) {
    const popBySector = indexPopularityByFactionAndSector(popularityRows);
    const factionPop = popBySector.get(factionId) || new Map();

    const out = [];
    for (const s of sectors) {
        if (!s.is_active) continue;
        const pop = factionPop.get(s.id) ?? 0;
        const weight = Number(s.weight) || 0;
        const turnout = Number(s.base_turnout) || 0;
        out.push({
            sector_id: s.id,
            sector_key: s.sector_key,
            name: s.name,
            popularity: pop,
            weight,
            base_turnout: turnout,
            contribution: pop * weight * turnout,
        });
    }
    return out;
}

/**
 * Computes one faction's Total Weighted Popularity for a nation.
 *
 *   TWP = Σ over active sectors of (popularity * weight * base_turnout)
 *
 * Implemented as a sum over calculateSectorContributions so the math has a
 * single source of truth. The array allocation is fine for Phase 1's admin
 * use case; if Phase 3's election hot path needs a fast path, add one then.
 */
export function calculateTotalWeightedPopularity(factionId, sectors, popularityRows) {
    if (!factionId) return 0;
    return calculateSectorContributions(factionId, sectors, popularityRows)
        .reduce((sum, c) => sum + c.contribution, 0);
}

// ─── Lead-to-seats curve ────────────────────────────────────────────────────

/**
 * Translates a popularity lead between two parties into the leading party's
 * seat share, scaled to the given parliament size. Mirrors V3's piecewise
 * curve: 0→50, +10→55, +20→58, +50→67, +100→78, +200→92, then linear at
 * +0.14 seats per +1 lead.
 *
 * Lead values <= 0 always return 50 seats per 100 (a tie or negative lead
 * means the function isn't being asked about the leader).
 *
 * Returns a non-rounded number (caller decides how to round/distribute).
 */
export function leadToSeatsCurve(lead, parliamentSize = 100) {
    const seatsPer100 = leadToSeatsPer100(lead);
    return seatsPer100 * (parliamentSize / 100);
}

function leadToSeatsPer100(lead) {
    if (!Number.isFinite(lead) || lead <= 0) return 50;

    for (let i = 0; i < LEAD_CURVE_BREAKPOINTS.length - 1; i++) {
        const lo = LEAD_CURVE_BREAKPOINTS[i];
        const hi = LEAD_CURVE_BREAKPOINTS[i + 1];
        if (lead <= hi.lead) {
            const t = (lead - lo.lead) / (hi.lead - lo.lead);
            return lo.seats + t * (hi.seats - lo.seats);
        }
    }
    const last = LEAD_CURVE_BREAKPOINTS[LEAD_CURVE_BREAKPOINTS.length - 1];
    return last.seats + (lead - last.lead) * LEAD_CURVE_TAIL_SLOPE;
}

// ─── Tie detection and resolution ───────────────────────────────────────────

/**
 * For each active sector, finds the set of factions tied at the highest
 * popularity. Storage is already at display precision (integer tenths), so
 * a tie means equal stored values: 73 and 73 tie ("7.3" each); 73 and 74
 * do not ("7.3" vs "7.4").
 *
 * Returns an array of { sector_id, sector_key, name, tied_faction_ids: [...] }
 * for sectors where 2+ factions share the top value. Sectors with a unique
 * leader, or with all factions at 0, are omitted (a tie at "no support" is
 * meaningless for spatial-competition purposes — V3 §3.3).
 */
export function findTiedSectors(factions, sectors, popularityRows) {
    const popBySector = indexPopularityBySector(popularityRows);
    const factionIds = new Set(factions.map(f => f.id));
    const out = [];

    for (const s of sectors) {
        if (!s.is_active) continue;
        const rows = popBySector.get(s.id) || [];
        const eligible = rows.filter(r => factionIds.has(r.faction_id));
        if (eligible.length < 2) continue;

        const pops = eligible.map(r => Number(r.popularity) || 0);
        const top = Math.max(...pops);
        if (top <= 0) continue;

        const tied = eligible.filter((_, i) => pops[i] === top).map(r => r.faction_id);
        if (tied.length >= 2) {
            out.push({
                sector_id: s.id,
                sector_key: s.sector_key,
                name: s.name,
                tied_faction_ids: tied,
            });
        }
    }
    return out;
}

/**
 * Picks one winner from a tied set using the supplied RNG. RNG must be a
 * function returning a float in [0, 1) — `Math.random` works in production,
 * tests pass a deterministic generator.
 *
 * Throws if `tiedFactionIds` has fewer than 2 entries (callers should only
 * invoke this for actual ties).
 */
export function resolveTie(tiedFactionIds, rng = Math.random) {
    if (!Array.isArray(tiedFactionIds) || tiedFactionIds.length < 2) {
        throw new Error('resolveTie requires at least 2 tied factions');
    }
    const idx = Math.floor(rng() * tiedFactionIds.length);
    // Defensive clamp: rng() === 1.0 (rare but possible with bad RNGs) would
    // otherwise overshoot the array.
    return tiedFactionIds[Math.min(idx, tiedFactionIds.length - 1)];
}

// ─── Bill resolution: vote-aligned sector shifts (Phase 2) ──────────────────

/**
 * Translate one bill's sector_effects + per-faction votes into the list of
 * popularity deltas to apply on resolution. Pure function — caller does the
 * DB upsert + 0..100 clamp.
 *
 * Inputs:
 *   effects   = [{ sector_key: string, change_tenths: number }, ...]
 *               Signed; positive = popularity gain on pass. Caller is
 *               responsible for summing across articles before invoking.
 *   voters    = Map<factionId, 'yes' | 'no' | 'abstain'>
 *               Normalized stances from bill_support. Sponsor is auto-merged
 *               internally as 'yes' regardless of whether they cast a vote.
 *   sponsorId = string | null   The proposing faction.
 *   result    = 'passed' | 'failed' | 'withdrawn'
 *
 * Output:
 *   [{ factionId, sector_key, delta_tenths }, ...]
 *
 * Effect model (Phase 2 design — vote-aligned pass / asymmetric fail):
 *   * passed:    sponsor + YES voters get +change_tenths;
 *                NO voters get -change_tenths;
 *                abstain unaffected.
 *   * failed:    sponsor gets -change_tenths (full inverse); other voters
 *                unaffected. The proposer "owns" the failed bill alone.
 *   * withdrawn: no effect for anyone.
 *
 * Effects with non-numeric or zero change_tenths are skipped so callers can
 * pass raw arrays without pre-filtering.
 */
export function computeSectorShifts({ effects, voters, sponsorId, result }) {
    if (result !== 'passed' && result !== 'failed') return [];
    if (!Array.isArray(effects) || effects.length === 0) return [];

    const cleanEffects = effects.filter(e =>
        e
        && typeof e.sector_key === 'string' && e.sector_key.length > 0
        && Number.isFinite(Number(e.change_tenths)) && Number(e.change_tenths) !== 0
    );
    if (cleanEffects.length === 0) return [];

    const out = [];

    if (result === 'passed') {
        // Snapshot voters and force the sponsor to YES so callers don't have
        // to remember to pre-merge. Matches the existing processIdeologyShifts
        // pattern (bills.js:432-433).
        const stances = new Map(voters || []);
        if (sponsorId) stances.set(sponsorId, 'yes');

        for (const eff of cleanEffects) {
            const change = Number(eff.change_tenths);
            for (const [factionId, stance] of stances) {
                if (stance === 'yes') {
                    out.push({ factionId, sector_key: eff.sector_key, delta_tenths:  change });
                } else if (stance === 'no') {
                    out.push({ factionId, sector_key: eff.sector_key, delta_tenths: -change });
                }
                // abstain or unknown stance => no row
            }
        }
        return out;
    }

    // result === 'failed': only the sponsor takes the hit, full inverse magnitude.
    if (!sponsorId) return [];
    for (const eff of cleanEffects) {
        out.push({
            factionId: sponsorId,
            sector_key: eff.sector_key,
            delta_tenths: -Number(eff.change_tenths),
        });
    }
    return out;
}

/**
 * Sum sector_effects arrays across multiple articles of one bill into a
 * single deduplicated list, grouping by sector_key. Skips malformed entries
 * silently so downstream calc stays defensive.
 *
 * Inputs:
 *   effectsArrays = [[{sector_key, change_tenths}, ...], [...], ...]
 *
 * Output:
 *   [{ sector_key, change_tenths }, ...]
 */
export function sumSectorEffects(effectsArrays) {
    const totals = new Map();
    for (const arr of effectsArrays || []) {
        if (!Array.isArray(arr)) continue;
        for (const e of arr) {
            if (!e || typeof e.sector_key !== 'string' || e.sector_key.length === 0) continue;
            const change = Number(e.change_tenths);
            if (!Number.isFinite(change) || change === 0) continue;
            totals.set(e.sector_key, (totals.get(e.sector_key) || 0) + change);
        }
    }
    // Drop net-zero totals (e.g., +10 then -10) so downstream code never has
    // to filter them — they're equivalent to "no effect on this sector".
    const out = [];
    for (const [sector_key, change_tenths] of totals) {
        if (change_tenths !== 0) out.push({ sector_key, change_tenths });
    }
    return out;
}

// ─── Election: independents roll (Phase 3) ──────────────────────────────────

// Lookup table mapping a 1D10 roll (1..10) to the delta applied to a nation's
// independent_seats count on each election. Negative on rolls 1-6, positive
// on rolls 7-10 — biased toward decay so independents fade absent disruption.
const INDEPENDENT_ROLL_TABLE = {
    1: -6, 2: -5, 3: -4, 4: -3, 5: -2, 6: -1,
    7: +1, 8: +2, 9: +3, 10: +4,
};
const INDEPENDENT_CAP_FRACTION = 0.08; // max 8% of parliament_size, floored

/**
 * Roll the per-election delta on a nation's independent seat count and
 * clamp the result to [0, floor(parliamentSize * 0.08)].
 *
 *   roll: 1  2  3  4  5  6  7  8  9  10
 *   Δ:   -6 -5 -4 -3 -2 -1 +1 +2 +3 +4
 *
 * Returns { roll, delta, next, cap } where:
 *   roll  = the 1D10 result (1..10)
 *   delta = the table delta for that roll
 *   next  = the new independent_seats value after applying delta + clamp
 *   cap   = floor(parliamentSize * 0.08)
 *
 * RNG is injectable for deterministic tests; defaults to Math.random.
 */
export function rollIndependents(currentCount, parliamentSize, rng = Math.random) {
    const ps = Number(parliamentSize) || 0;
    const cap = Math.max(0, Math.floor(ps * INDEPENDENT_CAP_FRACTION));
    const current = Math.max(0, Math.min(cap, Number(currentCount) || 0));

    const roll = 1 + Math.floor(rng() * 10);
    const safeRoll = Math.min(10, Math.max(1, roll));   // defensive clamp on bad RNGs
    const delta = INDEPENDENT_ROLL_TABLE[safeRoll];
    const next = Math.max(0, Math.min(cap, current + delta));

    return { roll: safeRoll, delta, next, cap };
}

// ─── Election: seat allocation (Phase 3) ────────────────────────────────────

const DEFAULT_FRINGE_THRESHOLD = 30;

/**
 * Allocate seats to factions by Total Weighted Popularity using the Largest
 * Remainder method (same algorithm as the legacy allocateSeatsByVotes —
 * proven proportional allocation). Wraps the math with two Phase 3 rules:
 *
 *   1. Fringe threshold — factions with TWP below `fringeThreshold` get 0
 *      seats. Below-threshold parties are excluded from the divisor; their
 *      voters effectively don't count for seat math.
 *   2. Zero-fallback — if NO faction qualifies (every TWP is 0 or below the
 *      threshold, common in early Phase 3 before sector data is seeded),
 *      seats are split evenly across all input factions. Predictable, no
 *      division-by-zero, gives a working election when there's no signal.
 *
 * Inputs:
 *   twpByFaction    = { factionId: twp, ... }
 *   totalSeats      = available seats (parliament_size - independent_seats)
 *   fringeThreshold = below-this TWP gets zero seats (default 30)
 *
 * Output:
 *   { factionId: seats, ... } summing to exactly totalSeats.
 */
export function allocateSeatsByTwp(twpByFaction, totalSeats, fringeThreshold = DEFAULT_FRINGE_THRESHOLD) {
    const ids = Object.keys(twpByFaction || {});
    if (ids.length === 0 || totalSeats <= 0) {
        const empty = {};
        for (const id of ids) empty[id] = 0;
        return empty;
    }

    const qualifying = ids.filter(id => Number(twpByFaction[id]) >= fringeThreshold);

    // Zero-fallback: nobody qualifies → split evenly across ALL inputs.
    if (qualifying.length === 0) {
        return distributeEvenly(ids, totalSeats);
    }

    // Largest Remainder among qualifying factions; non-qualifying get 0.
    const totalQualifying = qualifying.reduce((s, id) => s + Number(twpByFaction[id]), 0);
    const seats = {};
    for (const id of ids) seats[id] = 0;

    if (totalQualifying === 0) {
        // All qualifying factions tied at exactly the threshold and threshold
        // is 0 (rare). Treat the same as the zero-fallback for the qualifying set.
        return { ...seats, ...distributeEvenly(qualifying, totalSeats) };
    }

    const quota = totalQualifying / totalSeats;
    const fractionals = [];
    let allocated = 0;
    for (const id of qualifying) {
        const raw = Number(twpByFaction[id]) / quota;
        const floor = Math.floor(raw);
        seats[id] = floor;
        allocated += floor;
        fractionals.push({ id, fractional: raw - floor });
    }
    fractionals.sort((a, b) => b.fractional - a.fractional);
    const remaining = totalSeats - allocated;
    for (let i = 0; i < remaining; i++) {
        seats[fractionals[i].id] += 1;
    }
    return seats;
}

function distributeEvenly(ids, totalSeats) {
    const out = {};
    if (ids.length === 0) return out;
    const base = Math.floor(totalSeats / ids.length);
    const remainder = totalSeats - (base * ids.length);
    // Stable order: input order, first N factions get the +1.
    ids.forEach((id, i) => { out[id] = base + (i < remainder ? 1 : 0); });
    return out;
}

// ─── Election: post-allocation modifiers (Phase 3) ──────────────────────────

const ELECTABILITY_MODIFIER = {
    Low:      -0.02,
    Moderate:  0.00,
    High:     +0.02,
};

/**
 * Apply the leader Electability modifier to each faction's seat count.
 * Modifier table per V3 §4.5: Low = -2%, Moderate = 0%, High = +2%.
 *
 * Inputs are integer seat counts. The modifier produces fractional results;
 * the caller normalizes back to integers (uses Largest Remainder again to
 * ensure the total still equals the input total).
 *
 *   seatsByFaction        = { factionId: seats, ... }
 *   electabilityByFaction = { factionId: 'Low'|'Moderate'|'High', ... }
 *   totalSeats            = expected sum (caller passes parliament_size - independents)
 *
 * Returns adjusted integer seat counts that still sum to totalSeats.
 * Factions with no electability entry get the Moderate (0%) modifier.
 */
export function applyElectabilityModifier(seatsByFaction, electabilityByFaction, totalSeats) {
    const ids = Object.keys(seatsByFaction || {});
    if (ids.length === 0) return {};

    // Step 1: scale each faction's seats by (1 + modifier).
    const scaled = {};
    for (const id of ids) {
        const seats = Number(seatsByFaction[id]) || 0;
        const electability = electabilityByFaction?.[id] ?? 'Moderate';
        const mod = ELECTABILITY_MODIFIER[electability] ?? 0;
        scaled[id] = seats * (1 + mod);
    }

    // Step 2: re-normalize to integers summing to totalSeats via Largest Remainder.
    const total = Object.values(scaled).reduce((s, v) => s + v, 0);
    if (total <= 0) {
        // All zeros after scaling — return zeros.
        const zeros = {};
        for (const id of ids) zeros[id] = 0;
        return zeros;
    }
    return allocateByLargestRemainder(scaled, totalSeats);
}

/**
 * Apply the ±5% uncertainty roll (V3 §4.4) to the leading party's seat count,
 * then re-normalize so the total still equals totalSeats. Other parties absorb
 * the swing proportionally to their existing seat share.
 *
 * If there's no clear leader (no one above 0 seats), the function is a no-op.
 *
 * RNG is injectable for tests; defaults to Math.random.
 */
export function applyUncertaintyRoll(seatsByFaction, totalSeats, rng = Math.random) {
    const ids = Object.keys(seatsByFaction || {});
    if (ids.length === 0) return {};

    let leaderId = null;
    let leaderSeats = -1;
    for (const id of ids) {
        const seats = Number(seatsByFaction[id]) || 0;
        if (seats > leaderSeats) { leaderSeats = seats; leaderId = id; }
    }
    if (!leaderId || leaderSeats <= 0) return { ...seatsByFaction };

    // ±5% of parliament_size. (rng() * 2 - 1) ∈ [-1, 1).
    const swing = Math.round((rng() * 2 - 1) * 0.05 * totalSeats);
    if (swing === 0) return { ...seatsByFaction };

    // Apply swing to leader, absorb the inverse proportionally across others.
    const adjusted = { ...seatsByFaction };
    adjusted[leaderId] = Math.max(0, leaderSeats + swing);

    const otherIds = ids.filter(id => id !== leaderId);
    const otherTotal = otherIds.reduce((s, id) => s + (Number(seatsByFaction[id]) || 0), 0);
    if (otherTotal > 0) {
        const others = {};
        for (const id of otherIds) others[id] = (Number(seatsByFaction[id]) || 0) - swing * (Number(seatsByFaction[id]) || 0) / otherTotal;
        const normalized = allocateByLargestRemainder(others, totalSeats - adjusted[leaderId]);
        for (const id of otherIds) adjusted[id] = normalized[id];
    }
    // Final defensive normalize: if rounding put us off by 1, give/take from leader.
    const sum = ids.reduce((s, id) => s + adjusted[id], 0);
    if (sum !== totalSeats) adjusted[leaderId] = Math.max(0, adjusted[leaderId] + (totalSeats - sum));
    return adjusted;
}

// ─── Election: tie-breaker bonuses (Phase 3) ────────────────────────────────

/**
 * For each sector where 2+ factions are tied at the highest popularity,
 * roll a die to pick the winner and assign them a virtual +10 popularity
 * (== +1.0 displayed) for THIS election only. The caller layers the bonus
 * map on top of stored popularity when computing TWP.
 *
 * Returns: Map<factionId, Map<sectorKey, bonusTenths>>
 *
 * RNG is injectable for tests.
 */
export function applyTieBreakerBonuses(factions, sectors, popularityRows, rng = Math.random) {
    const tied = findTiedSectors(factions, sectors, popularityRows);
    const bonuses = new Map();
    for (const t of tied) {
        const winner = resolveTie(t.tied_faction_ids, rng);
        if (!bonuses.has(winner)) bonuses.set(winner, new Map());
        // V3 §3.2 specifies +1 displayed popularity = +10 in integer tenths.
        bonuses.get(winner).set(t.sector_key, 10);
    }
    return bonuses;
}

// ─── Internal: Largest Remainder (DRY across the new helpers) ───────────────

function allocateByLargestRemainder(weightsByFaction, totalSeats) {
    const ids = Object.keys(weightsByFaction);
    const out = {};
    for (const id of ids) out[id] = 0;
    const total = ids.reduce((s, id) => s + Math.max(0, Number(weightsByFaction[id]) || 0), 0);
    if (total <= 0 || totalSeats <= 0) return out;

    const quota = total / totalSeats;
    const fractionals = [];
    let allocated = 0;
    for (const id of ids) {
        const w = Math.max(0, Number(weightsByFaction[id]) || 0);
        const raw = w / quota;
        const floor = Math.floor(raw);
        out[id] = floor;
        allocated += floor;
        fractionals.push({ id, fractional: raw - floor });
    }
    fractionals.sort((a, b) => b.fractional - a.fractional);
    for (let i = 0; i < (totalSeats - allocated); i++) {
        out[fractionals[i].id] += 1;
    }
    return out;
}


// ─── Display helpers ────────────────────────────────────────────────────────

/**
 * Convert integer-tenths storage (0..100) to displayed popularity ("0.0".."10.0").
 */
export function formatPopularity(tenths) {
    const n = Number(tenths);
    if (!Number.isFinite(n)) return '0.0';
    return (n / 10).toFixed(1);
}

/**
 * Convert a displayed popularity string ("7.3", "10", "0") to integer tenths
 * (73, 100, 0). Out-of-range or non-numeric inputs return null so callers can
 * surface a validation error.
 */
export function parsePopularity(displayValue) {
    const n = Number(displayValue);
    if (!Number.isFinite(n)) return null;
    if (n < 0 || n > 10) return null;
    return Math.round(n * 10);
}

// ─── Internal helpers ───────────────────────────────────────────────────────

function indexPopularityByFactionAndSector(popularityRows) {
    const m = new Map();
    for (const r of popularityRows || []) {
        let inner = m.get(r.faction_id);
        if (!inner) { inner = new Map(); m.set(r.faction_id, inner); }
        inner.set(r.sector_id, Number(r.popularity) || 0);
    }
    return m;
}

function indexPopularityBySector(popularityRows) {
    const m = new Map();
    for (const r of popularityRows || []) {
        let arr = m.get(r.sector_id);
        if (!arr) { arr = []; m.set(r.sector_id, arr); }
        arr.push(r);
    }
    return m;
}
