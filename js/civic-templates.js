/**
 * civic-templates.js — All 47 CIVIC event template sets + mapping from
 * event_log trigger keys and campaign_actions types to template keys.
 *
 * Each template set has 5 entries: 1 NEUTRAL, 2 PRO, 2 ANTI.
 * The dispatcher picks 2-3 using no-replacement selection.
 */

// ═══════════════════════════════════════════════════════════
// AGENDA ITEM TITLE MAP — for state visit template variables
// ═══════════════════════════════════════════════════════════

const AGENDA_TITLE_MAP = {
    formal_reception:  'a formal reception ceremony',
    joint_press:       'a joint press conference',
    economic_forum:    'an economic forum',
    university_address:'a university address',
    bilateral_talks:   'private bilateral talks',
    military_review:   'a military review',
    cultural_exchange: 'a cultural exchange programme',
    monument_visit:    'a monument visit',
    treaty_signing:    'a treaty signing ceremony',
};

// ═══════════════════════════════════════════════════════════
// EVENT TAG MAPPING — which tag badge to show per template key
// ═══════════════════════════════════════════════════════════

export const CIVIC_TAG_MAP = {
    parliamentary_election:        'ELECTION',
    presidential_election:         'ELECTION',
    snap_election:                 'ELECTION',
    presidential_endorsement:      'ELECTION',
    coalition_formed:              'COALITION',
    coalition_failed:              'COALITION',
    minority_government:           'COALITION',
    party_kicked_coalition:        'COALITION',
    crisis_start:                  'CRISIS',
    crisis_end:                    'CRISIS',
    regime_health_threshold:       'CRISIS',
    consolidation_begins:          'CRISIS',
    coup_attempted:                'COUP',
    coup_succeeded:                'COUP',
    coup_failed:                   'COUP',
    bill_proposed:                 'BILL',
    bill_passed:                   'BILL',
    bill_failed:                   'BILL',
    bill_amended:                  'BILL',
    filibuster_called:             'BILL',
    minister_appointed:            'CABINET',
    minister_resigned:             'CABINET',
    minister_nomination_rejected:  'CABINET',
    trade_agreement_proposed:      'DIPLOMACY',
    trade_agreement_accepted:      'DIPLOMACY',
    trade_agreement_rejected:      'DIPLOMACY',
    state_visit_proposed:          'DIPLOMACY',
    state_visit_accepted:          'DIPLOMACY',
    state_visit_happened:          'DIPLOMACY',
    state_visit_rejected:          'DIPLOMACY',
    diplomatic_initiative_proposed:'DIPLOMACY',
    diplomatic_initiative_accepted:'DIPLOMACY',
    diplomatic_initiative_rejected:'DIPLOMACY',
    nation_joins_org:              'DIPLOMACY',
    nation_leaves_org:             'DIPLOMACY',
    io_charter_amended:            'DIPLOMACY',
    io_cohesion_collapsed:         'DIPLOMACY',
    faction_influence:             'FACTION',
    faction_action:                'FACTION',
    strongman_power:               'FACTION',
    overreach_threshold:           'FACTION',
    executive_order_issued:        'FACTION',
    executive_order_expired:       'FACTION',
    party_action:                  'PARTY',
    party_founded:                 'PARTY',
    party_dissolved:               'PARTY',
    corporate_contract_signed:     'ECONOMY',
    ministry_enforce_public_order: 'INTERIOR',
    ministry_community_outreach:   'INTERIOR',
    ministry_surveillance_expansion:'INTERIOR',
};

// ═══════════════════════════════════════════════════════════
// ALL 47 TEMPLATE SETS
// ═══════════════════════════════════════════════════════════

