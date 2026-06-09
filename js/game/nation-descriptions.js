/**
 * nation-descriptions.js — one source of truth for the short flavour blurb
 * shown beneath each nation on the origin pickers (select-nation.html for
 * party/entrepreneur, first-steps.html for politician).
 *
 * Each entry is a 1-2 sentence cultural sketch. Keep them flavour-only —
 * stats, gov type, and seat counts are derived from the nations row and
 * rendered separately so they never drift from the database.
 */
export const NATION_DESCRIPTIONS = Object.freeze({
    'Melizea':      'A parliamentary republic with a diverse economy. Analogous to Colombia.',
    'Sangreza':     'A parliamentary democracy with strong traditions. Analogous to Spain.',
    'San Estrella': 'A presidential republic with a growing economy. Analogous to Mexico.',
    'Palvera':      'A presidential nation rich in natural resources. Analogous to Venezuela.',
    'Montequilla':  'A parliamentary republic with a service-driven economy. Analogous to Argentina.',
    'Avelia':       'A parliamentary republic blending Spanish and Italian culture. Analogous to Italy.',
    'Calveth':      'A parliamentary democracy with strong social systems. Analogous to Denmark.',
    'Flandis':      'A parliamentary democracy with a trade-focused economy. Analogous to the Netherlands.',
    'Vostia':       'A parliamentary nation with a complex political landscape. Analogous to Serbia.',
    'Sierramar':    'A small Caribbean island democracy with a young, religious population. Analogous to Puerto Rico.',
    'Hajjara':      'A vast desert monarchy ruled by an absolute king, rich in oil and gas with deep Islamic traditions. Analogous to Iran.',
    'Dravka':       'Dravka is analogous culturally to Albania.',
    'Danwei':       'This island nation in Faresia is analogous to real world Taiwan.',
});
