# Nationhood Code Review

**Reviewer:** Claude (automated review)
**Date:** 2026-02-22
**Scope:** Full codebase — security, code quality, architecture, SQL schema

---

## Executive Summary

Nationhood is an ambitious browser-based political simulation game with ~150 files across 3.3MB of code. The architecture (Vite + Supabase + vanilla JS + PostgreSQL) is well-chosen for the use case. However, the review uncovered **3 critical security issues**, several medium-severity code quality problems, and some architectural concerns that should be addressed.

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 2 |
| Medium | 5 |
| Low | 4 |

---

## CRITICAL Issues

### 1. RLS Policies Are Completely Permissive (Security)

**File:** `sql/fix_rls_policies_all_tables.sql`

All 23 tables have RLS policies that grant unrestricted access to every authenticated user:

```sql
CREATE POLICY "Allow select for all" ON %I FOR SELECT USING (true)
CREATE POLICY "Allow insert for all" ON %I FOR INSERT WITH CHECK (true)
CREATE POLICY "Allow update for all" ON %I FOR UPDATE USING (true) WITH CHECK (true)
CREATE POLICY "Allow delete for all" ON %I FOR DELETE USING (true)
```

**Impact:** Any authenticated user can read, modify, or delete ANY row in ANY table — including other nations' data, other factions' action points, election results, bills, etc. This completely undermines the game's integrity. A player could:
- Set their own faction's `action_points` to 9999
- Modify another nation's GDP, population, or stats
- Delete or alter bills, elections, or government formations
- Impersonate other factions

**Recommendation:** Implement proper RLS policies. For example:
- `factions`: `USING (id = auth.uid())` for UPDATE/DELETE; SELECT can remain open if public
- `bills`: INSERT `WITH CHECK (author_faction_id = auth.uid())`; UPDATE restricted to author or voting actions
- `nations`: SELECT open; UPDATE restricted to server-side edge function (service role)
- Use a `role` column or separate `admins` table to gate admin operations

---

### 2. Admin Override Has No Authorization Check (Security)

**File:** `js/common.js:62-78, 122-161`

The admin inspection system allows ANY user to append `?nation_id=<uuid>&faction_id=<uuid>` to any page URL and view that nation/faction's data as if it were their own:

```javascript
export function getAdminNationOverride() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('nation_id') || null;
    // No admin check — accepts override from anyone
    if (fromUrl) { sessionStorage.setItem('_admin_nation', fromUrl); return fromUrl; }
    return sessionStorage.getItem('_admin_nation') || null;
}
```

In `loadGameState()` (line 126), the override loads any faction's full data without verifying the requesting user has admin privileges:

```javascript
if (overrideFactionId) {
    console.log('Admin override: loading faction', overrideFactionId);
    const { data: factionData } = await _supabase
        .from('factions').select('*').eq('id', overrideFactionId).single();
    faction = factionData; // No permission check
}
```

The "ADMIN VIEWING" banner (line 178) is purely cosmetic and provides no actual protection.

