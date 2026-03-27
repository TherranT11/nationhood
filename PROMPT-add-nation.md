# Add a New Nation — Prompt Template

Use this prompt when you want Claude to add a new nation to Nationhood.
Copy everything below the line and paste it as your opening message.

---

## PROMPT START

I want to add a new nation to Nationhood. Walk me through the full process in phases. Do NOT generate anything until you have my answers for each phase. Ask me the questions, wait for my responses, then move to the next phase.

### PHASE 1 — Identity & Government

Ask me:
1. **Nation name** (e.g., "Kingdom of Calveth", "Republic of Toraza")
2. **Capital city**
3. **Government type** — Parliamentary, Presidential, or Autocracy?
4. **Total legislature seats** (existing nations use 120-155)
5. **Max party slots** (existing nations use 8)
6. **Continent** — Crucera (Southern Hemisphere, resource-rich) or Meridian (Old world, traditions)? Or a new continent? If new, give me a name and one-sentence description.
7. **Head of State method** — `appointed` (parliament picks), `direct_vote` (presidential election), or `hereditary` (monarchy)? If hereditary: generate a dynasty name, monarch name, age, title, and successor.
8. **Head of State title** — (e.g., President, King, Queen, Chancellor, Premier, Generalísimo, etc.)
9. **Flag** — Do I already have a flag file in `assets/flags/`? If so, what filename? If not, I will upload one before running the SQL.
10. **Alpha tester codes** — Should this nation require invite codes to join? If yes, how many codes?

### PHASE 2 — Starting Stats

Ask me for ALL of the following stats (0-100 scale unless noted). If I say something like "wealthy democracy" or "struggling authoritarian", suggest values that fit that profile and let me adjust.

**Economic (dollar-scale)**
- GDP (raw number, e.g., 717000000000)
- Debt (raw number)

**Fiscal & Monetary (0-100)**
- GDP Growth, Debt Growth, Inflation, Interest Rates
- Trade Balance, Currency Strength, Foreign Investment, Credit

**Taxation (0-100)**
- Income Tax, Corporate Tax, Sales Tax, Tariffs

**Labor & Inequality (0-100)**
- Unemployment, Labor Force Participation, Minimum Wage, Union Strength
- Poverty Rate, Income Inequality

**Demographics**
- Population (raw number)
- Population Growth, Median Age, Eligible Voters (raw number or percentage of pop)
- Ethnic Diversity

**Healthcare (0-100)**
- Healthcare Quality, Healthcare Accessibility, Beds per 100k, Lifespan, Drug Use

**Education (0-100)**
- Literacy, Higher Education, Education Accessibility, Academic Immigration

**Infrastructure (0-100)**
- Physical Infrastructure, Digital Infrastructure, Rail Network, Urbanization

**Energy & Resources (0-100)**
- Energy Generation, Renewable Energy %, Arable Land, Rare Minerals, Oil & Gas, Fuel Prices

**Environment (0-100)**
- Pollution, Carbon Emissions

**Quality of Life (0-100)**
- Standard of Living, Happiness, Social Mobility, Benefits

**Security & Society (0-100)**
- Crime Rate, Incarceration Rate, Religiosity
- Cost of Living, Manufacturing Output, Service Output, Housing Affordability

**Governance (0-100)**
- Stability, Legitimacy, Efficiency, Corruption
- Press Freedom, Judicial Independence, Freedom Index
- Polarization, Civil Unrest, Terrorism, Political Violence

**International (0-100)**
- Immigration, Illegal Immigration, Emigration, International Reputation

**Approval (0-100)**
- National Approval, Gov Approval, Gov Approval Institutional, Gov Approval Outcomes, Gov Approval Events

### PHASE 3 — Nation Profile (Lore)