export const CIVIC_TEMPLATES = {

    // ── 1. Parliamentary Election ──
    parliamentary_election: [
        { id: 'pe1', text: 'Results confirmed. {party} takes {seats} seats in the chamber. Coalition talks expected within {days} days. #ParliamentaryElection #{nation}Votes' },
        { id: 'pe2', text: 'The people spoke clearly. {party} wins {seats} seats — a mandate for change. Democracy works. #ElectionNight #{nation}Votes' },
        { id: 'pe3', text: '{party} earns a strong result with {seats} seats. A clear signal from the electorate. Now the work begins. #ParliamentaryElection' },
        { id: 'pe4', text: '{seats} seats for {party} and somehow that is being called a mandate. {pct}% of voters chose someone else. #ElectionNight #{nation}Votes' },
        { id: 'pe5', text: 'Another election, another inconclusive result. {party} at {seats} seats means more dealmaking, less governing. #Parliament' },
    ],

    // ── 2. Presidential Election ──
    presidential_election: [
        { id: 'pre1', text: '{candidate} wins the presidency with {pct}% of the vote. Transition begins immediately. #PresidentialElection' },
        { id: 'pre2', text: '{candidate} is the new president. A decisive result. The republic chose well. #PresidentialElection #{nation}' },
        { id: 'pre3', text: '{pct}% is not a squeaker — that is a mandate. Congratulations to {candidate}. #NewPresident #{nation}' },
        { id: 'pre4', text: '{candidate} wins with {pct}%. Nearly half the country voted against this. Let that sink in. #PresidentialElection' },
        { id: 'pre5', text: '{candidate} takes the presidency. The next {years} years are going to be long. #NewPresident #{nation}' },
    ],

    // ── 3. Strongman Takes Power ──
    strongman_power: [
        { id: 'sp1', text: '{faction} has consolidated control of the executive. Official statements pending. Situation developing. #PowerTransfer #Faction' },
        { id: 'sp2', text: '{faction} has restored order where the old government failed. Sometimes strong hands are necessary. #Stability' },
        { id: 'sp3', text: 'The chaos of the last {months} months is over. {faction} steps in. Whatever it takes. #Order #{nation}' },
        { id: 'sp4', text: 'This is not a transition. This is a takeover. {faction} seized power and nobody is stopping them. #DarkTimes' },
        { id: 'sp5', text: '{faction} controls the ministries now. Opposition offices are quiet. Draw your own conclusions. #Autocracy #{nation}' },
    ],

    // ── 4. Coalition Formed ──
    coalition_formed: [
        { id: 'cf1', text: '{party_a} and {party_b} sign a formal coalition agreement. {seats} combined seats. Government formation complete. #Coalition' },
        { id: 'cf2', text: '{days} days of talks and they got it done. {party_a} and {party_b} have a working majority. #Coalition' },
        { id: 'cf3', text: 'The {party_a}\u2013{party_b} coalition framework is published. Solid commitments across the board. This could actually work. #Coalition' },
        { id: 'cf4', text: '{party_a} and {party_b} in the same coalition. One of them is going to regret this. #Coalition' },
        { id: 'cf5', text: 'Read the coalition text. {party_b} gave up almost everything to get {party_a} on board. This is not a partnership. #Coalition' },
    ],

    // ── 5. Coalition Fails to Form ──
    coalition_failed: [
        { id: 'cfl1', text: 'Coalition talks between {party_a} and {party_b} collapse. No agreement after {days} days. Next steps unclear. #NoCoalition' },
        { id: 'cfl2', text: 'Good. A bad coalition is worse than no coalition. Let the voters decide again. #SnapElection #{nation}' },
        { id: 'cfl3', text: '{party} was right to walk away. The terms were unacceptable. #NoCoalition' },
        { id: 'cfl4', text: '{days} days of talks and nothing. These parties cannot govern themselves let alone the country. #Deadlock #{nation}' },
        { id: 'cfl5', text: 'Coalition falls apart over {issue}. The inability to compromise is going to cost everyone. #NoCoalition #Crisis' },
    ],

    // ── 6. Snap Election ──
    snap_election: [
        { id: 'se1', text: 'Snap election called. Polls open in {days} days. Current standings: {party} leads at {pct}%. #SnapElection' },
        { id: 'se2', text: 'Going back to the people is the right call. Let the electorate settle what the politicians could not. #SnapElection' },
        { id: 'se3', text: 'A snap election was always the correct move after {event}. Democracy resets itself. #{nation}Votes' },
        { id: 'se4', text: 'A snap election costs {cost} and solves nothing if the same parties return. Expensive theater. #SnapElection' },
        { id: 'se5', text: '{party} called this snap election to catch the opposition off guard. This is strategy, not democracy. #SnapElection' },
    ],

    // ── 7. Minority Government ──
    minority_government: [
        { id: 'mg1', text: '{party} will govern as a minority with {seats} seats. Confidence and supply talks ongoing. #MinorityGovernment' },
        { id: 'mg2', text: 'Minority government means every vote matters. {party} will have to earn support bill by bill. Good. #MinorityGov' },
        { id: 'mg3', text: '{party} governs without a majority. That is accountability in action. No blank cheques. #MinorityGovernment' },
        { id: 'mg4', text: 'A minority government under {party} is a recipe for paralysis. Nothing is going to get done. #MinorityGov' },
        { id: 'mg5', text: '{party} has {seats} seats and thinks they can run the country. Every week will be a crisis. #MinorityGovernment' },
    ],

    // ── 8. Crisis Starts ──
    crisis_start: [
        { id: 'cs1', text: '{crisis_name} declared. Government convenes emergency session. Situation under active monitoring. #Crisis #CrisisAlert' },
        { id: 'cs2', text: 'The government is responding quickly to {crisis_name}. Emergency session called within hours. #CrisisResponse' },
        { id: 'cs3', text: '{crisis_name} is serious but manageable. Leadership is in the room. #CrisisResponse #{nation}' },
        { id: 'cs4', text: '{crisis_name} did not come out of nowhere. This was predictable and the government did nothing. #Crisis #Negligence' },
        { id: 'cs5', text: 'Emergency session for {crisis_name}. The same people who caused it are now managing it. #Crisis #{nation}' },
    ],

    // ── 9. Crisis Ends ──
    crisis_end: [
        { id: 'ce1', text: '{crisis_name} officially ended. Recovery assessment underway. Full report expected within {days} days. #CrisisOver' },
        { id: 'ce2', text: '{crisis_name} is behind us. Credit to the administration for navigating this. #CrisisOver #{nation}' },
        { id: 'ce3', text: 'The {crisis_name} resolution sets a precedent. When the government acts decisively it works. #Recovery' },
        { id: 'ce4', text: '{crisis_name} is over but the damage is done. {stat} is down {pct}% and nobody is being held accountable. #CrisisOver' },
        { id: 'ce5', text: 'They are calling it resolved. The people who lived through {crisis_name} would disagree. #CrisisEnd #{nation}' },
    ],

    // ── 10. Trade Agreement Proposed ──
    trade_agreement_proposed: [
        { id: 'tp1', text: '{nation_a} tables a trade framework with {nation_b}. Response expected within {days} days. Full text not yet public. #Trade' },
        { id: 'tp2', text: 'A trade agreement between {nation_a} and {nation_b} is long overdue. Good to see this moving. #TradeWatch' },
        { id: 'tp3', text: '{nation_a} proposing terms that heavily favor {nation_a}. {nation_b} should read carefully. #TradeWatch' },
    ],

    // ── 11. Trade Agreement Accepted ──
    trade_agreement_accepted: [
        { id: 'ta1', text: '{nation_a} and {nation_b} formalize trade agreement. Implementation begins next quarter. #TradeAgreement' },
        { id: 'ta2', text: 'This is what economic diplomacy looks like. {nation_a}\u2013{nation_b} deal is a win for both sides. #TradeAgreement' },
        { id: 'ta3', text: '{nation_b} accepted {nation_a}\'s terms with minimal changes. This is not a deal, it is a concession. #TradeAgreement' },
    ],

    // ── 12. Trade Agreement Rejected ──
    trade_agreement_rejected: [
        { id: 'tr1', text: '{nation_b} rejects trade proposal from {nation_a}. No counter-proposal issued. Relations strained. #TradeRejected' },
        { id: 'tr2', text: '{nation_b} was right to reject those terms. Stand firm. #TradeRejected #Diplomacy' },
        { id: 'tr3', text: 'Rejecting the {nation_a} offer leaves {nation_b} isolated. Short-term pride, long-term cost. #Trade' },
    ],

    // ── 13. State Visit Proposed ──
    state_visit_proposed: [
        { id: 'svp1', text: '{nation_a} formally requests a state visit to {nation_b}. Scheduling and agenda under discussion. #StateVisit' },
        { id: 'svp2', text: '{leader} reaching out to {nation_b} directly. This is what proactive diplomacy looks like. #StateVisit' },
        { id: 'svp3', text: '{nation_a} proposing a state visit to {nation_b} right now? The timing is suspicious. #StateVisit' },
        { id: 'svp4', text: 'Breaking: {leader} proposes an official visit to {nation_b}. Diplomatic circles are watching closely. #StateVisit #Diplomacy' },
        { id: 'svp5', text: '{nation_a} extends a formal invitation to visit {nation_b}. A lot riding on whether they say yes. #StateVisit' },
    ],

    // ── 14. State Visit Accepted ──
    state_visit_accepted: [
        { id: 'sva1', text: '{nation_b} confirms acceptance of {nation_a} state visit. Dates to be announced. #StateVisit' },
        { id: 'sva2', text: '{nation_b} welcoming {leader}. This is the right move at the right time. #StateVisit #Diplomacy' },
        { id: 'sva3', text: '{nation_b} accepts. Hope they know what they signed up for. {nation_a} always wants something. #StateVisit' },
        { id: 'sva4', text: 'Official: {leader} will visit {nation_b}. Protocol teams already coordinating the agenda. This is going to be a big one. #StateVisit' },
        { id: 'sva5', text: '{nation_b} rolls out the red carpet for {nation_a}. Bilateral talks, press events, the works. #StateVisit #Diplomacy' },
        { id: 'sva6', text: 'State visit confirmed between {nation_a} and {nation_b}. Markets reacting positively. #StateVisit #Trade' },
        { id: 'sva7', text: '{leader} heading to {nation_b}. The diplomatic calendar just got a lot more interesting. #StateVisit #{nation_b}' },
    ],

    // ── 15. State Visit Happens ──
    state_visit_happened: [
        { id: 'svh1', text: '{leader} concludes state visit to {nation_b}. Joint communiqu\u00e9 released. #StateVisit' },
        { id: 'svh2', text: '{leader}\'s visit to {nation_b} produced concrete results. This is diplomacy working. #StateVisit #Diplomacy' },
        { id: 'svh3', text: 'Joint communiqu\u00e9 from the {nation_a}\u2013{nation_b} summit is {words} words of nothing. #Diplomacy' },
        { id: 'svh4', text: '{leader} wraps up in {nation_b}. Highlights included {agenda_1} and {agenda_2}. Both sides calling it a success. #StateVisit' },
        { id: 'svh5', text: 'The {nation_a}\u2013{nation_b} state visit featured {agenda_1} \u2014 a strong signal to the region. #StateVisit #Diplomacy' },
        { id: 'svh6', text: '{leader} back from {nation_b}. {agenda_1} went well. {agenda_2} was reportedly tense. Details still emerging. #StateVisit' },
        { id: 'svh7', text: 'Three days in {nation_b} and {leader} managed to fit in {agenda_1}, {agenda_2}, and still make the evening news. #StateVisit #{nation_a}' },
    ],

    // ── 16. State Visit Rejected ──
    state_visit_rejected: [
        { id: 'svr1', text: '{nation_b} declines {nation_a} state visit request. No official reason given. #Diplomacy' },
        { id: 'svr2', text: '{nation_b} was right to decline. Some visits do more damage than good. #StateVisit #Diplomacy' },
        { id: 'svr3', text: 'Rejecting a state visit request with no counter-offer is not diplomacy. It is provocation. #Diplomacy' },
        { id: 'svr4', text: '{nation_b} says no to {leader}. Diplomatic channels remain open but the snub is real. #StateVisit #Diplomacy' },
        { id: 'svr5', text: '{nation_a} wanted a state visit. {nation_b} wanted to make a point. Point made. #Diplomacy' },
        { id: 'svr6', text: 'Rejected. {nation_b} sends {nation_a} home before they even arrived. Relations will feel this one. #StateVisit' },
        { id: 'svr7', text: '{leader} will not be visiting {nation_b} after all. The official line is scheduling. Nobody believes that. #Diplomacy' },
    ],

    // ── 17. Diplomatic Initiative Proposed ──
    diplomatic_initiative_proposed: [
        { id: 'dip1', text: '{nation_a} proposes a diplomatic initiative with {nation_b}. Scope limited, signal potentially significant. #Diplomacy' },
        { id: 'dip2', text: 'Small steps matter. {nation_a}\'s outreach to {nation_b} is a good-faith move. #Diplomacy' },
        { id: 'dip3', text: 'A minor diplomatic initiative is what you do when you want credit without commitment. #Diplomacy' },
    ],

    // ── 18. Diplomatic Initiative Accepted ──
    diplomatic_initiative_accepted: [
        { id: 'dia1', text: '{nation_b} accepts diplomatic overture from {nation_a}. Formal contact to begin. #Diplomacy' },
        { id: 'dia2', text: '{nation_b} saying yes is a quiet but meaningful step. Progress is not always loud. #DiplomacyWatch' },
        { id: 'dia3', text: 'Accepted, sure. But watch whether it actually leads anywhere. These gestures usually do not. #Diplomacy' },
    ],

    // ── 19. Diplomatic Initiative Rejected ──
    diplomatic_initiative_rejected: [
        { id: 'dir1', text: '{nation_b} declines {nation_a} diplomatic initiative. Relations remain at current level. #Diplomacy' },
        { id: 'dir2', text: 'Better to say no clearly than enter a process in bad faith. {nation_b} made the honest call. #Diplomacy' },
        { id: 'dir3', text: '{nation_b} rejects even a minor gesture from {nation_a}. At some point you have to ask who wants peace here. #Diplomacy' },
    ],

    // ── 20. Bill Proposed ──
    bill_proposed: [
        { id: 'bp1', text: 'The {bill_name} Act tabled for first reading. Debate scheduled. Full text published. #Legislation #{nation}' },
        { id: 'bp2', text: 'The {bill_name} Act is exactly what {issue} needs. Long overdue. #Legislation #{nation}' },
        { id: 'bp3', text: 'The {bill_name} Act is {pages} pages of {issue} dressed up as reform. Read the fine print. #Legislation' },
    ],

    // ── 21. Bill Passed ──
    bill_passed: [
        { id: 'bpa1', text: 'The {bill_name} Act passes {votes_for} to {votes_against} in #{nation}. Signed into law by the executive. A landmark day for the legislature. #BillPassed #Parliament' },
        { id: 'bpa2', text: '{bill_name} is now the law of the land in #{nation}. Final tally: {votes_for} to {votes_against}. The chamber has spoken and the people will feel this one. #BillPassed' },
        { id: 'bpa3', text: '{votes_for} MPs in #{nation} just voted to make {bill_name} the law of the land. {votes_against} voted against. Remember their names at the next election. #Parliament #BillPassed' },
        { id: 'bpa4', text: 'After heated debate in #{nation}, the {bill_name} Act clears the chamber {votes_for} to {votes_against}. A victory margin of {margin}. The opposition will not forget this. #BillPassed' },
        { id: 'bpa5', text: '{bill_name} passes in #{nation} with {votes_for} ayes and {votes_against} nays. {party_yes} whipped the vote hard and delivered. Credit where it is due. #BillPassed #Parliament' },
        { id: 'bpa6', text: 'Despite fierce opposition from {party_no}, the {bill_name} Act passes {votes_for} to {votes_against} in #{nation}. Their arguments fell short today. #BillPassed' },
        { id: 'bpa7', text: 'Historic vote in #{nation}: {bill_name} is enacted into law. {votes_for} for, {votes_against} against. {party_yes} can claim this as a win for their platform. #BillPassed #Legislation' },
        { id: 'bpa8', text: 'The ayes have it. {bill_name} passes {votes_for}-{votes_against} in #{nation}. {party_no} fought hard but could not block the majority. On to implementation. #BillPassed' },
    ],

    // ── 22. Bill Failed ──
    bill_failed: [
        { id: 'bf1', text: 'The {bill_name} Act fails {votes_against} to {votes_for}. Government takes the defeat under review. #BillFailed' },
        { id: 'bf2', text: 'Defeating {bill_name} was the right call. The chamber did its job. This legislation was not ready. #BillFailed' },
        { id: 'bf3', text: '{bill_name} fails by {margin} votes. That is {margin} MPs who just voted against progress. #BillFailed' },
    ],

    // ── 23. Minister Appointed ──
    minister_appointed: [
        { id: 'ma1', text: '{name} confirmed as Minister of {ministry}. Takes effect immediately. First address scheduled. #Cabinet #{nation}' },
        { id: 'ma2', text: '{name} is a strong appointment to {ministry}. Track record speaks for itself. #Cabinet' },
        { id: 'ma3', text: '{name} as Minister of {ministry}. Interesting choice given their history. #Cabinet' },
    ],

    // ── 24. Minister Resigned or Purged ──
    minister_resigned: [
        { id: 'mr1', text: '{name} has left the post of Minister of {ministry}. No official reason given. Replacement TBD. #Cabinet' },
        { id: 'mr2', text: '{name} stepping down from {ministry} opens the door to real reform there. #Cabinet #{nation}' },
        { id: 'mr3', text: '{name} removed from {ministry}. This is a purge, not a resignation. Who gave the order? #Cabinet #Purge' },
    ],

    // ── 25. Faction Gains Seats ──
    faction_influence: [
        { id: 'fi1', text: 'Seat distribution shift confirmed. {faction} gains {seats} legislative seats via reported influence operations. #Factions' },
        { id: 'fi2', text: '{faction} is playing the long game and winning. Whatever it takes to build a working bloc. #Factions #Power' },
        { id: 'fi3', text: '{faction} bought {seats} legislative seats. This is corruption and everyone knows it. #DarkMoney #Factions' },
    ],

    // ── 26. Party Action ──
    party_action: [
        { id: 'pa1', text: '{party} announces {action}. Full statement published. Response from coalition partners expected. #Politics #{nation}' },
        { id: 'pa2', text: '{party} taking {action} at this moment shows real political courage. #Politics #{nation}' },
        { id: 'pa3', text: '{party} doing {action} right now is nakedly opportunistic. This is about the polls, not the policy. #Politics' },
    ],

    // ── 27. Faction Action ──
    faction_action: [
        { id: 'fa1', text: '{faction} has moved against {target}. Officials cite {reason}. Situation developing. #Factions #{nation}' },
        { id: 'fa2', text: '{faction} acted where others hesitated. {target} had this coming. #Factions #Order' },
        { id: 'fa3', text: '{faction} just went after {target}. The list of independent actors in this country is getting shorter. #Factions #Purge' },
    ],

    // ── 28. Executive Order Issued ──
    executive_order_issued: [
        { id: 'eo1', text: 'Executive Order {number} issued: {description}. Takes effect {date}. Parliamentary review to follow. #ExecutiveOrder' },
        { id: 'eo2', text: 'EO {number} on {issue} was necessary. The legislature was not moving and the situation could not wait. #ExecutiveOrder' },
        { id: 'eo3', text: 'Another executive order bypassing parliament. EO {number} on {issue} should have gone through the chamber. #Overreach' },
    ],

    // ── 29. Executive Order Expired ──
    executive_order_expired: [
        { id: 'eoe1', text: 'Executive Order {number} on {issue} has expired. No renewal announced. Effects under review. #ExecutiveOrder' },
        { id: 'eoe2', text: 'EO {number} served its purpose and was allowed to lapse. Exactly how temporary powers should work. #Governance' },
        { id: 'eoe3', text: 'The order is gone but the changes it made to {issue} are permanent. Expiry is not accountability. #Overreach' },
    ],

    // ── 30. Overreach Threshold ──
    overreach_threshold: [
        { id: 'ot1', text: 'Executive overreach index reaches {threshold}. Institutional review process triggered. #Overreach' },
        { id: 'ot2', text: 'The overreach index hitting {threshold} is a warning, not a crisis. The system is working as intended. #Governance' },
        { id: 'ot3', text: 'Overreach index at {threshold}. How many more orders before someone in the chamber acts? #Overreach #Democracy' },
    ],

    // ── 31. Coup Attempted ──
    coup_attempted: [
        { id: 'ca1', text: 'An attempted seizure of government is underway. Official communications suspended. Situation developing. #CoupAlert' },
        { id: 'ca2', text: 'Those moving against the {government} are doing what the ballot box failed to do. History will judge. #Coup' },
        { id: 'ca3', text: 'Armed factions are moving on the capital. This is not politics. This is violence against democracy. #CoupAlert' },
    ],

    // ── 32. Coup Succeeds ──
    coup_succeeded: [
        { id: 'csu1', text: 'The government has fallen. {faction} controls the executive and key ministries. #CoupSucceeded' },
        { id: 'csu2', text: '{faction} moved fast and the transition is complete. Stability returns under new leadership. #CoupSucceeded' },
        { id: 'csu3', text: 'The government has fallen. This is the end of {years} years of democratic governance. #CoupSucceeded #DarkDay' },
    ],

    // ── 33. Coup Fails ──
    coup_failed: [
        { id: 'cfa1', text: 'Coup attempt defeated. {faction} forces stand down. Government resumes function. Arrests pending. #CoupFailed' },
        { id: 'cfa2', text: 'The republic held. {faction} is contained. Democracy survived today. #CoupFailed #{nation}' },
        { id: 'cfa3', text: 'The coup failed but {faction} still exists, still has resources, and nobody is asking why this happened. #CoupFailed' },
    ],

    // ── 34. Regime Health Threshold ──
    regime_health_threshold: [
        { id: 'rh1', text: 'Regime stability index registers {threshold}. Government continuity under assessment. #RegimeHealth #{nation}' },
        { id: 'rh2', text: 'The {threshold} reading is a warning, not a verdict. There is still time to stabilize. #RegimeHealth' },
        { id: 'rh3', text: 'Regime health at {threshold}. The question is no longer whether this government is in trouble. #RegimeHealth' },
    ],

    // ── 35. The Consolidation Begins ──
    consolidation_begins: [
        { id: 'cb1', text: 'Democratic Backsliding Index reaches critical level. The Consolidation phase has begun. #TheConsolidation' },
        { id: 'cb2', text: 'The Consolidation is a correction, not a collapse. Some things needed to be restructured. #TheConsolidation' },
        { id: 'cb3', text: 'The Consolidation has begun. This is what the end of democracy looks like from the inside. #TheConsolidation' },
    ],

    // ── 36. Bill Amended ──
    bill_amended: [
        { id: 'ba1', text: 'The {bill_name} Act amended in committee. {clause} modified before third reading. Revised text published. #Legislation' },
        { id: 'ba2', text: 'The amendment to {bill_name} actually improves it. Negotiation working as intended. #Parliament #Legislation' },
        { id: 'ba3', text: 'The {bill_name} amendment guts the most important part of the original text. A hollow win. #Legislation' },
    ],

    // ── 37. Filibuster Called ──
    filibuster_called: [
        { id: 'fc1', text: 'Filibuster called on the {bill_name} Act. Floor time consumed. Vote delayed. #Filibuster' },
        { id: 'fc2', text: 'The filibuster on {bill_name} is a legitimate tool. The minority has a right to be heard. #Filibuster #Parliament' },
        { id: 'fc3', text: '{party} filibustering {bill_name} is obstruction dressed as principle. They do not have the votes so they burn the clock. #Filibuster' },
    ],

    // ── 38. Nation Joins IO ──
    nation_joins_org: [
        { id: 'nj1', text: '{nation} formally joins {org_name}. Membership effective {date}. Charter obligations begin immediately. #InternationalOrg' },
        { id: 'nj2', text: '{nation} joining {org_name} is the right call. Stronger together. #InternationalOrg #Diplomacy' },
        { id: 'nj3', text: '{nation} ceding sovereignty to {org_name}. What exactly did we get in return? #InternationalOrg' },
    ],

    // ── 39. Nation Leaves IO ──
    nation_leaves_org: [
        { id: 'nl1', text: '{nation} has exited {org_name}. Consequences for existing agreements under review. #InternationalOrg' },
        { id: 'nl2', text: '{nation} leaving {org_name} was long overdue. The terms were never in our favor. #InternationalOrg' },
        { id: 'nl3', text: 'Expelled, not resigned. {nation} did not leave {org_name} — {org_name} removed them. #InternationalOrg' },
    ],

    // ── 40. IO Charter Amended ──
    io_charter_amended: [
        { id: 'ica1', text: '{org_name} charter amended. {change_description}. Member states have {days} days to ratify. #InternationalOrg' },
        { id: 'ica2', text: 'The {org_name} charter update fixes what was broken. Overdue reform. #InternationalOrg #Diplomacy' },
        { id: 'ica3', text: 'The {org_name} charter amendment shifts power toward {bloc}. Not all members agreed willingly. #InternationalOrg' },
    ],

    // ── 41. IO Cohesion Collapses ──
    io_cohesion_collapsed: [
        { id: 'icc1', text: '{org_name} cohesion index drops to critical levels. Member coordination suspended pending review. #InternationalOrg' },
        { id: 'icc2', text: 'Sometimes institutions need to break before they can be rebuilt properly. {org_name} had structural problems. #InternationalOrg' },
        { id: 'icc3', text: 'The {org_name} collapse leaves {nation} exposed on {issue}. This is going to get expensive. #InternationalOrg' },
    ],

    // ── 42. New Party Founded ──
    party_founded: [
        { id: 'pf1', text: '{party} formally registered as a political party. Platform published. First candidates announced. #NewParty #{nation}' },
        { id: 'pf2', text: '{party} enters the field. Real competition is good for democracy. #NewParty #Politics' },
        { id: 'pf3', text: '{party} is {existing_party} with a new logo. The founders are not fooling anyone. #NewParty' },
    ],

    // ── 43. Party Dissolved ──
    party_dissolved: [
        { id: 'pd1', text: '{party} formally dissolved. {seats} seats redistributed. Members have {days} days to affiliate elsewhere. #PartyDissolved' },
        { id: 'pd2', text: '{party}\'s dissolution was inevitable after {event}. Better a clean end than a slow collapse. #PartyDissolved' },
        { id: 'pd3', text: '{party} dissolved. {seats} seats up for grabs and every faction is already circling. #PartyDissolved' },
    ],

    // ── 44. Party Kicked from Coalition ──
    party_kicked_coalition: [
        { id: 'pk1', text: '{party} removed from the governing coalition. {seats} seats lost. Government majority now at {new_seats}. #Coalition' },
        { id: 'pk2', text: '{party} had to go. The coalition is cleaner without them. Better a smaller majority than a dysfunctional one. #Coalition' },
        { id: 'pk3', text: '{party} out of the coalition means the government is {margin} seats from collapse. #Coalition' },
    ],

    // ── 45. Presidential Endorsement ──
    presidential_endorsement: [
        { id: 'pen1', text: 'President {president} formally endorses {candidate} ahead of {election}. Statement released. #PresidentialEndorsement' },
        { id: 'pen2', text: 'The president endorsing {candidate} is a clear signal. This is the right call for {nation}. #PresidentialEndorsement' },
        { id: 'pen3', text: '{president} puts a thumb on the scale for {candidate}. Voters deserve to decide without this pressure. #PresidentialEndorsement' },
    ],

    // ── 46. Corporate Contract Signed ──
    corporate_contract_signed: [
        { id: 'cc1', text: '{company} and the {ministry} sign a {value} contract covering {sector}. Terms published. #Economy' },
        { id: 'cc2', text: 'The {company} contract brings investment and jobs to {sector}. This is what economic policy should look like. #Economy' },
        { id: 'cc3', text: '{company} wins a {value} contract with almost no competitive bidding. Someone should look at this closely. #Corruption #Economy' },
    ],

    // ── 47. Minister Nomination Rejected ──
    minister_nomination_rejected: [
        { id: 'mnr1', text: '{name}\'s nomination to {ministry} has been rejected by {body}. President must submit a new candidate. #Cabinet #{nation}' },
        { id: 'mnr2', text: '{body} blocking {name} for {ministry} is the confirmation process doing exactly what it is supposed to. #Cabinet' },
        { id: 'mnr3', text: '{body} votes down {name} after a single hearing. This is not vetting, it is a power play. #Cabinet' },
    ],

    // ── 48. Ministry Action: Enforce Public Order ──
    ministry_enforce_public_order: [
        { id: 'epo1', text: '{minister_name} of the {party} has ordered a crackdown on protests across {nation}. The {ministry} has deployed additional law enforcement units to restore public order. #PublicOrder #Interior' },
        { id: 'epo2', text: '{party} government moves to suppress civil unrest. Critics call it heavy-handed. #PublicOrder #{nation}' },
        { id: 'epo3', text: '{minister_name} invokes emergency policing powers. Liberty advocates condemn the move. #PublicOrder #Interior' },
        { id: 'epo4', text: 'The streets needed this. {minister_name} is restoring the order that this government let collapse. #PublicOrder #Support' },
        { id: 'epo5', text: 'Crackdown by the {ministry} is state violence dressed up as policy. This will not be forgotten. #PublicOrder #CivilRights' },
    ],

    // ── 49. Ministry Action: Community Outreach ──
    ministry_community_outreach: [
        { id: 'co1', text: '{ministry} launches new community trust initiative across {nation}. #CommunityOutreach #Interior' },
        { id: 'co2', text: '{minister_name} announces grassroots outreach program funded by the {party} government. #CommunityOutreach' },
        { id: 'co3', text: 'The {party} government is investing in citizen-institution relations, says {minister_name}. #CommunityOutreach #{nation}' },
        { id: 'co4', text: '{ministry} outreach drive begins. Opposition calls it an election stunt. #CommunityOutreach' },
        { id: 'co5', text: 'Community trust programs work. This is the {ministry} doing its job right for once. #CommunityOutreach #Interior' },
    ],

    // ── 50. Ministry Action: Surveillance Expansion ──
    ministry_surveillance_expansion: [
        { id: 'se1', text: '{minister_name} expands national monitoring infrastructure across urban centers. #Surveillance #Interior' },
        { id: 'se2', text: 'The {ministry} has rolled out new surveillance systems in major cities. #Surveillance #{nation}' },
        { id: 'se3', text: '{party} government quietly expands digital monitoring network under {minister_name}. #Surveillance' },
        { id: 'se4', text: 'Civil liberties groups raise alarm as {ministry} deploys new surveillance infrastructure. #Surveillance #CivilRights' },
        { id: 'se5', text: '{nation}\'s surveillance footprint grows under {minister_name}\'s interior directive. Safety or overreach? #Surveillance #Interior' },
    ],
};


