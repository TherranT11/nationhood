#!/usr/bin/env node

/**
 * sync-edge-function.js
 *
 * Generates supabase/functions/advance-tick/index.ts by combining:
 *   1. The header from handler-template.ts (everything before __GAME_COMMON_JS__)
 *   2. The full contents of js/game-common.js
 *   3. The footer from handler-template.ts (everything after __GAME_COMMON_JS__)
 *
 * This ensures game-common.js remains the single source of truth for game logic,
 * while the Edge Function gets the Deno.serve handler and integrity checks from
 * the handler template.
 *
 * Usage: node scripts/sync-edge-function.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GAME_COMMON_PATH = path.join(ROOT, 'js', 'game-common.js');
const TEMPLATE_PATH = path.join(ROOT, 'supabase', 'functions', 'advance-tick', 'handler-template.ts');
const OUTPUT_PATH = path.join(ROOT, 'supabase', 'functions', 'advance-tick', 'index.ts');
const MARKER = '// __GAME_COMMON_JS__';

// Read source files
const gameCommon = fs.readFileSync(GAME_COMMON_PATH, 'utf8');
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

// Split template on marker
const markerIndex = template.indexOf(MARKER);
if (markerIndex === -1) {
    console.error(`ERROR: Marker "${MARKER}" not found in ${TEMPLATE_PATH}`);
    process.exit(1);
}

const header = template.substring(0, markerIndex);
const footer = template.substring(markerIndex + MARKER.length);

// Assemble output
const output = header + gameCommon + footer;

// Write
fs.writeFileSync(OUTPUT_PATH, output, 'utf8');

const gameCommonLines = gameCommon.split('\n').length;
const headerLines = header.split('\n').length;
const footerLines = footer.split('\n').length;
const totalLines = output.split('\n').length;

console.log(`Generated ${path.relative(ROOT, OUTPUT_PATH)} (${totalLines} lines)`);
console.log(`  Header:     ${headerLines} lines from handler-template.ts`);
console.log(`  Game logic: ${gameCommonLines} lines from game-common.js`);
console.log(`  Footer:     ${footerLines} lines from handler-template.ts`);
