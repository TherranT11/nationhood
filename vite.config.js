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
  // Serve assets/ as static files — copies to dist/ root on build
  // Flag images are referenced as assets/flags/NationName.png
  publicDir: false,
  build: {
    rollupOptions: {
      input,
    },
    copyPublicDir: false,
  },
  plugins: [{
    name: 'copy-flags',
    writeBundle() {
      // Copy flag images to dist after build
      const fs = require('fs');
      const path = require('path');
      const src = path.resolve(__dirname, 'assets/flags');
      const dest = path.resolve(__dirname, 'dist/assets/flags');
      if (fs.existsSync(src)) {
        fs.mkdirSync(dest, { recursive: true });
        for (const file of fs.readdirSync(src)) {
          fs.copyFileSync(path.join(src, file), path.join(dest, file));
        }
      }
    }
  }]
}));
