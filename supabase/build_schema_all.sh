#!/usr/bin/env bash
# Regenerate schema_all.sql by concatenating schema/*.sql in numeric (dependency)
# order. schema/ stays the single source of truth; schema_all.sql is a convenience
# "run everything in one paste" bundle. Re-run this whenever a schema/ file changes:
#   ./supabase/build_schema_all.sh
set -euo pipefail
cd "$(dirname "$0")"
out=schema_all.sql

{
  printf -- '-- ============================================================================\n'
  printf -- '-- Nationhood — full schema, all files concatenated in dependency order.\n'
  printf -- '-- GENERATED from supabase/schema/*.sql by build_schema_all.sh — do not edit by hand. Idempotent.\n'
  printf -- '-- ============================================================================\n'
  for f in $(printf '%s\n' schema/*.sql | sort -V); do
    printf '\n\n'
    printf -- '-- ============================================================================\n'
    printf -- '-- FILE: %s\n' "$(basename "$f")"
    printf -- '-- ============================================================================\n\n'
    cat "$f"
  done
} > "$out"

echo "Wrote $out ($(grep -c '^-- FILE:' "$out") files)."
