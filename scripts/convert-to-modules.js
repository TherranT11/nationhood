#!/usr/bin/env node
/**
 * One-time migration script: converts HTML files from global script tags to ES modules.
 * Removes CDN/preconnect tags, removes old <script src="js/...">, adds type="module" + imports.
 */
const fs = require('fs');
const path = require('path');

// Import maps per file
const imports = {
  // GROUP A: standard game pages (CDN + supabase-client + common + game-common)
  'world.html': [
    `import { _supabase } from './js/supabase-client.js';`,
    `import { initPage, formatNumber } from './js/common.js';`,
    `import { isGovernmentAutocracy, isGovernmentPresidential, getCanonicalGovernmentType, loadSeats, CANONICAL_GOVERNMENT_TYPES, GAME_CONFIG } from './js/game-common.js';`,
  ],
  'nation.html': [
    `import { _supabase } from './js/supabase-client.js';`,
    `import { initPage, qCache, qCacheSet, formatNumber, scaleRawToDollars } from './js/common.js';`,
    `import { CANONICAL_GOVERNMENT_TYPES, isGovernmentAutocracy, isGovernmentPresidential, getCanonicalGovernmentType, INVERTED_STATS, STATS_HIGHER_IS_BETTER, STATS_LOWER_IS_BETTER } from './js/game-common.js';`,
  ],
  'government.html': [
    `import { _supabase } from './js/supabase-client.js';`,
    `import { initPage } from './js/common.js';`,
    `import { GAME_CONFIG, initGameConfigForNation, isGovernmentAutocracy, isGovernmentPresidential, loadSeats, detectHeadFaction, fetchActiveCoalition, generatePMCandidates, deductAP } from './js/game-common.js';`,
  ],
  'elections.html': [
    `import { _supabase } from './js/supabase-client.js';`,
    `import { initPage, formatNumber } from './js/common.js';`,
    `import { GAME_CONFIG, initGameConfigForNation, isGovernmentAutocracy, isGovernmentPresidential, loadSeats, fetchActiveCoalition, runElectionPreview, getPartyAlignment, distributeVotes, allocateSeatsByVotes } from './js/game-common.js';`,
  ],
  'laws.html': [
    `import { _supabase } from './js/supabase-client.js';`,
    `import { initPage, qCache, qCacheSet, qCacheBust } from './js/common.js';`,
    `import { GAME_CONFIG, initGameConfigForNation, isGovernmentAutocracy, isGovernmentPresidential, loadSeats, detectHeadFaction, fetchActiveCoalition, getCompatiblePolicies, loadFactionIdeology, IDEOLOGY_TO_AXIS, resolveExpiredVotes, deductAP, calculateBillSupport, enactBill, failBill, syncVoteTallies, enactFoundationalBill } from './js/game-common.js';`,
  ],
  'bill.html': [
    `import { _supabase } from './js/supabase-client.js';`,
    `import { initPage, qCache, qCacheSet } from './js/common.js';`,
    `import { GAME_CONFIG, initGameConfigForNation, isGovernmentAutocracy, isGovernmentPresidential, loadSeats, detectHeadFaction, fetchActiveCoalition, getCompatiblePolicies, loadFactionIdeology, IDEOLOGY_TO_AXIS, deductAP, calculateBillSupport, POLICY_STANCES } from './js/game-common.js';`,
  ],
  'diplomacy.html': [
    `import { _supabase } from './js/supabase-client.js';`,
    `import { initPage, formatNumber } from './js/common.js';`,
    `import { isGovernmentAutocracy, fetchActiveCoalition, detectHeadFaction, DIPLOMACY_CONFIG, PROPOSAL_TYPES, WAR_JUSTIFICATIONS, deductAP, loadSeats, GAME_CONFIG } from './js/game-common.js';`,
  ],
  'events.html': [
    `import { _supabase } from './js/supabase-client.js';`,
    `import { initPage } from './js/common.js';`,
    `import { initGameConfigForNation } from './js/game-common.js';`,
  ],
  'factions.html': [
    `import { _supabase } from './js/supabase-client.js';`,
    `import { initPage } from './js/common.js';`,
  ],
  'map.html': [
    `import { _supabase } from './js/supabase-client.js';`,
    `import { initPage, loadGameState, updateTopBarInfo } from './js/common.js';`,
    `import { initGameConfigForNation } from './js/game-common.js';`,
  ],
  'economy.html': [
    `import { initPage } from './js/common.js';`,
  ],
  'conflict.html': [
    `import { initPage } from './js/common.js';`,
  ],
  'select-candidate.html': [
    `import { _supabase } from './js/supabase-client.js';`,
    `import { initPage, getAdminNationOverride, getAdminFactionOverride } from './js/common.js';`,
    `import { getIdeologyClass, escapeHtml } from './js/utils.js';`,
    `import { initGameConfigForNation, generatePMCandidates, selectPMCandidate, selectPresidentCandidate, isPresidentialRepublic, isGovernmentAutocracy, fetchActiveCoalition, loadSeats, syncVoteTallies, deductAP, adjustMomentumAll, GAME_CONFIG } from './js/game-common.js';`,
  ],

  // GROUP B: CDN + supabase-client + game-common (no common.js)
  'eventadmin.html': [
    `import { _supabase } from './js/supabase-client.js';`,
    `import { GAME_CONFIG, MAJOR_SECTORS, NATION_STAT_COLUMNS, formatStatName, normalizeNationStatKey } from './js/game-common.js';`,
  ],
  'crisisadmin.html': [
    `import { _supabase } from './js/supabase-client.js';`,
    `import { NATION_STAT_COLUMNS, formatStatName } from './js/game-common.js';`,
  ],

  // GROUP C: CDN + game-common only
  'admin.html': [
    `import { createClient } from '@supabase/supabase-js';`,
    `import { GAME_CONFIG, processElections, processEvents, processCrises, processLoyaltyTick, processStatEffects, processMinistryActions, processOngoingCosts, snapshotNationHistory, applyGdpGrowth, processGovernmentVacancy, processIdeologyShifts, resolveExpiredVotes, resolveNoConfidence, processRevolution, autoResolveStaleShakeups, processPresidentDesk, processPresidentialTermEnd, processPresidentCandidateTimeout, processParliamentaryPMTimeout, triggerPresidentialCandidateSelection, autoSelectPresidentialCandidates, processPMTraitEffects, calculateNationalBudget, initGameConfigForNation, FORMATION_DEADLINE_TICKS, CANONICAL_GOVERNMENT_TYPES } from './js/game-common.js';`,
  ],

  // GROUP D: CDN + inline client (auth pages)
  'login.html': [
    `import { createClient } from '@supabase/supabase-js';`,
  ],
  'signup.html': [
    `import { createClient } from '@supabase/supabase-js';`,
  ],
  'forgot-password.html': [
    `import { createClient } from '@supabase/supabase-js';`,
  ],
  'reset-password.html': [
    `import { createClient } from '@supabase/supabase-js';`,
  ],
  'index.html': [
    `import { createClient } from '@supabase/supabase-js';`,
  ],

  // GROUP E/F: nation pages with inline client
  'createparty.html': [
    `import { _supabase } from './js/supabase-client.js';`,
  ],
  'sangreza.html': [
    `import { createClient } from '@supabase/supabase-js';`,
  ],
  'melizea.html': [
    `import { createClient } from '@supabase/supabase-js';`,
  ],
  'avelia.html': [
    `import { createClient } from '@supabase/supabase-js';`,
  ],

  // GROUP G: policyadmin
  'policyadmin.html': [
    `import { _supabase } from './js/supabase-client.js';`,
  ],

  // Legacy
  'dashboard-old.html': [
    `import { createClient } from '@supabase/supabase-js';`,
  ],
};