// ═══════════════════════════════════════════════════════════
// MAPPING: event_log trigger keys -> CIVIC template keys
// ═══════════════════════════════════════════════════════════

export const CIVIC_EVENT_MAP = {
    // Bill events
    'bill_passed':                       'bill_passed',
    'bill_failed':                       'bill_failed',
    'quorum_failed':                     'bill_failed',
    'major_initiative_ratified':         'bill_passed',
    'major_initiative_ratification_failed': 'bill_failed',

    // Election events
    'parliamentary_election':            'parliamentary_election',
    'election_results':                  'parliamentary_election',
    'general_election':                  'parliamentary_election',
    'presidential_election':             'presidential_election',
    'formation_snap_election':           'snap_election',
    'emergency_minority_government':     'minority_government',

    // Government events
    'pm_appointed':                      'minister_appointed',
    'minister_appointed':                'minister_appointed',
    'minister_resigned':                 'minister_resigned',
    'minister_nomination_rejected':      'minister_nomination_rejected',
    'incumbent_lockin':                  'presidential_election',

    // Trade/diplomatic events
    'trade_agreement_proposed':          'trade_agreement_proposed',
    'trade_agreement_expired':           'trade_agreement_rejected',
    'trade_agreement_accepted':          'trade_agreement_accepted',
    'trade_agreement_rejected':          'trade_agreement_rejected',
    'aid_terminated':                    'trade_agreement_rejected',
    'aid_suspended':                     'crisis_start',
    'aid_resumed':                       'trade_agreement_accepted',
    'state_visit_proposed':              'state_visit_proposed',
    'state_visit_accepted':              'state_visit_accepted',
    'state_visit_happened':              'state_visit_happened',
    'state_visit_rejected':              'state_visit_rejected',
    'diplomatic_initiative_proposed':    'diplomatic_initiative_proposed',
    'diplomatic_initiative_accepted':    'diplomatic_initiative_accepted',
    'diplomatic_initiative_rejected':    'diplomatic_initiative_rejected',

    // Bill events
    'bill_proposed':                     'bill_proposed',
    'bill_amended':                      'bill_amended',
    'filibuster_called':                 'filibuster_called',

    // International organizations
    'nation_joins_org':                  'nation_joins_org',
    'nation_leaves_org':                 'nation_leaves_org',
    'io_charter_amended':                'io_charter_amended',
    'io_cohesion_collapsed':             'io_cohesion_collapsed',

    // Economy
    'corporate_contract_signed':         'corporate_contract_signed',

    // Parties
    'party_founded':                     'party_founded',
    'party_kicked_coalition':            'party_kicked_coalition',
    'presidential_endorsement':          'presidential_endorsement',

    // Executive orders
    'executive_order_issued':            'executive_order_issued',
    'executive_order_expired':           'executive_order_expired',

    // Overreach
    'overreach_threshold':               'overreach_threshold',

    // Crisis events (event_name pattern matching)
    'crisis_started':                    'crisis_start',
    'crisis_resolved':                   'crisis_end',

    // Ministry actions (Interior)
    'ministry_enforce_public_order':     'ministry_enforce_public_order',
    'ministry_community_outreach':       'ministry_community_outreach',
    'ministry_surveillance_expansion':   'ministry_surveillance_expansion',
};


