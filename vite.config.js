import { readdirSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';

// Automatically find all HTML files in the project root
const htmlFiles = readdirSync(__dirname)
  .filter(file => file.endsWith('.html'));

// Build a { name: path } map for Rollup's multi-page input
const input = {};
for (const file of htmlFiles) {
  const name = file.replace('.html', '');
  input[name] = resolve(__dirname, file);
}

export default defineConfig(({ mode }) => ({
  // Load .env.work when mode is 'work', otherwise .env.main
  envFile: `.env.${mode === 'work' ? 'work' : 'main'}`,
  // No Vite public dir. The copy-static-assets plugin below explicitly
  // copies assets/flags/* and loose top-level assets/*.png into
  // dist/assets/ (referenced at runtime as assets/flags/X.png and
  // assets/{Nation} Whole.png etc.).
  publicDir: false,
  build: {
    rollupOptions: {
      input,
    },
    copyPublicDir: false,
  },
  plugins: [{
    name: 'copy-static-assets',
    writeBundle() {
      const fs = require('fs');
      const path = require('path');
      const assetsRoot = path.resolve(__dirname, 'assets');
      const distAssets = path.resolve(__dirname, 'dist/assets');

      // Flag images: assets/flags/* → dist/assets/flags/*
      const flagSrc = path.join(assetsRoot, 'flags');
      const flagDest = path.join(distAssets, 'flags');
      if (fs.existsSync(flagSrc)) {
        fs.mkdirSync(flagDest, { recursive: true });
        for (const file of fs.readdirSync(flagSrc)) {
          fs.copyFileSync(path.join(flagSrc, file), path.join(flagDest, file));
        }
      }

      // Loose top-level map images: assets/*.png → dist/assets/*.png
      // (e.g. "Avelia Whole.png", "Avelia Valeranza.png"). Files only —
      // subdirectories (flags/, etc.) are not recursed.
      if (fs.existsSync(assetsRoot)) {
        fs.mkdirSync(distAssets, { recursive: true });
        for (const file of fs.readdirSync(assetsRoot)) {
          if (!file.toLowerCase().endsWith('.png')) continue;
          const sp = path.join(assetsRoot, file);
          if (!fs.statSync(sp).isFile()) continue;
          fs.copyFileSync(sp, path.join(distAssets, file));
        }
      }
    }
  }]
}));
