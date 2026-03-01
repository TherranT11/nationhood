/**
 * fingerprint.js — Browser fingerprinting for multi-account detection
 *
 * Generates a stable hash from browser properties to identify devices.
 * Not perfect (users can spoof) but catches casual alt-account abuse.
 */

/**
 * Generate a simple but stable browser fingerprint hash.
 * Combines: screen, timezone, language, platform, canvas hash, fonts.
 */
export async function generateFingerprint() {
    const components = [];

    // Screen signature
    const screen = window.screen;
    components.push(`${screen.width}x${screen.height}x${screen.colorDepth}@${window.devicePixelRatio || 1}`);

    // Timezone
    try {
        components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch { components.push('unknown-tz'); }

    // Language
    components.push(navigator.language || 'unknown-lang');

    // Platform
    components.push(navigator.platform || 'unknown-platform');

    // Hardware concurrency (CPU cores)
    components.push(String(navigator.hardwareConcurrency || 0));

    // Device memory (Chrome only)
    components.push(String(navigator.deviceMemory || 0));

    // Canvas fingerprint (renders a unique image per GPU/driver combo)
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(50, 0, 80, 50);
        ctx.fillStyle = '#069';
        ctx.fillText('Nationhood FP', 2, 15);
        ctx.fillStyle = 'rgba(102,204,0,0.7)';
        ctx.fillText('Nationhood FP', 4, 17);
        components.push(canvas.toDataURL().slice(-50));
    } catch { components.push('no-canvas'); }

    // WebGL renderer (identifies GPU)
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const dbg = gl.getExtension('WEBGL_debug_renderer_info');
            if (dbg) {
                components.push(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || 'unknown-gpu');
            }
        }
    } catch { components.push('no-webgl'); }

    // Touch support
    components.push(String('ontouchstart' in window || navigator.maxTouchPoints > 0));

    // Hash all components into a stable fingerprint
    const raw = components.join('|||');
    return await hashString(raw);
}

/**
 * Get screen signature string.
 */
export function getScreenSig() {
    const s = window.screen;
    return `${s.width}x${s.height}@${window.devicePixelRatio || 1}`;
}

/**
 * Get timezone string.
 */
export function getTimezone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; }
    catch { return 'unknown'; }
}

/**
 * Hash a string to a hex digest using SHA-256.
 */
async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Record fingerprint to the database (non-blocking, fire-and-forget).
 * Called from common.js on every page load.
 */
export async function recordFingerprint(supabase) {
    try {
        const fingerprint = await generateFingerprint();
        const screenSig = getScreenSig();
        const timezone = getTimezone();
        const language = navigator.language || 'unknown';
        const userAgent = navigator.userAgent || 'unknown';

        await supabase.rpc('upsert_player_fingerprint', {
            p_fingerprint: fingerprint,
            p_user_agent: userAgent.substring(0, 500),
            p_screen_sig: screenSig,
            p_timezone: timezone,
            p_language: language,
            p_ip_hint: null  // IP captured server-side if available
        });
    } catch (e) {
        // Non-blocking — don't break the page if fingerprinting fails
        console.warn('Fingerprint recording failed (table may not exist yet):', e.message);
    }
}

/**
 * Check if the current user is banned.
 * Returns { banned: true, reason, ban_type, banned_until } or { banned: false }.
 */
export async function checkBanStatus(supabase) {
    try {
        const { data, error } = await supabase
            .from('player_bans')
            .select('ban_type, reason, banned_until')
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

        if (error || !data) return { banned: false };

        // Check if temporary ban has expired
        if (data.banned_until && new Date(data.banned_until) < new Date()) {
            return { banned: false };
        }

        return {
            banned: true,
            ban_type: data.ban_type,
            reason: data.reason || 'Account suspended.',
            banned_until: data.banned_until
        };
    } catch {
        return { banned: false };
    }
}
