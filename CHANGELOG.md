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

### Fixed

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
