#!/usr/bin/env node

/**
 * sync-edge-function.js
 *
 * Generates supabase/functions/advance-tick/index.ts by combining:
 *   1. The header from handler-template.ts (everything before __GAME_COMMON_JS__)
 *   2. The contents of each js/game/*.js module (in dependency order)
 *   3. The footer from handler-template.ts (everything after __GAME_COMMON_JS__)
 *
 * Each module is processed by:
 *   - Stripping `export ` keywords (Edge Functions run as a single Deno.serve() module)
 *   - Stripping `import { ... } from '...'` lines (all symbols are in the same scope)
 *   - Adding a section comment header for readability
 *
 * The domain modules under js/game/ are the single source of truth for game logic,
 * while the Edge Function gets the Deno.serve handler and integrity checks from
 * the handler template.
 *
 * Usage: node scripts/sync-edge-function.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const GAME_DIR = path.join(ROOT, 'js', 'game');
// Template lives in scripts/ (build-time input), NOT in
// supabase/functions/advance-tick/. Keeping it in the function dir
// caused Supabase CLI's deploy-time path scanner to read the
// template's doc comments and warn on every "see js/game/X.js"
// reference. Moved 2026-05-10.
const TEMPLATE_PATH = path.join(ROOT, 'scripts', 'advance-tick-handler-template.ts');
const OUTPUT_PATH = path.join(ROOT, 'supabase', 'functions', 'advance-tick', 'index.ts');
const MARKER = '// __GAME_COMMON_JS__';

// Module concatenation order — dependencies before dependents
const MODULE_FILES = [
    'config.js',
    'government-types.js',
    'trade-constants.js',
    'diplomacy-constants.js',
    'stats.js',
    'momentum.js',
    'budget.js',
    'government-structure.js',
    'repeal-helper.js',
    'event-helpers.js',
    'corp-valuation.js',
    'tax-articles.js',
    'sectors.js',
    'bills.js',
    'elections.js',
    'presidential.js',
    'engagement.js',
    'electorate.js',
    'policies.js',
    'party-leadership.js',
    'protest.js',
    'political-actions.js',
    'election-simulation.js',
    'energy.js',
    'sovereign-default.js',
    'shipping.js',
    'issues.js',
    'incidents.js',
    'platforms.js',
    'platform-promises.js',
    'lawsuits.js',
    'military-loyalty.js',
    'loan-math.js',
    'modifiers.js',
];

// Read and process each module
let gameLogic = '';
let totalModuleLines = 0;

for (const file of MODULE_FILES) {
    const filePath = path.join(GAME_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Strip re-export lines (export { ... } from '...') — must come before export keyword strip
    content = content.replace(/^export\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];\s*\n?/gm, '');

    // Strip multi-line export blocks (export {\n  ...\n};) — no 'from', just re-declaring local symbols
    content = content.replace(/^export\s+\{[\s\S]*?\};\s*\n?/gm, '');

    // Strip ES module export keywords
    content = content.replace(/^export /gm, '');

    // Strip import lines (inter-module imports are resolved by concatenation)
    content = content.replace(/^import\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];\s*\n?/gm, '');

    // Strip the auto-generated module header comment (first 4 lines: /**, * name, * desc, */)
    content = content.replace(/^\/\*\*\n \* \S+\.js — [^\n]+\n \* Extracted from game-common\.js\n \*\/\n/, '');

    const lines = content.split('\n').length;
    totalModuleLines += lines;

    // Add section header
    const name = file.replace('.js', '');
    gameLogic += `// ────────── ${name} ──────────\n\n`;
    gameLogic += content;

    // Ensure trailing newline between modules
    if (!content.endsWith('\n')) gameLogic += '\n';
    gameLogic += '\n';
}

// Read handler template
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
let output = header + gameLogic + footer;

// Sanitize comment-only module-name references that trigger Supabase
// CLI's deploy-time dependency scanner. Doc comments across the
// bundle say things like "see js/game/political-actions.js" or
// "bills.js:432" — the CLI scans bundle text for path-like strings
// and tries to resolve them, warning on each miss (e.g.
// "WARN: failed to read file: open supabase/js/game/political-actions.js").
//
// The bundle is self-contained — these strings are documentation,
// not imports. Strip the .js suffix from bare references to any of
// our bundled module names so the path-scanner heuristic stops
// matching. Source files keep their full paths for readability;
// only the deployed artifact is sanitized.
//
// config.js is excluded because it IS a real co-deployed sibling
// import at `await import('./config.js')` (line 28000-ish). Stripping
// it would break the runtime import path.
//
// Confirmed safe via a sweep on 2026-05-10: every <module>.js
// occurrence in the assembled bundle outside of `await import(...)`
// is inside a comment.
const stripModuleNames = MODULE_FILES
    .filter(m => m !== 'config.js')
    .map(m => m.replace(/\.js$/, ''))
    .map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); // regex-escape (defensive)
const stripRegex = new RegExp(`\\b(${stripModuleNames.join('|')})\\.js\\b`, 'g');
output = output.replace(stripRegex, '$1');

// Write
fs.writeFileSync(OUTPUT_PATH, output, 'utf8');

const headerLines = header.split('\n').length;
const footerLines = footer.split('\n').length;
const totalLines = output.split('\n').length;

console.log(`Generated ${path.relative(ROOT, OUTPUT_PATH)} (${totalLines} lines)`);
console.log(`  Header:      ${headerLines} lines from handler-template.ts`);
console.log(`  Game logic:  ${totalModuleLines} lines from ${MODULE_FILES.length} modules`);
console.log(`  Footer:      ${footerLines} lines from handler-template.ts`);
console.log(`  Modules:     ${MODULE_FILES.join(', ')}`);