const root = path.resolve(__dirname, '..');

// Lines to remove (matched by substring)
const REMOVE_PATTERNS = [
  'cdn.jsdelivr.net/npm/@supabase/supabase-js',
  '<link rel="preconnect" href="https://cdn.jsdelivr.net"',
  '<link rel="preconnect" href="https://pbumjalxclmegzckhqqr.supabase.co"',
  '<script src="js/supabase-client.js"',
  '<script src="js/common.js"',
  '<script src="js/game-common.js"',
];

let filesProcessed = 0;
let errors = [];

for (const [filename, importLines] of Object.entries(imports)) {
  const filepath = path.join(root, filename);
  if (!fs.existsSync(filepath)) {
    errors.push(`${filename}: file not found`);
    continue;
  }

  let html = fs.readFileSync(filepath, 'utf8');
  const originalHtml = html;

  // 1. Remove CDN/preconnect/old script tags
  const lines = html.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    return !REMOVE_PATTERNS.some(pat => trimmed.includes(pat));
  });
  html = filteredLines.join('\n');

  // 2. Find the LAST inline <script> tag (the main page logic) and add type="module" + imports
  // For auth pages that have `supabase.createClient`, change that to just `createClient`
  // We need to handle <script> (no src) and convert to <script type="module">

  // Find inline script tags (not ones with src=)
  const scriptRegex = /<script>(\s*\n)/g;
  let lastMatch = null;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    lastMatch = match;
  }

  if (lastMatch) {
    const insertPos = lastMatch.index + lastMatch[0].length;
    const importBlock = importLines.join('\n') + '\n';
    html = html.slice(0, lastMatch.index) +
           '<script type="module">' + lastMatch[1] +
           importBlock +
           html.slice(insertPos);
  } else {
    // Try matching <script> without trailing newline
    const altRegex = /<script>/g;
    let altLast = null;
    while ((match = altRegex.exec(html)) !== null) {
      // Make sure this isn't a <script src="...">
      const lineStart = html.lastIndexOf('\n', match.index) + 1;
      const lineEnd = html.indexOf('\n', match.index);
      const fullLine = html.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
      if (!fullLine.includes('src=')) {
        altLast = match;
      }
    }
    if (altLast) {
      const insertPos = altLast.index + '<script>'.length;
      const importBlock = '\n' + importLines.join('\n') + '\n';
      html = html.slice(0, altLast.index) +
             '<script type="module">' +
             importBlock +
             html.slice(insertPos);
    } else {
      errors.push(`${filename}: could not find inline <script> tag`);
      continue;
    }
  }

  // 3. For auth pages with inline client: replace `supabase.createClient` with `createClient`
  if (importLines.some(l => l.includes("from '@supabase/supabase-js'"))) {
    html = html.replace(/\bsupabase\.createClient\b/g, 'createClient');
  }

  fs.writeFileSync(filepath, html, 'utf8');
  filesProcessed++;
  console.log(`✓ ${filename}`);
}

console.log(`\nProcessed ${filesProcessed} files`);
if (errors.length) {
  console.log('Errors:');
  errors.forEach(e => console.log(`  ✗ ${e}`));
}
