/**
 * Supabase Client Setup
 * Shared across all dashboard pages
 *
 * Environment-aware: reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * from .env.main or .env.work depending on the Vite mode.
 * Fallback to hardcoded production values for non-Vite contexts (e.g. direct file open).
 */

const SUPABASE_ESM_URL = 'https://esm.sh/@supabase/supabase-js@2';

function surfaceSupabaseLoadError(message) {
    if (typeof document === 'undefined') {
        return;
    }

    const authError = document.getElementById('auth-error');
    if (!authError) {
        return;
    }

    authError.textContent = message;
    authError.style.display = 'block';
}

async function resolveCreateClient() {
    if (typeof globalThis.supabase?.createClient === 'function') {
        return globalThis.supabase.createClient;
    }

    try {
        const module = await import(/* @vite-ignore */ SUPABASE_ESM_URL);
        if (typeof module.createClient === 'function') {
            return module.createClient;
        }
    } catch (error) {
        console.error('Supabase ESM import failed:', error);
    }

    surfaceSupabaseLoadError('Supabase client failed to load');
    throw new Error('Supabase client failed to load');
}

// Environment detection — Vite statically replaces import.meta.env at build/dev time
const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL)
    || 'https://pbumjalxclmegzckhqqr.supabase.co';
const SUPABASE_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY)
    || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBidW1qYWx4Y2xtZWd6Y2tocXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODk0NTUsImV4cCI6MjA4NTM2NTQ1NX0.ykjUqdJbwF3yliond1Vz2lcNQZCWA-5SnviruXm4ypI';

export const APP_ENV = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_ENV) || 'main';
export const IS_WORK_ENV = APP_ENV === 'work';

const createClient = await resolveCreateClient();

// Initialize Supabase client
export const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Check if user is authenticated
 * Redirects to index.html if not
 * @returns {Promise<object|null>} User object or null
 */
export async function requireAuth() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    return user;
}

/**
 * Handle logout
 */
export async function handleLogout() {
    // Clear cached state
    sessionStorage.removeItem('nationhood_state');

    await _supabase.auth.signOut();
    window.location.href = 'https://www.nationhoodgame.com';
}
