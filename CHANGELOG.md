# Changelog

All notable changes to Nationhood are recorded here. Format inspired by
[Keep a Changelog](https://keepachangelog.com/); dates use ISO 8601.

## [MARIANNE — 3.0] — 2026-06-10

### Added — Businessman (Alpha)

- **Third faction path: Businessman.** "Join a corporation, work your
  way up, or start from scratch and make history." Gated behind alpha
  code `Vanderbilt1` (same prompt pattern as politician slot #4).
  Confirming opens the origin-nation picker, which for this path also
  shows each nation's **Construction Corporations** and **Automotive
  Corporations** counts and includes **Sierramar** alongside Melizea,
  Avelia, and Montequilla. The picker is the current end of the flow —
  character creation lands in a follow-up.

### Added — Foreign Service

- **Foreign Events authoring tool + Day to Day in the Embassy.** The
  Admin Backend's FOREIGN EVENTS tab is now a real authoring surface:
  admins write embassy events (title + description) with up to three
  decisions (A / B / C), each carrying up to three stat effects
  against the four new embassy stats — **Embassy Budget** ($100
  start, floor $0), **Embassy Reputation**, **Embassy Trust**, and
  **Embassy Leverage** (each 0–100, starting at 50). Text supports
  `{Nation}` (host country), `{City}` (the embassy's location),
  `{Name1}` (a name drawn from the host nation's name list), and
  `{Corp}` (a corporation operating in the country), substituted when
  the event is drawn. On the home page, the Attaché card now shows
  the embassy stat strip and **[Day to Day in the Embassy] is live**:
  it draws a random event from the pool, you pick a decision, and the
  effects land. Draws are snapshotted — refreshing can't re-roll a
  bad hand, and an undecided event waits on your desk. Resigning the
  posting resets the embassy stats and discards the pending event.
- **Foreign Service Exam + Tier 1 (Attaché).** [Join the Service] on
  the career page now opens a 5-question multiple-choice exam on the
  active Politicianverse nations — population, Head of Government,
  capital, legislature seats, government type. All five correct →
  you are admitted to the Foreign Service, assigned to a random
  foreign nation, and stationed at the embassy in its capital. Any
  miss → −1 Reputation and a retry next month. Passing surfaces a
  **Foreign Attaché in {Nation}** affiliation card on the home page
  with three embassy actions (Day to Day in the Embassy / Build
  Local Contacts / Send Cable to the Foreign Ministry — mechanics
  coming), an **(Attaché)** suffix in the character switcher, and a
  Political Career timeline entry. **RESIGN** (top right of the
  card) returns you to civilian life — re-entry means re-taking the
  exam.

### Added — Federal Investigations

- **Federal Investigations Service ladder** — new 5-tier career on
  the career page above the armed services: Agent (Probationary) →
  Section Head → Head of Task Force → Deputy Director → Director of
  FIS.
- **Tier 1 Agent is live.** [Join the Academy] grants +1 Experience
  and +1 Influence (with a confirmation prompt if you already hold
  another career — roles stack deliberately). Three repeatable
  actions, one per tick: **Begin Investigation** (choose a Financial
  Crimes target from every corporation holding assets in your
  nation — Corruption and Anti-Terrorism unlock at higher tiers),
  **Run Field Ops** (+0.5 Experience), **Make Friends at the
  Bureau** (+0.3 Influence).
- **Case files.** Every investigation creates a persistent Pressing
  Issues card and its own case-file page showing the target's full
  **Corporate History and Transactions** — every building, loan,
  share trade, and tax bill on the corporate record. **Close
  Investigation** seals an empty-handed case at −1 Reputation.
  Resigning the Service dismisses your open cases and withdraws the
  academy bonus. Subpoena / interview / evidence mechanics are the
  next phase.

### Added — Corporations

- **Retain Consultancy.** Corp owners can offer any Entrepreneur or
  Politician a consultancy from the corp page's Administrative Hub.
  The fee is escrowed from the treasury at offer time; the target
  gets an ACCEPT / DECLINE card in their Pressing Issues. On accept
  the fee lands in their personal funds — politicians also gain
  **1 Capital per $5,000,000**, rounded down. Declines refund the
  treasury. Accepted engagements enter the corporate record:
  *"{Corporation} retained {Person} for a consultancy."* Public
  companies disclose the amount; private companies don't — until
  someone investigates.

### Added — Committees & Legislation

- **Set the Agenda.** Any committee member, once per tick, can click
  a queued bill in Upcoming Agenda to put it before the committee.
  All five seats vote **HEAR / VOTE / AMEND** (NPCs vote by party
  archetype and never vote Amend); the first action to 3 votes
  carries, with the chair breaking 2-2-1 splits.
- **Hearing deliberation chat.** While a hearing is in session,
  committee members get a live composer on the Hearing Record to
  respond to witness testimony; everyone else can read the
  deliberations.
- **Witness calls now reach entrepreneurs.** Open hearings invite
  every non-committee player in the nation — entrepreneurs get the
  Pressing Issues card and an inline persona + testimony modal on
  their own dashboard.
- **MP action redesign.** The Member of Parliament action set is now
  **Propose New Statute / Propose New Law / Fundraising** (1d20 ×
  $1,000 to party funds, −0.5 party approval).
- **Per-article type picker** on Propose New Law — each article can
  be tagged Operative / Remedy / Administrative / Definition /
  Exception — and the 2-archetype cap on supporting/opposing lists
  is gone.
- **Amend Statute redesign.** Pick a category → pick an enacted
  statute → write what it should say once amended → choose the
  committee to refer it to.
- **Committee seat cards** in Pressing Issues — each seat you hold
  shows pending agenda items and a [View Committee] button.

### Added — Elections

- **Run for Re-Election.** Incumbent MPs within 5 ticks of the
  general election can file for re-election from the career page;
  the candidacy is assigned to the general election itself and
  resolves there.
- **Popularity-driven odds.** Starting election odds now derive from
  party strength: your party's popularity + (your Experience ÷ 2)
  against the opponent's party popularity + 5.
- **+1 Experience on election wins.** Parliament wins now grant
  Experience alongside the existing Capital reward; community wins
  already did.

### Added — Admin

- **Consolidated admin backend** at `adminbackend.html` — one
  password-gated console with [Ordinance] [Court Case] [National
  Modifier] [Paperwork] [Foreign Events] tabs replacing the loose
  standalone tools. Foreign Events is a placeholder pending the
  Foreign Service event mechanics.

### Fixed

- **Corporate tax was assessing $0 profit for everyone** — File Taxes
  computed the taxable base from the same dead `corp_cash_events`
  ledger as the Revenue cards, so every filing owed nothing and
  auto-stamped 'compliant'. `file_corporate_tax` now reads its base
  through `corp_revenue_by_year` itself, so the taxable profit is by
  construction the figure shown on the corp page's This Year's
  Revenue card.
- **"This Year's / Last Year's Revenue" cards never populated** — they
  summed `corp_cash_events`, a ledger the corp simplification stopped
  writing months ago (frozen at tick 140), so every corp showed $0
  year-to-date no matter what the month card said. The revenue stamp
  helper (the single choke point all revenue processors call) now
  rolls per-year accumulators on the corp row, `corp_revenue_by_year`
  reads them, and existing stamps are backfilled so the cards open
  consistent with the month card. Months before the fix were never
  recorded anywhere and are unrecoverable.
- **Party login redirect loop** — since the news-site cull turned
  dashboard.html into a thin redirect to faction-select.html, any
  account with an active party ping-ponged between "AUTHENTICATING"
  and the faction chooser forever (faction-select sent parties to
  dashboard.html, which sent them straight back). Party factions now
  route to politics.html, their Actions home, everywhere: login, the
  faction switcher, and faction-select all read the single-source
  router in js/game/factions.js.
- **Bankruptcy unblocked for aviation corps** — the aircraft/engine
  design self-reference no longer aborts the liquidation cascade.
- **Witness testimony submit** — fixed the broken submit on
  committee.html (scope bug + missing faction argument on the
  entrepreneur path).
- **HEARING IN SESSION** pill on Monthly Agenda is now red — a live,
  time-pressure state should look like one.
- **Foreign Service exam generation** — questions now draw only from
  the four active Politicianverse nations, the 4-nation roster
  passes the eligibility gate, and the government-type question
  always offers Parliamentary Republic / Presidential Republic /
  Absolute Monarchy / Constitutional Monarchy as options.
- **FIS resign exploit** closed — resigning no longer clears the
  per-tick action cooldown (an in-tick rejoin loop could farm
  Experience).
- **Private-corp consultancy amounts** are no longer readable by
  third parties querying the table directly — confidential until
  investigated, as intended.

### Removed

- **The news site.** `news.html`, the newspaper engine, its styles,
  and the underlying article schema are gone (−4,400 lines).
  `dashboard.html` now redirects to faction select; every legacy
  "back to game" link keeps working.

## [ALPA — 2.9] — 2026-06-04

### Removed

- **Political Party founding — Sunset Phase 1.** The first phase of
  the political-party sunset. Players going forward create only
  Entrepreneurs and Politicians; existing parties keep operating
  unchanged. Phase 1 only freezes the on-ramp — no data is touched,
  no other mechanics are affected. Active player parties continue to
  function exactly as before, and the politics engine (Head of
  Government auto-install, Deputy Speaker, Speaker of the Assembly,
  general-election seat allocation) keeps reading them the same way.
  Migration `20270612` short-circuits `politician_found_party` to
  return `success:false reason:'sunset'`. UI on-ramps removed:
  `politician-movements.html` "Start a Political Party" action greyed
  out + tag flipped Open → Sunset; `faction-select.html` Political
  Party card hidden + the auto-redirect to `createparty.html`
  removed; `js/common.js` "Found a Political Party" dropdown item
  dropped; `createparty.html` carries a banner directing newcomers
  to Entrepreneur or Politician and the Create button is
  hard-disabled (the underlying `proceed()` is overridden to a
  redirect so a devtools-stripped disabled attribute can't insert a
  party row).
  Faction switcher + login pickup also hide existing parties:
  `isHiddenFromSwitcher` in `js/game/factions.js` (the SoT all four
  topbars — common / corp / entrepreneur / military / politician —
  read from) now returns true for `party` and `movement_party`
  alongside the existing `corporation` retirement, so party rows
  drop out of the dropdown for current owners. `js/common.js`'s
  active-faction picker filters parties out of the pool, so a
  stale `sessionStorage.active_faction_id` pointing at a party
  redirects to a Politician or Entrepreneur the user owns; the
  stale stamp is rewritten so the override sticks across reloads.
  Existing party rows still exist — `party.html` continues to load
  for anyone who navigates directly, and the politics engine reads
  them all the same. Reversal: re-apply the `20270583` body of
  `politician_found_party` and revert the affected UI files.

### Added — Career roles

- **Deputy Speaker** rung on the Legislature ladder. Sitting MP with
  35 Reputation in the plurality party can take the chair. One per
  nation; held until the next general election or a voluntary
  resignation. Surfaced on the Political Affiliation card on
  `politician-home.html` (`MEMBER OF PARLIAMENT · DEPUTY SPEAKER`).
- **Speaker of the Assembly** rung. Same shape as Deputy Speaker but
  gated on the party holding the Head of Government role
  (`party_status = 'Governing'`). Mutually exclusive with Deputy
  Speaker at the holder level.
- **Resign Chair** action on both rungs. Clears the chair stamp;
  politician stays a sitting MP. `politician_resign_chair()` RPC.
- **Capital Ship Commander** Navy career rung between Junior Officer
  and Frigate Captain. Tier ranks updated end-to-end on the Navy
  ladder (Squadron Commander → Admiral, Chief of Naval Operations →
  Fleet Admiral, Department Head removed).
- **Run Political Ads** mechanic for MP candidates rewritten:
  - 1d10 + 6 polling per use, costs 1 Capital.
  - **Hold a Rally** (no cost, +1d6 polling) added.
  - **Request Endorsement** (1d6 + Reputation; ≥3 = +7 polling,
    <3 = -1d3 polling). Once per race. Outcome persists on
    `politician_active_election.endorsement_outcome`.
- **Door Knocking** + **Give a Speech** are now live for the
  party-member rung (previously disabled stubs):
  - Door Knocking: 1d6 → ±Influence (-1 / +1 / +2).
  - Give a Speech: random 50/50 +1 Skill or +1 Capital, 3-tick
    cooldown (`next_speech_tick` on factions).
- **Head of Government auto-installs** on general elections — the
  largest-seated `movement_party`'s leader is appointed at the
  same time `resolve_due_general_elections` reallocates seats.
- **Trial turn timeout** — 4-tick auto-flip on stale advocate
  turns inside court trials. Modal + Pressing-Issues card show
  "Forfeit in N ticks" computed server-side
  (`court_case_trials.current_turn_started_at_tick` +
  `process_trial_turn_timeouts` wired into `advance-tick`).

### Added — Forum

- **Three-zone forum surface** at `politician-forum.html`. World /
  Players / Game zones; 15 categories seeded by `20270595` covering
  press, diplomatic channels, character lives, sport, speeches,
  markets, intros, questions, theorycraft, suggestions, off-topic,
  announcements, rules, calendar, recruitment.
- **Per-category URLs** at `politician-forum-category.html?slug=`.
  Same content for every viewer regardless of nation.
- **Compose surface** at `politician-forum-compose.html`. Title +
  rich-text body (B / I / U / quote / heading / link / bulleted /
  numbered list) with inline image embeds via Supabase Storage
  (`forum-images` bucket, 8 MB / image, per-faction upload policy).
- **Primary Nation tag** on every thread (or International). Stored
  on `forum_threads.nation_id`, surfaced as a chip on the thread
  header.
- **Identity selector** on compose and reply forms — post as any
  of your owned Entrepreneur / Corporation / Politician factions.
  Server-side ownership validation in
  `public._forum_resolve_author()`.
- **Thread detail page** at `politician-forum-thread.html?id=` —
  reader + reply form. Sanitised body render at submit (whitelist
  walker in `js/forum-utils.js`) AND at render. Image-only replies
  permitted.
- **Per-faction unread state** via `forum_reads`; the index page
  flags categories with new activity.
- **Corp negotiation chat (CEO-to-CEO discussion).** The contract
  negotiation page (`corp-contract.html`) now splits into a 2-column
  layout: article-drafting panel left (~66%), discussion panel right
  (~33%). Either CEO can post messages to the other in the same row
  as the articles they're drafting. Backed by migration `20270604`:
  new `corp_negotiation_messages` table, plus
  `send_corp_negotiation_message` and `list_corp_negotiation_messages`
  RPCs that reuse the existing `_corp_negotiation_validate_caller`
  helper (from 20270571) so posting is gated on
  "CEO of one of the two parties." 4-second poll on the client mirrors
  the trial-modal pattern; no Supabase Realtime subscription needed.
  Layout collapses to single-column under 920px. Hidden entirely when
  the viewer isn't a CEO of either party (admin / observer mode).
- **Forum Edit/Delete now show on movement-party-authored posts.**
  User reported a post they authored under their party (a
  `movement_party` faction, e.g. "Partido Conservador de Melizea")
  showed no Edit/Delete chips even though they own the faction.
  Cause: `caller_owns` in `get_forum_thread` and the ownership
  guards in `update_forum_post` / `delete_forum_post` all required
  `faction_type IN ('entrepreneur','corporation','politician')`,
  filtering out historical posts authored under other faction types
  (movement_party, military) before the 20270599 dropdown restriction
  was added. Fix: drop the faction-type filter from those three
  checkpoints — ownership is the only signal needed at read / edit /
  delete time. New posts still funnel through `_forum_resolve_author`
  which keeps the identity-selector dropdown limited to the three
  postable types. Migration `20270603`.
- **Wiki subtab now functional on both Forum surfaces.** The
  previously-placeholder "No wiki entries yet" pane in
  `politician-forum.html` and `entrepreneur-forum.html` now mirrors
  the standalone `wiki-list.html` surface: title search input,
  template-type filter pills (All / Nation / Person / Corporation /
  Religion / Culture / Political Party / Law / Agreement / Event /
  Organization / Military Unit / Product / Location / Sports),
  a tag-filter input with popular-tag chips (`fetchPopularTags`),
  Wiki Home + New Page buttons that link out to the standalone
  pages, and the alphabetical page list with title + tag chips +
  type tag + updated date. Clicking a row opens the page inline
  with the same reader (`renderWikiLinks` + `renderInfobox`) as
  before — links to other wiki pages stay inside the Forum shell;
  missing-link clicks fall through to `wiki.html`. Shared
  `js/forum-wiki.js` module so the two Forum pages don't duplicate
  the list/reader code (single `mountWikiPane(hostEl, supabase)`
  entry point).
- **Entrepreneur forum parity.** Renamed the entrepreneur `LOBBYING`
  tab to `FORUM` and cloned the four `politician-forum-*.html`
  pages into `entrepreneur-forum-*.html` siblings with the
  entrepreneur topbar mount. Entrepreneurs see the same threads
  as politicians (forum is global, one DB) and can post / reply /
  edit / delete under any of their owned faction identities — the
  identity selector and the `_forum_resolve_author` ownership gate
  already accept entrepreneur and corporation types, no backend
  change needed. `entrepreneur-lobbying.html` removed.
- **Discord notification on new threads.** New `create_forum_thread`
  fires a fire-and-forget `net.http_post` to a Supabase Edge Function
  (`forum-thread-discord`) which forwards a compact embed (title +
  author + link) to a configured Discord webhook. Edge function holds
  the Discord webhook URL in `DISCORD_FORUM_WEBHOOK_URL` env var;
  shared bearer secret in `FORUM_DISCORD_EDGE_SECRET` keeps the
  endpoint locked. Three matching `system_config` rows
  (`forum_discord_edge_url`, `forum_discord_edge_secret`,
  `forum_public_base_url`) carry the DB-side config. Notification
  is skipped (no-op) when any of the three are blank — thread
  creation always succeeds; Discord is best-effort. Replies don't
  fire (scope was new threads only).
- **Nation flag + name on every thread row.** Category-list rows
  now carry a small chip beside the title with the thread's
  Primary Nation (flag image + name) or "International" when
  unset. Same chip pattern on the thread detail header. Server-
  side join in `get_forum_category` + `get_forum_thread` pulls
  `nations.flag_url`; client-side render goes through a shared
  `renderNationChip()` helper in `forum-utils.js`.
- **Edit + Delete on your own posts.** Both chips appear in a small
  action row at the bottom of any post whose `author_faction_id` is
  in the caller's faction set. Edit swaps the body for an inline
  `contenteditable` with Save / Cancel; Save round-trips through
  `update_forum_post` (server re-checks ownership and bounds, sets
  `forum_posts.updated_at`). The page reloads on success so the
  render-side sanitizer runs and an `edited <relative>` badge
  appears beside the original timestamp. Delete confirms, calls
  `delete_forum_post`; if the row was the only post in its thread
  the thread row cascades (empty threads aren't a useful surface)
  and the page bounces back to the category index.

### Added — Contracts

- **Corporate lawsuits**. `file_corp_lawsuit` RPC + `lawsuit-evidence`
  Storage bucket (`20270579-20270581`). Corps can file civil
  complaints against other corps, attach evidence files (PNG / JPEG /
  PDF), and trigger an Advocate engagement on the recipient side.
- **Build-to-Order aircraft settlement at delivery** (`20270586`).
  BTO contracts now settle the production cost + airline payment at
  the moment the airframe is delivered to the airline's fleet,
  instead of at order time. Cancellation paths cleaned up.
- **Aircraft RFP manual award** (`20270587`). Airline can manually
  award an RFP to a specific bid (in addition to the lowest-price
  automatic award) before the deadline. Award sends an automatic
  notification + creates a build-to-order contract on the winning
  corp's side.
- **Committee Chair bid** (`20270584`). Politicians on a committee
  can bid for the chair via a 5-tick window; the highest Reputation
  bid wins, ties broken on bid order. Costs `next_chair_bid_tick`
  cooldown to prevent rapid re-bidding.

### Changed

- **Stat labels reshuffled.** The `politician_influence` column is
  now labelled "Capital" in the UI; `political_capital` is labelled
  "Influence" (topbar pill, action buttons, career card). The
  underlying columns are unchanged — only the display strings flipped.
- **Topbar pill** on politician pages now reads
  `INFLUENCE: <value>` instead of `POLITICAL CAPITAL: <value>`.
- **Run Political Ads cost** debits `politician_influence` ("Capital"),
  not `political_capital` ("Influence"). The button reads
  "-1 Capital" with the updated mapping.
- **Trial state visibility.** `get_trial_state` and
  `list_active_trials_for_advocate` both return
  `ticks_until_forfeit` so the modal + Pressing-Issues card render
  the countdown without client-side tick math.
- **Corp contract — auto-grow article textareas + mobile refresh.**
  Article body textareas on `corp-contract.html` now soft-autosize
  to fit their content (no internal scrollbar; doubled the min
  height from 54 → 108px), wired through a shared
  `autosizeTextarea(el, maxPx)` helper that also powers the chat
  composer. Added 720px and 520px breakpoints so the contract reads
  cleanly on phones: tighter padding, stacked phase rows, stacked
  cancel block. At ≤920px the 2-column negotiation grid collapses to
  a single column and the chat panel drops its `position:sticky`
  pin so it sits naturally below the doc panel.

### Changed

- **Aircraft production: engine handling consolidated into helpers.**
  `ent_queue_production_run` (DIY runs) and `ent_accept_aircraft_order`
  (BTO branch) both did the same five-step engine dance inline:
  look up the engine design, verify type, check
  `ent_engine_inventory >= engine_count × qty`, subtract engine cost
  from `v_per_unit`, draw from inventory via a race-guarded CAS
  UPDATE. Two copies of the math, two copies of the inventory
  consumption pattern — exactly the duplication that bit us when
  `20270368` regressed the unified engine handling in one function
  but not the other. Migration `20270609` extracts:
  `_aircraft_engine_requirement(corp_id, engine_design_id, eng_count,
  qty)` (STABLE lookup + check, returns engine cost + eng_need on
  success) and `_draw_engines_from_inventory(corp_id,
  engine_design_id, qty)` (race-guarded CAS draw). Both callers
  re-issued to PERFORM the helpers. Public response shapes preserved
  — `insufficient_engines` for DIY, `seller_insufficient_engines`
  for BTO — so the existing client error handlers
  (`entrepreneur-corp.html:1877` + `:2216`) don't move. Now: one
  place to change the engine-discount math, one place to change the
  draw semantics, no more drift risk.

### Added

- **Board of Directors: CFO / COO roles + resign + COO succession
  (Phase 1).** Extends the existing CEO + Director board with two
  named officer roles, a voluntary-resignation path, and a COO-first
  CEO-succession rule. Migration `20270614`:
  • `corp_board_seats.role` (`NULL` / `'cfo'` / `'coo'`) with a
    partial unique index so only one CFO and one COO per corp.
  • `factions.next_board_apply_tick` cooldown stamp set by voluntary
    resignation; blocks `corp_board_request_join` until expiry
    (5-tick window).
  • `corp_appoint_role` (CEO appoints a seated Director to CFO/COO;
    auto-swaps any existing holder), `corp_clear_role` (drops a
    CFO/COO back to plain Director), `corp_board_resign` (caller
    self-resigns, stamps cooldown, fires `politician_career_events`
    'removed_from_board' with reason 'voluntary' and an `event_log`
    world entry), `corp_remove_director` (CEO kicks a board member —
    no cooldown applied, same career + world events with reason
    'forced').
  • `corp_no_confidence_resolve` re-issued so the ousted-CEO
    successor selection prefers the seated COO over the highest
    shareholder (`ORDER BY (s.role = 'coo') DESC NULLS LAST`,
    shares desc, joined_tick asc).
  Board card on `entrepreneur-corp.html` now surfaces role badges
  (`DIRECTOR · CFO` / `DIRECTOR · COO`) and a uniform action strip
  per director: CEO sees Appoint CFO / Appoint COO / Clear Role /
  Remove; the seated member sees Resign. Phase 2 (CFO-initiated
  dividend voting) and Phase 3 (per-tick Reputation / Skill /
  Influence drips for tenure) are separate follow-ups.

### Changed

- **Case-drafting witnesses: side dropdown + 5 questions per phase.**
  Each witness on `courtcase.html` now carries a "Witness for"
  selector (Plaintiff / Defendant) at the top of the card next to
  Gender, so the drafter records which side is calling the witness
  rather than leaving it implicit. `MAX_QA_PER_PHASE` bumped from 3
  to 5 — Direct and Cross examinations can each hold up to five
  Q&A pairs (up from three). Server-side `submit_court_case_draft`
  only caps witness count, not Q&A per phase, so this is a
  pure client change. New `side` field is stored verbatim in
  `court_case_drafts.witnesses[]`; surfacing it on the trial UI
  during play (the "Witness for Plaintiff" label during examination)
  is a follow-up — `get_trial_state` doesn't return it yet.

### Changed

- **Apartment occupancy now tier-aware.** Previously all three
  apartment tiers in a nation projected the same occupancy because
  the formula was `clamp(0.4, stab/100, 1.0)` — pure function of
  nation stability, no tier input. Realistically a luxury unit
  serves a smaller renter pool than a basic one. Migration
  `20270617` adds a tier multiplier inside the clamp: basic ×1.00,
  modest ×0.85, luxury ×0.65. So a nation at stab=91 now projects
  91% / 77% / 59% for basic / modest / luxury instead of 91% across
  the board. Floor (0.4) still applies to all tiers in low-stab
  nations. JS-side helper renamed `apartmentOccupancyFromStability`
  → `apartmentOccupancy(buildingType, stab)`; `APARTMENT_DEFS`
  gains an `occMult` field as the SoT, with the SQL CASE in lockstep
  per the existing "Keep them in sync" pattern. Modal projection
  and the sparkline both pass building_type so live numbers match
  the actual tick math.

### Fixed

- **Shipping corps: Revenue Change card now stamps per-tick payout.**
  Third in the bypass-the-ledger sweep (after oil & gas in `20270605`
  and airlines in `20270616`). User confirmed their shipping corp
  earning from an active freighter route while the card showed "$0
  · no data yet" — same diagnosis. Migration `20270618` re-issues
  `process_trade_agreement_shipping_multiwinner` (live body
  confirmed via `pg_get_functiondef` probe — `always_manual_accept`
  variant, no auto-fill window) with the per-bid `UPDATE
  entrepreneur_corps` extended to stamp `last_tick_revenue` /
  `last_revenue_tick` alongside the treasury credit. Multi-bid
  aggregation per tick handled by the same CASE pattern as
  airlines: a corp winning multiple bids in one tick accumulates
  the payouts in one stamp. Legacy faction-corp bidders (writing
  to `corp_cash_reserves`) are unchanged. Apartment-rent
  (`20270445`) and share-trade paths still pending follow-ups.
- **Airline corps: Revenue Change card now stamps per-tick net.**
  User reported two airline routes generating "net +$1,500" each
  per tick (=$3,000/tick total treasury inflow), but the Revenue
  Change card on `entrepreneur-corp.html` stayed at "$0 · no data
  yet". Cause: `process_entrepreneur_airline_routes` writes to
  `treasury_cash` but didn't stamp `last_tick_revenue` /
  `last_revenue_tick` on `entrepreneur_corps` — the two columns
  `corp_revenue_change_this_month` reads from. Already flagged as
  a follow-up in `20270605`'s commit body (oil & gas got the same
  treatment; airlines / share trades / apartment rents were
  pending). Migration `20270616` re-issues the airline tick
  processor with the entrepreneur_corps UPDATE extended to stamp
  the two columns alongside the treasury credit. Multi-route
  aggregation per tick handled via CASE: corps running multiple
  routes accumulate the net across them in one stamp.
  Share-trade and apartment-rent paths remain pending follow-ups.
- **Trial chat: opposing counsel can now read the text of played
  evidence.** When a beat was played as part of a trial message,
  the chat card surfaced only "FACT · The Three Workers" — opposing
  counsel saw a label but had no way to read what the evidence
  actually said. The description text lived on the beat row and was
  already returned for the calling side's own hand, so this was a
  read-permission gap, not a missing field. Migration `20270613`
  adds `beat_description` to the message jsonb returned by
  `get_trial_state` (played beats are public to both sides, so no
  privacy gate). `politician-home.html`'s `renderTrialChat` now
  renders the description under the beat name in italics, separated
  by a thin rule.
- **Aircraft production modal: shows the actual charge, not the
  bundled cost.** The Produce modal on `entrepreneur-corp.html` was
  reading `design.cost_per_unit` for its "Unit cost $X" line — for
  aircraft designs that's the BUNDLED total (airframe + engines ×
  count), but `ent_queue_production_run` (since `20270608`) only
  charges the airframe portion (engines come from
  `ent_engine_inventory`). The displayed cost was higher than the
  actual debit; users reported it looked like they were being
  billed for engines twice (once on engine purchase, again as part
  of the aircraft). Migration `20270611`: new
  `ent_production_cost_preview(p_corp_id, p_design_id)` RPC returns
  the per-unit charge `ent_queue_production_run` would compute,
  plus engine breakdown (`engine_name`, `engine_inventory_have`).
  Modal calls it once on open, caches the value, and adds a sub-
  line: "Engines: 2× Artigiano Passera drawn from your inventory
  (5 on hand) — not billed again here." Warning red when stock is
  short. Also folded the engine-discount math into
  `_aircraft_engine_requirement`'s response (new
  `per_unit_discount` field) so the formula now lives in exactly
  one place — `ent_queue_production_run`,
  `ent_accept_aircraft_order`, and the new preview RPC all read
  the same source. **If you're still seeing the full bundled cost
  debited from treasury after applying `20270611`, double-check
  that `20270608` and `20270609` are also applied — the server-
  side charge fix lives there.**
- **Brokerage modal: "nation gets" now correctly reads "owner gets"
  for owner-offered buildings.** The Re-price / List-for-Sale modal
  on `entrepreneur-corp.html` always rendered the proceeds split as
  "commission $X · nation gets $Y" — misleading for any building
  brokered on behalf of an OWNING corp (which is the common case for
  buildings built by construction corps and offered for brokerage).
  The server-side `broker_buy_listing` (20270207) already correctly
  routes proceeds to the owner corp when the building is owned (and
  only to the nation budget for nation-seeded inventory) — only the
  UI label was wrong. Threaded the owner's name through the brokerage
  buttons (`sh-broker-list` / `sh-broker-reprice`) and modal context;
  preview now reads "**Monteq Building Group** gets $61M" for
  owner-offered listings and the historical "nation gets $X" for
  nation inventory. Also renamed the preview's `nationTake` field to
  `proceeds` so the call sites read honestly. No money flow change
  — the actual sale credits the owner corp either way.
- **Corporate Contracts section on `entrepreneur-corp.html` now
  populates with binding contracts.** The `#cp-contracts` div sat
  on a hardcoded "No contracts yet." even after both CEOs signed a
  negotiation into `status='binding'` — no JS ever queried for
  them. The Corporate Negotiations modal already calls
  `list_corp_negotiations` for drafting contracts, so migration
  `20270610` extends that same RPC with an optional `p_statuses
  TEXT[] DEFAULT ARRAY['drafting']` parameter (existing modal calls
  unchanged) and the section now passes `['binding']`. Also threads
  `signed_at_tick` + `expires_at_tick` into the response so each
  row reads "signed Jul, 2014 · expires Mar, 2017". Clicking a row
  opens the same `corp-contract.html?id=…` page the modal does.
- **Aircraft production: own-designed engines were billed twice.**
  An aviation-manufacturing corp that designed both an engine and an
  aircraft using that engine was being charged the engine cost twice:
  once when producing the engine into `ent_engine_inventory`, and
  again as part of the bundled `design.cost_per_unit` when producing
  the aircraft. Root cause: `20270368` ("plumb per_unit_cost
  through ent_queue_production_run") rebased its body from `20270235`,
  which still had the original own-vs-foreign-engine branch — so it
  silently reverted the `20270356` unification fix that had
  intentionally collapsed both paths ("no own-vs-foreign branch — if
  you don't have the engines on hand, you can't build the aircraft").
  For own-designed engines, `v_engine.entrepreneur_corp_id ==
  p_corp_id`, so the foreign-only block was skipped: no inventory
  consumption, no engine-cost subtraction from `v_per_unit`,
  manufacturer charged the full bundled cost. Migration `20270608`
  re-issues `ent_queue_production_run` with the unified body
  (functionally `20270363`'s version + the `per_unit_cost` write
  `20270368` was after). Foreign-corp aircraft orders via
  `ent_accept_aircraft_order` (20270586) were already on the unified
  pattern — only DIY production runs were affected. Existing in-flight
  / completed runs aren't retro-fixed; their `cost_per_tick` was
  stamped at queue time. Any cash restitution for engines already
  double-billed is a separate per-corp one-shot.
- **Airlines: route panel shows lane demand pool, not last-tick
  carried.** The "Total passengers on lane" line under each active
  route was summing `last_tick_pax` across every airline on the city
  pair. For a brand-new route — no tick processed yet — every term
  is 0 and the row rendered as "Total: 0 — You 0", which looked
  broken even though everything was correct. Migration `20270607`
  carves the existing per-lane demand formula out of
  `process_entrepreneur_airline_routes`' `lane_demand` CTE into a
  reusable `lane_demand(origin_city_id, dest_city_id) RETURNS int`
  helper (single source of truth — the tick processor calls the
  same helper instead of its old inline formula). New
  `list_active_lane_demands()` RPC returns the per-lane pool in one
  call for the client to merge with `last_tick_pax`. The route row
  now reads "Lane demand: 18 · last tick: 0 — You 0" the moment
  the route opens; once ticks accumulate it becomes "Lane demand:
  18 · last tick: 15 — You 10 · Sky Air 5", same per-airline
  breakdown as before. No formula duplication client-side.
- **Airlines: every nation now has 3 cities + auto-range trigger.**
  Only Calveth and Avelia had `airline_cities` rows (seeded by 20260706
  phase 2); eleven other nations sat at zero, so any airline founded
  outside those two nations hit "No cities available" in the Open Route
  form even with idle aircraft. `admin_create_nation` never seeded
  cities, and `admin_create_hub` never backfilled `airline_city_ranges`
  for the city it inserted — so even hand-added cities were range-
  orphaned and unusable. Migration `20270606`:
  (a) AFTER-INSERT trigger on `airline_cities` that fans out
  `airline_city_ranges` to every existing city using the 20270465
  formula (within-nation = 2; cross-nation derived from
  `diplomatic_relations.proximity`). Same trigger covers future
  `admin_create_hub` calls.
  (b) Seeds three placeholder cities for each of the eleven zero-city
  nations: `"{Nation} Capital"` (50% pop, capital), `"{Nation} North"`
  (30%), `"{Nation} South"` (20%). Rename via `admin_update_hub` when
  the worldbuilding lands. Weights sum to 100 so the deferred
  `pop_pct` constraint trigger from 20270465 passes at COMMIT.
- **Oil & Gas: Revenue Change card now reflects actual per-tick
  revenue.** The "Revenue Change (This Month)" card on
  `entrepreneur-corp.html` was rendering "$0 · no data yet" for every
  oil & gas corp even when retail revenue was clearly flowing into
  the treasury each tick (pumps → refinery → gas stations → treasury,
  same-tick). Root cause: `corp_revenue_change_this_month` reads
  `corp_cash_events` (a legacy ledger FK'd to `factions(id)`), but
  `process_oil_and_gas` writes to `entrepreneur_corps.treasury_cash`
  and physically can't emit corp_cash_events rows (wrong FK). The
  ledger had zero matching rows; the card had nothing to display.
  Fix in `20270605`: new `entrepreneur_corps.last_tick_revenue` +
  `last_revenue_tick` columns (server-only writes) stamped by
  `process_oil_and_gas` on every tick that produces retail revenue,
  plus a rewrite of `corp_revenue_change_this_month` to read those
  columns directly. Same response shape so the client doesn't
  change. Same fix needed for airline routes, share trades,
  apartment rents, etc. — those still bypass the legacy ledger and
  will keep showing "no data yet" until they get the same stamp.
- **`20270579` storage policy** wrapped in `DROP POLICY IF EXISTS`
  guards. The first push attempt failed with `SQLSTATE 42710`
  (policy already exists) on a re-run.
- **`20270580` `_corp_highest_standing_counsel`** switched from
  `f.politician_standing` to `f.politician_influence` (the
  post-20270583 column name) and `20270583` renames now wrapped in
  `DO $$ IF EXISTS … RENAME … END IF; $$` blocks so re-runs against
  a half-applied DB are idempotent.
- **`advance-tick` regeneration**. The trial-turn-timeouts wire-up
  block now lives in `scripts/advance-tick-handler-template.ts` so
  `check:edge-function-sync` CI doesn't strip it on regen.
- **Forum compose race**. Image upload locks Post + Cancel buttons
  for the upload duration to prevent a mid-upload cancel from
  orphaning the file in storage.
- **Image-only forum posts** previously failed `body_too_short`
  because the tag-stripped length came out to 0. The check now
  passes when the body contains an `<img>` tag, regardless of
  accompanying text.
- **Forum compose upload path mismatch**. Image uploads were going to
  `forum-images/<bootstrap-faction>/...` instead of the
  identity-selector value, so they landed in the wrong faction's
  folder while the post was attributed to the selected faction.
  Compose now reads the selected identity for the upload path and
  early-returns with a friendly message if no identity is selected.
- **Stale "Posting as" footer on compose** removed. It was a
  carryover from the pre-identity-selector design and showed the
  bootstrap-selected faction regardless of which identity the
  dropdown actually picked — actively misleading. The dropdown is
  the author truth; the footer copy now points the user at it.

### Security

- **`_forum_resolve_author` grant tightened.** The internal helper
  used by `create_forum_thread` and `create_forum_post` is now
  `REVOKE FROM PUBLIC` with no `GRANT TO authenticated`. Both call
  sites are SECURITY DEFINER and execute with elevated privileges
  regardless, so removing the wire-API surface costs nothing and
  reduces what a client can probe directly.
- **`forum-images` per-faction upload policy.** The 20270597
  initial policy gated only on `bucket_id = 'forum-images'`,
  letting any authenticated user write to any path under the
  bucket (no XSS surface, just clutter). The 20270598 follow-up
  pins `(storage.foldername(name))[1]` to a faction id the
  caller owns (`id = auth.uid() OR linked_user_id = auth.uid()`).

### Removed

- Legacy `20260219` forum tables (`forum_categories` keyed on `name`
  with `is_enabled`; intermediate `forum_subcategories`;
  `forum_threads` keyed on `subcategory_id`; the
  `trg_forum_reply_count` trigger). Orphan schema, no client code
  read it; dropped CASCADE so `20270595` could create the
  zone-based v1 shape cleanly.
- `politician_door_knock`'s old ads body. Reassigned to the actual
  Door Knocking mechanic; the ads mechanic moved to a new
  `politician_run_political_ads` RPC.
- `ent_vision` column on factions (replaced by stat consolidation
  in `20270583`).
