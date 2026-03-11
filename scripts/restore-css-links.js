#!/usr/bin/env node
/**
 * Fix: Add <link rel="stylesheet"> tags back to HTML files so CSS works
 * when served as static files (without Vite dev server).
 * Also removes the `import './css/xxx.css'` from inline module scripts
 * since CSS should load via <link> tags, not JS imports.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cssDir = path.join(root, 'css');

// Pages that need dashboard.css (the standard game pages that use common.js)
const dashboardPages = new Set([
  'world', 'nation', 'government', 'parties', 'elections', 'laws', 'bill',
  'diplomacy', 'events', 'factions', 'map', 'economy',
  'conflict', 'select-candidate'
]);

const htmlFiles = fs.readdirSync(root).filter(f => f.endsWith('.html'));

let fixed = 0;

for (const filename of htmlFiles) {
  const filepath = path.join(root, filename);
  let html = fs.readFileSync(filepath, 'utf8');
  const pageName = filename.replace('.html', '');
  let changed = false;

  // 1. Remove `import './css/xxx.css';` from inline scripts
  const cssImportRegex = /import\s+['"]\.\/css\/[^'"]+\.css['"];\s*\n?/g;
  if (cssImportRegex.test(html)) {
    html = html.replace(cssImportRegex, '');
    changed = true;
  }

  // 2. Build the <link> tags to insert
  const links = [];

  // Add dashboard.css for pages that need it
  if (dashboardPages.has(pageName)) {
    links.push('    <link rel="stylesheet" href="css/dashboard.css">');
  }

  // Add page-specific CSS if the file exists
  const pageCssFile = path.join(cssDir, `${pageName}.css`);
  if (fs.existsSync(pageCssFile)) {
    // Check it's not empty
    const content = fs.readFileSync(pageCssFile, 'utf8').trim();
    if (content) {
      links.push(`    <link rel="stylesheet" href="css/${pageName}.css">`);
    }
  }

  if (links.length === 0 && !changed) {
    continue;
  }

  // 3. Insert <link> tags into <head> (before </head>)
  if (links.length > 0) {
    const linkBlock = links.join('\n');
    // Check if links already exist to avoid duplicates
    if (!html.includes(`href="css/${pageName}.css"`) && !html.includes('href="css/dashboard.css"')) {
      // Insert before </head>
      html = html.replace('</head>', `${linkBlock}\n</head>`);
      changed = true;
    } else if (!html.includes('href="css/dashboard.css"') && dashboardPages.has(pageName)) {
      // Only dashboard.css is missing
      html = html.replace('</head>', `    <link rel="stylesheet" href="css/dashboard.css">\n</head>`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filepath, html, 'utf8');
    fixed++;
    console.log(`✓ ${filename} (${links.length} link tags)`);
  }
}

console.log(`\nFixed ${fixed} files`);
