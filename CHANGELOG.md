# Changelog

All notable changes to Nationhood are recorded here. Format inspired by
[Keep a Changelog](https://keepachangelog.com/); dates use ISO 8601.

## [ALPA — 2.9] — 2026-06-04

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

### Fixed

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
