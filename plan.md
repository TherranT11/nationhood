# Government Card Implementation Plan

## Overview
Create a new Government card that:
1. Appears as the **second card** on `dashboard.html` (after Nation card)
2. **Replaces** the existing `renderAdminBox` (first box) on `politics.html`

The card uses the `dash-card` / `dash-card-header` / `dash-card-body` pattern from the Nation card.

---

## Card Layout (from reference screenshot)

```
┌─────────────────────────────────────┐
│  ● GOVERNMENT                       │  ← green dot + header
├─────────────────────────────────────┤
│                                     │
│  3rd Guerrero Administration        │  ← admin_name from administrations table
│  [PRESIDENTIAL] [COALITION]         │  ← gov type + coalition/single-party badges
│                                     │
│  [IG]  Isabela Guerrero             │  ← initials avatar + president name
│        President · Age 44 · 1st Term│  ← role, age, term info
│        ● SNC                        │  ← party dot + abbreviation
│                                     │
│  [MR]  Miguel Reyes                 │  ← initials avatar + VP/HoG name
│        Vice President               │  ← "Vice President" (pres) / "Head of Govt" (parl)
│                                     │
│  GOVERNING COALITION                │  ← section header
│  ████████████████░░░░░░░            │  ← stacked seat bar (party colors)
│  ● San Estrellan National Congress 39│ ← party rows with dots + seat counts
│  ● The National Front              15│
│                       54 seats combined│
│                                     │
│  APPROVAL                           │  ← section header
│  41%                                │  ← large approval number (color-coded)
│                                     │
│  MAJORITY GOVERNMENT 54/100 (51 needed)│ ← footer status bar
└─────────────────────────────────────┘
```

---

## Data Sources

### Dashboard.html — new Supabase queries needed:
1. **`factions`** — `id, seats, faction_name, abbreviation, party_color` where `nation_id` and `faction_type='party'`
2. **`presidents`** — `id, faction_id, first_name, last_name, age, terms_served, elected_tick, term_ends_tick, is_active` (active president)
3. **`administrations`** — `admin_name, government_type, coalition_parties, total_seats` (current, `ended_at_tick IS NULL`)
4. **`nations_history`** — `gov_approval` for previous tick (delta calculation)
5. **`nation`** fields already available from `state.nation`: `government_type`, `gov_approval`, `head_of_state_first_name`, `head_of_state_last_name`, `head_of_state_age`, `ruling_faction_id`
6. **Coalition** — import `fetchActiveCoalition` from `./js/game-common.js`

### Person display logic:
- **Presidential**: First person = President (from `presidents` table); Second person = "Vice President" (from `nations.head_of_state_*`)
- **Parliamentary**: First person = Head of Government / PM (from coalition lead party); Second person = "Head of State" (from `nations.head_of_state_*`)
- **Autocracy**: First person = Generalísimo / ruler (from `nations.head_of_state_*`); Second person = omitted

---

## Implementation Steps

### Step 1: Add CSS to `dashboard.html`
Add styles in the `<style>` block for:
- `.gov-admin-name` — bold title for administration name
- `.gov-badge` — tag badges for "PRESIDENTIAL", "COALITION", etc.
- `.gov-leader-row` — leader display with initials avatar
- `.gov-initials` — circular initials avatar
- `.gov-leader-info` — name, role, party info
- `.gov-party-dot` — small colored party dot
- `.gov-section-title` — "GOVERNING COALITION", "APPROVAL" section headers
- `.gov-seat-bar` — stacked horizontal bar for coalition seats
- `.gov-party-row` — party name + seat count rows
- `.gov-approval-big` — large approval percentage display
- `.gov-footer-bar` — bottom status bar ("MAJORITY GOVERNMENT...")

Use dashboard CSS variables (`--bg-panel`, `--bg-card`, `--border-main`, `--text-primary`, `--text-secondary`, `--green`, `--red`, `--orange`, etc.)

### Step 2: Add HTML placeholder to `dashboard.html`
After the Nation card `</div>`, add:
```html
<div class="dash-card" id="gov-card" style="display:none; margin-top:20px;">
  <div class="dash-card-header">
    <span class="gov-status-dot"></span> GOVERNMENT
  </div>
  <div class="dash-card-body" id="gov-card-body"></div>
</div>
```

### Step 3: Add JavaScript to `dashboard.html`
Inside the `initPage` callback, after the Nation card rendering:

1. Import `fetchActiveCoalition` and helper functions
2. Fetch data: allParties, president, administration, prevApproval, coalition, shard tick
3. Compute: approval + color, delta, coalition parties + governing seats, majority threshold
4. Render the card body with all sections
5. Show the card

### Step 4: Replace `renderAdminBox` on `politics.html`
Replace the existing `renderAdminBox` function (lines 4810-5089) with a new `renderGovCard` that produces the same layout, using the politics page CSS variables (`--dbg-*`, `--dtext-*`, etc.).

Update the call site at line 3353.
