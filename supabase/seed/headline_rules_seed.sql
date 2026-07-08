-- ===========================================================================
-- Seed: a wide spread of THRESHOLD headline rules, one variant per paper slant.
-- Global scope (nation_id null) → they apply in every nation; each nation's papers print the variant
-- matching their slant. Fires from the per-tick sweep (schema/158): the national/economy stats use
-- their stored value; the ministry stats use their policy-driven contribution, so a rule fires when a
-- nation's policy mix pushes that stat past the threshold.
--
-- Tokens: {nation} = the nation, {value} = the crossing figure, {subject} = the stat name.
-- Idempotent: each rule is guarded by name, so re-running never duplicates. Adds NO new papers.
-- Slant ids: record | state | left | radleft | centre | right | farright | tabloid (slants.js).
-- Tune thresholds/cooldowns to taste, or add more in Admin Setup → News → Headline Rules.
-- ===========================================================================

insert into public.headline_rules (name, scope, trigger_type, subject_type, subject, direction, value, headline_mode, headlines, cooldown, priority)
select v.name, 'global', 'threshold', 'stat', v.subject, v.direction, v.value, 'slant', v.headlines::jsonb, 12, v.priority
from (values
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

  ('Recession', 'Growth', 'below', 8, 6, $j${
    "record":"{nation} growth slows to {value}.",
    "state":"A brief adjustment: {nation} growth steadies at {value}, ministers say.",
    "left":"Austerity bites: {nation} growth collapses to {value} as families pay.",
    "radleft":"Capitalism stalls {nation} again — growth craters to {value}.",
    "centre":"{nation} growth sinks to {value}; a steadier hand is needed.",
    "right":"Overregulation stalls {nation}: growth falls to {value}.",
    "farright":"Globalist mismanagement drags {nation} to {value} growth.",
    "tabloid":"ECONOMY IN FREEFALL! {nation} growth crashes to {value}!"}$j$),

  ('Economic boom', 'Growth', 'above', 15, 5, $j${
    "record":"{nation} growth accelerates to {value}.",
    "state":"Boom times: {nation}'s bold plan powers growth to {value}.",
    "left":"{nation} booms at {value} — now share the gains with workers.",
    "radleft":"Whose boom? {nation} grows {value} while the many wait.",
    "centre":"{nation} growth surges to {value}; keep it sustainable.",
    "right":"Enterprise unleashed: {nation} growth roars to {value}.",
    "farright":"{nation} thrives at {value} when it puts itself first.",
    "tabloid":"BOOM! {nation} economy on fire at {value}!"}$j$),

  ('Living standards slide', 'Prosperity', 'below', 8, 6, $j${
    "record":"Prosperity in {nation} falls to {value}.",
    "state":"{nation} shields households as prosperity holds near {value}.",
    "left":"Hardship spreads as {nation} prosperity drops to {value}.",
    "radleft":"Managed decline: {nation} prosperity sinks to {value} for the many.",
    "centre":"{nation} prosperity slips to {value}; broad-based reform needed.",
    "right":"High taxes drag {nation} prosperity down to {value}.",
    "farright":"{nation} left poorer, prosperity down to {value}.",
    "tabloid":"SKINT! {nation} living standards tank to {value}!"}$j$),

  ('Unrest', 'Order', 'below', 8, 6, $j${
    "record":"Public order in {nation} weakens to {value}.",
    "state":"{nation} maintains calm; order steady at {value}, police say.",
    "left":"Neglect breeds unrest as {nation} order falls to {value}.",
    "radleft":"The people rise: {nation} order buckles to {value}.",
    "centre":"{nation} order drops to {value}; dialogue over crackdowns.",
    "right":"Soft governance lets {nation} order slide to {value}.",
    "farright":"Chaos on the streets: {nation} order collapses to {value}.",
    "tabloid":"STREETS IN CHAOS! {nation} order hits {value}!"}$j$),

  ('Welfare in retreat', 'Welfare', 'below', 8, 6, $j${
    "record":"Welfare provision in {nation} falls to {value}.",
    "state":"{nation} protects core services; welfare steady at {value}.",
    "left":"Safety net shredded: {nation} welfare drops to {value}.",
    "radleft":"They gut the poor: {nation} welfare crashes to {value}.",
    "centre":"{nation} welfare slips to {value}; target help where it counts.",
    "right":"Unaffordable promises: {nation} trims welfare to {value}.",
    "farright":"{nation} welfare down to {value} — care for our own first.",
    "tabloid":"SAFETY NET RIPPED! {nation} welfare at {value}!"}$j$),

  ('Reputation crisis', 'Global Image', 'below', 8, 5, $j${
    "record":"{nation}'s standing abroad falls to {value}.",
    "state":"{nation} deepens ties; global image resilient at {value}.",
    "left":"{nation} isolated on the world stage, image down to {value}.",
    "radleft":"Empire's friends desert {nation}; image at {value}.",
    "centre":"{nation}'s global image slips to {value}; rebuild alliances.",
    "right":"Weak leadership erodes {nation}'s standing to {value}.",
    "farright":"Disrespected abroad: {nation}'s image sinks to {value}.",
    "tabloid":"HUMILIATED! {nation}'s world image at {value}!"}$j$),

  -- ---- Ministry stats (policy-driven contribution) -------------------------------------------------
  ('Crime wave', 'Crime', 'above', 5, 6, $j${
    "record":"Crime is rising in {nation} (index {value}).",
    "state":"{nation} steps up policing as crime edges to {value}.",
    "left":"Cuts fuel crime in {nation}, now at {value} — invest in communities.",
    "radleft":"Poverty breeds crime: {nation} at {value}, not more prisons.",
    "centre":"{nation} crime climbs to {value}; balance enforcement and prevention.",
    "right":"Soft justice lets {nation} crime hit {value} — back the police.",
    "farright":"Lawlessness grips {nation}: crime surges to {value}.",
    "tabloid":"CRIME WAVE! {nation} streets unsafe at {value}!"}$j$),

  ('Pollution alarm', 'Environment', 'below', -5, 5, $j${
    "record":"Environmental quality in {nation} declines ({value}).",
    "state":"{nation} balances growth and green goals; environment at {value}.",
    "left":"Communities choke as {nation} lets the environment fall to {value}.",
    "radleft":"Profit over planet: {nation} environment gutted to {value}.",
    "centre":"{nation} environment slips to {value}; steady green investment needed.",
    "right":"Costly green rules or none — {nation} environment sits at {value}.",
    "farright":"{nation} land and water neglected, environment at {value}.",
    "tabloid":"TOXIC! {nation} environment poisoned to {value}!"}$j$),

  ('Green progress', 'Environment', 'above', 5, 4, $j${
    "record":"{nation} improves its environment to {value}.",
    "state":"{nation}'s green plan delivers, environment up to {value}.",
    "left":"A cleaner {nation} for all as the environment reaches {value}.",
    "radleft":"A start, not enough: {nation} environment at {value}.",
    "centre":"{nation} environment rises to {value}; keep the momentum.",
    "right":"Green gains at {value} — now count the cost to {nation} business.",
    "farright":"{nation} protects its own land, environment up to {value}.",
    "tabloid":"GOING GREEN! {nation} cleans up to {value}!"}$j$),

  ('Poverty crisis', 'Poverty', 'above', 5, 6, $j${
    "record":"Poverty is rising in {nation} (index {value}).",
    "state":"{nation} widens support as hardship ticks to {value}.",
    "left":"Millions pushed under: {nation} poverty climbs to {value}.",
    "radleft":"A rigged system: {nation} manufactures poverty at {value}.",
    "centre":"{nation} poverty rises to {value}; targeted relief now.",
    "right":"Dependency grows as {nation} poverty reaches {value}.",
    "farright":"{nation}'s own left behind, poverty at {value}.",
    "tabloid":"BREADLINE BRITAIN-STYLE! {nation} poverty at {value}!"}$j$),

  ('Press crackdown', 'Press Freedom', 'below', -5, 6, $j${
    "record":"Press freedom in {nation} narrows ({value}).",
    "state":"{nation} curbs disinformation; a responsible press at {value}.",
    "left":"Voices silenced as {nation} press freedom falls to {value}.",
    "radleft":"The regime muzzles dissent: {nation} press at {value}.",
    "centre":"{nation} press freedom slips to {value}; protect open debate.",
    "right":"{nation} reins in a hostile media, press freedom at {value}.",
    "farright":"{nation} tames the elite press, freedom index {value}.",
    "tabloid":"GAGGED! {nation} muzzles the press at {value}!"}$j$),

  ('Immigration surge', 'Immigration', 'above', 5, 5, $j${
    "record":"Immigration to {nation} rises (index {value}).",
    "state":"{nation} manages orderly arrivals at {value}.",
    "left":"{nation} welcomes newcomers at {value} — fund services to match.",
    "radleft":"Borders are violence: {nation} debates arrivals at {value}.",
    "centre":"{nation} immigration reaches {value}; integration is the test.",
    "right":"{nation} strains under {value} arrivals — control the border.",
    "farright":"{nation} overwhelmed: immigration hits {value}.",
    "tabloid":"BORDERS BURST! {nation} migration at {value}!"}$j$),

  ('Extremism rising', 'Extremism', 'above', 5, 6, $j${
    "record":"Extremism is growing in {nation} (index {value}).",
    "state":"{nation} confronts radical fringes, contained at {value}.",
    "left":"Hate emboldened: {nation} extremism climbs to {value}.",
    "radleft":"Reaction on the march as {nation} extremism hits {value}.",
    "centre":"{nation} extremism rises to {value}; defend the centre ground.",
    "right":"{nation} unrest breeds extremism at {value} — restore order.",
    "farright":"{nation}'s establishment drives ordinary people to {value}.",
    "tabloid":"RADICALS RISING! {nation} extremism at {value}!"}$j$),

  ('Rule of law erodes', 'Rule of Law', 'below', -5, 6, $j${
    "record":"Rule of law in {nation} weakens ({value}).",
    "state":"{nation} reforms the courts; rule of law steady at {value}.",
    "left":"Justice for the powerful only as {nation} rule of law falls to {value}.",
    "radleft":"Whose law? {nation}'s crumbles to {value} for the rich.",
    "centre":"{nation} rule of law slips to {value}; guard the institutions.",
    "right":"{nation} courts undermined, rule of law at {value}.",
    "farright":"{nation}'s laws ignored — rule of law sinks to {value}.",
    "tabloid":"ABOVE THE LAW! {nation} justice at {value}!"}$j$),

  ('Housing crisis', 'Housing Affordability', 'below', -5, 6, $j${
    "record":"Housing affordability in {nation} worsens ({value}).",
    "state":"{nation} accelerates homebuilding; affordability at {value}.",
    "left":"Locked out: {nation} housing affordability crashes to {value}.",
    "radleft":"Landlord nation: {nation} affordability gutted to {value}.",
    "centre":"{nation} housing affordability falls to {value}; build more, faster.",
    "right":"Planning gridlock strangles {nation} housing at {value}.",
    "farright":"{nation}'s young priced out, housing at {value}.",
    "tabloid":"PRICED OUT! {nation} homes out of reach at {value}!"}$j$),

  ('Energy shortage', 'Energy Availability', 'below', -5, 6, $j${
    "record":"Energy availability in {nation} tightens ({value}).",
    "state":"{nation} secures supply through winter; energy at {value}.",
    "left":"Cold homes as {nation} energy availability falls to {value}.",
    "radleft":"Energy barons profit while {nation} freezes at {value}.",
    "centre":"{nation} energy availability drops to {value}; diversify supply.",
    "right":"{nation} energy at {value} — build capacity, cut dependence.",
    "farright":"{nation} left in the dark, energy at {value}.",
    "tabloid":"LIGHTS OUT! {nation} energy crunch at {value}!"}$j$),

  ('Emissions rising', 'CO₂ Emissions', 'above', 5, 4, $j${
    "record":"{nation} carbon emissions rise (index {value}).",
    "state":"{nation} balances industry and climate; emissions at {value}.",
    "left":"{nation} emissions climb to {value} — a just transition now.",
    "radleft":"Fossil capital wins as {nation} emissions hit {value}.",
    "centre":"{nation} emissions reach {value}; credible targets needed.",
    "right":"{nation} keeps the lights on, emissions at {value}.",
    "farright":"Global climate diktats aside, {nation} emits at {value}.",
    "tabloid":"SMOKESTACK NATION! {nation} emissions at {value}!"}$j$),

  ('Health improving', 'Health', 'above', 5, 4, $j${
    "record":"Health outcomes in {nation} improve to {value}.",
    "state":"{nation}'s health investment pays off, up to {value}.",
    "left":"Public health delivers for {nation} — outcomes at {value}.",
    "radleft":"Gains at {value}, but {nation} care still rations the poor.",
    "centre":"{nation} health rises to {value}; protect the progress.",
    "right":"Choice and reform lift {nation} health to {value}.",
    "farright":"{nation} cares for its own, health up to {value}.",
    "tabloid":"HEALTH BOOST! {nation} wellbeing hits {value}!"}$j$)
) as v(name, subject, direction, value, priority, headlines)
where not exists (select 1 from public.headline_rules hr where hr.name = v.name);