// ═══════════════════════════════════════════════════════════
// MAPPING: campaign_actions action_type -> CIVIC template key
// ═══════════════════════════════════════════════════════════

export const CIVIC_ACTION_MAP = {
    'rally':                             'party_action',
    'outreach':                          'party_action',
    'take_a_stand':                      'party_action',
    'champion_community':                'party_action',
    'build_a_bridge':                    'party_action',
    'double_down':                       'party_action',
    'campaign_mobilize':                 'party_action',
    'campaign_message':                  'party_action',
    'campaign_contrast':                 'party_action',

    'attack':                            'faction_action',
    'purge':                             'faction_action',
    'intimidate':                        'faction_action',
    'faction_intimidate':                'faction_action',

    'buy_influence':                     'faction_influence',
    'faction_buy_influence':             'faction_influence',

    'faction_consolidate_power':         'strongman_power',
    'faction_pledge_allegiance':         'strongman_power',
    'faction_demonstrate_competence':    'strongman_power',

    'coup_success':                      'coup_succeeded',
    'coup_failed':                       'coup_failed',
    'coup_invitation':                   'coup_attempted',
    'coup_plot_reported':                'coup_attempted',

    'party_disbanded':                   'party_dissolved',

    'coalition_accepted':                'coalition_formed',
    'accept_coalition':                  'coalition_formed',
    'coalition_dissolved':               'coalition_failed',
    'dissolve_coalition':                'coalition_failed',

    'regime_health_threshold':           'regime_health_threshold',
    'power_vacuum':                      'consolidation_begins',
    'regime_succession':                 'strongman_power',
};


