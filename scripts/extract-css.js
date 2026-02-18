#!/usr/bin/env node
/**
 * One-time migration script: extracts inline <style> blocks from HTML files
 * into separate CSS files, then adds CSS imports to the inline <script type="module">.
 * Also removes <link rel="stylesheet" href="css/dashboard.css"> since it's now
 * imported via common.js.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cssDir = path.join(root, 'css');

// Get all HTML files in root
const htmlFiles = fs.readdirSync(root)
  .filter(f => f.endsWith('.html'));

let extracted = 0;
let linkRemoved = 0;
let skipped = 0;
let errors = [];

for (const filename of htmlFiles) {
  const filepath = path.join(root, filename);
  let html = fs.readFileSync(filepath, 'utf8');
  const pageName = filename.replace('.html', '');

  // 1. Extract all <style>...</style> blocks
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
  const styleBlocks = [];
  let match;
  while ((match = styleRegex.exec(html)) !== null) {
    const content = match[1].trim();
    if (content) {
      styleBlocks.push(content);
    }
  }

  if (styleBlocks.length === 0) {
    console.log(`  skip ${filename} (no inline CSS)`);
    skipped++;
    // Still remove <link> if present
    const beforeLink = html;
    html = html.replace(/\s*<link\s+rel="stylesheet"\s+href="css\/dashboard\.css"[^>]*>\s*/g, '\n');
    if (html !== beforeLink) {
      fs.writeFileSync(filepath, html, 'utf8');
      linkRemoved++;
      console.log(`  ✓ ${filename} (removed <link> only)`);
    }
    continue;
  }

  // 2. Write combined CSS to css/<pagename>.css
  const cssContent = styleBlocks.join('\n\n');
  const cssFilename = `${pageName}.css`;
  const cssFilepath = path.join(cssDir, cssFilename);
  fs.writeFileSync(cssFilepath, cssContent + '\n', 'utf8');

  // 3. Remove <style>...</style> blocks from HTML
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>\s*/g, '');

  // 4. Remove <link rel="stylesheet" href="css/dashboard.css">
  html = html.replace(/\s*<link\s+rel="stylesheet"\s+href="css\/dashboard\.css"[^>]*>\s*/g, '\n');

  // 5. Remove leftover empty comment markers
  // Clean up "<!-- Shared Styles -->" comments that now have nothing after them
  html = html.replace(/\s*<!-- Shared Styles -->\s*\n\s*\n/g, '\n');

  // 6. Add CSS import to the inline <script type="module">
  // Find the <script type="module"> and add the CSS import after the last import line
  const scriptModuleRegex = /<script type="module">\s*\n/;
  const scriptMatch = html.match(scriptModuleRegex);

  if (scriptMatch) {
    const scriptStart = html.indexOf(scriptMatch[0]);
    const afterScriptTag = scriptStart + scriptMatch[0].length;

    // Find where the imports end (last line starting with 'import ')
    const restOfScript = html.slice(afterScriptTag);
    const lines = restOfScript.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trimStart().startsWith('import ')) {
        lastImportIdx = i;
      } else if (lastImportIdx >= 0) {
        // Stop after first non-import line past the imports
        break;
      }
    }

    if (lastImportIdx >= 0) {
      // Insert CSS import after the last JS import
      lines.splice(lastImportIdx + 1, 0, `import './css/${cssFilename}';`);
    } else {
      // No existing imports - add at the beginning
      lines.unshift(`import './css/${cssFilename}';`);
    }

    html = html.slice(0, afterScriptTag) + lines.join('\n');
  } else {
    // No <script type="module"> found - try to add a new one before </head> or </body>
    errors.push(`${filename}: no <script type="module"> found for CSS import`);
    // Still save the extracted CSS file and modified HTML
  }

  fs.writeFileSync(filepath, html, 'utf8');
  extracted++;
  const lines = cssContent.split('\n').length;
  console.log(`✓ ${filename} → css/${cssFilename} (${lines} lines)`);
}

console.log(`\nExtracted: ${extracted} files`);
console.log(`Skipped (no CSS): ${skipped} files`);
console.log(`Link tags removed: ${linkRemoved} additional files`);
if (errors.length) {
  console.log('Errors:');
  errors.forEach(e => console.log(`  ✗ ${e}`));
}
