// Vite multi-page build for the static site (deployed to GitHub Pages at the
// domain root). Every index.html in the tree is a page entry; bundling collapses
// each page's first-party module waterfall (util.js, supabase.js, topbar.js, …)
// plus the npm-bundled Supabase client into hashed, minified chunks.
//
// Pass-through statics live in public/ (theme.js, assets/, CNAME, .nojekyll): they
// are copied to dist/ verbatim, so /theme.js stays a synchronous pre-paint script
// (no theme flash) and /assets/... URLs are unchanged (the DB stores those paths).
import { defineConfig } from 'vite';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const SKIP = new Set(['node_modules', 'dist', 'public', 'supabase', '.git', '.github', '.claude']);

// Every *.html under the project root → a Rollup input, keyed by its path (so the
// list is never hand-maintained as pages are added). Output keeps the directory
// layout, so /play/government/ etc. resolve exactly as they do today.
function htmlEntries(dir, out = {}) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) htmlEntries(full, out);
    else if (name.endsWith('.html')) {
      out[relative(root, full).replace(/\\/g, '/').replace(/\.html$/, '')] = full;
    }
  }
  return out;
}

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: { input: htmlEntries(root) },
  },
});
