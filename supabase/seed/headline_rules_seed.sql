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
    "tabloid":"HACK ALERT! {nation} cyber defences at {value}!"}$j$)
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
