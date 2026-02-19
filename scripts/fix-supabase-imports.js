#!/usr/bin/env node
/**
 * Fix: Restore Supabase CDN <script> tag and replace bare npm imports.
 *
 * The Phase 2 ES module conversion used `import { createClient } from '@supabase/supabase-js'`
 * which is a bare specifier that only works with a bundler. Since the site is served as
 * static files, browsers can't resolve it. This script:
 *
 * 1. Adds <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *    to <head> of every HTML file (before </head>)
 * 2. Replaces `import { createClient } from '@supabase/supabase-js';` with
 *    `const { createClient } = supabase;` in inline scripts
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const CDN_TAG = '    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>';

const htmlFiles = fs.readdirSync(root).filter(f => f.endsWith('.html'));

let fixed = 0;

for (const filename of htmlFiles) {
  const filepath = path.join(root, filename);
  let html = fs.readFileSync(filepath, 'utf8');
  let changed = false;

  // 1. Add CDN script tag if not already present
  if (!html.includes('cdn.jsdelivr.net/npm/@supabase/supabase-js')) {
    html = html.replace('</head>', `${CDN_TAG}\n</head>`);
    changed = true;
  }

  // 2. Replace bare import in inline scripts
  const bareImport = /import\s*\{\s*createClient\s*\}\s*from\s*['"]@supabase\/supabase-js['"];?/g;
  if (bareImport.test(html)) {
    html = html.replace(bareImport, 'const { createClient } = supabase;');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filepath, html, 'utf8');
    fixed++;
    console.log(`✓ ${filename}`);
  }
}

console.log(`\nFixed ${fixed} files`);
