#!/usr/bin/env node
/**
 * One-time migration script: adds window.fn = fn assignments for onclick handlers
 * in ES module inline scripts. Required because <script type="module"> scopes
 * functions away from HTML attribute event handlers (onclick, onchange, etc.).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// Map of filename → list of functions that need window.fn = fn
const windowExports = {
  'world.html': ['joinNation'],
  'createparty.html': ['goBack', 'createParty'],
  'factions.html': ['showSubTab'],
  'bill.html': [
    'castVote', 'sendComment', 'closeAmendmentModal', 'onAmendmentSectorChange',
    'closeTextAmendmentModal', 'submitAmendment', 'submitTextAmendment',
    'signBillAction', 'vetoBillAction', 'enactDecree', 'retractBill',
    'sendToFloor', 'respondToAmendment', 'setCommitteeStance', 'selectAmendmentPolicy'
  ],
  'diplomacy.html': [
    'jumpToAmbNation', 'recallAmbassador', 'cancelPendingAmbassador', 'sendDiploMessage'
  ],
  'events.html': [
    'setScope', 'setNationFilter', 'setCategory', 'showMore', 'togglePost', 'submitComment'
  ],
  'map.html': ['viewNation'],
  'select-candidate.html': ['selectCandidate', 'confirmSelection', 'regenerate'],
  'admin.html': [
    'authenticate', 'logout', 'showTab', 'setTickInterval', 'advanceTickAdmin',
    'onElectionNationSelect', 'runElection', 'previewElection',
    'onScheduleNationSelect', 'scheduleElection', 'filterPlayers',
    'onVoterNationSelect', 'saveAxes', 'resetAxesToSaved',
    'generateDefaultBlocs', 'showAddBlocForm', 'initializeBlocApprovals',
    'loadInspector', 'openInspectorNewTab', 'reloadInspector', 'resizeInspector',
    'loadInspectorFactions', 'resetShard', 'toggleBlocDetail', 'editBloc',
    'deleteVoterBloc', 'toggleIssue', 'saveBlocForm', 'cancelBlocForm'
  ],
  'policyadmin.html': [
    'checkAuth', 'switchView', 'filterPolicies', 'populateLawCategories',
    'onSectorOrLawChange', 'onLawCategorySelect', 'updateCostPreview',
    'addStatEffect', 'addOpposedSlot', 'resetBuilder', 'savePolicy',
    'editPolicy', 'duplicatePolicy', 'deletePolicy', 'toggleStartingNation',
    'removeStatEffect', 'removeOpposedSlot'
  ],
  'crisisadmin.html': [
    'createNewCrisis', 'applyFilters', 'editCrisis', 'cancelEditor',
    'deleteCrisis', 'addTrigger', 'addEffect', 'addEndTrigger', 'saveCrisis',
    'removeTrigger', 'removeEffect', 'removeEndTrigger'
  ],
  'eventadmin.html': [
    'switchMode', 'viewRecentLog', 'createNewEvent', 'applyFilters',
    'editEvent', 'cancelEditor', 'deleteEvent', 'switchEventType',
    'addDescription', 'addTrigger', 'addEffect', 'copyPlaceholder',
    'removeDescription', 'removeTrigger', 'removeEffect',
    'addWeightCondition', 'removeWeightCondition',
    'addMTitle', 'removeMTitle', 'addMBody', 'removeMBody', 'saveEvent',
    'createNewMinistryEvent', 'applyMinistryFilters', 'editMinistryEvent',
    'cancelMinistryEditor', 'deleteMinistryEvent',
    'updateOutcomeEffect', 'removeOutcomeEffect', 'updateOutcome',
    'removeOutcome', 'addOutcomeEffect', 'toggleCivicEvent', 'updateMOpt',
    'addOutcome', 'addMOption', 'removeMOption', 'saveMinistryEvent'
  ],
  'avelia.html': ['goBack', 'continueToPartyCreation'],
  'melizea.html': ['goBack', 'continueToPartyCreation'],
  'sangreza.html': ['goBack', 'continueToPartyCreation'],
};

let filesProcessed = 0;
let errors = [];

for (const [filename, fns] of Object.entries(windowExports)) {
  const filepath = path.join(root, filename);
  if (!fs.existsSync(filepath)) {
    errors.push(`${filename}: file not found`);
    continue;
  }

  let html = fs.readFileSync(filepath, 'utf8');

  // Build the window assignment block
  const assignments = fns.map(fn => `window.${fn} = ${fn};`).join('\n');
  const block = `\n// Expose functions for HTML onclick/onchange handlers\n${assignments}\n`;

  // Find the LAST </script> tag (the closing of the inline module script)
  const lastScriptClose = html.lastIndexOf('</script>');
  if (lastScriptClose === -1) {
    errors.push(`${filename}: no </script> found`);
    continue;
  }

  // Insert the assignments just before the closing </script>
  html = html.slice(0, lastScriptClose) + block + html.slice(lastScriptClose);

  fs.writeFileSync(filepath, html, 'utf8');
  filesProcessed++;
  console.log(`✓ ${filename} (${fns.length} functions)`);
}

console.log(`\nProcessed ${filesProcessed} files`);
if (errors.length) {
  console.log('Errors:');
  errors.forEach(e => console.log(`  ✗ ${e}`));
}
