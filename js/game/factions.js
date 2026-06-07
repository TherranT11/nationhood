/**
 * factions.js — Single source of truth for "is this faction inactive?"
 *
 * Before this module the check was inlined in 5+ places as
 * `f.nation_id && !f.abandoned_at`. The impeachment trigger needed
 * a third signal (is_banned), and we don't want each caller to
 * diverge on which flags count. One helper, one definition.
 *
 * Inactivity tiers (in priority order):
 *   1. abandoned   — player explicitly disbanded the faction
 *   2. unassigned  — faction has no nation_id (detached / never seeded);
 *                    entrepreneurs are exempt — they are nation-agnostic
 *                    by design and always have nation_id = null
 *   3. banned      — admin-banned via factions.is_banned
 *
 * If you only need a boolean, use isFactionInactive(f). If you need
 * to surface WHY (e.g., for a UI label), use getFactionInactiveReason(f).
 */

// officeTitle resolves a politician_office enum to its display string.
// Shared with the career-page rungs so a new office value only lands
// in one place (utils.js OFFICE_TITLES) to flow through both surfaces.
import { officeTitle } from '../utils.js';

/**
 * Returns one of 'abandoned' | 'unassigned' | 'banned' | null.
 * null means the faction is structurally active.
 */
export function getFactionInactiveReason(f) {
    if (!f) return null;
    if (f.abandoned_at) return 'abandoned';
    // Entrepreneurs are nation-agnostic by design (created with
    // nation_id = null); a missing nation_id is not "unassigned" for them.
    if (!f.nation_id && f.faction_type !== 'entrepreneur') return 'unassigned';
    if (f.is_banned)    return 'banned';
    return null;
}

/**
 * Boolean convenience wrapper around getFactionInactiveReason.
 * True iff the faction is in any inactive state.
 */
export function isFactionInactive(f) {
    return getFactionInactiveReason(f) !== null;
}

/**
 * Faction types hidden from every faction-switcher dropdown (common /
 * corp / entrepreneur / military / politician topbars). Single source
 * for that rule:
 *
 *   • 'corporation'   — legacy corps fully retired.
 *   • 'party' +
 *     'movement_party' — political-party sunset Phase 1 (20270612).
 *                        Players can no longer switch INTO a party
 *                        from the topbar; the row also gets filtered
 *                        out of the active-faction picker in
 *                        js/common.js so a stale sessionStorage
 *                        active_faction_id pointing at a party
 *                        redirects to a Politician or Entrepreneur
 *                        the user owns.
 *   • 'military'       — military faction switcher access sunset.
 *                        Mirrors the party pattern: existing army
 *                        factions still exist, war-room reads still
 *                        work, but the switcher chip is gone from
 *                        every dashboard so an entrepreneur can no
 *                        longer hop into the army from their own
 *                        topbar. Common.js's stale-session redirect
 *                        inherits the same gate.
 *
 * Existing rows are NOT deleted — the politics / war-room engines
 * still read them. This is only the switcher / picker gate.
 */
export function isHiddenFromSwitcher(f) {
    const t = f?.faction_type;
    return t === 'corporation' || t === 'party' || t === 'movement_party' || t === 'military';
}

/**
 * Branch → dashboard URL for military factions. Add entries as new
 * branch dashboards land. Importers should look up by faction.branch
 * and fall back gracefully if the entry is missing.
 */
export const BRANCH_DASHBOARDS = {
    army: 'army-dashboard.html',
};

/**
 * Branch key → uppercase display label for badges and headers
 * ("army" → "ARMY", "air_force" → "AIR FORCE"). Fallback handles any
 * future branch keys by upper-casing and converting underscores.
 */
export function getBranchDisplayLabel(branch) {
    if (branch === 'army')      return 'ARMY';
    if (branch === 'navy')      return 'NAVY';
    if (branch === 'air_force') return 'AIR FORCE';
    return (branch || '').toUpperCase().replace(/_/g, ' ');
}

/**
 * Badge label + color for a faction_type, used by the faction switcher
 * dropdowns in every topbar. Single source so adding or renaming a type
 * doesn't require touching every renderer.
 */
export function getFactionTypeBadge(factionType) {
    if (factionType === 'corporation')  return { label: 'CORP',  color: 'var(--teal)'   };
    if (factionType === 'military')     return { label: 'MIL',   color: 'var(--red)'    };
    if (factionType === 'entrepreneur') return { label: 'ENTR',  color: 'var(--purple)' };
    if (factionType === 'politician')   return { label: 'POL',   color: 'var(--teal)'   };
    return                                     { label: 'PARTY', color: 'var(--amber)'  };
}

/**
 * Role suffix for a politician faction in the switcher chips, so a
 * player with multiple politicians can tell their advocate from their
 * MP from their civil servant when switching between them.
 *
 * Mutually exclusive in practice — the civil-service gate (20270507)
 * blocks the exam if bar_admitted_nation_id is set, and election +
 * appointment paths each write only one of politician_office /
 * politician_ministry. If two ever co-exist on the same row,
 * Advocate wins by display priority (most stable career identity).
 *
 * Returns null for non-politician factions or unassigned politicians
 * (junior politician with no career yet) — callers should skip the
 * suffix in that case rather than print "(null)".
 */
