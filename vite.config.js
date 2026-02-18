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

export default defineConfig({
  build: {
    rollupOptions: {
      input,
    },
  },
});
