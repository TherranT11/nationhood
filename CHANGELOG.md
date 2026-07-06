# Changelog

All notable changes to Nationhood are recorded here.

## 0.5.0 — 2026-07-06

The first full build of the live game system: the tutorial's design carried through to
real, server-authoritative play across governance, the economy, diplomacy, and war.

### Governance & Legislature
- **Influence** replaces Action Points as the single action resource — it banks up to 100
  and accrues +3 each tick (+1 for the largest party in a nation).
- **Legislative committee** — a proposed policy bill now goes to committee first: its own
  public page with a party chat, an **Endorse** button (5 Influence), and a **Push to the
  Floor** button for the proposer (free with an endorsement, otherwise 5 Influence and −2
  Party Popularity). A bill sits 6 ticks, then expires.
- **Policy builder, rebuilt** — On/Off and Spectrum (laddered) policies authored against the
  20-stat ministry vocabulary, with per-rung effects, Budget Balance as a flat figure or a
  % of GDP, directional vote-popularity, base influence cost, and implementation time.
- **Floor votes** are seat-weighted, resolve early on an outright majority, and dock
  popularity from parties absent at the close. Every bill has a standalone document page.
- **Head-of-Government actions** — Statement (a public address), Reshuffle, Resign, Call
  Election, and no-confidence motions (which carry on the seat tally).
- Proposing a bill requires holding at least one legislature seat.

### Economy & Public Finances
- **Budget Balance** is computed in one place from every in-force policy (and running
  initiative), and read everywhere — the top bar, the Budget page, and the Government cell.
- **Public Debt** moves with the balance each tick: a surplus pays it down, a deficit grows
  it, and every January it accrues 3% interest. A short budget rolls into debt rather than
  going negative.
- **Bureaucracy** is likewise computed from policy effects, with its own detail page.
- **National Initiatives** — standing programmes a Minister of Economic Development enacts
  for an upfront Influence cost and a recurring $B/yr Budget Balance cost; they build up,
  land a permanent production increase, and run until deactivated. Private or state
  execution, and joint projects with a partner nation.
- **Trade & production** — annual resource demands with a June reckoning, Produce, world
  scarcity tiers, debt-financed imports, a 5-rung Trade Policy (import multiplier + tariffs),
  Sanctions, a world trade ledger, trade agreements, corporations, and per-nation production
  ceilings. **Growth** now drives GDP and gates population growth.
- Added a **Society** ministry (Rule of Law, Standard of Living, Housing Affordability).

### Nation, Government & Parties
- The **Nation** and **Government** pages were reshaped to the tutorial spine — ministry
  stat groups, an Administration History timeline, and the Head of Government shown as a
  person with their term range.
- **Coalition Strength** hearts replace the old confidence gauge; the National Assembly
  tags each party [Governing] or [Opposition].
- **Party approval** is backed by a real popularity trend with a sparkline and chart.
- Ministry stats are editable per nation in admin setup.

### Elections & Politicians
- Full-field **Projected Result** on the Elections page.
- **Campaign Trail** — four campaign actions across the six-month pre-election window.
- **Secondary elections** for city mayors, **parliamentary runs** for backbenchers,
  **Youth Wing** expansion, paramilitaries, and a regime-based popularity ceiling.
- **Inactivity ladder** — a party goes inactive at 7 days and is auto-deleted at 21.

### World, Diplomacy & War
- **Nation Relations** (1–10) with a World-page meter and named bands.
- **World Events** — turning points and free-for-all bidding events (with sides), on an
  even-month firing pool.
- **Military** — typed units (Army / Fleet / Air Wing), bases at home and on allies' soil,
  per-base capacity, deployment, and **mutual defence pacts**. A Conflict page shows
  standing by continent.
- **Crises** with custom per-crisis stats, five escalating stages, and stat-aware end
  conditions; **National Malaise** yearly penalties for headline stats left too low.
- **National Objectives** / the government agenda, with a January penalty for neglect.

### Communication
- **News** — a world newspaper rendered over the shared events feed.
- **Inbox** — private party-to-party direct messages, with recipients tagged by cabinet role.
- The events feed shows every nation's activity, with a Nation/Global selector.

### Admin (setup)
- Authoring tools for policies, trade policy, crises, objectives, world events, national
  initiatives, modifiers, cities, and defence pacts.
- Add a nation with a flag uploaded live at creation.
- Game clock control and a game-wide base bill-proposal cost.

### Removed
- **Action Points** (superseded by Influence) and **Convictions** (superseded by the policy
  / ministry-stat model), along with the old Party page, the coalition-formation flow, the
  Market page, and the Wiki authoring tab.