// ═══════════════════════════════════════════════════════════
// VARIABLE EXTRACTORS — pull template variables from DB rows
// ═══════════════════════════════════════════════════════════

/**
 * Extract template variables from an event_log row.
 * @param {string} templateKey - The CIVIC template key
 * @param {object} row - An event_log row
 * @returns {object} Template variables
 */
export function extractEventVars(templateKey, row) {
    const e = row.effects_applied || {};
    const name = row.event_name || '';
    const desc = row.description_chosen || row.description_used || '';

    switch (templateKey) {
        case 'bill_passed':
        case 'bill_failed': {
            // Try effects_applied first, then strip known prefixes from event_name,
            // then try extracting from description_chosen as last resort.
            let billName = e.bill_name;
            if (!billName) {
                const stripped = name.replace(/^(Bill Passed|Bill Failed|BILL PASSED|BILL FAILED|bill_passed|bill_failed|Enacted|Signed into Law|Defeated|Vetoed)[:\s\-—]*/i, '').trim();
                billName = stripped || null;
            }
            if (!billName && desc) {
                // description_chosen often contains the bill name in quotes or as a leading phrase
                const quoted = desc.match(/"([^"]+)"|'([^']+)'|"(.+?) Act/);
                billName = (quoted && (quoted[1] || quoted[2] || quoted[3])) || null;
            }
            const votesFor = e.votes_for ?? null;
            const votesAgainst = e.votes_against ?? null;
            // Extract vote counts from description if not in effects_applied
            let parsedFor = votesFor, parsedAgainst = votesAgainst;
            if (parsedFor == null && desc) {
                const voteMatch = desc.match(/(\d+)\s*(?:to|-)\s*(\d+)/);
                if (voteMatch) {
                    parsedFor = voteMatch[1];
                    parsedAgainst = voteMatch[2];
                }
            }
            return {
                bill_name: billName || 'Unknown Bill',
                votes_for: parsedFor != null ? String(parsedFor) : '?',
                votes_against: parsedAgainst != null ? String(parsedAgainst) : '?',
                margin: Math.abs((parseInt(parsedFor) || 0) - (parseInt(parsedAgainst) || 0)),
                sponsor: e.sponsor || '',
                party_yes: e.party_yes || e.sponsor || 'the governing coalition',
                party_no: e.party_no || 'the opposition',
            };
        }

        case 'presidential_election':
            return {
                candidate: e.winner || e.candidate || name,
                pct: e.vote_pct || e.pct || '?',
                years: '5',
                rival: e.runner_up || '',
            };

        case 'snap_election':
            return {
                days: e.days || '30',
                party: e.leading_party || e.party || '',
                pct: e.pct || '?',
                event: e.trigger_reason || 'political deadlock',
                cost: e.cost || 'millions',
            };

        case 'minority_government':
            return {
                party: e.party || e.faction_name || '',
                seats: e.seats || '?',
            };

        case 'minister_appointed':
            return {
                name: e.minister_name || e.name || '',
                ministry: e.ministry || '',
            };

        case 'crisis_start':
            return {
                crisis_name: e.crisis_name || name.replace(/^(CRISIS|CRISIS_STARTED|crisis)[:\s\-—]*/i, '').trim() || desc || 'Developing Crisis',
            };

        case 'crisis_end':
            return {
                crisis_name: e.crisis_name || name.replace(/^(CRISIS_RESOLVED|crisis resolved|crisis ended)[:\s\-—]*/i, '').trim() || desc || 'Crisis',
                days: e.duration || '?',
                stat: e.stat || '',
                pct: e.pct || '?',
            };

        case 'trade_agreement_rejected':
        case 'trade_agreement_accepted':
        case 'trade_agreement_proposed':
            return {
                nation_a: e.nation_a || e.nation || '',
                nation_b: e.nation_b || '',
                days: e.days || '?',
            };

        case 'coalition_formed':
            return {
                party_a: e.party_a || '',
                party_b: e.party_b || '',
                seats: e.seats || '?',
                days: e.days || '?',
            };

        case 'coalition_failed':
            return {
                party_a: e.party_a || '',
                party_b: e.party_b || '',
                days: e.days || '?',
                party: e.party || '',
                issue: e.issue || '',
            };

        case 'parliamentary_election':
            return {
                party: e.party || e.winner || e.faction_name || '',
                seats: e.seats || e.seats_won || '?',
                days: e.days || '30',
                pct: e.pct || e.vote_pct || '?',
            };

        case 'minister_resigned':
            return {
                name: e.minister_name || e.name || '',
                ministry: e.ministry || '',
            };

        case 'minister_nomination_rejected':
            return {
                name: e.nominee || e.name || '',
                ministry: e.ministry || '',
                body: e.rejecting_body || 'parliament',
            };

        case 'bill_proposed':
            return {
                bill_name: e.bill_name || name.replace(/^(Bill Proposed|Bill Introduced|bill_proposed)[:\s\-—]*/i, '').trim() || '',
                issue: e.issue || e.policy_area || '',
                pages: e.pages || '?',
            };

        case 'bill_amended':
            return {
                bill_name: e.bill_name || name.replace(/^(Bill Amended|Amendment|bill_amended)[:\s\-—]*/i, '').trim() || '',
                clause: e.clause || e.amendment || 'key provision',
            };

        case 'filibuster_called':
            return {
                bill_name: e.bill_name || name.replace(/^(Filibuster|filibuster_called)[:\s\-—]*/i, '').trim() || '',
                party: e.party || e.faction_name || '',
            };

        case 'state_visit_proposed':
        case 'state_visit_accepted':
        case 'state_visit_rejected':
            return {
                nation_a: e.nation_a || e.host || '',
                nation_b: e.nation_b || e.visitor || '',
                leader: e.leader || e.leader_name || '',
            };

        case 'state_visit_happened': {
            // Pick 1-2 agenda item titles for template mentions
            const agendaKeys = e.agenda || e.computed_effects?.agenda || [];
            const agendaTitles = agendaKeys.map(k => AGENDA_TITLE_MAP[k] || k.replace(/_/g, ' '));
            // Pick first and midpoint to get two distinct items
            const a1 = agendaTitles[0] || 'bilateral talks';
            const a2 = agendaTitles.length > 1 ? agendaTitles[Math.floor(agendaTitles.length / 2)] : 'a formal reception';
            return {
                nation_a: e.nation_a || e.host || '',
                nation_b: e.nation_b || e.visitor || '',
                leader: e.leader || e.leader_name || '',
                words: e.words || '1,200',
                agenda_1: a1,
                agenda_2: a2,
            };
        }

        case 'diplomatic_initiative_proposed':
        case 'diplomatic_initiative_accepted':
        case 'diplomatic_initiative_rejected':
            return {
                nation_a: e.nation_a || e.proposer || '',
                nation_b: e.nation_b || e.target || '',
            };

        case 'nation_joins_org':
        case 'nation_leaves_org':
        case 'io_charter_amended':
        case 'io_cohesion_collapsed':
            return {
                org_name: e.org_name || e.org || e.organization || '',
                nation: e.nation || '',
                date: e.date || 'immediately',
                change_description: e.change_description || e.description || '',
                bloc: e.bloc || '',
                issue: e.issue || '',
            };

        case 'executive_order_issued':
        case 'executive_order_expired':
            return {
                number: e.order_number || e.number || '—',
                description: e.description || e.title || '',
                date: e.effective_date || e.date || 'immediately',
                issue: e.issue || e.policy_area || '',
            };

        case 'party_founded':
            return {
                party: e.party || e.faction_name || '',
                existing_party: e.existing_party || '',
            };

        case 'party_kicked_coalition':
            return {
                party: e.party || e.faction_name || '',
                seats: e.seats || '?',
                new_seats: e.new_seats || e.remaining_seats || '?',
                margin: e.margin || '?',
            };

        case 'presidential_endorsement':
            return {
                president: e.president || e.endorser || '',
                candidate: e.candidate || '',
                election: e.election || 'the upcoming election',
                nation: e.nation || 'the country',
            };

        case 'corporate_contract_signed':
            return {
                company: e.company || e.corp || '',
                ministry: e.ministry || '',
                sector: e.sector || '',
                value: e.value || '?',
            };

        case 'coup_attempted':
            return {
                faction: e.faction || e.faction_name || '',
                government: e.government || 'the government',
            };

        case 'overreach_threshold':
            return {
                threshold: e.threshold || e.index || 'critical',
            };

        default:
            // Pass through all effects_applied as variables
            return { ...e };
    }
}

