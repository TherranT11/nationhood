// ════════════════════════════════════════════════════════════════════
// National Characteristics — shared tier defs + renderer
// ════════════════════════════════════════════════════════════════════
// Pulled out of politician-nation.html so a dedicated
// politician-characteristics.html page can use the same data without
// duplicating any of it. The brief stat strip on the nation card also
// reads STABILITY_TIERS / CIVIL_FREEDOMS_TIERS here, so the colored
// tier badge in the strip and the tier label in the body always agree.
//
// Each tier carries:
//   min    — threshold (score points for 0..100 stats, ratio for money)
//   label  — short tier name shown under the value
//   color  — hex used for border, label, and the accent phrase
//   lead   — bold opening fragment of the sentence
//   accent — the colored phrase
//   tail   — regular-weight prose continuation
// Highest threshold first; pickTier walks top-down.
// ════════════════════════════════════════════════════════════════════
import { fmtMoney } from '../utils.js';

export const TIER_COLOR = {
    green:    '#4ec98a',
    teal:     '#5aafa5',
    amber:    '#c8a64e',
    orange:   '#d68a4e',
    red:      '#d97070',
    deepRed:  '#a85050',
};

export const STABILITY_TIERS = [
    { min: 81, label: 'Firm',     color: TIER_COLOR.green,
      lead: 'The state functions as designed.',
      accent: ' Politics happens in chambers, not in the streets',
      tail: ' — protests stay civic, the security forces are visible without being feared, and government decisions translate smoothly into action.' },
    { min: 61, label: 'Strained', color: TIER_COLOR.teal,
      lead: 'Tensions are visible.',
      accent: ' Protests draw crowds; commentators speak of "this difficult moment."',
      tail: ' Things still work — but everyone can feel them being tested.' },
    { min: 41, label: 'Unrest',   color: TIER_COLOR.amber,
      lead: 'Riots break out in the cities.',
      accent: ' Curfews come and go.',
      tail: ' Going out after dark is no longer something one does without thinking.' },
    { min: 21, label: 'Crisis',   color: TIER_COLOR.red,
      lead: 'Authority is contested.',
      accent: ' The provinces don’t always answer the capital.',
      tail: ' Whole neighborhoods are no-go zones; the security forces are exhausted, divided, or unreliable.' },
    { min:  0, label: 'Collapse', color: TIER_COLOR.deepRed,
      lead: 'Anarchy.',
      accent: ' The regime exists on paper.',
      tail: ' Power belongs to whoever holds the street, and that changes block by block.' },
];

export const GDP_GROWTH_TIERS = [
    { min: 81, label: 'Booming',    color: TIER_COLOR.green,
      lead: 'The economy roars.',
      accent: ' Construction cranes crowd the skyline,',
      tail: ' hiring signs are in every window, and the press writes admiring features about "the [name] miracle."' },
    { min: 61, label: 'Healthy',    color: TIER_COLOR.teal,
      lead: 'The economy is doing what it’s supposed to.',
      accent: ' Jobs are added, prices behave,',
      tail: ' and most people end the year a little better off than they began.' },
    { min: 41, label: 'Stagnant',   color: TIER_COLOR.amber,
      lead: 'The numbers wobble around the line.',
      accent: ' Some quarters up, some down.',
      tail: ' People stop expecting things to get better and start expecting them to stay the same.' },
    { min: 21, label: 'Recession',  color: TIER_COLOR.red,
      lead: 'The economy is shrinking.',
      accent: ' Layoffs make the news weekly;',
      tail: ' shops close; the property pages are full of foreclosures.' },
    { min:  0, label: 'Depression', color: TIER_COLOR.deepRed,
      lead: 'Whole industries die.',
      accent: ' Banks fail or are nationalized.',
      tail: ' Lines form for bread and for jobs that don’t exist.' },
];

