// ════════════════════════════════════════════════════════════════════
// Stat tiers — Stability + Civil Freedoms scoring bands
// ════════════════════════════════════════════════════════════════════
// Used by the nation-card stat strip on politician-nation.html to
// color-code the tier badge ("Firm" / "Strained" / etc.) under each
// score. The wider stat-prose body these tiers used to feed lived on
// politician-characteristics.html, which has since pivoted to
// politician-modifiers.html (a Situations / Modifiers surface that
// doesn't render per-stat prose). Filename kept for now so the
// existing import path doesn't break; can rename to nation-stat-tiers
// in a future cleanup pass.
//
// Tier shape:
//   min    — threshold (score points, 0..100)
//   label  — short tier name shown under the value
//   color  — hex used for the colored badge
// Highest threshold first; pickTier walks top-down.
// ════════════════════════════════════════════════════════════════════

const TIER_COLOR = {
    green:    '#4ec98a',
    teal:     '#5aafa5',
    amber:    '#c8a64e',
    red:      '#d97070',
    deepRed:  '#a85050',
};

export const STABILITY_TIERS = [
    { min: 81, label: 'Firm',     color: TIER_COLOR.green },
    { min: 61, label: 'Strained', color: TIER_COLOR.teal },
    { min: 41, label: 'Unrest',   color: TIER_COLOR.amber },
    { min: 21, label: 'Crisis',   color: TIER_COLOR.red },
    { min:  0, label: 'Collapse', color: TIER_COLOR.deepRed },
];

export const CIVIL_FREEDOMS_TIERS = [
    { min: 81, label: 'Free',       color: TIER_COLOR.green },
    { min: 61, label: 'Permissive', color: TIER_COLOR.teal },
    { min: 41, label: 'Restricted', color: TIER_COLOR.red },
    { min: 21, label: 'Repressed',  color: TIER_COLOR.deepRed },
    { min:  0, label: 'Closed',     color: TIER_COLOR.deepRed },
];

export function pickTier(tiers, value) {
    for (const t of tiers) if (value >= t.min) return t;
    return tiers[tiers.length - 1];
}
