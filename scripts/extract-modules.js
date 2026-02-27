#!/usr/bin/env node
/**
 * extract-modules.js
 *
 * Splits js/game-common.js into 15 domain modules under js/game/.
 * Creates a barrel re-export file at js/game-common.js.
 * Auto-detects cross-module imports.
 *
 * Usage: node scripts/extract-modules.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'js', 'game-common.js');
const GAME_DIR = path.join(ROOT, 'js', 'game');

// Read source file
const allLines = fs.readFileSync(SRC, 'utf8').split('\n');
console.log(`Read ${allLines.length} lines from game-common.js`);

// Extract lines helper (1-indexed, inclusive)
function extractLines(ranges) {
    const result = [];
    for (const [start, end] of ranges) {
        result.push(...allLines.slice(start - 1, end));
    }
    return result.join('\n');
}

// ── Module definitions ──────────────────────────────────────────────────
// Order matters: this is the concatenation order for the edge function pipeline.
const MODULES = [
    {
        file: 'config.js',
        ranges: [[20, 51], [850, 905]],
        header: 'Game configuration constants and AP management',
    },
    {
        file: 'government-types.js',
        ranges: [[907, 960]],
        header: 'Government type helpers (autocracy, democracy, presidential)',
    },
    {
        file: 'trade-constants.js',
        ranges: [[53, 847]],
        header: 'Trade system constants and calculation functions',
    },
    {
        file: 'diplomacy-constants.js',
        ranges: [[962, 1515]],
        header: 'Diplomacy constants, policy stances, and scaling divisors',
    },
    {
        file: 'ideology.js',
        ranges: [[2543, 2797]],
        header: 'Dynamic ideology system (axes, labels, alignment, DB helpers)',
    },
    {
        file: 'stats.js',
        ranges: [[4726, 5302]],
        header: 'Nation stat columns, decay config, trends, and approval setup',
    },
    {
        file: 'momentum.js',
        ranges: [[8041, 8093], [11488, 11532]],
        header: 'Momentum and government approval event adjustments',
    },
    {
        file: 'budget.js',
        ranges: [[1516, 2541]],
        header: 'National budget, tax config, economic aid, shutdown, GDP growth',
    },
    {
        file: 'government-structure.js',
        ranges: [[2800, 3058]],
        header: 'Seat loading, head faction detection, coalition fetching, policy compatibility',
    },
    {
        file: 'bills.js',
        ranges: [[3061, 4723]],
        header: 'Bill support, vote tallies, ideology shifts, resolution engine, foundational bills',
    },
    {
        file: 'elections.js',
        ranges: [[5304, 7119]],
        header: 'Administration lifecycle, coalition dissolution, elections, government vacancy',
    },
    {
        file: 'presidential.js',
        ranges: [[7121, 7793]],
        header: 'Presidential candidates, nomination, veto, and term processing',
    },
    {
        file: 'three-pillar.js',
        ranges: [[7794, 8039]],
        header: 'Three-pillar preference engine',
    },
    {
        file: 'political-actions.js',
        ranges: [[8096, 11487], [11533, 13174]],
        header: 'Political actions, tick processors, crises, events, resign PM, disband party',
    },
    {
        file: 'election-simulation.js',
        ranges: [[13175, 13755]],
        header: "Election simulation (vote distribution, D'Hondt allocation)",
    },
];

// ── Phase 1: Extract raw content ────────────────────────────────────────
fs.mkdirSync(GAME_DIR, { recursive: true });

const moduleContents = {};
for (const mod of MODULES) {
    moduleContents[mod.file] = extractLines(mod.ranges);
}

// ── Phase 2: Build export map (name → module file) ─────────────────────
const exportMap = {};
for (const mod of MODULES) {
    const content = moduleContents[mod.file];
    // Match exported declarations
    const re = /^export\s+(?:const|let|var|function|async\s+function)\s+(\w+)/gm;
    let m;
    while ((m = re.exec(content)) !== null) {
        exportMap[m[1]] = mod.file;
    }
}

console.log(`Found ${Object.keys(exportMap).length} exports across ${MODULES.length} modules`);

// ── Phase 3: Detect cross-module references ─────────────────────────────
function findImports(modFile, content) {
    const imports = {}; // sourceFile → Set<name>

    // Strip comments to reduce false positives
    const stripped = content
        .replace(/\/\*[\s\S]*?\*\//g, '')   // block comments
        .replace(/\/\/.*/g, '');              // line comments

    for (const [name, sourceFile] of Object.entries(exportMap)) {
        if (sourceFile === modFile) continue;
        // Word-boundary check on comment-stripped content
        const re = new RegExp('\\b' + name + '\\b');
        if (re.test(stripped)) {
            if (!imports[sourceFile]) imports[sourceFile] = new Set();
            imports[sourceFile].add(name);
        }
    }
    return imports;
}

// ── Phase 4: Write module files ─────────────────────────────────────────
const moduleOrder = MODULES.map(m => m.file);

for (const mod of MODULES) {
    const content = moduleContents[mod.file];
    const imports = findImports(mod.file, content);

    let output = '';
    output += `/**\n * ${mod.file} — ${mod.header}\n * Extracted from game-common.js\n */\n`;

    // Import statements sorted by module order
    const sortedImports = Object.entries(imports)
        .sort((a, b) => moduleOrder.indexOf(a[0]) - moduleOrder.indexOf(b[0]));

    if (sortedImports.length > 0) {
        output += '\n';
        for (const [sourceFile, names] of sortedImports) {
            const sorted = [...names].sort();
            output += `import { ${sorted.join(', ')} } from './${sourceFile}';\n`;
        }
    }

    output += '\n' + content + '\n';

    const outPath = path.join(GAME_DIR, mod.file);
    fs.writeFileSync(outPath, output);

    const lineCount = content.split('\n').length;
    const importCount = sortedImports.reduce((sum, [, names]) => sum + names.size, 0);
    console.log(`  ${mod.file.padEnd(28)} ${String(lineCount).padStart(5)} lines, ${importCount} imports from ${sortedImports.length} modules`);
}

// ── Phase 5: Write barrel re-export file ────────────────────────────────
// Back up original
fs.writeFileSync(SRC + '.bak', fs.readFileSync(SRC, 'utf8'));
console.log(`\nBacked up original game-common.js → game-common.js.bak`);

const barrelLines = [
    '/**',
    ' * game-common.js — Barrel re-export file',
    ' *',
    ' * Re-exports all game logic from domain modules under js/game/.',
    ' * This file exists for backward compatibility: all HTML pages import',
    ' * from ./js/game-common.js and continue to work without changes.',
    ' */',
    '',
];

for (const mod of MODULES) {
    barrelLines.push(`export * from './game/${mod.file}';`);
}
barrelLines.push('');

fs.writeFileSync(SRC, barrelLines.join('\n'));
console.log(`Wrote barrel re-export: game-common.js (${barrelLines.length} lines)`);

// ── Summary ─────────────────────────────────────────────────────────────
let totalExtracted = 0;
for (const mod of MODULES) {
    totalExtracted += moduleContents[mod.file].split('\n').length;
}
console.log(`\nTotal extracted: ${totalExtracted} lines from ${allLines.length} original`);
console.log(`Lines not captured: ${allLines.length - totalExtracted} (file header + blank separators)`);
console.log('\nExtraction complete!');
