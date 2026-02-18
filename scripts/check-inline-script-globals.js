#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const TARGET_EXT = '.html';
const RISKY_GLOBALS = new Set(['isAutocracy', 'currentNation', 'currentFaction']);
const ALLOWLIST_PATH = path.join(ROOT_DIR, 'scripts', 'inline-script-globals-allowlist.json');

function loadAllowlist() {
  if (!fs.existsSync(ALLOWLIST_PATH)) {
    return new Set();
  }

  const entries = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8'));
  return new Set(Array.isArray(entries) ? entries : []);
}

function findHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...findHtmlFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(TARGET_EXT)) {
      files.push(fullPath);
    }
  }

  return files;
}

function lineFromIndex(text, index) {
  return text.slice(0, index).split('\n').length;
}

function getTopLevelLexicalDeclarations(scriptContent) {
  const hits = [];
  const lines = scriptContent.split('\n');
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (braceDepth === 0) {
      const match = trimmed.match(/^(let|const)\s+([A-Za-z_$][\w$]*)\b/);
      if (match && RISKY_GLOBALS.has(match[2])) {
        hits.push({
          name: match[2],
          lineOffset: i + 1,
          declaration: trimmed,
        });
      }
    }

    for (const ch of line) {
      if (ch === '{') {
        braceDepth += 1;
      } else if (ch === '}') {
        braceDepth = Math.max(0, braceDepth - 1);
      }
    }
  }

  return hits;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let scriptMatch;

  while ((scriptMatch = scriptRegex.exec(content)) !== null) {
    const attrs = scriptMatch[1] || '';
    const body = scriptMatch[2] || '';
    const isModule = /\btype\s*=\s*(["'])module\1/i.test(attrs) || /\btype\s*=\s*module\b/i.test(attrs);

    if (isModule || body.trim() === '') {
      continue;
    }

    const scriptStartLine = lineFromIndex(content, scriptMatch.index);
    const scriptFindings = getTopLevelLexicalDeclarations(body);

    for (const finding of scriptFindings) {
      findings.push({
        filePath,
        line: scriptStartLine + finding.lineOffset,
        name: finding.name,
        declaration: finding.declaration,
      });
    }
  }

  return findings;
}

function main() {
  const htmlFiles = findHtmlFiles(ROOT_DIR);
  const allowlist = loadAllowlist();
  const findings = htmlFiles
    .flatMap(scanFile)
    .filter((finding) => !allowlist.has(`${path.relative(ROOT_DIR, finding.filePath)}:${finding.name}`));

  if (findings.length === 0) {
    console.log('No risky top-level inline script globals detected.');
    return;
  }

  console.error('Found risky top-level lexical globals in classic inline scripts:\n');
  for (const finding of findings) {
    const relativePath = path.relative(ROOT_DIR, finding.filePath);
    console.error(`- ${relativePath}:${finding.line} (${finding.name})`);
    console.error(`  ${finding.declaration}`);
  }

  console.error('\nInline scripts must be wrapped in an IIFE or moved to module files; do not add top-level lexical globals.');
  process.exitCode = 1;
}

main();
