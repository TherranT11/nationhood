// Shared people vocabulary — one source for the words each people uses for its
// polity and lineage, plus display names, sides, hints, and suggestion pools.
// Used by founding step 2 and the game home so the wording never drifts.

export const PEOPLES = {
  humans: { name:'Human Kingdom', side:'Forces of Good', polity:'Realm of', lineage:'House of',
    labelA:'Your realm', labelB:'Your dynasty',
    hintA:'Your lands, on every map and in every chronicle entry.',
    hintB:'Your bloodline. It outlives your realm and carries into the next age.',
    namesA:['Ordane','Bellhollow','Marrowgate','Vaunt','Highmarch','Errowdale','Cairnwell'],
    namesB:['Verren','Calloway','Marchbank','Dellorne','Ashcombe','Ferrant'] },
  elves: { name:'Elves of the Highborn', side:'Forces of Good', polity:'Court of', lineage:'Line of',
    labelA:'Your court', labelB:'Your line',
    hintA:'Where the Highborn gather. Borders come and go; the court remains.',
    hintB:'Your line. You may still be leading it when the age ends.',
    namesA:['Silmeryn','Aelthwood','Thessalyn','Loriel','Vaeryn','Elenmar'],
    namesB:['Faelan','Nimrothel','Aerendil','Sylwen','Caelor','Thaelin'] },
  dwarves: { name:'Dwarves of Karrowmoor', side:'Forces of Good', polity:'Hold of', lineage:'Kin of',
    labelA:'Your hold', labelB:'Your kin',
    hintA:'The mountain you cut, and the gate that has never been forced.',
    hintB:'Your kin. Every grudge you take is entered under this name.',
    namesA:['Karrowmoor','Grimhalt','Durnvault','Stonereach','Barrowdeep','Ironmarch'],
    namesB:['Bralgun','Thurik','Orsdohr','Halvarn','Dregnir','Kazrun'] },
  orcs: { name:'Orcs of the Ashen Compact', side:'Forces of Evil', polity:'Clan', lineage:'Blood of',
    labelA:'Your clan', labelB:'Your blood',
    hintA:'The clans know each other by name long before they meet in the field.',
    hintB:'Your blood. It is claimed by whoever survives you.',
    namesA:['Gorrash','Skarn','Uzgul','Blackmaw','Redtusk','Vharn'],
    namesB:['Ghorak','Mazug','Throg','Ulgra','Nazruk','Dregka'] },
  undead: { name:'The Quiet Court', side:'Forces of the End Prophecy', polity:'Dominion of', lineage:'Wake of',
    labelA:'Your dominion', labelB:'Your wake',
    hintA:'The ground you hold. It does not need to be living ground.',
    hintB:'What follows you. The Court keeps no bloodline, only a wake.',
    namesA:['Sorrowmere','Ashfen','Greyholt','Mourncairn','Duskharrow','Pallidane'],
    namesB:['Vethis','Morrant','Sableth','Corvane','Nyxram','Hollowen'] },
};

// The nations table stores `side` as a stable key; this maps it to a label.
export const SIDE_LABEL = { good:'Forces of Good', evil:'Forces of Evil', end:'Forces of the End Prophecy' };