Ask me for (or offer to auto-generate based on the stats/government):
1. **Overview** — 3-5 sentence description of the nation
2. **Motto** — national motto
3. **History Timeline** — 8-12 key historical events with years
4. **Official Name** — (e.g., "Kingdom of Calveth", "Federal Republic of Toraza")
5. **Demonym** — what citizens are called (e.g., "Calvethian")
6. **Languages**
7. **Religion**
8. **Currency Name** (e.g., "Calvethian Crown (C£)")
9. **Founded Year**
10. **National Anthem name**
11. **National Animal**
12. **National Flower**
13. **Geographic Region** — description of terrain
14. **Climate**
15. **Area (sq km)**
16. **Coastline (km)**
17. **Natural Resources**
18. **Major Industries**
19. **Major Exports**
20. **Major Imports**
21. **Calling Code** (e.g., "+31")
22. **Internet TLD** (e.g., ".cv")
23. **Drives On** — "left" or "right"

### PHASE 4 — Pre-Activated Policies

Based on the nation's stats, government type, and character, recommend which of the existing ~200+ policies should be pre-activated at game start. Rules:
- Only activate **structural** policies (not levers)
- All pre-activated policies use: `activated_at_tick=0, effects_started=true, effects_completed=true, ticks_elapsed=48`
- Effects are already baked into the starting stats — they do NOT tick
- Group recommendations by sector and let me approve/modify before generating SQL
- If the nation has `hos_election_method = 'hereditary'`, the monarchy foundational law is already set on the nation row (not via nation_policies)

### PHASE 5 — SQL Generation

Once all phases are approved, generate 3 SQL files following existing patterns:

1. **`sql/migrations/YYYYMMDD_add_[continent_if_new]_and_[nation].sql`**
   - Add continent column if new continent (skip if Crucera/Meridian already exist)
   - Create alpha_tester_codes table if it doesn't exist yet (skip if already created)
   - Set continent on any existing nations that need it

2. **`sql/insert_[nation].sql`**
   - Insert nation with shard FK (Alpha Shard)
   - UPDATE all stats
   - Save seed_stats JSONB snapshot (split across two jsonb_build_object calls merged with `||` to stay under 100-arg limit)
   - Insert nation_profile with all lore fields
   - Insert alpha tester codes if applicable
   - Verification SELECT at the end

3. **`sql/insert_[nation]_policies.sql`**
   - DO $$ block with v_[nation] and v_policy_id variables
   - Look up each policy by LOWER(policy_name)
   - INSERT INTO nation_policies with ON CONFLICT DO NOTHING
   - Verification SELECT at the end

### PHASE 6 — UI Updates

Check if `select-nation.html` needs changes:
- New continent tab? (only if a new continent was added)
- Alpha code gate already wired? (yes, if alpha_tester_codes table exists)
- Flag file present in `assets/flags/`?

### PHASE 7 — Pre-Commit Audit

Run the 10-point audit checklist before committing:
1. Stale code
2. Redundant code
3. Dead state
4. Console logs / debug artifacts
5. Error handling gaps
6. Critical logic bugs
7. Race conditions / double-fires
8. RLS and permissions
9. Schema consistency
10. UI loose ends

### PHASE 8 — Commit & Push

- Commit with descriptive message
- Push to the designated branch
- Post each SQL file in full so I can run them in the Supabase SQL Editor in order

---

## REFERENCE — Existing Nations

| Nation | Government | Continent | Pop | GDP | Character |
|--------|-----------|-----------|-----|-----|-----------|
| Avelia | Parliamentary | Crucera | 9.5M | $358B | Clean-slate baseline democracy |
| Sangreza | Presidential | Crucera | 12.5M | $528B | Bill-on-desk testing, moderate |
| Melizea | Autocracy | Crucera | 5.8M | $95B | Strongman, low legitimacy |
| Palvera | Presidential | Crucera | 6.65M | $106B | High debt/deficit stress |
| San Estrella | Presidential | Crucera | — | — | Tropical islands, colonial history |
| Montequilla | Parliamentary | Crucera | 4.2M | $109B | Crisis state, election imminent |
| Calveth | Parliamentary | Meridian | 13M | $717B | Constitutional monarchy, wealthy, stable |

## REFERENCE — SQL Execution Order

Always run in this order:
1. Migration file (schema changes)
2. Nation insert file (data)
3. Policy activation file (depends on nation existing)