export function getPoliticianRoleLabel(faction) {
    if (!faction || faction.faction_type !== 'politician') return null;
    if (faction.bar_admitted_nation_id) {
        // Bench tiers replace lower suffixes — show the most recent /
        // highest rung. Priority: Magistrate (bench, 20270531) →
        // State Prosecutor (parallel sidestep, 20270532) → Experienced
        // Advocate (20270529) → Advocate. Magistrate wins when both
        // bench and prosecutor are held (rare; possible since the two
        // are parallel paths). All columns are set-once / never-
        // cleared. `!= null` so a tick-0 stamp still reads as set
        // (truthy would treat 0 as not-yet-stepped-up).
        if (faction.politician_magistrate_at_tick != null) return 'Magistrate';
        // Display label was "State Prosecutor" until 20270543 renamed
        // it to "State Advocate" — the column / RPC / event_log
        // trigger_key keep the original name to avoid a schema churn
        // pass; only the user-facing string flipped.
        if (faction.politician_state_prosecutor_at_tick != null) return 'State Advocate';
        if (faction.politician_experienced_advocate_at_tick != null) return 'Experienced Advocate';
        return 'Advocate';
    }
    // Elected office — covers Community Organizer / City Council Member
    // / Member of Parliament / Senior MP. OFFICE_TITLES (utils.js) is
    // the single source for the display strings shared with the career
    // page rungs, so adding a new office value there flows through here
    // automatically. Falsy return ('' from unknown values) collapses to
    // null at the caller's `role ? ...` check.
    if (faction.politician_office) return officeTitle(faction.politician_office) || null;
    if (faction.politician_ministry) return 'Civil Servant';
    return null;
}

/**
 * Dashboard URL for a faction the player is switching INTO from a faction
 * switcher dropdown. Returns null for unknown types so each caller can
 * apply its own home-page fallback (party pages default to dashboard.html,
 * corp pages to corp-dashboard.html). Military factions whose branch has
 * no dashboard yet (navy, air_force) route to faction-select.html so the
 * player isn't stranded.
 */
export function getFactionDashboardUrl(faction) {
    if (!faction) return null;
    // Legacy corporations are retired (corp-cull) — send any stray login to
    // the neutral faction chooser rather than a deleted dashboard.
    if (faction.faction_type === 'corporation') return 'faction-select.html';
    if (faction.faction_type === 'party')       return 'dashboard.html';
    if (faction.faction_type === 'military') {
        return BRANCH_DASHBOARDS[faction.branch] || 'faction-select.html';
    }
    if (faction.faction_type === 'entrepreneur') return 'entrepreneur-dashboard.html';
    if (faction.faction_type === 'politician')   return 'politician-home.html';
    return null;
}

/**
 * Entrepreneur archetypes — single source of truth for the setup
 * archetype page. The player picks one; its fixed stat block + starting
 * cash are written to the new factions columns. Stats are the shared
 * Reputation / Influence / Skill trio (cash is the fourth, "Capital").
 * Totals are derived wherever shown (never stored); the rename from
 * the four-stat ambition/cunning/reputation/vision model leaves
 * archetypes with uneven totals (28–42) — a deliberate v1 trade-off,
 * to be re-balanced in a follow-up.
 */
