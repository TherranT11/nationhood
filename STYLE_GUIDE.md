# Nationhood Style Guide

A comprehensive reference for all visual design tokens, component patterns, and conventions used across the Nationhood application.

---

## 1. Typography

### Font Families

| Token / Variable   | Font Stack                                        | Usage                                      |
|---------------------|---------------------------------------------------|--------------------------------------------|
| `--font-mono`       | `'JetBrains Mono', monospace`                     | Labels, badges, stats, mono UI elements    |
| `--font-ui`         | `'IBM Plex Sans', -apple-system, sans-serif`      | Body text, titles, descriptions            |
| *(serif)*           | `'IBM Plex Serif', serif`                         | Nation names, mottos (dashboard)           |
| *(fallback body)*   | `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` | Default body font (dashboard.css)          |

### Google Fonts Import

```
JetBrains Mono: 300, 400, 500, 600, 700, 800
IBM Plex Sans:  300, 400, 400i, 500, 600, 700
IBM Plex Serif: 400, 400i, 500, 600
```

### Font Size Scale

| Size       | Rem     | Usage Examples                                            |
|------------|---------|-----------------------------------------------------------|
| 3XS        | 0.6rem  | Ratification classification badges                        |
| 2XS        | 0.65rem | Government badges, section subtitles                      |
| XS         | 0.68rem | Stat labels, event rows, tally titles, form labels        |
| SM-XS      | 0.7rem  | Party stat labels, info labels, amendment seats            |
| SM         | 0.72rem | Section headers, support titles, total labels             |
| SM-MD      | 0.75rem | Status badges, nav badges, support seats                  |
| MD-SM      | 0.78rem | Crisis descriptions, coalition party names, event icons   |
| MD         | 0.8rem  | Section headers, voting titles, amendment buttons         |
| MD-BASE    | 0.82rem | Crisis item names, descriptions, guide code               |
| BASE-SM    | 0.85rem | Action descriptions, bill sponsor, chat text, policy desc |
| BASE       | 0.9rem  | Card headers, bill title sponsor, stat rows, body text    |
| BASE-MD    | 0.95rem | Person names, minister names, election types              |
| MD-LG      | 1.0rem  | Action titles, coalition party names                      |
| LG-SM      | 1.05rem | Article titles, admin names, person names                 |
| LG         | 1.1rem  | Current vote values, party stat values                    |
| LG-MD      | 1.2rem  | Party display names, coalition seats                      |
| XL-SM      | 1.25rem | Stat card values                                          |
| XL         | 1.35rem | Nation identity heading (dashboard)                       |
| XL-LG      | 1.5rem  | Bill title, total cost values                             |
| 2XL-SM     | 1.55rem | Party name (big)                                          |
| 2XL        | 1.6rem  | Approval rating number                                    |
| 3XL        | 2.0rem  | Nation hero heading                                       |

### Font Weight Scale

| Weight | Name      | Usage                                           |
|--------|-----------|-------------------------------------------------|
| 300    | Light     | Available in JetBrains Mono                     |
| 400    | Regular   | Body text, descriptions                         |
| 500    | Medium    | Info values, leader names, stat row values       |
| 600    | Semi-Bold | Labels, nav tabs, section titles, badges         |
| 700    | Bold      | Headings, stat values, party names, buttons      |
| 800    | Extra-Bold| AP count (topbar)                                |

### Text Transform Conventions

- **Uppercase + letter-spacing**: All labels, badges, section headers, nav tabs, buttons
- Typical letter-spacing values: `0.04em`, `0.06em`, `0.08em`, `0.1em`, `1px`, `1.5px`, `2px`

---

## 2. Color System

### Dark Mode (Default `:root`)

#### Backgrounds

| Variable              | Value       | Usage                        |
|-----------------------|-------------|------------------------------|
| `--bg-body`           | `#121212` / `#141412` | Page background       |
| `--bg-panel`          | `#1a1a1a` / `#1a1a17` | Cards, panels         |
| `--bg-card`           | `#252525` / `#1e1e1a` | Card headers, inputs  |
| `--bg-elevated`       | `#24241f`   | Elevated surfaces (bill)     |
| `--bg-input`          | `#252525` / `#1e1e1a` | Form inputs           |
| `--bg-hover`          | `#2a2a2a` / `#282822` | Hover states          |

> **Note**: dashboard.css and bill.css define slightly different shades. Bill uses warmer tones (`#1a1a17`, `#1e1e1a`) vs dashboard's neutral grays (`#1a1a1a`, `#252525`).

#### Text Colors

