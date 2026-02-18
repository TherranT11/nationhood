# nationhood

## Contributor notes

- Inline scripts must be wrapped in an IIFE or moved to module files; do not add top-level lexical globals.
- Run `npm run lint:inline-scripts` to catch risky top-level declarations (`let`/`const`) in classic inline scripts.
