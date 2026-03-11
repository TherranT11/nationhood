import assert from 'node:assert/strict';
import {
  ENDORSEMENT_SWITCH_WINDOW_ERROR,
  isEndorsementSwitchWindowOpen,
  switchPartyEndorsement
} from '../js/game/config.js';

function createSupabaseWithError(message) {
  return {
    async rpc() {
      return { data: null, error: { message } };
    }
  };
}

async function run() {
  // Boundary checks for tick window logic.
  assert.equal(isEndorsementSwitchWindowOpen(94, 100), true, 'exactly 6 ticks before should be allowed');
  assert.equal(isEndorsementSwitchWindowOpen(93, 100), false, '7 ticks before should be blocked');
  assert.equal(isEndorsementSwitchWindowOpen(100, 100), false, 'election tick should be blocked');
  assert.equal(isEndorsementSwitchWindowOpen(101, 100), false, 'post-election tick should be blocked');

  // Ensure UI-facing error wording is normalized when RPC returns window guard error.
  {
    const result = await switchPartyEndorsement(
      createSupabaseWithError('Endorsements can only be changed in the last 6 ticks before a presidential election.'),
      'f1',
      'f2',
      50
    );
    assert.equal(result.success, false);
    assert.equal(result.error, ENDORSEMENT_SWITCH_WINDOW_ERROR);
  }

  // AP behavior unchanged inside allowed window: success path still returns updated_ap.
  {
    const supabase = {
      async rpc() {
        return {
          data: [{ updated_ap: 9, endorsed_party_id: 'party-b' }],
          error: null
        };
      }
    };

    const result = await switchPartyEndorsement(supabase, 'party-a', 'party-b', 94);
    assert.equal(result.success, true);
    assert.equal(result.newAp, 9);
    assert.equal(result.endorsedPartyId, 'party-b');
  }

  console.log('endorsement window checks passed');
}

run();