| Variable              | Value         | Usage                             |
|-----------------------|---------------|-----------------------------------|
| `--text-bright`       | `#e8e4d9`     | Highest emphasis (bill)           |
| `--text-primary`      | `#e0e0e0` / `#c8c4b8` | Primary content          |
| `--text-secondary`    | `#888` / `#8a8778`     | Labels, metadata         |
| `--text-muted`        | `#666` / `#6b6a5e`     | Low-emphasis text        |
| `--text-dim`          | `#555` / `#5c5a50`     | Very low emphasis        |
| `--text-faint`        | `#444`        | Placeholder-level text            |

#### Top Bar Colors (Hardcoded, not using variables)

| Element             | Color         |
|---------------------|---------------|
| Top bar background  | `#141412`     |
| Top bar borders     | `rgba(255,255,255,0.06)`, `rgba(255,255,255,0.04)` |
| Tick labels         | `#7a7868`     |
| Tick values          | `#f0efe6`     |
| Nav tab (inactive)  | `#8a8978`     |
| Nav tab (hover)     | `#a8a797`     |
| Nav tab (active)    | `#f0efe6`     |
| Gold/Amber accent   | `#d4b45c`, `#c8a64e` |

#### Borders

| Variable              | Value                       | Usage                  |
|-----------------------|-----------------------------|------------------------|
| `--border-main`       | `#333` / `rgba(255,255,255,0.06)` | Primary borders  |
| `--border-light`      | `#222` / `rgba(255,255,255,0.04)` | Subtle dividers  |
| `--border-mid`        | `rgba(255,255,255,0.08)`    | Medium borders (bill)  |
| `--border-strong`     | `rgba(255,255,255,0.12)`    | Emphasized borders     |
| `--border-accent`     | `#ffcc00`                   | Accent border          |

#### Semantic / Status Colors

| Variable        | Value     | Faint BG                    | Border                        |
|-----------------|-----------|-----------------------------|-----------------------------|
| `--green`       | `#4CAF50` / `#5cb85c` | `rgba(92,184,92,0.08)` | `rgba(92,184,92,0.2)`   |
| `--red`         | `#ff4444` / `#d9534f` | `rgba(217,83,79,0.08)` | `rgba(217,83,79,0.2)`   |
| `--blue`        | `#2196F3` / `#5b9bd5` | `rgba(91,155,213,0.08)` | `rgba(91,155,213,0.2)` |
| `--orange`      | `#ff9800` / `#d48a3c` | `rgba(212,138,60,0.08)` | `rgba(212,138,60,0.2)` |
| `--purple`      | `#8b7ec8`  | `rgba(139,126,200,0.08)` | `rgba(139,126,200,0.2)` |
| `--amber`       | `#c8a64e`  | `rgba(200,166,78,0.08)` | `rgba(200,166,78,0.2)` |
| `--teal`        | `#5aafa5`  | *(not defined)* | *(not defined)* |
| `--accent`      | `#ffcc00` / `#c8a64e` | — | — |

#### Shadows

| Variable              | Value                       |
|-----------------------|-----------------------------|
| `--shadow-card`       | `rgba(0,0,0,0.5)`          |
| `--shadow-accent`     | `rgba(255,204,0,0.4)`      |

#### Other Contextual Colors

| Variable                  | Value       | Usage                   |
|---------------------------|-------------|-------------------------|
| `--ocean-bg`              | `#87CEEB`   | World map ocean          |
| `--sidebar-bg`            | `#1a1a1a`   | Sidebar background       |
| `--sidebar-border`        | `#333`      | Sidebar border           |
| `--spinner-track`         | `#333`      | Loading spinner track    |
| `--party-badge-bg`        | `#252525`   | Party badge background   |
| `--party-badge-border`    | `#444`      | Party badge border       |
| `--your-party-bg`         | `#2a2410`   | Highlighted own party    |
| `--stat-card-border-top`  | `#333`      | Stat card top border     |
| `--tag-bg`                | `#252525`   | Tag background           |
| `--bg-danger-subtle`      | `#2a1a1a`   | Danger subtle background |
| `--bg-success-subtle`     | `#1a2a1a`   | Success subtle background|

### Light Mode (`body.light-mode`)

#### Backgrounds

| Variable              | Value       |
|-----------------------|-------------|
| `--bg-body`           | `#f0f1f4`   |
| `--bg-panel`          | `#ffffff`   |
| `--bg-card`           | `#f5f5f5`   |
| `--bg-input`          | `#ffffff`   |
| `--bg-hover`          | `#e8e8e8`   |

#### Text Colors

