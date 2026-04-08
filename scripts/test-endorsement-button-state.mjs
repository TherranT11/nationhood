import assert from 'node:assert/strict';
import { computeEndorsementButtonState } from '../js/ui/endorsement-ui.js';

function testEnabledState() {
  const result = computeEndorsementButtonState({
    isPresidentialSystem: true,
    currentTick: 100,
    playerSeats: 10,
    scheduledElections: [{ election_type: 'presidential', election_tick: 104 }]
  });

  assert.equal(result.disabled, false, 'expected button to be enabled inside election window');
  assert.equal(result.disabledReason, '', 'enabled button should not have a disabled tooltip reason');
}

function testDisabledStates() {
  const noWindow = computeEndorsementButtonState({
    isPresidentialSystem: true,
    currentTick: 100,
    playerSeats: 10,
    scheduledElections: [{ election_type: 'presidential', election_tick: 120 }]
  });
  assert.equal(noWindow.disabled, true);
  assert.equal(noWindow.disabledReason, 'No presidential election is in the eligible window.');

  const fired = computeEndorsementButtonState({
    isPresidentialSystem: true,
    currentTick: 100,
    playerSeats: 10,
    scheduledElections: [{ election_type: 'presidential', election_tick: 100 }]
  });
  assert.equal(fired.disabled, true);
  assert.equal(fired.disabledReason, 'This election has already fired; endorsement is locked for this cycle.');

  const ineligible = computeEndorsementButtonState({
    isPresidentialSystem: true,
    currentTick: 100,
    playerSeats: 0,
    scheduledElections: [{ election_type: 'presidential', election_tick: 103 }]
  });
  assert.equal(ineligible.disabled, true);
  assert.equal(ineligible.disabledReason, 'Your party is not eligible to endorse in this cycle.');

  // Parliamentary system should hide the button entirely
  const parlSystem = computeEndorsementButtonState({
    isPresidentialSystem: false,
    currentTick: 100,
    playerSeats: 10,
    scheduledElections: [{ election_type: 'presidential', election_tick: 104 }]
  });
  assert.equal(parlSystem.hidden, true, 'parliamentary system should hide endorsement button');
}

testEnabledState();
testDisabledStates();
console.log('endorsement button state checks passed');
