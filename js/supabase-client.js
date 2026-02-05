/**
 * Supabase Client Setup
 * Shared across all dashboard pages
 */

const SUPABASE_URL = 'https://pbumjalxclmegzckhqqr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBidW1qYWx4Y2xtZWd6Y2tocXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODk0NTUsImV4cCI6MjA4NTM2NTQ1NX0.ykjUqdJbwF3yliond1Vz2lcNQZCWA-5SnviruXm4ypI';

// Initialize Supabase client
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Check if user is authenticated
 * Redirects to index.html if not
 * @returns {Promise<object|null>} User object or null
 */
async function requireAuth() {
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
async function handleLogout() {
    // Clear cached state
    sessionStorage.removeItem('nationhood_state');
    
    await _supabase.auth.signOut();
    window.location.href = 'index.html';
}