/**
 * Extract template variables from a campaign_actions row.
 * @param {string} templateKey - The CIVIC template key
 * @param {object} row - A campaign_actions row
 * @returns {object} Template variables
 */
export function extractActionVars(templateKey, row) {
    const r = row.result || {};
    const factionName = row.factions?.faction_name || r.faction_name || 'Unknown';

    switch (templateKey) {
        case 'party_action':
            return {
                party: factionName,
                action: r.headline || row.action_type?.replace(/_/g, ' ') || 'political action',
                issue: r.issue || r.bloc_name || '',
                region: r.region || '',
            };

        case 'faction_action':
            return {
                faction: factionName,
                target: r.targetName || r.target_name || r.target || 'opposition',
                reason: r.headline || r.reason || 'political differences',
            };

        case 'faction_influence':
            return {
                faction: factionName,
                seats: r.seats_gained || r.seats || '?',
            };

        case 'strongman_power':
            return {
                faction: factionName,
                months: r.months || '',
            };

        case 'coup_succeeded':
            return {
                faction: factionName,
                years: '',
                time: '',
            };

        case 'coup_failed':
            return {
                faction: factionName,
            };

        case 'party_dissolved':
            return {
                party: factionName,
                seats: r.seats || '?',
                days: '30',
                event: r.reason || 'internal collapse',
            };

        case 'coalition_formed':
            return {
                party_a: factionName,
                party_b: r.partner_faction || r.partner || '',
                seats: r.seats || '?',
                days: r.days || '?',
            };

        case 'coalition_failed':
            return {
                party_a: factionName,
                party_b: r.partner_faction || r.partner || '',
                days: r.days || '?',
                party: factionName,
                issue: r.issue || '',
            };

        case 'regime_health_threshold':
            return {
                threshold: r.threshold || r.message || 'critical',
            };

        case 'consolidation_begins':
            return {
                faction: factionName,
            };

        case 'coup_attempted':
            return {
                faction: factionName,
            };

        default:
            return {
                party: factionName,
                faction: factionName,
                ...r,
            };
    }
}
