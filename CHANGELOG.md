# Changelog

All notable changes to Nationhood are recorded here.

## 0.7.2 — 2026-07-14

A new world map, named military units, a reworked card turn, international organizations
with a living law-book, and a deep statistics layer — the numbers a nation runs on are now
computed from the game rather than typed in, with a regime-stability layer on top.

### The World Map (Home)
- **A living map** — the home screen is now the world map. Your capital flies a golden star,
  other cities are drawn as medieval hamlets, and every settlement sits on the hex grid.
- **This month's events** — a marker sits over each capital where something is happening;
  tap it to read that nation's feed, each entry stamped with its month and year.
- **Political / Military filter** — toggle between the political view and a military view that
  shows unit counters on the map.
- **Topbar & countdown** — a live "next tick" countdown alongside your Action Points,
  Influence, and the in-game date, framed by a clean map border. A raft of mobile fixes so
  taps land where you mean them and panels open reliably.

### Military — Named Units
- **Build named units** — deploying from a base now opens a proper builder: choose the base,
  name the unit ("1st Infantry Division"), and pick **Infantry** or **Armor**. Armor is the
  heavier class and costs **1 Energy + 1 Mineral** to field.
- **On the map** — each unit shows as a NATO-style counter (green for yours, red for foreign)
  with its class and strength, and its name labelled beside it.

### Cards, Turns & Action Points
- **Play *or* discard, bid freely** — each month you make one terminal choice, play a card or
  discard it, and that's it for the choice. **Bidding is now decoupled**: you can place or
  raise bids any time, whether or not you've already played or discarded.
- **A flat three-bid cap** — you may chase up to three market cards at once, independent of
  how many cards you're holding, so a full hand no longer blocks the auction.
- **Action Points bank and persist** — playing a card adds its Action Points to a running
  bank that carries across months; on top of that every party gets a fresh baseline of 2 AP
  each month, use-it-or-lose-it.
- **Card play reads cleanly** — a played card announces itself as "In {nation}, {what it is}.",
  and a Government Choice fires a *separate* second event when the government decides — with the
  chosen option's effects listed out on the timeline.
- **Card Creator** — mob and militia hex effects can now be authored as **Enemy**-aligned
  rather than always belonging to a party.

### International Organizations
- **Cohesion** — every organization runs on a Cohesion score that starts at 20 and grows +0.5
  each tick; a member leaving costs the bloc 5 Cohesion.
