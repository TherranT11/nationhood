// ─── Name pools: gender lookup ──────────────────────────────────────
// Leaf module (no imports) so any surface — topbars, factions.js — can
// derive a character's gender from their first name without pulling the
// heavy political-actions.js graph. Moved out of political-actions.js,
// which now re-exports isFemaleName for its existing importers.
//
// Female first names from both name pools; isFemaleName tests the
// FIRST_NAMES slot only. Danwei has NO entries on purpose — its
// family-first convention stores surnames in the first-name slot, so
// given-name entries here would never match (gendered titles are inert
// for Danwei anyway). To gender Danwei, make isFemaleName nation-aware
// rather than adding entries here.
export const FEMALE_NAMES = new Set([
    // Crucera
    'Camila', 'Valentina', 'Isabela', 'Mariana', 'Catalina', 'Renata',
    // Avelia
    'Luciana', 'Sofía', 'Elena', 'Rosario', 'Carolina', 'Paloma', 'Inés',
    'Marisol', 'Florencia', 'Celeste',
    // Calveth
    'Alma', 'Ida', 'Clara', 'Ella', 'Olivia', 'Freja', 'Sofie', 'Astrid',
    'Maja', 'Agnes',
    // Flandis
    'Anneliese', 'Bregje', 'Clasien', 'Dymphna', 'Elske', 'Fenna', 'Grietje',
    'Hanneke', 'Ilse', 'Jobke', 'Karlijn', 'Lieselotte', 'Maaike', 'Nienke', 'Roos',
    // Vostia
    'Dragana', 'Svetlana', 'Jelena', 'Milica', 'Danica', 'Zora', 'Radmila',
    'Snežana', 'Vesna',
    // Dravka
    'Afërdita', 'Bora', 'Era', 'Luljeta', 'Teuta',
]);

export function isFemaleName(firstName) {
    return FEMALE_NAMES.has(firstName);
}
