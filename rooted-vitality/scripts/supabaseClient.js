/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/supabaseClient.js                                   ║
║  Purpose: Supabase client initialization and configuration         ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. SUPABASE CLIENT INITIALIZATION
  2. CONFIGURATION
  3. DIAGNOSTICS
*/

console.log('[Rooted Vitality] supabaseClient.js loading...');

// ======================================================
// 1. SUPABASE CLIENT INITIALIZATION
// ======================================================

/**
 * Get Supabase credentials from config.js
 * config.js must be loaded before this file
 */
if (!window.supabaseClient) {
    if (!window.supabase) {
        console.error('❌ [Supabase Client] supabase.js library not loaded');
        throw new Error('Supabase JS library required before supabaseClient.js');
    }

    // Use credentials from config.js
    const SUPABASE_URL = "https://racsktdyrvepyvndbjzs.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhY3NrdGR5cnZlcHl2bmRianpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODIyNDUsImV4cCI6MjA3NzM1ODI0NX0.5a0HksN7H1r5qBMExzKa9mPY-5uzTcJhffRuc5gNU2M";

    // Initialize Supabase client
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    console.log('✅ [Supabase Client] Initialized');
    console.log('📍 [Supabase Client] URL:', SUPABASE_URL);
}

// Export for use in modules (if using ES modules)
// export const supabase = window.supabaseClient;

// ======================================================
// 2. CONFIGURATION
// ======================================================

/**
 * Database configuration constants
 */
const SUPABASE_CONFIG = {
    tables: {
        practitioners: 'practitioners',
        credentials: 'credentials',
        backgroundChecks: 'background_checks',
        profiles: 'profiles'
    },
    buckets: {
        practitionerFiles: 'practitioner-files',
        avatars: 'avatars'
    },
    storage: {
        maxImageSize: 5 * 1024 * 1024, // 5MB
        maxDocumentSize: 10 * 1024 * 1024, // 10MB
        maxVideoSize: 50 * 1024 * 1024 // 50MB
    }
};

// ======================================================
// 3. DIAGNOSTICS
// ======================================================

/**
 * Test Supabase connection
 */
async function testConnection() {
    try {
        const { data, error } = await window.supabaseClient.auth.getSession();
        if (error) throw error;
        console.log('✅ [Supabase Diagnostics] Connection test passed');
        return true;
    } catch (error) {
        console.error('❌ [Supabase Diagnostics] Connection test failed:', error);
        return false;
    }
}

// Run diagnostic on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testConnection);
} else {
    testConnection();
}