| Variable              | Value       |
|-----------------------|-------------|
| `--text-primary`      | `#1a1a1a`   |
| `--text-secondary`    | `#555`      |
| `--text-muted`        | `#777`      |
| `--text-dim`          | `#999`      |
| `--text-faint`        | `#bbb`      |

#### Accent / Status (Light Mode)

| Variable              | Value       |
|-----------------------|-------------|
| `--accent`            | `#b8960a`   |
| `--accent-hover`      | `#a58500`   |
| `--green`             | `#2e7d32`   |
| `--red`               | `#c62828`   |
| `--blue`              | `#1565c0`   |
| `--orange`            | `#e65100`   |

#### Borders (Light Mode)

| Variable              | Value       |
|-----------------------|-------------|
| `--border-main`       | `#d0d0d0`   |
| `--border-light`      | `#e0e0e0`   |
| `--border-accent`     | `#c8a000`   |

---

## 3. Ideology Tag Colors

| Class                | Background | Text Color |
|----------------------|-----------|------------|
| `.tag-liberty`       | `#9C27B0` | white      |
| `.tag-equality`      | `#E91E63` | white      |
| `.tag-freedom`       | `#2196F3` | white      |
| `.tag-security`      | `#FF9800` | white      |
| `.tag-individualism` | `#eab308` | white      |
| `.tag-collectivism`  | `#ec4899` | white      |
| `.tag-tradition`     | `#795548` | white      |
| `.tag-progress`      | `#00BCD4` | white      |
| `.tag-nationalism`   | `#FF5722` | white      |
| `.tag-globalism`     | `#3F51B5` | white      |

---

## 4. Nation Map Colors

| Nation        | Default Fill | Hover Fill  | Selected Fill |
|---------------|-------------|-------------|---------------|
| Melizea       | `#eeffaa`   | `#f5ffcc`   | `#ccff00`     |
| Avelia        | `#ddafe9`   | `#eeccf2`   | `#d070d8`     |
| Sangreza      | `#5599ff`   | `#77bbff`   | `#2277ff`     |
| Montequilla   | `#aade87`   | `#bbee99`   | `#66cc44`     |
| San Estrella  | `#ffb380`   | `#ffc499`   | `#ff8833`     |
| Palvera       | `#dea0a0`   | `#eab5b5`   | `#d47070`     |

All nations use a `drop-shadow` glow on hover and a stronger glow on selected state.

---

## 5. Spacing & Layout

### Global Reset

```css
* { box-sizing: border-box; margin: 0; padding: 0; }
```

### Page Layout

- **Body**: Full-height flex column (`height: 100vh; display: flex; flex-direction: column; overflow: hidden;`)
- **Bill page**: Overrides to `overflow-y: auto; height: auto; min-height: 100vh;`

### Common Padding Values

| Context              | Value             |
|----------------------|-------------------|
| Panel padding        | `24px`            |
| Card body padding    | `6px 20px 20px`   |
| Card header padding  | `10px 20px`       |
| Bill articles        | `24px`            |
| Article internal     | `20px`            |
| Modal content        | `24px`            |
| Chat messages        | `14px`            |
| Top bar row          | `8px 20px`        |
| Nav tab              | `9px 14px`        |

### Grid Layouts

| Component         | Columns                        | Gap    | Max Width  |
|-------------------|--------------------------------|--------|------------|
| Dashboard grid    | `repeat(4, 1fr)`               | `20px` | `1580px`   |
| Bill page         | `1fr 420px`                    | `24px` | `1600px`   |
| Government 2-col  | `1fr 1fr`                      | `14px` | —          |
| Cabinet grid      | `1fr 1fr`                      | `12px` | —          |
| Action grid       | `repeat(2, 1fr)`               | `16px` | —          |
| Stat grid         | `repeat(auto-fit, minmax(150px, 1fr))` | `12px` | — |
| Parties grid      | `repeat(auto-fill, minmax(300px, 1fr))` | `20px` | — |
| Party layout      | `300px 1fr`                    | `22px` | —          |
| Party display stats | `repeat(2, 1fr)`             | `12px` | —          |

### Responsive Breakpoints

| Breakpoint     | Changes                                          |
|----------------|--------------------------------------------------|
| `≤ 1200px`     | Dashboard grid → 2 columns                       |
| `≤ 900px`      | Bill page → single column                        |
| `≤ 768px`      | Dashboard grid → 1 column, nav collapses, body scrolls, grids → 1 column |

---

## 6. Border Radius

