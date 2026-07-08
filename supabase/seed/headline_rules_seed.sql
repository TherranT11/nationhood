-- ===========================================================================
-- Seed: a wide spread of THRESHOLD headline rules, one variant per paper slant.
-- PREREQUISITE: apply schema_all.sql FIRST — it creates public.headline_rules (schema/157) and the
-- news tables this seed and the engine depend on. Running the seed against a DB that hasn't had the
-- schema applied fails with: relation "public.headline_rules" does not exist.
--
-- Global scope (nation_id null) → they apply in every nation; each nation's papers print the variant
-- matching their slant. Fires from the per-tick sweep (schema/158) on each stat's STORED value — the
-- same 1..100 number the admin authors and the player sees (ministry_stats, schema/150; the national
-- stats now share that 1..100 scale). So a rule fires when the nation's authored stat crosses the line.
--
-- Thresholds are on the 1..100 scale (Poverty > 40, Golden age Prosperity > 90, Crime > 60, …);
-- Inflation/Unemployment stay percentages. Tokens: {nation} = the nation, {value} = the crossing
-- figure, {subject} = the stat name. Slants: record | state | left | radleft | centre | right |
-- farright | tabloid (slants.js). Adds NO new papers.
--
-- Idempotent AND authoritative: re-running UPDATES an existing rule of the same name to these values
-- (so edits here propagate) and INSERTS the ones not present yet. Tune thresholds/cooldowns to taste,
-- or add more in Admin Setup → News → Headline Rules.
-- ===========================================================================

-- The Global Image rule was retired.
delete from public.headline_rules where name = 'Reputation crisis';