**Impact:** Combined with the permissive RLS policies (Issue #1), any player can view and potentially act as any other faction by guessing or discovering faction/nation UUIDs.

**Recommendation:**
- Add an `is_admin` column to the `factions` table (or a separate `admins` table)
- Check admin status in `loadGameState()` before accepting overrides:
  ```javascript
  if (overrideFactionId) {
      const { data: profile } = await _supabase.from('admins').select('id').eq('id', user.id).single();
      if (!profile) { console.warn('Non-admin tried override'); return; }
      // ... proceed with override
  }
  ```

---

### 3. XSS Vulnerabilities via innerHTML with Unescaped User Data

Multiple pages insert user-controlled data (nation names, faction names, party names, policy names) directly into `innerHTML` without escaping. The codebase has `escapeHtml()` in `js/utils.js`, but it's inconsistently used.

**Affected locations (non-exhaustive):**

| File | Line(s) | Unescaped Data |
|------|---------|----------------|
| `world.html` | ~163-164 | `nation.name`, `nation.capital` |
| `policyadmin.html` | ~414-465 | `policy_name`, `major_sector`, ideology tags |
| `avelia.html` | ~262 | `party.name` |
| `elections.html` | ~1219 | `faction_name` |
| `dashboard-old.html` | ~806 | `faction_name` in `<option>` |
| `admin.html` | ~606, 612, 1377, 1842, 1860 | nation/faction names in selects and tables |
| `bill.html` | ~1559 | `faction_name` (note: `comment_text` IS escaped here, but not the author name) |

**Example attack vector:** A player creates a faction named `<img src=x onerror="fetch('/api',{method:'POST',body:document.cookie})">` — this executes arbitrary JavaScript when rendered on any page that displays faction names via innerHTML.

**Recommendation:** Apply `escapeHtml()` to ALL user-provided values before innerHTML insertion. Better yet, use `textContent` where possible (for simple text), or switch to a templating approach that escapes by default.

---

## HIGH Issues

### 4. Edge Function Has No Caller Authentication

**File:** `supabase/functions/advance-tick/handler-template.ts:723-756`

```javascript
Deno.serve(async (req) => {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",  // Open to all origins
        // ...
    };
    // No Authorization header check
    // No caller identity verification
    const supabase = createClient(supabaseUrl, supabaseServiceKey); // Uses service role
```

The `force` parameter (line 756) allows bypassing the tick-time check, but there's no authorization — any HTTP client can force a tick:

```javascript
const body = await req.json();
force = body?.force === true; // Anyone can send { "force": true }
```

**Impact:** While the tick lock prevents concurrent processing, an attacker could:
- Force tick advancement ahead of schedule
- Cause unexpected game state changes
- Potentially DoS the game by repeatedly forcing ticks

**Recommendation:**
- Validate the `Authorization` header against expected callers (pg_cron service key, admin tokens)
- Restrict the `force` parameter to requests with valid admin credentials
- Tighten CORS to specific origins (the game domain only)

---

### 5. AP Functions Lack Row-Level Authorization

**Files:** `sql/create_accumulate_ap.sql`, `sql/create_deduct_ap.sql`

Both functions are `SECURITY DEFINER` (run with the function owner's privileges) and accept any `p_faction_id`:

```sql
CREATE OR REPLACE FUNCTION accumulate_ap(p_faction_id UUID, p_gain INT, p_max_ap INT DEFAULT 20)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE factions SET action_points = LEAST(COALESCE(action_points, 0) + p_gain, p_max_ap)
    WHERE id = p_faction_id  -- No check that caller owns this faction
    RETURNING action_points INTO v_new_ap;
```

**Impact:** Any authenticated user can call `accumulate_ap` or `deduct_ap` for ANY faction, not just their own. Combined with the permissive RLS, a player could grant themselves unlimited AP or drain opponents' AP.

**Recommendation:** Add authorization inside the function:
```sql
IF p_faction_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another faction''s AP';
END IF;
```
Or restrict these to service-role-only calls (remove public EXECUTE grant).

---

## MEDIUM Issues

### 6. Dead Code: Identical Routing Branches

**File:** `index.html:95-101`

```javascript
if (faction && faction.faction_type === 'party' && faction.nation_id) {
    window.location.href = 'world.html';  // Fully set up
} else {
    window.location.href = 'world.html';  // Needs setup (comment says "go to map")
}
```

Both branches redirect to `world.html`. The comment says the else-branch should go to `map.html`. This means new users who haven't completed setup are never routed to the onboarding flow.

**Recommendation:** Fix to `window.location.href = 'map.html';` in the else-branch, or remove the dead conditional.

---

### 7. Silently Swallowed Errors in Cache Layer

**File:** `js/common.js:25, 31, 42, 68, 77, 91`

Multiple empty `catch` blocks throughout the caching and state management code:

```javascript
} catch { return null; }           // line 25 — cache read failure
} catch { /* storage full */ }     // line 31 — cache write failure
} catch {}                         // line 42 — cache bust failure
} catch (e) { return null; }       // lines 68, 77 — admin override failures
} catch (e) {}                     // line 91 — stale override cleanup
```

**Impact:** If sessionStorage is corrupted, full, or throws due to privacy mode, users will get silently broken behavior with no diagnostics. Debugging production issues becomes very difficult.

**Recommendation:** At minimum, add `console.warn()` calls in catch blocks. Consider a lightweight error reporting mechanism for production.

---

### 8. Supabase Credentials Duplicated

**Files:** `js/supabase-client.js:9-10`, `index.html:32-33`

The Supabase URL and anon key are hardcoded in two separate locations. The key IS correctly an anon key (JWT payload confirms `"role":"anon"`), which is safe for client-side use. However, duplication creates maintenance risk.

**Recommendation:** Have `index.html` import from `supabase-client.js` instead of redeclaring the credentials, or use a shared config module.

---

### 9. `var` Usage in Modern ES Module Code

**File:** `js/game-common.js:53, 69, 128-133`

```javascript
export var TRADE_CONFIG = { ... };
export var TRADE_SECTORS = [ ... ];
export var TRADE_SECTOR_KEYS = [];
export var TRADE_SECTOR_MAP = {};
for (var _tsi = 0; _tsi < TRADE_SECTORS.length; _tsi++) { ... }
```

The file uses `export const` for `GAME_CONFIG` but `export var` for trade constants. This inconsistency suggests these were added quickly without matching the existing code style.

**Recommendation:** Use `const` for all exports that aren't reassigned. Replace the `var` loop with `for...of` or `forEach`.

---

### 10. `scaleRawToDollars` Is a Dead Pass-Through

**File:** `js/common.js:493-495`

```javascript
export function scaleRawToDollars(val) {
    return val;  // "pass-through... exists only to avoid breaking callers"
}
```

The comment acknowledges this is dead code kept for backward compatibility. The callers (`nation.html`, `map.html`, `forum.html`) should be updated to remove the call.

**Recommendation:** Remove the function and update the 3 calling sites.

---

## LOW Issues

### 11. Duplicate Wrapper Function

**File:** `js/game-common.js:18-19`

```javascript
export function isAutocracy(input) { return getCanonicalGovernmentType(input) === CANONICAL_GOVERNMENT_TYPES.AUTOCRACY; }
export function isGovernmentAutocracy(nation) { return isAutocracy(nation); }
```

`isGovernmentAutocracy()` is an unnecessary alias for `isAutocracy()`.

---

### 12. Excessive Console Logging in Production

**Files:** `js/common.js` (~8 locations), `js/game-common.js` (~40+ locations), `handler-template.ts` (~30+ locations)

Examples: `console.log('Fetching fresh state from Supabase')`, `console.log('Admin override: loading faction', ...)`. While some logging aids debugging, the volume is excessive for a production game and leaks internal information to players who open DevTools.

**Recommendation:** Use a logging utility with configurable levels (debug/info/warn/error) and suppress debug/info in production builds.

---

### 13. game-common.js Size (486KB / ~11,700 lines)

The file is very large because it serves as the single source of truth for both client and edge function game logic (via the sync script). While the approach is reasonable for consistency, it makes the file hard to navigate.

**Recommendation:** Consider splitting into logical sub-modules (trade, elections, ideology, events) and having the sync script bundle them for the edge function.

---

### 14. `@ts-nocheck` in Edge Function

**File:** `supabase/functions/advance-tick/handler-template.ts:1`

```typescript
// @ts-nocheck
```

TypeScript checking is disabled entirely. Since the file is auto-generated from JS, this is understandable but means no type safety on the server-side code that processes game state.

**Recommendation:** Long-term, consider writing the shared game logic in TypeScript natively and transpiling for the browser, rather than the other direction.

---

## Architecture Notes (Non-Issues)

These are observations, not problems:

1. **Anon key is safe for client-side use** — confirmed via JWT decode (`"role":"anon"`)
2. **No `eval()` or `Function()` constructor usage** — good
3. **No direct SQL queries from client** — all queries use Supabase's parameterized API, eliminating SQL injection risk from the client
4. **AP functions are atomic** — `accumulate_ap` and `deduct_ap` use single UPDATE+RETURNING statements, which are inherently atomic in PostgreSQL (no race conditions)
5. **Tick processing has proper locking** — `acquireTickLock`/`releaseTickLock` prevent concurrent tick processing
6. **XSS utilities exist** — `escapeHtml()` and `escapeAttr()` in `js/utils.js` are well-implemented; the issue is inconsistent usage, not missing utilities

---

## Recommended Priority

1. **Immediately:** Fix RLS policies (#1) — this is exploitable now by any authenticated player
2. **Immediately:** Add admin authorization check (#2) — trivial to exploit
3. **Soon:** Fix XSS vulnerabilities (#3) — requires player interaction but high impact
4. **Soon:** Secure edge function (#4) and AP functions (#5)
5. **Next sprint:** Fix routing (#6), error handling (#7), credential dedup (#8)
6. **Backlog:** Code quality items (#9-14)