| Size    | Value | Usage                                     |
|---------|-------|-------------------------------------------|
| None    | `0`   | *(default)*                               |
| Small   | `3px` | Badges, tags, bill components, buttons (bill page), form inputs |
| Medium  | `4px` | Crisis items, party stats, border-radius on some cards |
| Default | `6px` | Stat cards, info blocks, action log, minister cards |
| Large   | `8px` | Dashboard cards, party cards, coalition cards, action cards |
| XL      | `12px`| Guide panel overlay                       |
| Round   | `50%` | Loading spinner, legend swatches          |

> **Convention**: Bill page consistently uses `3px` border-radius. Dashboard uses `6px`–`8px`.

---

## 7. Component Patterns

### Status Badges (Bill)

Colored badge pattern used extensively:

```css
.badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-family: var(--font-mono);
}
```

Color variants follow the **faint bg + color text + border** pattern:

| Variant      | Background               | Text Color      | Border                    |
|--------------|--------------------------|-----------------|---------------------------|
| Green        | `var(--green-faint)`     | `var(--green)`  | `var(--green-border)`     |
| Red          | `var(--red-faint)`       | `var(--red)`    | `var(--red-border)`       |
| Blue         | `var(--blue-faint)`      | `var(--blue)`   | `var(--blue-border)`      |
| Orange       | `var(--orange-faint)`    | `var(--orange)` | `var(--orange-border)`    |
| Amber        | `var(--amber-faint)`     | `var(--amber)`  | `var(--amber-border)`     |
| Purple       | `var(--purple-faint)`    | `var(--purple)` | `var(--purple-border)`    |
| Neutral      | `rgba(255,255,255,0.04)` | `var(--text-muted)` | `var(--border-mid)` |

### Cards

**Dashboard cards:**
```css
.dash-card {
    background: var(--bg-panel);
    border: 1px solid var(--border-main);
    border-radius: 8px;
    overflow: hidden;
}
```

**Bill panels:**
```css
.bill-main {
    background: var(--bg-panel);
    border-radius: 3px;
    border: 1px solid var(--border-main);
    overflow: hidden;
}
```

### Card Headers

```css
.card-header {
    background: var(--bg-card);
    padding: 10px–14px 20px;
    font-size: 0.72rem–0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em–0.1em;
    color: var(--text-secondary) / var(--text-muted);
    font-family: var(--font-mono);
}
```

### Buttons

**Primary action button (gold gradient):**
```css
.action-btn {
    background: linear-gradient(135deg, #ffcc00 0%, #e6b800 100%);
    border: none;
    border-radius: 6px;
    color: #121212;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: transform 0.2s, box-shadow 0.2s;
}
.action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--shadow-accent);
}
.action-btn:disabled {
    background: var(--border-main);
    color: var(--text-muted);
    cursor: not-allowed;
}
```

**Vote buttons (bill page):**
```css
.vote-btn {
    padding: 14px;
    border: none;
    border-radius: 3px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-family: var(--font-mono);
    transition: opacity 0.2s;
}
.vote-btn:hover:not(:disabled) { opacity: 0.85; }
.vote-btn.yes { background: var(--green); color: white; }
.vote-btn.no { background: var(--red); color: white; }
.vote-btn.abstain { background: var(--bg-elevated); color: var(--text-secondary); border: 1px solid var(--border-mid); }
```

**Sponsor/tool buttons (dashed border):**
```css
.sponsor-tool-btn {
    border: 1px dashed var(--border-mid);
    background: transparent;
    color: var(--text-secondary);
    font-family: var(--font-mono);
}
.sponsor-tool-btn:hover {
    border-color: var(--amber);
    color: var(--amber);
    background: var(--amber-faint);
}
```

**Topbar buttons (logout, theme, guide):**
```css
/* Shared pattern */
font-family: 'JetBrains Mono', monospace;
font-size: 9px–11px;
font-weight: 600–700;
letter-spacing: 0.04em;
text-transform: uppercase;
padding: 3px–4px 8px–10px;
```

### Form Elements

```css
.form-label {
    font-size: 0.72rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-family: var(--font-mono);
    font-weight: 600;
}

.form-select, .form-input {
    width: 100%;
    padding: 12px;
    background: var(--bg-card);
    border: 1px solid var(--border-mid);
    border-radius: 3px;
    color: var(--text-primary);
    font-size: 0.9rem;
    font-family: var(--font-ui);
}
.form-select:focus, .form-input:focus {
    outline: none;
    border-color: var(--blue);
}
```

### Modals

```css
.modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    display: none; /* .active → display: flex */
    align-items: center;
    justify-content: center;
}
.modal-content {
    background: var(--bg-panel);
    border: 1px solid var(--border-strong);
    border-radius: 3px;
    padding: 24px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
}
```