export const ENTREPRENEUR_ARCHETYPES = Object.freeze({
    heir: {
        name: 'THE HEIR',
        quote: "You didn't build this. Your father did. Now it's yours to keep or lose.",
        description: "Inherited a substantial position. Comes with money and a name, but the field doesn't yet know whether you're worth your inheritance. Trusted because of who you are, doubted for the same reason.",
        stats: { influence: 6, skill: 4, reputation: 18 },
        startingCash: 95000000,
    },
    founder: {
        name: 'THE FOUNDER',
        quote: 'You built one thing well. Whether you can build another is the open question.',
        description: 'Sold a successful business and now have capital to deploy but no platform. Modest reputation among insiders, unknown to the public. You know how to make things; whether you know how to make more things is untested.',
        stats: { influence: 16, skill: 8, reputation: 10 },
        startingCash: 48000000,
    },
    operator: {
        name: 'THE OPERATOR',
        quote: 'Twenty years in middle management. You know how everything works. Now you have your own seat at the table.',
        description: "Long-tenured corporate executive who finally bought a meaningful stake. Reputation built on competence and execution. Knows where the bodies are buried in three industries. Less of a builder, more of a fixer.",
        stats: { influence: 8, skill: 14, reputation: 14 },
        startingCash: 62000000,
        // 20 years in middle management means they started ~22 and
        // are now at least 42; setup samples from a 45-55 range.
        age: [45, 55],
    },
    raider: {
        name: 'THE RAIDER',
        quote: 'Other people built it. You take it.',
        description: "Aggressive corporate raider with a track record of hostile takeovers, leveraged buyouts, and brutal restructurings. Feared in boardrooms. The press hates you. You don't read the press.",
        stats: { influence: 18, skill: 20, reputation: 2 },
        startingCash: 71000000,
    },
    visionary: {
        name: 'THE VISIONARY',
        quote: 'You see what no one else does. The question is whether you can convince anyone before you run out of money.',
        description: 'Brilliant strategic thinker with unconventional ideas. Has a reputation among the people who matter for being either a genius or a crank. Has built nothing of note yet — but the ideas are real.',
        stats: { influence: 14, skill: 6, reputation: 8 },
        startingCash: 32000000,
    },
    politician: {
        name: 'THE POLITICIAN',
        quote: 'You know everyone. You know what they want. You know what they owe.',
        description: "Spent your career in regulated industries where success depends on relationships with government. Reputation is everything in your world. You don't out-compete rivals; you out-maneuver them through connections they don't have.",
        stats: { influence: 10, skill: 16, reputation: 16 },
        startingCash: 54000000,
    },
    prodigy: {
        name: 'THE PRODIGY',
        quote: 'Twenty-five years old. Your first venture sold for more than the GDP of small countries. Now the second act starts and no one knows what it looks like.',
        description: "Recently exited a wildly successful early venture. The market still doesn't know what to make of you. You have cash and ambition — but neither operational depth nor political capital.",
        stats: { influence: 20, skill: 4, reputation: 12 },
        startingCash: 88000000,
        // Quote pins them to 25; setup honours this override instead
        // of the default 30+1d6 random spread.
        age: 25,
    },
    fixer: {
        name: 'THE FIXER',
        quote: "You've been brought in to clean up two failed companies. Both came back from the brink. Now you have your own war chest.",
        description: 'Career turnaround specialist who\'s been hired to save dying companies, succeeded twice, and parlayed that into a personal position. Modest cash but enormous reputation for getting things done in hard situations.',
        stats: { influence: 12, skill: 14, reputation: 16 },
        startingCash: 28000000,
    },
});

/**
 * Display metadata for the three entrepreneur faction-stat columns.
 * Single source of truth — every UI that renders a "REP / INF / SKL"
 * (or "REPUTATION / INFLUENCE / SKILL") row reads this. Order is
 * Reputation → Influence → Skill to match the four-stat consolidation
 * (cash/Capital is rendered separately by each surface).
 */
export const ENT_STAT_DISPLAY = Object.freeze([
    Object.freeze({ short: 'REP', long: 'REPUTATION', key: 'ent_reputation' }),
    Object.freeze({ short: 'INF', long: 'INFLUENCE',  key: 'ent_influence'  }),
    Object.freeze({ short: 'SKL', long: 'SKILL',      key: 'ent_skill'      }),
]);

/**
 * Single source of truth for the "Join as Politician #N" entries that
 * surface in every faction-switcher dropdown (common / entrepreneur /
 * politician / military topbars).
 *
 * Cap: 4 politicians per user. Slot 1 keeps the historical "Join
 * Project Neptune" label; slots 2-3 read "Join as Politician #N";
 * slot 4 carries the "(alpha code)" tag and is gated client-side on
 * the literal Patreon11 string. Same-nation duplicates are caught
 * downstream by idx_factions_one_politician_per_user_per_nation
 * (20270374); first-steps.html surfaces the 23505 with a friendly
 * "You already hold a politician in this nation."
 */
export const POLITICIAN_SLOT_MAX = 4;
const POLITICIAN_SLOT_4_ALPHA_CODE = 'Patreon11';

/**
 * Compute the next politician slot to surface in a switcher, or null
 * if the user has hit the cap. Callers pass whatever faction list
 * they have — the helper just counts. Active-vs-abandoned filtering
 * (or not) is the caller's choice and matches each topbar's existing
 * pattern.
 */
export function nextPoliticianSlot(allFactions) {
    const count = (allFactions || []).filter(f => f?.faction_type === 'politician').length;
    if (count >= POLITICIAN_SLOT_MAX) return null;
    const slot = count + 1;
    return {
        slot,
        label: slot === 1
            ? 'Join Project Neptune'
            : slot === POLITICIAN_SLOT_MAX
                ? `Join as Politician #${slot} (alpha code)`
                : `Join as Politician #${slot}`,
        requiresAlphaCode: slot === POLITICIAN_SLOT_MAX,
    };
}

/**
 * Click handler for the politician-slot row. Prompts for the alpha
 * code when the slot needs it, then stores the return URL and
 * navigates to first-steps.html. Aborts silently if the user
 * cancels or types the wrong code.
 */
export function activatePoliticianSlot(slotInfo) {
    if (!slotInfo) return;
    if (slotInfo.requiresAlphaCode) {
        const code = window.prompt('Alpha tester code required to claim slot #4:');
        if (code !== POLITICIAN_SLOT_4_ALPHA_CODE) {
            if (code != null) window.alert('Invalid alpha code.');
            return;
        }
    }
    sessionStorage.setItem('neptune_return_url', window.location.pathname + window.location.search);
    window.location.href = 'first-steps.html';
}