with v (name, subject, direction, value, priority, headlines) as (values
  -- ---- National & economy stats (stored values) ----------------------------------------------------
  ('Inflation crisis', 'Inflation', 'above', 15, 7, $j${
    "record":"Inflation in {nation} rises to {value}%.",
    "state":"{nation} holds the line on prices at {value}%, officials insist.",
    "left":"Cost-of-living crisis deepens as {nation} prices soar to {value}%.",
    "radleft":"Profiteering unchecked: {nation} inflation rips to {value}% while wages stall.",
    "centre":"{nation} inflation reaches {value}%; the central bank faces a hard choice.",
    "right":"Overspending stokes {nation} inflation to {value}%.",
    "farright":"Runaway {value}% inflation is bleeding {nation} families dry.",
    "tabloid":"PRICES EXPLODE! {nation} inflation smashes {value}%!"}$j$),

  ('Jobs crisis', 'Unemployment', 'above', 12, 7, $j${
    "record":"Unemployment in {nation} climbs to {value}%.",
    "state":"{nation} weathers a soft patch; jobs plan on track at {value}%.",
    "left":"{value}% out of work: {nation} abandons its workers.",
    "radleft":"The system discards {nation} labour — {value}% left jobless.",
    "centre":"{nation} unemployment hits {value}%; retraining urged.",
    "right":"Red tape and taxes push {nation} unemployment to {value}%.",
    "farright":"{nation} jobs vanish as unemployment reaches {value}%.",
    "tabloid":"NO JOBS! {nation} unemployment rockets to {value}%!"}$j$),

  ('Recession', 'Growth', 'below', 30, 6, $j${
    "record":"{nation} growth slows to {value}.",
    "state":"A brief adjustment: {nation} growth steadies at {value}, ministers say.",
    "left":"Austerity bites: {nation} growth collapses to {value} as families pay.",
    "radleft":"Capitalism stalls {nation} again — growth craters to {value}.",
    "centre":"{nation} growth sinks to {value}; a steadier hand is needed.",
    "right":"Overregulation stalls {nation}: growth falls to {value}.",
    "farright":"Globalist mismanagement drags {nation} to {value} growth.",
    "tabloid":"ECONOMY IN FREEFALL! {nation} growth crashes to {value}!"}$j$),

  ('Economic boom', 'Growth', 'above', 75, 5, $j${
    "record":"{nation} growth accelerates to {value}.",
    "state":"Boom times: {nation}'s bold plan powers growth to {value}.",
    "left":"{nation} booms at {value} — now share the gains with workers.",
    "radleft":"Whose boom? {nation} grows {value} while the many wait.",
    "centre":"{nation} growth surges to {value}; keep it sustainable.",
    "right":"Enterprise unleashed: {nation} growth roars to {value}.",
    "farright":"{nation} thrives at {value} when it puts itself first.",
    "tabloid":"BOOM! {nation} economy on fire at {value}!"}$j$),

  ('Living standards slide', 'Prosperity', 'below', 25, 6, $j${
    "record":"Prosperity in {nation} falls to {value}.",
    "state":"{nation} shields households as prosperity holds near {value}.",
    "left":"Hardship spreads as {nation} prosperity drops to {value}.",
    "radleft":"Managed decline: {nation} prosperity sinks to {value} for the many.",
    "centre":"{nation} prosperity slips to {value}; broad-based reform needed.",
    "right":"High taxes drag {nation} prosperity down to {value}.",
    "farright":"{nation} left poorer, prosperity down to {value}.",
    "tabloid":"SKINT! {nation} living standards tank to {value}!"}$j$),

  ('Unrest', 'Order', 'below', 25, 6, $j${
    "record":"Public order in {nation} weakens to {value}.",
    "state":"{nation} maintains calm; order steady at {value}, police say.",
    "left":"Neglect breeds unrest as {nation} order falls to {value}.",
    "radleft":"The people rise: {nation} order buckles to {value}.",
    "centre":"{nation} order drops to {value}; dialogue over crackdowns.",
    "right":"Soft governance lets {nation} order slide to {value}.",
    "farright":"Chaos on the streets: {nation} order collapses to {value}.",
    "tabloid":"STREETS IN CHAOS! {nation} order hits {value}!"}$j$),

  ('Welfare in retreat', 'Welfare', 'below', 25, 6, $j${
    "record":"Welfare provision in {nation} falls to {value}.",
    "state":"{nation} protects core services; welfare steady at {value}.",
    "left":"Safety net shredded: {nation} welfare drops to {value}.",
    "radleft":"They gut the poor: {nation} welfare crashes to {value}.",
    "centre":"{nation} welfare slips to {value}; target help where it counts.",
    "right":"Unaffordable promises: {nation} trims welfare to {value}.",
    "farright":"{nation} welfare down to {value} — care for our own first.",
    "tabloid":"SAFETY NET RIPPED! {nation} welfare at {value}!"}$j$),


  -- ---- Ministry stats (stored 1..100 value, ministry_stats) -----------------------------------------
  ('Crime wave', 'Crime', 'above', 60, 6, $j${
    "record":"Crime is rising in {nation} (index {value}).",
    "state":"{nation} steps up policing as crime edges to {value}.",
    "left":"Cuts fuel crime in {nation}, now at {value} — invest in communities.",
    "radleft":"Poverty breeds crime: {nation} at {value}, not more prisons.",
    "centre":"{nation} crime climbs to {value}; balance enforcement and prevention.",
    "right":"Soft justice lets {nation} crime hit {value} — back the police.",
    "farright":"Lawlessness grips {nation}: crime surges to {value}.",
    "tabloid":"CRIME WAVE! {nation} streets unsafe at {value}!"}$j$),

  ('Pollution alarm', 'Environment', 'below', 30, 5, $j${
    "record":"Environmental quality in {nation} declines ({value}).",
    "state":"{nation} balances growth and green goals; environment at {value}.",
    "left":"Communities choke as {nation} lets the environment fall to {value}.",
    "radleft":"Profit over planet: {nation} environment gutted to {value}.",
    "centre":"{nation} environment slips to {value}; steady green investment needed.",
    "right":"Costly green rules or none — {nation} environment sits at {value}.",
    "farright":"{nation} land and water neglected, environment at {value}.",
    "tabloid":"TOXIC! {nation} environment poisoned to {value}!"}$j$),

  ('Green progress', 'Environment', 'above', 70, 4, $j${
    "record":"{nation} improves its environment to {value}.",
    "state":"{nation}'s green plan delivers, environment up to {value}.",
    "left":"A cleaner {nation} for all as the environment reaches {value}.",
    "radleft":"A start, not enough: {nation} environment at {value}.",
    "centre":"{nation} environment rises to {value}; keep the momentum.",
    "right":"Green gains at {value} — now count the cost to {nation} business.",
    "farright":"{nation} protects its own land, environment up to {value}.",
    "tabloid":"GOING GREEN! {nation} cleans up to {value}!"}$j$),

  ('Poverty crisis', 'Poverty', 'above', 40, 6, $j${
    "record":"Poverty is rising in {nation} (index {value}).",
    "state":"{nation} widens support as hardship ticks to {value}.",
    "left":"Millions pushed under: {nation} poverty climbs to {value}.",
    "radleft":"A rigged system: {nation} manufactures poverty at {value}.",
    "centre":"{nation} poverty rises to {value}; targeted relief now.",
    "right":"Dependency grows as {nation} poverty reaches {value}.",
    "farright":"{nation}'s own left behind, poverty at {value}.",
    "tabloid":"BREADLINE BRITAIN-STYLE! {nation} poverty at {value}!"}$j$),

  ('Press crackdown', 'Press Freedom', 'below', 30, 6, $j${
    "record":"Press freedom in {nation} narrows ({value}).",
    "state":"{nation} curbs disinformation; a responsible press at {value}.",
    "left":"Voices silenced as {nation} press freedom falls to {value}.",
    "radleft":"The regime muzzles dissent: {nation} press at {value}.",
    "centre":"{nation} press freedom slips to {value}; protect open debate.",
    "right":"{nation} reins in a hostile media, press freedom at {value}.",
    "farright":"{nation} tames the elite press, freedom index {value}.",
    "tabloid":"GAGGED! {nation} muzzles the press at {value}!"}$j$),

  ('Immigration surge', 'Immigration', 'above', 60, 5, $j${
    "record":"Immigration to {nation} rises (index {value}).",
    "state":"{nation} manages orderly arrivals at {value}.",
    "left":"{nation} welcomes newcomers at {value} — fund services to match.",
    "radleft":"Borders are violence: {nation} debates arrivals at {value}.",
    "centre":"{nation} immigration reaches {value}; integration is the test.",
    "right":"{nation} strains under {value} arrivals — control the border.",
    "farright":"{nation} overwhelmed: immigration hits {value}.",
    "tabloid":"BORDERS BURST! {nation} migration at {value}!"}$j$),

  ('Extremism rising', 'Extremism', 'above', 40, 6, $j${
    "record":"Extremism is growing in {nation} (index {value}).",
    "state":"{nation} confronts radical fringes, contained at {value}.",
    "left":"Hate emboldened: {nation} extremism climbs to {value}.",
    "radleft":"Reaction on the march as {nation} extremism hits {value}.",
    "centre":"{nation} extremism rises to {value}; defend the centre ground.",
    "right":"{nation} unrest breeds extremism at {value} — restore order.",
    "farright":"{nation}'s establishment drives ordinary people to {value}.",
    "tabloid":"RADICALS RISING! {nation} extremism at {value}!"}$j$),

  ('Rule of law erodes', 'Rule of Law', 'below', 30, 6, $j${
    "record":"Rule of law in {nation} weakens ({value}).",
    "state":"{nation} reforms the courts; rule of law steady at {value}.",
    "left":"Justice for the powerful only as {nation} rule of law falls to {value}.",
    "radleft":"Whose law? {nation}'s crumbles to {value} for the rich.",
    "centre":"{nation} rule of law slips to {value}; guard the institutions.",
    "right":"{nation} courts undermined, rule of law at {value}.",
    "farright":"{nation}'s laws ignored — rule of law sinks to {value}.",
    "tabloid":"ABOVE THE LAW! {nation} justice at {value}!"}$j$),

  ('Housing crisis', 'Housing Affordability', 'below', 30, 6, $j${
    "record":"Housing affordability in {nation} worsens ({value}).",
    "state":"{nation} accelerates homebuilding; affordability at {value}.",
    "left":"Locked out: {nation} housing affordability crashes to {value}.",
    "radleft":"Landlord nation: {nation} affordability gutted to {value}.",
    "centre":"{nation} housing affordability falls to {value}; build more, faster.",
    "right":"Planning gridlock strangles {nation} housing at {value}.",
    "farright":"{nation}'s young priced out, housing at {value}.",
    "tabloid":"PRICED OUT! {nation} homes out of reach at {value}!"}$j$),

  ('Energy shortage', 'Energy Availability', 'below', 30, 6, $j${
    "record":"Energy availability in {nation} tightens ({value}).",
    "state":"{nation} secures supply through winter; energy at {value}.",
    "left":"Cold homes as {nation} energy availability falls to {value}.",
    "radleft":"Energy barons profit while {nation} freezes at {value}.",
    "centre":"{nation} energy availability drops to {value}; diversify supply.",
    "right":"{nation} energy at {value} — build capacity, cut dependence.",
    "farright":"{nation} left in the dark, energy at {value}.",
    "tabloid":"LIGHTS OUT! {nation} energy crunch at {value}!"}$j$),

  ('Emissions rising', 'CO₂ Emissions', 'above', 60, 4, $j${
    "record":"{nation} carbon emissions rise (index {value}).",
    "state":"{nation} balances industry and climate; emissions at {value}.",
    "left":"{nation} emissions climb to {value} — a just transition now.",
    "radleft":"Fossil capital wins as {nation} emissions hit {value}.",
    "centre":"{nation} emissions reach {value}; credible targets needed.",
    "right":"{nation} keeps the lights on, emissions at {value}.",
    "farright":"Global climate diktats aside, {nation} emits at {value}.",
    "tabloid":"SMOKESTACK NATION! {nation} emissions at {value}!"}$j$),

  ('Health improving', 'Health', 'above', 70, 4, $j${
    "record":"Health outcomes in {nation} improve to {value}.",
    "state":"{nation}'s health investment pays off, up to {value}.",
    "left":"Public health delivers for {nation} — outcomes at {value}.",
    "radleft":"Gains at {value}, but {nation} care still rations the poor.",
    "centre":"{nation} health rises to {value}; protect the progress.",
    "right":"Choice and reform lift {nation} health to {value}.",
    "farright":"{nation} cares for its own, health up to {value}.",
    "tabloid":"HEALTH BOOST! {nation} wellbeing hits {value}!"}$j$),

  -- ---- Economic extremes (outrank the base rules on the same subject via higher priority) -----------
  ('Hyperinflation', 'Inflation', 'above', 30, 9, $j${
    "record":"Inflation in {nation} spirals to {value}%.",
    "state":"{nation} acts to break the price spiral now at {value}%.",
    "left":"Wages worthless as {nation} inflation explodes to {value}%.",
    "radleft":"Currency collapse: {nation} inflation rips to {value}% while the rich hedge.",
    "centre":"{nation} inflation out of control at {value}%; emergency measures loom.",
    "right":"Reckless spending detonates {nation} inflation at {value}%.",
    "farright":"{nation} savings wiped out as inflation hits {value}%.",
    "tabloid":"MONEY MELTDOWN! {nation} inflation insane at {value}%!"}$j$),

  ('Deflation warning', 'Inflation', 'below', 0, 6, $j${
    "record":"Prices in {nation} are falling ({value}%).",
    "state":"{nation} keeps prices in check; inflation eases to {value}%.",
    "left":"Demand slumps as {nation} slides into deflation at {value}%.",
    "radleft":"Stagnation for the many: {nation} prices fall to {value}%.",
    "centre":"{nation} tips toward deflation at {value}%; watch the spiral.",
    "right":"Weak demand pulls {nation} into deflation at {value}%.",
    "farright":"{nation} economy freezes as prices fall to {value}%.",
    "tabloid":"PRICES DROP! Is {nation} heading for the freeze at {value}%?"}$j$),

  ('Mass unemployment', 'Unemployment', 'above', 20, 9, $j${
    "record":"Unemployment in {nation} surges to {value}%.",
    "state":"{nation} launches a jobs emergency; unemployment at {value}%.",
    "left":"A generation on the scrapheap: {nation} joblessness hits {value}%.",
    "radleft":"The system fails {nation} entirely — {value}% cast aside.",
    "centre":"{nation} unemployment at a crisis {value}%; act decisively.",
    "right":"{nation}'s economy seizes up, unemployment at {value}%.",
    "farright":"{nation} workers thrown out as unemployment reaches {value}%.",
    "tabloid":"JOBS ARMAGEDDON! {nation} unemployment at {value}%!"}$j$),

  ('Golden age', 'Prosperity', 'above', 90, 5, $j${
    "record":"Prosperity in {nation} rises to {value}.",
    "state":"A golden age: {nation} prosperity soars to {value}.",
    "left":"{nation} prospers at {value} — now lock in gains for all.",
    "radleft":"Prosperity at {value}, but who really owns {nation}'s wealth?",
    "centre":"{nation} prosperity reaches {value}; steward it wisely.",
    "right":"Free enterprise lifts {nation} prosperity to {value}.",
    "farright":"{nation} flourishes at {value} by backing its own.",
    "tabloid":"BOOM TIME! {nation} living it up at {value}!"}$j$),

  ('Iron grip', 'Order', 'above', 90, 5, $j${
    "record":"Public order in {nation} is exceptionally tight ({value}).",
    "state":"{nation} enjoys firm stability, order strong at {value}.",
    "left":"Order at {value} — but at what cost to {nation}'s freedoms?",
    "radleft":"The iron fist tightens: {nation} order clamped at {value}.",
    "centre":"{nation} order high at {value}; balance security and liberty.",
    "right":"Firm government restores {nation} order to {value}.",
    "farright":"Strength restored: {nation} order commands {value}.",
    "tabloid":"CRACKDOWN! {nation} locked down tight at {value}!"}$j$),

  -- ---- Further ministry stats (stored 1..100 value, ministry_stats) ---------------------------------
  ('Schools failing', 'Education', 'below', 30, 6, $j${
    "record":"Education standards in {nation} slip ({value}).",
    "state":"{nation} reforms schools; standards steady at {value}.",
    "left":"Class sizes swell as {nation} education falls to {value}.",
    "radleft":"Two-tier schooling: {nation} education gutted to {value}.",
    "centre":"{nation} education slips to {value}; invest in teachers.",
    "right":"Falling standards drag {nation} education to {value} — raise the bar.",
    "farright":"{nation} classrooms neglected, education at {value}.",
    "tabloid":"SCHOOL SCANDAL! {nation} education sinks to {value}!"}$j$),

  ('Schools improving', 'Education', 'above', 70, 4, $j${
    "record":"Education in {nation} improves to {value}.",
    "state":"{nation}'s schools plan delivers, education up to {value}.",
    "left":"Every child gains as {nation} education reaches {value}.",
    "radleft":"Progress at {value}, yet {nation}'s elite schools still buy advantage.",
    "centre":"{nation} education rises to {value}; keep raising standards.",
    "right":"Rigour and choice lift {nation} education to {value}.",
    "farright":"{nation} teaches its own well, education up to {value}.",
    "tabloid":"TOP MARKS! {nation} schools shine at {value}!"}$j$),

  ('Crumbling infrastructure', 'Infrastructure', 'below', 30, 6, $j${
    "record":"Infrastructure in {nation} degrades ({value}).",
    "state":"{nation} prioritises repairs; infrastructure holding at {value}.",
    "left":"Potholes and delays as {nation} infrastructure falls to {value}.",
    "radleft":"Public assets left to rot: {nation} infrastructure at {value}.",
    "centre":"{nation} infrastructure slips to {value}; fund maintenance.",
    "right":"{nation} infrastructure at {value} — cut waste, build smart.",
    "farright":"{nation}'s roads and rails crumble to {value}.",
    "tabloid":"FALLING APART! {nation} infrastructure rots to {value}!"}$j$),

  ('Building the future', 'Infrastructure', 'above', 70, 4, $j${
    "record":"{nation} upgrades its infrastructure to {value}.",
    "state":"{nation}'s build-out delivers, infrastructure up to {value}.",
    "left":"Investment reaches every region as {nation} infrastructure hits {value}.",
    "radleft":"New projects at {value} — will {nation}'s workers share the benefit?",
    "centre":"{nation} infrastructure rises to {value}; maintain the momentum.",
    "right":"Enterprise builds {nation}: infrastructure up to {value}.",
    "farright":"{nation} builds for its own, infrastructure at {value}.",
    "tabloid":"ON THE MOVE! {nation} infrastructure booms to {value}!"}$j$),

  ('Wage squeeze', 'Wages', 'below', 30, 6, $j${
    "record":"Wages in {nation} fall behind ({value}).",
    "state":"{nation} steadies pay through a tough patch, wages at {value}.",
    "left":"Pay packets shrink as {nation} wages drop to {value}.",
    "radleft":"Bosses win, workers lose: {nation} wages driven to {value}.",
    "centre":"{nation} wages slip to {value}; productivity must follow pay.",
    "right":"{nation} wages at {value} — grow the economy to lift them.",
    "farright":"{nation} workers squeezed, wages down to {value}.",
    "tabloid":"PAY PAIN! {nation} wages crushed to {value}!"}$j$),

  ('Innovation surge', 'Innovation', 'above', 70, 4, $j${
    "record":"Innovation in {nation} accelerates to {value}.",
    "state":"{nation}'s research drive pays off, innovation up to {value}.",
    "left":"{nation} innovates at {value} — share the breakthroughs widely.",
    "radleft":"Whose invention? {nation} innovation at {value}, patents to the few.",
    "centre":"{nation} innovation rises to {value}; back the founders.",
    "right":"Enterprise sparks {nation} innovation to {value}.",
    "farright":"{nation} ingenuity leads, innovation up to {value}.",
    "tabloid":"BRAINWAVE! {nation} invents its way to {value}!"}$j$),

  ('Living standards squeeze', 'Standard of Living', 'below', 30, 6, $j${
    "record":"Standard of living in {nation} declines ({value}).",
    "state":"{nation} cushions households; living standards at {value}.",
    "left":"Everyday life gets harder as {nation} standards fall to {value}.",
    "radleft":"The many go without while {nation} standards drop to {value}.",
    "centre":"{nation} living standards slip to {value}; broad relief needed.",
    "right":"{nation} standards at {value} — lower taxes, let people keep more.",
    "farright":"{nation} families do without, standards at {value}.",
    "tabloid":"BELT TIGHTENS! {nation} living standards at {value}!"}$j$),

  ('Fraying society', 'Social Integration', 'below', 30, 5, $j${
    "record":"Social cohesion in {nation} weakens ({value}).",
    "state":"{nation} promotes shared values; cohesion at {value}.",
    "left":"Division deepens as {nation} social integration falls to {value}.",
    "radleft":"Divide and rule: {nation}'s cohesion driven to {value}.",
    "centre":"{nation} social integration slips to {value}; rebuild common ground.",
    "right":"{nation} cohesion at {value} — integration must be earned.",
    "farright":"{nation} pulled apart, social integration at {value}.",
    "tabloid":"NATION SPLIT! {nation} cohesion cracks to {value}!"}$j$),

  ('Warming alarm', 'Global Warming', 'above', 60, 4, $j${
    "record":"{nation}'s warming contribution rises (index {value}).",
    "state":"{nation} weighs climate action against jobs; index at {value}.",
    "left":"{nation} warming climbs to {value} — a just transition can't wait.",
    "radleft":"Fossil capital burns the planet: {nation} at {value}.",
    "centre":"{nation} warming index reaches {value}; credible targets now.",
    "right":"{nation} keeps industry running, warming index at {value}.",
    "farright":"Climate diktats rejected — {nation} sits at {value}.",
    "tabloid":"HEATING UP! {nation} warming index at {value}!"}$j$),

  ('Baby bust', 'Birth Rate', 'below', -10, 5, $j${
    "record":"The birth rate in {nation} falls ({value}).",
    "state":"{nation} supports young families; birth rate at {value}.",
    "left":"Priced out of parenthood as {nation} birth rate drops to {value}.",
    "radleft":"Insecurity deters families: {nation} birth rate at {value}.",
    "centre":"{nation} birth rate slips to {value}; ease the cost of children.",
    "right":"{nation} birth rate at {value} — back families to reverse it.",
    "farright":"{nation}'s future in doubt, birth rate down to {value}.",
    "tabloid":"BABY BUST! {nation} birth rate plunges to {value}!"}$j$),

  ('Cyber exposure', 'Cybersecurity', 'below', 30, 5, $j${
    "record":"Cybersecurity in {nation} weakens ({value}).",
    "state":"{nation} hardens key systems; cyber posture at {value}.",
    "left":"Public data left exposed as {nation} cybersecurity falls to {value}.",
    "radleft":"Surveillance grows, defence doesn't: {nation} cyber at {value}.",
    "centre":"{nation} cybersecurity slips to {value}; shore up the defences.",
    "right":"{nation} cyber posture at {value} — invest before the breach.",
    "farright":"{nation} left open to hostile states, cyber at {value}.",
    "tabloid":"HACK ALERT! {nation} cyber defences at {value}!"}$j$),

  -- ---- Good/bad COUNTERPARTS on covered stats (the other direction also makes news) --------------
  ('Jobs boom', 'Unemployment', 'below', 4, 5, $j${"record":"Unemployment in {nation} falls to {value}%.","state":"{nation}'s jobs plan pays off — unemployment down to {value}%.","left":"{nation} nears full employment at {value}% — now lift wages too.","radleft":"Jobs at {value}%, but who banks the gains in {nation}?","centre":"{nation} unemployment drops to {value}%; keep it steady.","right":"Enterprise puts {nation} back to work — unemployment {value}%.","farright":"{nation} works again: unemployment down to {value}%.","tabloid":"JOBS FOR ALL! {nation} unemployment just {value}%!"}$j$),
  ('Welfare flourishes', 'Welfare', 'above', 75, 4, $j${"record":"Welfare provision in {nation} rises to {value}.","state":"{nation} delivers for families — welfare up to {value}.","left":"A stronger safety net for {nation} — welfare at {value}.","radleft":"Welfare at {value} — a start; now decommodify care, {nation}.","centre":"{nation} welfare climbs to {value}; fund it sustainably.","right":"Generous at {value} — {nation} must mind the bill.","farright":"{nation} cares for its own, welfare up to {value}.","tabloid":"LOOKED AFTER! {nation} welfare hits {value}!"}$j$),
  ('Safe streets', 'Crime', 'below', 20, 4, $j${"record":"Crime in {nation} falls to {value}.","state":"{nation}'s policing works — crime down to {value}.","left":"Communities, not just cells: {nation} crime falls to {value}.","radleft":"Crime at {value} — proof {nation} thrives when needs are met.","centre":"{nation} crime drops to {value}; hold the gains.","right":"Tough policing pays: {nation} crime down to {value}.","farright":"Order restored — {nation} crime falls to {value}.","tabloid":"SAFE AT LAST! {nation} crime plunges to {value}!"}$j$),
  ('Poverty in retreat', 'Poverty', 'below', 15, 5, $j${"record":"Poverty in {nation} falls to {value}.","state":"{nation} lifts households — poverty down to {value}.","left":"Fewer left behind: {nation} poverty falls to {value}.","radleft":"Poverty at {value} — end it, don't just manage it, {nation}.","centre":"{nation} poverty drops to {value}; sustain the progress.","right":"Opportunity over handouts: {nation} poverty at {value}.","farright":"{nation}'s own lifted up, poverty down to {value}.","tabloid":"ON THE UP! {nation} poverty tumbles to {value}!"}$j$),
  ('Free press', 'Press Freedom', 'above', 70, 4, $j${"record":"Press freedom in {nation} rises to {value}.","state":"{nation} balances a free and responsible press at {value}.","left":"Voices heard: {nation} press freedom climbs to {value}.","radleft":"Freer at {value} — but who owns {nation}'s newspapers?","centre":"{nation} press freedom at {value}; guard it jealously.","right":"{nation} press unshackled, freedom at {value}.","farright":"{nation} lets the people speak, press freedom {value}.","tabloid":"SPEAK FREELY! {nation} press freedom at {value}!"}$j$),
  ('Immigration slows', 'Immigration', 'below', 20, 4, $j${"record":"Immigration to {nation} falls to {value}.","state":"{nation} controls its borders; arrivals steady at {value}.","left":"Fewer arrivals at {value} — don't scapegoat migrants, {nation}.","radleft":"Borders tighten to {value} as {nation} turns inward.","centre":"{nation} immigration eases to {value}; mind the labour gaps.","right":"{nation} takes back control — immigration down to {value}.","farright":"{nation} secures itself at last, immigration at {value}.","tabloid":"BORDERS HELD! {nation} migration down to {value}!"}$j$),
  ('Extremism fades', 'Extremism', 'below', 15, 4, $j${"record":"Extremism in {nation} falls to {value}.","state":"{nation} sees off the fringes — extremism down to {value}.","left":"Hope over hate: {nation} extremism falls to {value}.","radleft":"Extremism at {value} when {nation} meets people's needs.","centre":"{nation} extremism drops to {value}; hold the centre.","right":"Firm values calm {nation}: extremism at {value}.","farright":"{nation}'s people reassured, extremism down to {value}.","tabloid":"FRINGE FADES! {nation} extremism at {value}!"}$j$),
  ('Rule of law restored', 'Rule of Law', 'above', 70, 4, $j${"record":"Rule of law in {nation} strengthens to {value}.","state":"{nation}'s courts command trust — rule of law at {value}.","left":"Justice for all in {nation} as rule of law reaches {value}.","radleft":"Rule of law at {value} — now bind {nation}'s powerful to it too.","centre":"{nation} rule of law climbs to {value}; protect the courts.","right":"Order and law secure in {nation} at {value}.","farright":"{nation} upholds its laws, rule of law at {value}.","tabloid":"LAW WINS! {nation} rule of law at {value}!"}$j$),
  ('Housing boom', 'Housing Affordability', 'above', 70, 4, $j${"record":"Housing affordability in {nation} rises to {value}.","state":"{nation}'s homebuilding delivers — affordability at {value}.","left":"Homes within reach: {nation} affordability up to {value}.","radleft":"Affordable at {value} — housing is a right, not a market, {nation}.","centre":"{nation} housing affordability at {value}; keep building.","right":"Planning freed, {nation} builds — affordability {value}.","farright":"{nation}'s young can settle again, housing at {value}.","tabloid":"KEYS AT LAST! {nation} homes affordable at {value}!"}$j$),
  ('Energy abundance', 'Energy Availability', 'above', 70, 4, $j${"record":"Energy availability in {nation} rises to {value}.","state":"{nation} secures its power — energy at {value}.","left":"Warm homes for {nation} as energy reaches {value}.","radleft":"Energy at {value} — keep it public, not for profit, {nation}.","centre":"{nation} energy availability at {value}; diversify still.","right":"{nation} powers ahead, energy abundant at {value}.","farright":"{nation} stands energy-independent at {value}.","tabloid":"LIGHTS ON! {nation} energy surges to {value}!"}$j$),
  ('Emissions falling', 'CO₂ Emissions', 'below', 20, 4, $j${"record":"{nation} carbon emissions fall to {value}.","state":"{nation} greens its economy — emissions down to {value}.","left":"A cleaner {nation} for all as emissions fall to {value}.","radleft":"Emissions at {value} — a start; end fossil profit, {nation}.","centre":"{nation} emissions drop to {value}; keep the momentum.","right":"{nation} cuts emissions to {value} without wrecking industry.","farright":"{nation} cleans its own air, emissions at {value}.","tabloid":"CLEARING SKIES! {nation} emissions down to {value}!"}$j$),
  ('Health crisis', 'Health', 'below', 30, 5, $j${"record":"Health outcomes in {nation} decline to {value}.","state":"{nation} shores up hospitals; health steady at {value}.","left":"Wards overwhelmed as {nation} health falls to {value}.","radleft":"Care rationed for the poor: {nation} health at {value}.","centre":"{nation} health slips to {value}; invest before it worsens.","right":"{nation} health at {value} — reform the system, not just spend.","farright":"{nation}'s sick left waiting, health down to {value}.","tabloid":"HEALTH EMERGENCY! {nation} care collapses to {value}!"}$j$),
  ('Wage growth', 'Wages', 'above', 70, 4, $j${"record":"Wages in {nation} rise to {value}.","state":"{nation}'s workers see real gains — wages at {value}.","left":"Pay packets grow at last: {nation} wages up to {value}.","radleft":"Wages at {value} — still a fraction of what {nation}'s labour makes.","centre":"{nation} wages climb to {value}; watch it tracks output.","right":"A growing {nation} lifts wages to {value}.","farright":"{nation}'s workers rewarded, wages up to {value}.","tabloid":"PAY RISE! {nation} wages jump to {value}!"}$j$),
  ('Innovation stalls', 'Innovation', 'below', 30, 4, $j${"record":"Innovation in {nation} slows to {value}.","state":"{nation} retools its research; innovation steady at {value}.","left":"{nation} innovation stalls to {value} — fund public science.","radleft":"Patents hoard progress: {nation} innovation at {value}.","centre":"{nation} innovation drops to {value}; back the founders.","right":"Red tape stifles {nation}: innovation falls to {value}.","farright":"{nation} falls behind, innovation at {value}.","tabloid":"IDEAS DRY UP! {nation} innovation at {value}!"}$j$),
  ('Living standards rise', 'Standard of Living', 'above', 70, 4, $j${"record":"Standard of living in {nation} rises to {value}.","state":"{nation} lifts everyday life — living standards at {value}.","left":"Life gets better for {nation}'s many, standards at {value}.","radleft":"Standards at {value} — share the surplus fairly, {nation}.","centre":"{nation} living standards climb to {value}; broaden it.","right":"Prosperity reaches homes: {nation} standards at {value}.","farright":"{nation}'s families thrive, standards up to {value}.","tabloid":"GOOD LIFE! {nation} living standards at {value}!"}$j$),
  ('Society united', 'Social Integration', 'above', 70, 4, $j${"record":"Social cohesion in {nation} strengthens to {value}.","state":"{nation} pulls together — cohesion at {value}.","left":"Solidarity grows in {nation}, cohesion at {value}.","radleft":"United at {value} — united behind whom, {nation}, the street asks.","centre":"{nation} social integration climbs to {value}; nurture it.","right":"Shared values bind {nation}, cohesion at {value}.","farright":"{nation} united as one people, cohesion at {value}.","tabloid":"TOGETHER! {nation} unites, cohesion at {value}!"}$j$),
  ('Warming curbed', 'Global Warming', 'below', 20, 4, $j${"record":"{nation}'s warming contribution falls to {value}.","state":"{nation} meets its climate goals — warming index {value}.","left":"{nation} curbs warming to {value} — a just path forward.","radleft":"Warming at {value} — hold the polluters to it, {nation}.","centre":"{nation} warming index falls to {value}; stay the course.","right":"{nation} cuts warming to {value} while keeping the lights on.","farright":"{nation} tends its own land, warming down to {value}.","tabloid":"COOLING DOWN! {nation} warming index at {value}!"}$j$),
  ('Baby boom', 'Birth Rate', 'above', 10, 4, $j${"record":"The birth rate in {nation} rises to {value}.","state":"{nation}'s family policy works — birth rate up to {value}.","left":"Families feel secure again: {nation} birth rate at {value}.","radleft":"Birth rate at {value} — support parents, don't just cheer, {nation}.","centre":"{nation} birth rate climbs to {value}; a demographic reprieve.","right":"Confidence returns to {nation}'s families, birth rate {value}.","farright":"{nation}'s future secured, birth rate up to {value}.","tabloid":"BABY BOOM! {nation} birth rate leaps to {value}!"}$j$),
  ('Cyber fortress', 'Cybersecurity', 'above', 70, 4, $j${"record":"Cybersecurity in {nation} strengthens to {value}.","state":"{nation} hardens its systems — cyber posture at {value}.","left":"{nation} shields public data, cybersecurity at {value}.","radleft":"Secure at {value} — guard rights as well as servers, {nation}.","centre":"{nation} cybersecurity climbs to {value}; stay ahead.","right":"{nation} defends its networks, cyber posture at {value}.","farright":"{nation} fends off hostile states, cyber at {value}.","tabloid":"LOCKED DOWN! {nation} cyber defences at {value}!"}$j$),

  -- ---- Previously-uncovered stats (Tax Burden, Interest Rates, Debt-to-GDP, Pension Quality, …) --
  ('Tax burden bites', 'Tax Burden', 'above', 45, 5, $j${"record":"The tax burden in {nation} rises to {value}%.","state":"{nation} funds its services fairly; tax burden at {value}%.","left":"Make it progressive: {nation}'s {value}% falls hardest on the poor.","radleft":"Tax wealth, not wages — {nation} burden at {value}%.","centre":"{nation} tax burden reaches {value}%; broaden the base.","right":"Overtaxed at {value}% — {nation} punishes work and enterprise.","farright":"{nation} families bled dry by a {value}% tax burden.","tabloid":"TAXED TO THE HILT! {nation} burden hits {value}%!"}$j$),
  ('Borrowing costs soar', 'Interest Rates', 'above', 60, 5, $j${"record":"Interest rates in {nation} climb to {value}.","state":"{nation} steadies its currency; rates hold at {value}.","left":"Mortgages bite as {nation} rates rise to {value}.","radleft":"Rentiers win: {nation} hikes rates to {value} on the many.","centre":"{nation} rates reach {value}; balance growth and prices.","right":"Sound money: {nation} lifts rates to {value} to tame inflation.","farright":"{nation} borrowers squeezed as rates jump to {value}.","tabloid":"RATE SHOCK! {nation} borrowing costs at {value}!"}$j$),
  ('Debt eclipses the economy', 'Debt to GDP', 'above', 100, 6, $j${"record":"{nation}'s debt reaches {value}% of GDP.","state":"{nation} manages its obligations; debt at {value}% of GDP.","left":"Austerity looms as {nation} debt hits {value}% of GDP — defend services.","radleft":"Bondholders first? {nation} debt at {value}% of GDP.","centre":"{nation} debt passes {value}% of GDP; a credible plan is needed.","right":"Spending unchecked: {nation} debt tops {value}% of GDP.","farright":"{nation} mortgaged to foreign creditors at {value}% of GDP.","tabloid":"IN THE RED! {nation} debt at {value}% of GDP!"}$j$),
  ('Pensions in peril', 'Pension Quality', 'below', 30, 5, $j${"record":"Pension provision in {nation} falls to {value}.","state":"{nation} safeguards retirement; pensions steady at {value}.","left":"A betrayal of elders: {nation} pensions drop to {value}.","radleft":"They gamble our old age: {nation} pensions at {value}.","centre":"{nation} pension quality slips to {value}; reform sustainably.","right":"Unfunded promises catch up — {nation} pensions at {value}.","farright":"{nation}'s elderly abandoned, pensions down to {value}.","tabloid":"PENSION PANIC! {nation} retirement at {value}!"}$j$),
  ('Demographic strain', 'Demographic Pressure', 'above', 60, 4, $j${"record":"Demographic pressure in {nation} rises to {value}.","state":"{nation} plans for an ageing society; pressure at {value}.","left":"Fund care and services: {nation} demographic pressure at {value}.","radleft":"The many carry the strain as {nation} pressure hits {value}.","centre":"{nation} demographic pressure climbs to {value}; adapt now.","right":"{nation} strains under {value} — reform pensions and work.","farright":"{nation}'s balance tips, demographic pressure at {value}.","tabloid":"GREY SQUEEZE! {nation} demographic strain at {value}!"}$j$),
  ('Military buildup', 'Armed Forces Funding', 'above', 70, 4, $j${"record":"Military funding in {nation} rises to {value}.","state":"{nation} strengthens its defence — funding at {value}.","left":"Guns over butter? {nation} pours {value} into the military.","radleft":"The war machine feeds while {nation}'s needs go unmet at {value}.","centre":"{nation} defence funding at {value}; match means to threats.","right":"{nation} rebuilds its forces — funding up to {value}.","farright":"{nation} stands strong and armed, funding at {value}.","tabloid":"ARMED UP! {nation} military spend at {value}!"}$j$),
  ('Arms breakthrough', 'Military Research', 'above', 70, 4, $j${"record":"Military research in {nation} advances to {value}.","state":"{nation} leads in defence technology at {value}.","left":"Brains for war: {nation} sinks {value} into arms research.","radleft":"Science serves the generals as {nation} hits {value}.","centre":"{nation} military research at {value}; weigh the arms race.","right":"{nation} sharpens its edge — military research at {value}.","farright":"{nation}'s enemies beware, arms research at {value}.","tabloid":"WAR TECH! {nation} arms research at {value}!"}$j$),
  ('Generations divided', 'Equity Between Generations', 'below', 30, 4, $j${"record":"Fairness between generations in {nation} falls to {value}.","state":"{nation} balances the ledger across ages at {value}.","left":"The young inherit the bill: {nation} generational equity at {value}.","radleft":"Capital hoards while {nation}'s youth get {value}.","centre":"{nation} generational equity slips to {value}; rebalance.","right":"{nation} must not saddle its young — equity at {value}.","farright":"{nation} sells its children's future short at {value}.","tabloid":"YOUTH ROBBED! {nation} generational fairness at {value}!"}$j$)
),
-- Refresh any rule already seeded under the same name to the values above (thresholds/text/priority).
upd as (
  update public.headline_rules hr
     set scope = 'global', trigger_type = 'threshold', subject_type = 'stat',
         subject = v.subject, direction = v.direction, value = v.value,
         headline_mode = 'slant', headlines = v.headlines::jsonb, cooldown = 12, priority = v.priority
    from v where hr.name = v.name
   returning hr.name
)
-- Insert the rules that don't exist yet.
insert into public.headline_rules (name, scope, trigger_type, subject_type, subject, direction, value, headline_mode, headlines, cooldown, priority)
select v.name, 'global', 'threshold', 'stat', v.subject, v.direction, v.value, 'slant', v.headlines::jsonb, 12, v.priority
from v where v.name not in (select name from upd);
