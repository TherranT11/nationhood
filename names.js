// Roman name pools for character creation — one source of truth for the name
// dice on the Join screen. PRAENOMINA are personal (first) names; NOMINA are the
// family names (gentes). A citizen's name reads praenomen + nomen, e.g. the
// praenomen "Marcus" + the nomen "Aurelius" → "Marcus Aurelius".

export const NOMINA = [
  'Acilius', 'Aelius', 'Aemilius', 'Anicius', 'Atilius', 'Aurelius', 'Baebius',
  'Caecilius', 'Calpurnius', 'Carvilius', 'Cassius', 'Claudius', 'Cornelius',
  'Curius', 'Decius', 'Domitius', 'Duilius', 'Fabius', 'Fabricius', 'Fannius',
  'Flaminius', 'Fulvius', 'Furius', 'Genucius', 'Hostilius', 'Iunius', 'Laelius',
  'Licinius', 'Livius', 'Lutatius', 'Mamilius', 'Manlius', 'Marcius', 'Minucius',
  'Mucius', 'Ogulnius', 'Otacilius', 'Papirius', 'Plautius', 'Pomponius',
  'Popillius', 'Porcius', 'Postumius', 'Quinctius', 'Sempronius', 'Servilius',
  'Sulpicius', 'Terentius', 'Valerius', 'Volumnius',
];

export const PRAENOMINA = [
  'Aulus', 'Appius', 'Gaius', 'Gnaeus', 'Decimus', 'Lucius', 'Manius', 'Marcus',
  'Numerius', 'Publius', 'Quintus', 'Servius', 'Sextus', 'Spurius', 'Tiberius',
  'Titus', 'Vibius', 'Agrippa', 'Ancus', 'Cordus', 'Cossus', 'Denter', 'Epius',
  'Gellius', 'Geminus', 'Herius', 'Hostus', 'Kaeso', 'Mamercus', 'Marius',
  'Mesius', 'Minatius', 'Minius', 'Nero', 'Novius', 'Numa', 'Ovius', 'Paccius',
  'Paulus', 'Plautus', 'Postumus', 'Proculus', 'Salvius', 'Sertor', 'Statius',
  'Taurus', 'Trebius', 'Tullus', 'Volero', 'Volusus',
];

// The gens (family) name shown to players is the feminine form of the nomen:
// -ius → -ia (Aurelius → Aurelia). Every nomen above ends in -ius; the fallback
// returns the nomen unchanged for anything that doesn't.
export function gensName(nomen) {
  return nomen ? nomen.replace(/ius$/, 'ia') : '';
}

// Birthplaces — the region a gens hails from. The `key` is stored on the
// character (stable); `name` and `blurb` are display only. Flavour for now,
// but tracked from the start.
export const BIRTHPLACES = [
  { key: 'rome',     name: 'Rome',            blurb: 'The city itself and its immediate territory.' },
  { key: 'latium',   name: 'Latium',          blurb: 'The Latin heartland around Rome — Tusculum, Aricia, Lanuvium, and Antium.' },
  { key: 'etruria',  name: 'Southern Etruria', blurb: 'Roman-held land north of the Tiber — Veii, Caere, Sutrium, and Nepet.' },
  { key: 'campania', name: 'Campania',        blurb: 'The region around Capua, Cumae, Suessula, and the northern Campanian plain.' },
];