### Info Blocks / Panels

```css
.info-block {
    background: var(--bg-panel);
    border-radius: 6px;
    padding: 16px;
    border-left: 3px solid var(--accent);
}
```

### Article Cards (Bill)

```css
.article {
    background: var(--bg-card);
    border-radius: 3px;
    padding: 20px;
    margin-bottom: 16px;
    border: 1px solid var(--border-main);
    border-left: 4px solid var(--text-muted);
}
.article.preamble {
    border-left-color: var(--amber);
    background: var(--amber-faint);
}
```

### Chat Component

```css
.chat-container {
    background: var(--bg-panel);
    border-radius: 3px;
    border: 1px solid var(--border-main);
    display: flex;
    flex-direction: column;
    min-height: 300px;
}
.chat-input:focus { border-color: var(--amber); }
.chat-send-btn { background: var(--amber); color: #141412; }
```

### Loading Spinner

```css
.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--spinner-track);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
```

---

## 8. Interaction & Animation

| Property                | Value                                | Usage                         |
|-------------------------|--------------------------------------|-------------------------------|
| Hover lift              | `transform: translateY(-2px)`        | Action buttons, vote buttons  |
| Hover shadow            | `box-shadow: 0 4px 12px <shadow>`   | Action buttons                |
| Color transition        | `transition: color 0.1s–0.15s`      | Nav tabs, links               |
| Border transition       | `transition: border-color 0.3s`     | Cards with hover borders      |
| Opacity hover           | `opacity: 0.85`                      | Bill page buttons             |
| Background transition   | `transition: background 0.1s–0.15s` | Topbar buttons                |
| General transition      | `transition: all 0.1s–0.3s`         | Coalition cards               |
| Deadline pulse          | `@keyframes deadline-pulse` (2s)     | Amber border pulse animation  |
| Spinner                 | `@keyframes spin` (1s linear)        | Loading spinner               |
| Map hover glow          | `filter: drop-shadow(0 0 8px ...)`   | Map nations                   |
| Map selected glow       | `filter: drop-shadow(0 0 15px ...)`  | Selected map nations          |

---

## 9. Navigation

### Top Bar

- Two-row design: Row 1 has nation badge, tick info, AP pips, actions; Row 2 has nav tabs
- Background: `#141412` with subtle border `rgba(255,255,255,0.06)`
- Nav tabs: JetBrains Mono, 11.5px, uppercase, with 2px bottom border for active state
- Notification badges: Red (`#d9534f`) and amber (`#b09a5b`) positioned absolutely on tabs

### Mobile Navigation

- Hamburger button visible at `≤ 768px`
- Nav collapses to vertical list with left border active indicator
- Top bar row wraps

---

## 10. Z-Index Layers

| Layer            | z-index | Element             |
|------------------|---------|---------------------|
| Top bar          | 100     | `#top-bar`          |
| Modal overlay    | 1000    | `.modal-overlay`    |
| Guide overlay    | 1000    | `.guide-overlay`    |
| Vote badge       | 10      | `.vote-status-badge`|

---

## 11. Scrollbar & Overflow

- Dashboard body: `overflow: hidden` (no page scroll)
- Bill page body: `overflow-y: auto` (allows scroll)
- Content area: `overflow-y: auto; overflow-x: hidden`
- Sidebar & lists: `overflow-y: auto` on scroll containers
- Chat messages: `max-height: 250px; overflow-y: auto`
- Support box content: `max-height: 200px; overflow-y: auto`

---

## 12. Key Design Principles

1. **Dark-first design** — Default is dark mode with warm undertones; light mode is opt-in via `body.light-mode` class toggle
2. **Monospace for system UI** — JetBrains Mono for labels, stats, badges, timestamps, and anything "data-like"
3. **Sans-serif for content** — IBM Plex Sans for readable body text, descriptions, names
4. **Serif for identity** — IBM Plex Serif reserved for nation names and mottos
5. **Faint/border/color triad** — Status colors always appear as a triad: faint background, colored text, semi-transparent border
6. **Uppercase everything structural** — Labels, headers, badges, buttons all uppercase with letter-spacing
7. **Minimal border-radius** — Bill page uses sharp `3px`; dashboard uses softer `6px`–`8px`
8. **Left border accents** — Info blocks, articles, crisis items, and amendments use colored left borders for visual categorization
9. **Amber/gold as primary accent** — `#c8a64e` / `#d4b45c` / `#ffcc00` used as the main interactive/accent color across the application
10. **Opacity-based hover** — Bill page buttons use `opacity: 0.85` on hover rather than color changes
