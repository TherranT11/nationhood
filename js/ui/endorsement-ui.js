const ENDORSEMENT_WINDOW_TICKS = 6;

export function computeEndorsementButtonState({
    isPresidentialSystem = false,
    scheduledElections = [],
    currentTick = 0,
    playerSeats = 0
} = {}) {
    const nextPresidentialElection = (scheduledElections || [])
        .filter(e => e && e.election_type === 'presidential' && Number.isFinite(Number(e.election_tick)))
        .sort((a, b) => Number(a.election_tick) - Number(b.election_tick))[0] || null;

    let disabledReason = '';
    let ticksUntilElection = null;
    let ticksUntilWindow = null;
    let hidden = false;

    if (!isPresidentialSystem) {
        hidden = true;
        disabledReason = 'No presidential election is in the eligible window.';
    } else if (!nextPresidentialElection) {
        disabledReason = 'No presidential election is in the eligible window.';
    } else {
        ticksUntilElection = Number(nextPresidentialElection.election_tick) - Number(currentTick);
        if (ticksUntilElection <= 0) {
            disabledReason = 'This election has already fired; endorsement is locked for this cycle.';
            ticksUntilElection = null;
        } else if (ticksUntilElection > ENDORSEMENT_WINDOW_TICKS) {
            ticksUntilWindow = ticksUntilElection - ENDORSEMENT_WINDOW_TICKS;
            disabledReason = 'No presidential election is in the eligible window.';
        } else if (Number(playerSeats) <= 0) {
            disabledReason = 'Your party is not eligible to endorse in this cycle.';
        }
    }

    return {
        disabled: Boolean(disabledReason),
        disabledReason,
        ticksUntilElection,
        ticksUntilWindow,
        hidden
    };
}