export const CIVIL_FREEDOMS_TIERS = [
    { min: 81, label: 'Free',       color: TIER_COLOR.green,
      lead: 'Speech and assembly are',
      accent: ' fully protected and routinely exercised.',
      tail: ' Journalists publish without permission, demonstrations are a normal feature of public life, and the courts back the citizen against the state.' },
    { min: 61, label: 'Permissive', color: TIER_COLOR.teal,
      lead: 'Most criticism is tolerated.',
      accent: ' Dissent is legal, if sometimes uncomfortable.',
      tail: ' Major outlets operate freely; small frictions exist but the basic freedoms hold.' },
    { min: 41, label: 'Restricted', color: TIER_COLOR.red,
      lead: 'Speech and assembly are',
      accent: ' tolerated only where they do not threaten the state.',
      tail: ' Critical journalists are warned, then prosecuted; protests need permits the authorities can refuse. Dissenters operate with one eye over their shoulder.' },
    { min: 21, label: 'Repressed',  color: TIER_COLOR.deepRed,
      lead: 'The press is licensed.',
      accent: ' Independent reporting is criminal.',
      tail: ' Public protest is broken up; the prisons hold writers, lawyers, and clergy who said the wrong thing in the wrong room.' },
    { min:  0, label: 'Closed',     color: TIER_COLOR.deepRed,
      lead: 'There is no public criticism of the regime.',
      accent: ' All media is state-owned or state-approved.',
      tail: ' Speaking against power, even privately, can mean disappearance.' },
];

// Budget tiers — keyed on budget/GDP ratio so flush/strained read consistently
// across nations of different scale. A nation with no GDP falls to the bottom.
export const BUDGET_TIERS = [
    { min: 0.20, label: 'Surplus',  color: TIER_COLOR.green,
      lead: 'The treasury is',
      accent: ' flush.',
      tail: ' There is room for ambitious policy — new programmes, rapid response to crises, and long-term investment without immediate austerity.' },
    { min: 0.10, label: 'Healthy',  color: TIER_COLOR.teal,
      lead: 'The treasury is',
      accent: ' comfortable.',
      tail: ' Ministries are funded, capital projects move on schedule, and the finance minister sleeps soundly.' },
    { min: 0.03, label: 'Tight',    color: TIER_COLOR.amber,
      lead: 'Money is',
      accent: ' tight.',
      tail: ' Every spending request is contested. Ministers are asked to find efficiencies before new line items are approved.' },
    { min: 0,    label: 'Strained', color: TIER_COLOR.red,
      lead: 'The treasury is',
      accent: ' nearly empty.',
      tail: ' Payroll waits on revenue receipts; capital projects are deferred; the bond market watches.' },
];

// Debt tiers — keyed on debt/GDP ratio. Higher ratio is worse, so the bands
// step down from Unsustainable through Trivial.
export const DEBT_TIERS = [
    { min: 1.50, label: 'Unsustainable', color: TIER_COLOR.deepRed,
      lead: 'Debt has',
      accent: ' overrun the economy.',
      tail: ' Service costs crowd out essential spending; restructuring or default is on the table.' },
    { min: 0.90, label: 'Crushing',      color: TIER_COLOR.red,
      lead: 'Debt service is',
      accent: ' eating the budget.',
      tail: ' Each new bond auction tightens the noose; rating agencies are circling.' },
    { min: 0.50, label: 'Heavy',         color: TIER_COLOR.orange,
      lead: 'Debt is',
      accent: ' a real constraint.',
      tail: ' Lenders demand higher yields. A bad year would force unwelcome trade-offs.' },
    { min: 0.20, label: 'Manageable',    color: TIER_COLOR.amber,
      lead: 'Debt is',
      accent: ' sizeable but serviceable',
      tail: ' — comparable to a year’s revenue. Bondholders are calm. Continued growth keeps it in proportion; a downturn would make it bite.' },
    { min: 0,    label: 'Trivial',       color: TIER_COLOR.green,
      lead: 'Debt is',
      accent: ' a non-issue.',
      tail: ' The state could borrow heavily at favourable rates if it ever needed to.' },
];

