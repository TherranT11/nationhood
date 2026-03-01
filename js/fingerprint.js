/**
 * fingerprint.js — Browser fingerprinting for multi-account detection
 *
 * Collects stable browser signals (screen, canvas, WebGL, timezone, fonts, etc.),
 * hashes them with SHA-256, and reports the fingerprint to Supabase via RPC.
 * Also checks ban status and enforces it by replacing the page.
 */

import { _supabase } from './supabase-client.js';

// ==================== FINGERPRINT COMPONENTS ====================

function getScreenFingerprint() {
    return {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio || 1,
    };
}

function getTimezoneFingerprint() {
    return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        offset: new Date().getTimezoneOffset(),
    };
}

function getNavigatorFingerprint() {
    return {
        language: navigator.language,
        languages: (navigator.languages || []).join(','),
        platform: navigator.platform || '',
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
        maxTouchPoints: navigator.maxTouchPoints || 0,
    };
}

function getCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(10, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Nationhood fp', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Nationhood fp', 4, 17);
        return canvas.toDataURL();
    } catch {
        return '';
    }
}

function getWebGLFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return { vendor: '', renderer: '' };
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        return {
            vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '',
            renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '',
        };
    } catch {
        return { vendor: '', renderer: '' };
    }
}

// ==================== HASH ====================

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==================== PUBLIC API ====================

/**
 * Collect all fingerprint components and compute the SHA-256 hash.
 * @returns {Promise<{fingerprint: string, components: object}>}
 */
export async function collectFingerprint() {
    const components = {
        screen: getScreenFingerprint(),
        timezone: getTimezoneFingerprint(),
        navigator: getNavigatorFingerprint(),
        canvas: getCanvasFingerprint(),
        webgl: getWebGLFingerprint(),
    };

    // Build a stable string for hashing (sorted keys for consistency)
    const raw = JSON.stringify(components, Object.keys(components).sort());
    const fingerprint = await sha256(raw);

    return { fingerprint, components };
}

/**
 * Record the player's fingerprint (fire-and-forget, non-blocking).
 * Called on every page load for authenticated users.
 */
export async function recordFingerprint() {
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) return;

        const { fingerprint, components } = await collectFingerprint();

        await _supabase.rpc('upsert_player_fingerprint', {
            p_fingerprint: fingerprint,
            p_components: components,
            p_user_agent: navigator.userAgent,
        });
    } catch (err) {
        // Silently fail — fingerprinting should never block gameplay
        console.warn('[fingerprint] Failed to record:', err.message);
    }
}

/**
 * Check if the current user is banned. Returns true if banned.
 */
export async function checkBanStatus() {
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) return false;

        const { data: bans } = await _supabase
            .from('player_bans')
            .select('id, reason, expires_at')
            .eq('user_id', user.id)
            .eq('is_active', true);

        if (!bans || bans.length === 0) return false;

        // Check if any ban is still valid (permanent or not yet expired)
        const now = new Date();
        const activeBan = bans.find(b => !b.expires_at || new Date(b.expires_at) > now);
        if (!activeBan) return false;

        return activeBan;
    } catch {
        return false;
    }
}

/**
 * Replace the entire page with a ban screen if the user is banned.
 */
export function enforceBan(ban) {
    const reason = ban.reason || 'Violation of game rules';
    const expires = ban.expires_at
        ? `Your ban expires on ${new Date(ban.expires_at).toLocaleDateString()}.`
        : 'This ban is permanent.';

    document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0a;color:#fff;font-family:monospace;padding:20px;">
            <div style="max-width:500px;text-align:center;">
                <h1 style="color:#f44;font-size:2em;margin-bottom:16px;">ACCOUNT SUSPENDED</h1>
                <p style="color:#ccc;font-size:1.1em;margin-bottom:12px;">Your account has been suspended for:</p>
                <p style="color:#fa0;font-size:1.2em;font-weight:bold;margin-bottom:20px;">${reason}</p>
                <p style="color:#888;font-size:0.9em;">${expires}</p>
                <p style="color:#555;font-size:0.8em;margin-top:30px;">If you believe this is an error, contact the game administrators.</p>
            </div>
        </div>
    `;
}
