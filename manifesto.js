// The Manifesto catalog — static game content (like archetypes.js / ladders.js).
// A party spends Conviction to adopt permanent "planks". Only three archetypes
// have trees written so far (Communist, Nationalist, Centrist); every other
// archetype maps to null and shows a "coming soon" state on the Party page.
//
// Nothing here touches the database — these are design constants. The effects a
// plank lists reference systems that don't exist yet (whip rolls, crises,
// scandals, confidence…), so adoption is display-only until the turn system and
// those systems are built. Conviction accrual and "years in power" likewise wait
// on the political calendar.

// Years-in-power gate for each tier. Level I is available from founding.
export const GATES = { 1: 0, 2: 4, 3: 9, 4: 14, 5: 20 };
export const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];

// archetype NAME (parties.archetype) → manifesto tree key, or null if unwritten.
const ARCHETYPE_TREE = {
  Communist: 'communist',
  Nationalist: 'nationalist',
  Centrist: 'centrist'
};
export function treeForArchetype(name) { return ARCHETYPE_TREE[name] || null; }

export const PLANKS = {
  communist: {
    1: [
      { name: 'Vanguard Discipline', cost: 2, cat: 'Whipping Votes',   val: '+1 to whip rolls',          desc: 'The party votes as one bloc — dissent is not tolerated.' },
      { name: 'Mass Organisers',     cost: 2, cat: 'Popularity Floor', val: 'Floor +2',                  desc: 'Grassroots cells build a base that never abandons you.' },
      { name: 'Cadre Schooling',     cost: 1, cat: 'Experience',       val: 'Politicians +1 Exp / tick', desc: 'Ideological academies train your politicians faster.' },
      { name: 'Union War Chest',     cost: 3, cat: 'Party Funds',      val: '+₣2B / year',               desc: 'Union dues and collective contributions fill the coffers.' },
      { name: 'Close Ranks',         cost: 2, cat: 'Scandals',         val: 'Scandal hit −50%',          desc: 'When one of yours is caught, the party closes ranks.' }
    ],
    2: [
      { name: 'Democratic Centralism',  cost: 4, cat: 'Whipping Votes',  val: '+2 to whip rolls', sub: 'A failed whip no longer costs trust.', up: 'Vanguard Discipline', desc: 'Once the party decides, every member is absolutely bound.' },
      { name: "People's Movement",      cost: 4, cat: 'Popularity Floor', val: 'Floor +4', sub: "Your floor can't be breached by Attacks.", up: 'Mass Organisers', desc: 'A mass base so deep no rival can pry it loose.' },
      { name: 'Re-education Corps',     cost: 3, cat: 'Experience',       val: '+2 Exp / tick', sub: 'New recruits start with +1 stat point.', up: 'Cadre Schooling', desc: 'The party schools its cadres — and its newest faces arrive sharper.' },
      { name: 'Nationalised Industry', cost: 5, cat: 'Party Funds',      val: '+₣4B / year', sub: 'Scales with the nation’s Order.', up: 'Union War Chest', desc: 'The commanding heights of the economy answer to the party.' },
      { name: 'The Party Is Always Right', cost: 4, cat: 'Scandals',     val: 'Bury 1 scandal / year', sub: 'A scandal can be suppressed entirely.', up: 'Close Ranks', down: 'Image −1', desc: 'Inconvenient truths simply do not reach the front page.' }
    ],
    3: [
      { name: 'One-Party Resolve', cost: 6, cat: 'Whipping Votes',   val: 'Bloc votes always hold', sub: 'Defectors are expelled from the party.', up: 'Democratic Centralism', down: 'Image −1', desc: 'There is one line, and every member walks it.' },
      { name: "The Worker's State", cost: 6, cat: 'Popularity Floor', val: 'Floor +6', sub: 'Your floor rises on its own each year.', up: "People's Movement", desc: 'The workers come to see the party as their own.' },
      { name: 'The New Man',       cost: 6, cat: 'Experience',       val: 'Recruits arrive at full strength', sub: 'Politicians gain +3 Experience / tick.', up: 'Re-education Corps', desc: 'A whole generation raised by the party.' },
      { name: 'Command Economy',   cost: 7, cat: 'Party Funds',      val: '+₣8B / year', sub: 'Funds are immune to recessions.', up: 'Nationalised Industry', down: 'Growth −1', desc: 'Every factory and field is the party’s to direct.' },
      { name: 'The Censor',        cost: 7, cat: 'Scandals',         val: 'No scandal ever lands', sub: 'The press prints what it is told.', up: 'The Party Is Always Right', down: 'Image −2', desc: 'What the people don’t read can’t hurt you.' }
    ],
    4: [
      { name: 'Dictatorship of the Proletariat', cost: 11, cat: 'Govt Confidence',     val: 'Government cannot fall', sub: 'No-confidence votes are abolished.', up: 'One-Party Resolve', down: 'Legitimacy − · Regime ▸ Closed', desc: 'Power seized in the name of the people — and kept.' },
      { name: 'Total Mobilisation',              cost: 10, cat: 'Popularity Floor',    val: 'Floor +8', sub: 'Crises raise your floor instead of lowering it.', up: "The Worker's State", desc: 'Hardship only deepens the people’s loyalty.' },
      { name: 'Five-Year Plan',                  cost: 11, cat: 'Crisis Ticks',        val: 'Economic crises resolve 2× faster', sub: 'The whole nation bends to one plan.', up: 'Command Economy', down: 'Growth −2', desc: 'Production targets met, whatever the cost.' },
      { name: 'The Purge',                       cost: 10, cat: 'Archetype Penalties', val: 'Remove any politician, free', sub: 'Cabinet contradictions never penalise you.', up: 'The Censor', down: 'Image −2 · Order −1', desc: 'The party is cleansed of those who falter.' }
    ],
    5: [
      { name: 'The Vanguard Party',     cost: 17, cat: 'Govt Confidence',  val: 'The party IS the state', sub: 'Elections suspended; your term never ends.', up: 'Dictatorship of the Proletariat', down: 'Regime ▸ Totalitarian · Image −3', desc: 'History has chosen the party to lead forever.' },
      { name: 'Permanent Revolution',   cost: 15, cat: 'Popularity Floor', val: 'Floor rises to meet your Ceiling', sub: 'Support locked at its maximum.', up: 'Total Mobilisation', desc: 'The struggle never ends — and neither does your majority.' },
      { name: 'Withering of the State', cost: 16, cat: 'Party Funds',      val: 'Limitless party funds', sub: 'The party owns all there is to own.', up: 'Five-Year Plan', down: 'Growth −3', desc: 'When the party is everything, money is no object.' }
    ]
  },
  nationalist: {
    1: [
      { name: 'Cult of Personality', cost: 3, cat: 'Govt Confidence',    val: 'Confidence +3%',             desc: 'The nation rallies behind one strong, unmistakable leader.' },
      { name: 'Iron Order',          cost: 2, cat: 'Crisis Ticks',       val: 'Unrest grows 1 tick slower', desc: 'A heavy hand keeps unrest from spreading.' },
      { name: "Strongman's Reach",   cost: 2, cat: 'Popularity Ceiling', val: 'Ceiling +2',                 desc: "The leader's aura carries the party beyond its base." },
      { name: 'Loyalty Oaths',       cost: 1, cat: 'Whipping Votes',     val: '+1 to whip rolls',           desc: 'Members swear fealty — they fall in line on every vote.' },
      { name: 'Glory & Service',     cost: 2, cat: 'Age of Politicians', val: 'Veterans retire 5 yrs later', desc: 'Old servants of the nation stay at their posts longer.' }
    ],
    2: [
      { name: 'Apparatus of the State', cost: 5, cat: 'Govt Confidence',     val: 'Confidence +6%', sub: 'A fallen government triggers a snap election in your favour.', up: 'Cult of Personality', down: 'Legitimacy −', desc: 'The state and the party become difficult to tell apart.' },
      { name: 'Martial Law Powers',     cost: 4, cat: 'Crisis Ticks',        val: 'Unrest grows 2 ticks slower', sub: 'Freeze one crisis per term.', up: 'Iron Order', down: 'Image −1', desc: 'When the streets stir, the leader may simply still them.' },
      { name: 'National Myth',          cost: 4, cat: 'Popularity Ceiling',  val: 'Ceiling +4', sub: 'Each autocratic regime step raises it further.', up: "Strongman's Reach", desc: 'A story of destiny the people are eager to believe.' },
      { name: 'Sworn Brotherhood',      cost: 3, cat: 'Archetype Penalties', val: 'No contradiction penalty', sub: 'While the leader stays popular.', up: 'Loyalty Oaths', desc: 'Rivals in cabinet still answer to one man.' },
      { name: 'The Old Guard',          cost: 4, cat: 'Age of Politicians',  val: 'Veterans never retire from age', sub: 'A death promotes a hand-picked successor.', up: 'Glory & Service', down: 'Image −1', desc: 'The faithful serve until death — and choose who follows.' }
    ],
    3: [
      { name: 'One Nation, One Leader', cost: 6, cat: 'Govt Confidence',    val: 'Confidence +10%', sub: 'Every crisis rallies the people to the leader.', up: 'Apparatus of the State', down: 'Legitimacy −', desc: 'The leader and the nation are spoken of as one.' },
      { name: 'State of Emergency',     cost: 7, cat: 'Crisis Ticks',       val: 'Freeze every crisis for a term', sub: 'Emergency powers, indefinitely renewed.', up: 'Martial Law Powers', down: 'Image −2', desc: 'The emergency justifies whatever must be done.' },
      { name: 'The Greater Nation',     cost: 6, cat: 'Popularity Ceiling', val: 'Ceiling +6', sub: 'The ceiling ignores the regime cap.', up: 'National Myth', desc: 'A nation destined for greatness, and told so daily.' },
      { name: 'Secret Police',          cost: 7, cat: 'Scandals',           val: "Rivals' scandals surface on command", sub: 'Your own are never found.', up: 'Sworn Brotherhood', down: 'Image −2 · Order +1', desc: 'The state knows everything, and forgets nothing.' },
      { name: 'The Eternal Guard',      cost: 6, cat: 'Age of Politicians', val: 'Loyalists never age out', sub: 'Their stats never decay.', up: 'The Old Guard', desc: 'The faithful serve the nation until the very end.' }
    ],
    4: [
      { name: 'Supreme Command',    cost: 11, cat: 'Whipping Votes', val: "The leader's word is law", sub: 'No vote in the chamber can be lost.', up: 'One Nation, One Leader', down: 'Legitimacy − · Regime ▸ Closed', desc: 'Debate ends where the leader’s will begins.' },
      { name: 'Martial State',      cost: 10, cat: 'Crisis Ticks',   val: 'Crises cannot grow', sub: 'Order rises across the nation.', up: 'State of Emergency', down: 'Image −2', desc: 'Boots on every corner; calm by force.' },
      { name: 'Manifest Destiny',   cost: 11, cat: 'Party Funds',    val: 'Expansion funds the state', sub: 'The nation’s reach turns to gold.', up: 'The Greater Nation', down: 'Image −1', desc: 'What the nation takes, it keeps.' },
      { name: 'Total Surveillance', cost: 10, cat: 'Scandals',       val: 'Opponents suffer a scandal each year', sub: 'Dissent is found before it forms.', up: 'Secret Police', down: 'Image −2', desc: 'Every whisper reaches the leader’s ear.' }
    ],
    5: [
      { name: 'The Strongman',   cost: 17, cat: 'Govt Confidence', val: 'Rule by decree', sub: 'Democracy is suspended in the nation’s name.', up: 'Supreme Command', down: 'Regime ▸ Authoritarian · Image −3', desc: 'One hand on the wheel, and it does not let go.' },
      { name: 'Fortress Nation', cost: 15, cat: 'Crisis Ticks',    val: 'Immune to internal crises', sub: 'Nothing within can shake the state.', up: 'Martial State', down: 'Image −2', desc: 'Walls within and without; the nation cannot be moved.' },
      { name: 'Empire',          cost: 18, cat: 'Party Funds',     val: 'Limitless reach and revenue', sub: 'Borders and coffers that never stop growing.', up: 'Manifest Destiny', down: 'Image −3', desc: 'A flag over every horizon.' }
    ]
  },
  centrist: {
    1: [
      { name: 'Big Tent',           cost: 2, cat: 'Popularity Ceiling',  val: 'Ceiling +2',                desc: 'A broad, moderate appeal that reaches across the spectrum.' },
      { name: 'Consensus Builders', cost: 2, cat: 'Archetype Penalties', val: 'Contradiction −4% → −2%',   desc: 'You can seat rivals in cabinet with half the friction.' },
      { name: 'Steady Governance',  cost: 2, cat: 'Govt Confidence',     val: 'Confidence +2%',            desc: 'Competent, unremarkable management reassures the chamber.' },
      { name: 'Clean Hands',        cost: 1, cat: 'Scandals',            val: 'Scandal chance −25%',       desc: 'A buttoned-up party gives the press little to print.' },
      { name: 'Technocrats',        cost: 3, cat: 'Politician Modifiers', val: 'Minister actions +1 effect', desc: 'Expert ministers make their actions land harder.' }
    ],
    2: [
      { name: 'Grand Coalition',           cost: 4, cat: 'Popularity Ceiling',  val: 'Ceiling +4', sub: 'Extra support from parties you govern with.', up: 'Big Tent', desc: 'A government broad enough to absorb its own opposition.' },
      { name: 'Government of All Talents', cost: 4, cat: 'Archetype Penalties', val: 'No penalty, any pairing', sub: 'Seat anyone, anywhere.', up: 'Consensus Builders', desc: 'Competence outranks ideology at every desk.' },
      { name: 'Institutional Trust',       cost: 5, cat: 'Govt Confidence',     val: 'Confidence +4%', sub: 'Crises cost half the usual confidence.', up: 'Steady Governance', desc: 'The machinery of state is trusted to simply work.' },
      { name: 'Above Reproach',            cost: 3, cat: 'Scandals',            val: 'Scandal chance −50%', sub: "Turn an opponent's scandal to your gain.", up: 'Clean Hands', desc: 'Spotless enough to weaponise others’ stains.' },
      { name: 'The Expert Class',          cost: 5, cat: 'Politician Modifiers', val: 'Minister actions +2 effect', sub: 'Bonus to crisis-resolution rolls.', up: 'Technocrats', desc: 'Ministers chosen for mastery, not loyalty.' }
    ],
    3: [
      { name: 'Centre Ground',           cost: 6, cat: 'Popularity Ceiling',  val: 'Ceiling +6', sub: 'You absorb the moderate voters of every rival.', up: 'Grand Coalition', desc: "Everyone's reasonable second choice." },
      { name: 'The Permanent Coalition', cost: 6, cat: 'Archetype Penalties', val: 'Coalitions never break', sub: 'Partners cannot defect from your government.', up: 'Government of All Talents', desc: 'A government too sensible to collapse.' },
      { name: 'Trusted Institutions',    cost: 6, cat: 'Govt Confidence',     val: 'Confidence never below 40%', sub: 'The institutions hold even when you don’t.', up: 'Institutional Trust', desc: 'People trust the office, not just the officeholder.' },
      { name: 'Spotless Record',         cost: 7, cat: 'Scandals',            val: 'Immune to scandal', sub: 'There is simply nothing to find.', up: 'Above Reproach', desc: 'Dull, clean, and entirely unimpeachable.' },
      { name: 'The Civil Service',       cost: 7, cat: 'Politician Modifiers', val: 'Ministers act as if +2 stats', sub: 'Their experience is banked, never lost.', up: 'The Expert Class', desc: 'A permanent corps of experts behind every minister.' }
    ],
    4: [
      { name: 'The Establishment',         cost: 10, cat: 'Party Funds',       val: 'Donor class funds you indefinitely', sub: 'Business prefers a steady hand.', up: 'Centre Ground', desc: 'The money always knows where stability lies.' },
      { name: 'National Unity Government', cost: 11, cat: 'Govt Confidence',   val: 'All parties join your government', sub: 'There is no opposition left to speak of.', up: 'The Permanent Coalition', down: 'Legitimacy −', desc: 'Everyone is invited — and so no one objects.' },
      { name: 'The Stable State',          cost: 10, cat: 'Crisis Ticks',      val: 'Crises resolve quietly, halved', sub: 'Problems are managed before they’re noticed.', up: 'Trusted Institutions', desc: 'Nothing dramatic ever seems to happen here.' },
      { name: 'Mandarin Class',            cost: 10, cat: 'Age of Politicians', val: 'Technocrats serve for life', sub: 'No aging penalty for your ministers.', up: 'The Civil Service', desc: 'The experts outlast every government.' }
    ],
    5: [
      { name: 'The Third Way',   cost: 15, cat: 'Popularity Ceiling',  val: 'The party becomes the consensus', sub: 'Your ceiling rises to the whole electorate.', up: 'The Establishment', desc: 'Not left, not right — simply the way things are.' },
      { name: 'The Deep State',  cost: 16, cat: 'Govt Confidence',     val: 'You cannot fall', sub: 'The system governs whoever wins.', up: 'National Unity Government', down: 'Legitimacy −', desc: 'Governments come and go; the machine remains.' },
      { name: 'End of Politics', cost: 15, cat: 'Politician Modifiers', val: 'Governance becomes pure administration', sub: 'Every action your ministers take is optimal.', up: 'The Stable State', desc: 'When everything works, there is nothing left to argue about.' }
    ]
  }
};