- **The Resource law-book** — spend Cohesion to enact live laws: **Joint Pricing** (a shared
  buy price), **Emergency Reserves**, and **Survey Sharing** (each member produces +1 of the
  bloc's resource while they stay in). Laws are proposed, costed, and voted through the charter.
- **Membership by application** — outside nations **Apply for Membership**; a member review
  admits them **as a Member** (a voting seat) or **as an Observer** (presence only), or rejects
  them, and an unanswered application auto-fails after six ticks.
- **Upcoming Agenda** moved above the laws, below the chat.

### The Nation's Statistics
- **Computed, not typed** — roughly fifteen stats are now **derived** from the game and their
  hand-set inputs removed from nation setup: Tax Burden, Bureaucracy, Military Research, Civil
  Liberties, Armed Forces Funding, CO₂ Emissions, Global Warming, Energy Availability, Interest
  Rates, and connector-driven Crime, Poverty, Demographic Pressure, Standard of Living, and
  Equity Between Generations. Admins tune the couplings live rather than typing values.
- **Regime stability** — a new layer of stats: **Control** (the regime's grip), **Revolt Risk**,
  **Inflation**, **Cult of Personality** (a stock that autocracies build through propaganda and
  that decays over time), and **Government Default**. **Oppression** is added as a hand-set core
  stat that Control reads. Terrorism is tracked internally but hidden from the readout.
- **Government Default & sovereign default** — Default is a 0–100 risk from the debt-to-GDP
  ratio (150% of GDP → 50, 300% → 100). As it climbs, headlines fire at **30 / 50 / 70 / 80 /
  90 / 100**, re-arming if a nation recovers and slides back. At **100 the nation defaults**:
  its debt is written down, GDP takes a 15% recession hit, and Prosperity and Crime worsen.
- **Colour-coded readouts** — stat cells on the Government page are now shaded green / amber /
  red by whether the value is good, middling, or bad for the nation.

### Governance & Interface
- **Coalitions with a majority** — a party that wins an outright majority can now still open the
  Coalition tab and invite partners; take no action and it simply governs alone as before.
- **Bill titles** — an amended policy's auto-filled bill title now reads "{Policy} Bill" instead
  of "{Policy} (Amendment)".
- **Actions tab** — a new (placeholder) Actions item sits in the navigation between Home and Party.
- **Influence** shows as a lightning bolt everywhere it appears.

## 0.6.1 — 2026-07-11

The card system: a deck, a market, and a hand for every party — political plays authored in
the Card Creator, won at auction, and played on your turn.

### Cards, the Market & the Hand
- **Cards** — every nation holds a deck of authored cards. A card fires an event, forces a
  decision, swings a region, or takes hold as a lasting change. Generic cards enter every
  nation's deck; nation-specific cards enter one.
- **The Card Market** — a sealed-bid auction. Each nation blocks up one card per active party
  plus one; bids are secret and paid in Influence (escrowed on bid, refunded if outbid or
  cancelled), and the highest bid wins at the next tick, ties to the earliest.
- **Your Hand** — capped at four cards. A bid reserves a slot, so you can only bid on a new
  card while your held cards plus your outstanding bids leave room; play or discard to free one.
- **Seeding & auto-draw** — a newly authored card drops onto any market with an open slot the
  moment it's saved; an admin "Seed all markets" action fills every block on demand, and the
  tick keeps them topped up as cards are won and re-drawn.

### Turn Order & Action Points
- **Turn order** — each nation's parties are dealt a random order and keep it round to round;
  only the party whose turn it is may play a card.
- **Action Points** — on your turn, one of three choices: Take 1 Action, Play a Card (banks
  its 1–6 Action Points), or Discard a Card for +3 Influence. Every former Influence action
  now costs 1 AP instead; points bank on your turn and expire at your next.

### Card Effects
- **Immediate effects** — a played card resolves its stat, party-popularity, coalition-health,
  and election effects at once, with no Influence cost (it was paid for at auction).
- **Regional & targeted** — pick the rival a party effect lands on; or open a map of your
  nation and lift your own standing (or cut a rival's) in a chosen hex, shown on the Party page.
- **Hex elections** — call an election in one hex; its population-derived seats reapportion by
  regional standing on a 12-tick per-hex cooldown — a regional layer, separate from the
  national chamber.
- **Government Choice** — a card can open a decision resolved by a named ministry (else the
  Head of Government, else the player); each option carries up to three effects, applied when
  chosen.
- **Persistent cards** — become a standing national modifier, applying per-tick for as long as
  they're in play.
- **On-hand resources** — add or remove Food / Goods / Services / Military from a nation's
  stockpile, floored at zero.

### The Card Creator (admin)
- Author a card's name, Influence cost, and Action Points, then pick a mechanic — One-Off (up
  to 5 effects), Double-Sided (two stance sides, up to 3 effects each), or Government Choice
  (up to 4 options, up to 3 effects each). Optional stance requirement, persistence, a decision
  handler, reshuffle-or-discard after play, and card chains (requires / allows another card). A
  live preview renders the card as you build; saving shuffles it into every relevant deck.

### Other
- **Floor votes are final** — a cast vote can no longer be changed, and casting now asks for
  confirmation first.
- **Tick cadence** — the game clock now advances every 6 hours (was 8): 00:00 / 06:00 / 12:00 /
  18:00 UTC.
- **Calcordia** — a Scottish name pool for the nation's generated politicians.

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
