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
 * Computes one faction's Total Weighted Popularity for a nation.
 *
 * TWP = Σ over active sectors of (popularity * weight * base_turnout)
 *
 * Inputs are arrays straight from the DB:
 *   sectors[i]         = { id, sector_key, weight, base_turnout, is_active, ... }
 *   popularityRows[i]  = { faction_id, sector_id, popularity }   (0..100)
 *
 * Returns an integer-ish number (popularity tenths × weight × turnout). Inactive
 * sectors are skipped. Missing popularity rows are treated as 0.
 */
export function calculateTotalWeightedPopularity(factionId, sectors, popularityRows) {
    if (!factionId) return 0;
    const popBySector = indexPopularityByFactionAndSector(popularityRows);
    const factionPop = popBySector.get(factionId) || new Map();

    let total = 0;
    for (const s of sectors) {
        if (!s.is_active) continue;
        const pop = factionPop.get(s.id) ?? 0;
        const weight = Number(s.weight) || 0;
        const turnout = Number(s.base_turnout) || 0;
        total += pop * weight * turnout;
    }
    return total;
}

/**
 * Per-sector contribution breakdown for one faction. Used by the diagnostics
 * panel so admins can see exactly which sectors are pulling weight.
 *
 * Returns an array, one entry per ACTIVE sector (preserving the input order):
 *   { sector_id, sector_key, name, popularity, weight, base_turnout, contribution }
 *
 *   contribution = popularity * weight * base_turnout
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