// Baseline italic description per stat — the "what does this number mean"
// line that sits under the prose. Same text regardless of tier.
export const STAT_DESCRIPTIONS = {
    stability:      'how firmly the state holds the public’s compliance. High stability means smooth governance and an institutional order that goes unchallenged; low stability means brewing dissent and the threat of revolt.',
    gdp_growth:     'the year-on-year change in national output. Sustained growth funds wages, taxes, and ambition; contraction hollows out budgets, payrolls, and public mood.',
    budget:         'the treasury balance — cash on hand for ministries, programmes, and emergencies. A flush budget funds ambitious policy and rapid response; a thin budget forces austerity and crowds out long-term investment.',
    debt:           'total accumulated borrowing the nation owes. Manageable debt is normal for a developed economy; excessive debt service crowds out spending and raises the risk of default.',
    civil_freedoms: 'how freely citizens may speak, organise, protest, and dissent without state reprisal. High scores indicate open civic life; low scores signal censorship, surveillance, and risk to dissenters.',
};

export function pickTier(tiers, value) {
    for (const t of tiers) if (value >= t.min) return t;
    return tiers[tiers.length - 1];
}

// Cheap escape — module is HTML-emitting so it owns its own escaper
// rather than asking callers to thread one in.
function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : s;
    return d.innerHTML;
}

// Render the 5-stat National Characteristics body into `targetEl`.
// Reads politician_* columns from the nation row (the dual-economy
// politician-side stats added in 20270361/20270364). Pure function over
// the nation row — no DB calls, no DOM lookups outside `targetEl`.
export function renderNationalCharacteristics(targetEl, n) {
    if (!targetEl) return;

    const stabVal = Math.max(0, Math.min(100, Math.round(Number(n.politician_stability)      || 0)));
    const gdpgVal = Math.max(0, Math.min(100, Math.round(Number(n.politician_gdp_growth)     || 0)));
    const civVal  = Math.max(0, Math.min(100, Math.round(Number(n.politician_civil_freedoms) || 0)));
    const gdpDol  = Number(n.politician_gdp)    || 0;
    const bgtDol  = Number(n.politician_budget) || 0;
    const debtDol = Number(n.politician_debt)   || 0;
    const bgtRatio  = gdpDol > 0 ? bgtDol  / gdpDol : 0;
    const debtRatio = gdpDol > 0 ? debtDol / gdpDol : 0;

    // Booming GDP Growth tier names the nation in its flavor line.
    const gdpgTier = { ...pickTier(GDP_GROWTH_TIERS, gdpgVal) };
    gdpgTier.tail  = gdpgTier.tail.replaceAll('[name]', n.name || 'national');

    const rows = [
        { label: 'Stability',      key: 'stability',      value: String(stabVal), scale: '/ 100', tier: pickTier(STABILITY_TIERS,      stabVal) },
        { label: 'GDP Growth',     key: 'gdp_growth',     value: String(gdpgVal), scale: '/ 100', tier: gdpgTier },
        { label: 'Budget',         key: 'budget',         value: fmtMoney(bgtDol),  scale: '',     tier: pickTier(BUDGET_TIERS,        bgtRatio) },
        { label: 'Debt',           key: 'debt',           value: fmtMoney(debtDol), scale: '',     tier: pickTier(DEBT_TIERS,          debtRatio) },
        { label: 'Civil Freedoms', key: 'civil_freedoms', value: String(civVal),  scale: '/ 100', tier: pickTier(CIVIL_FREEDOMS_TIERS, civVal) },
    ];

    targetEl.innerHTML = `<div class="nat-list">${rows.map(r => `
      <div class="nat-row" style="--tier:${r.tier.color};">
        <div class="nat-card">
          <div class="nat-card__label">${esc(r.label)}</div>
          <div class="nat-card__value">${esc(r.value)}${r.scale ? `<span class="nat-card__scale">${esc(r.scale)}</span>` : ''}</div>
          <div class="nat-card__tier">${esc(r.tier.label)}</div>
        </div>
        <div class="nat-body">
          <div class="nat-body__head"><strong>${esc(r.tier.lead)}</strong><span class="nat-body__accent">${esc(r.tier.accent)}</span>${esc(r.tier.tail)}</div>
          <div class="nat-body__desc"><em>${esc(r.label)} — ${esc(STAT_DESCRIPTIONS[r.key])}</em></div>
        </div>
      </div>`).join('')}</div>`;
}
