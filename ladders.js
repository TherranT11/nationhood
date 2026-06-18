// Qualitative stat ladders — the single source of truth for every nation stat's
// word label, shared by the tutorial and the online nation pages. Index 0 = value
// 1. Prosperity/Welfare/Order/Image run 1–20; Growth runs 1–19 (10 is the flat,
// zero-growth midpoint). The number is the source — the word always follows it.
export const STAT_LADDERS = {
  prosperity: ['Famine and ruin','Crushing poverty','Widespread destitution','Struggling and poor','Barely scraping by','Hard times','Making ends meet','Modest comfort','Steady livelihoods','Comfortable enough','Rising standards','Growing prosperity','Broad affluence','Thriving economy','Widespread wealth','Booming nation','Roaring prosperity','Lavish abundance','Gilded opulence','Boundless riches'],
  welfare: ['Total neglect','The sick abandoned','No safety net','Bare survival','Patchy support','Minimal services','Basic provision','Modest care','Decent services','Reliable support','Solid safety net','Well looked after','Strong public services','Comprehensive care','Generous welfare','Cradle-to-grave care','Flourishing wellbeing','Universal abundance','Every need met','A model to the world'],
  order: ['Total anarchy','Open rebellion','Lawless chaos','Rampant unrest','Crime and disorder','Fragile peace','Shaky stability','Mostly calm','Settled and stable','Law and order','Firm control','A tight grip','Strong authority','Rigid discipline','Heavy enforcement','Iron rule','Watchful state','Surveillance state','Absolute obedience','Total police state'],
  image: ['Global pariah','Despised abroad','Disgraced reputation','Widely distrusted','Poor standing','A forgotten nobody','Quietly overlooked','Mildly regarded','Fair reputation','Respected enough','Well regarded','Rising influence','Admired abroad','Real prestige','Soft-power player','Globally admired','Cultural beacon','World-renowned','A revered power','Icon of the age'],
  growth: ['Massive recession','Deep recession','Severe recession','Sharp recession','Recession','Mild recession','Downturn','Slowdown','Stalling','Stagnant','Stirring','Slow growth','Modest growth','Steady growth','Strong growth','Rapid growth','Booming','Surging','Explosive growth'],
};

export function statLabel(stat, value) {
  const rung = STAT_LADDERS[stat]; if (!rung) return null;
  const i = Math.min(rung.length, Math.max(1, Math.round(value))) - 1; // clamp into range
  return rung[i];
}
