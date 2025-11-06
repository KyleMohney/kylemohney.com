/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  File: scripts/config.js                                           ║
║  Purpose: Supabase Authentication Configuration                    ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝

TABLE OF CONTENTS
  1. EMAIL CONFIGURATION (TEMPORARY GMAIL SMTP)
  2. SUPABASE CLIENT INITIALIZATION
  3. ENVIRONMENT SETUP INSTRUCTIONS
  4. API KEY MANAGEMENT
*/

console.log('[Rooted Vitality] config.js loading...');

// ======================================================
// 1. EMAIL CONFIGURATION (TEMPORARY GMAIL SMTP)
// ======================================================

/**
 * TEMPORARY EMAIL SENDER CONFIGURATION
 * 
 * Current Status: Personal Gmail SMTP (temporary)
 * Sender Email: kylejmohney@gmail.com
 * Future: Support@rooted-vitality.com (Google Workspace)
 * 
 * SUPABASE EMAIL SMTP SETTINGS:
 * 
 * To configure email verification in Supabase Dashboard:
 * 
 * 1. Go to: Authentication → Settings → SMTP Configuration
 * 
 * 2. Enter these values:
 *    SMTP Host: smtp.gmail.com
 *    SMTP Port: 587
 *    SMTP Username: kylejmohney@gmail.com
 *    SMTP Password: [Gmail App Password - NOT account password]
 *    Sender Name: Rooted Vitality Support
 *    Sender Email: kylejmohney@gmail.com
 * 
 * 3. Generate Gmail App Password:
 *    a) Go to myaccount.google.com
 *    b) Enable 2-Factor Authentication (if not already done)
 *    c) Go to myaccount.google.com/apppasswords
 *    d) Select "Mail" and "Windows Computer"
 *    e) Copy the 16-character app password
 *    f) Paste into Supabase SMTP Password field
 * 
 * 4. Test Connection in Supabase dashboard
 * 
 * FUTURE MIGRATION PATH:
 * 
 * When ready to use support@rooted-vitality.com:
 * 
 * 1. Set up Google Workspace account (or Postmark)
 * 2. Verify domain with SPF/DKIM records
 * 3. Update Supabase SMTP settings:
 *    SMTP Username: support@rooted-vitality.com
 *    SMTP Password: [Workspace/Postmark credentials]
 *    Sender Email: support@rooted-vitality.com
 * 4. Test new configuration
 * 5. No code changes required - this config.js file stays the same
 * 
 * EMAIL TEMPLATES IN SUPABASE:
 * 
 * The following templates are already configured with Rooted Vitality branding:
 * 
 * - Confirm Signup: Uses EMAIL_VERIFICATION_TEMPLATE.html
 *   Template Variable: {{ .ConfirmationURL }}
 *   Redirects to: /welcome.html after email confirmation
 * 
 * - Reset Password: Similar Rooted Vitality branding
 *   Template Variable: {{ .RecoveryURL }}
 *   For users who click "Forgot password?" in login modal
 * 
 * To update email templates in Supabase:
 * 1. Authentication → Templates
 * 2. Select template to edit
 * 3. Paste HTML from /docs/EMAIL_VERIFICATION_TEMPLATE.html
 * 4. Click Save
 */

// ======================================================
// 2. SUPABASE CLIENT INITIALIZATION
// ======================================================

/**
 * IMPORTANT: Replace these values with your Supabase project credentials
 * 
 * To get your credentials:
 * 1. Go to supabase.com and create a new project (or use existing)
 * 2. Navigate to Project Settings → API
 * 3. Copy the Project URL and Public Anon Key
 * 4. Paste them below in the respective placeholders
 * 
 * Project URL example: https://xxxxxxxxxx.supabase.co
 * Public Anon Key example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

const SUPABASE_URL = "https://racsktdyrvepyvndbjzs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhY3NrdGR5cnZlcHl2bmRianpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODIyNDUsImV4cCI6MjA3NzM1ODI0NX0.5a0HksN7H1r5qBMExzKa9mPY-5uzTcJhffRuc5gNU2M";

// ======================================================
// Initialize Supabase Client
// ======================================================
console.log('🔄 [Rooted Vitality] config.js loading Supabase...');

if (!window.supabase) {
    console.error('❌ [Rooted Vitality] supabase.js library not loaded. Make sure to include Supabase JS library before config.js');
    throw new Error('Supabase JS library required');
}

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

console.log('✅ [Rooted Vitality] Supabase client initialized with localStorage persistence');
console.log('📍 [Rooted Vitality] Supabase URL:', SUPABASE_URL);

// ======================================================
// Connection Test & Diagnostics
// ======================================================
// Test Supabase connection by checking auth status

// ======================================================
// 3. ENVIRONMENT SETUP INSTRUCTIONS
// ======================================================

/**
 * SETUP CHECKLIST:
 * 
 * [ ] Create Supabase account at https://supabase.com
 * [ ] Create new project or use existing
 * [ ] Add Project URL and Anon Key to this file (lines 28-29)
 * [ ] Create "profiles" table in Supabase SQL editor:
 * 
 *     create table profiles (
 *       id uuid primary key references auth.users(id),
 *       email text unique,
 *       role text check (role in ('client', 'practitioner')),
 *       created_at timestamp default now(),
 *       updated_at timestamp default now()
 *     );
 * 
 * [ ] Enable Row-Level Security on profiles table
 * [ ] Add RLS policy in Supabase (see section 3 below)
 * [ ] Enable Email/Password authentication in Supabase Auth
 * [ ] Test login with test@example.com / password123
 * [ ] Deploy to production
 * 
 * SECURITY WARNING:
 * - Never commit this file with real API keys to public repositories
 * - Use environment variables in production:
 *   process.env.SUPABASE_URL
 *   process.env.SUPABASE_ANON_KEY
 * - Consider using secrets management system
 * - Rotate keys periodically
 */

// ======================================================
// 4. API KEY MANAGEMENT
// ======================================================

/**
 * SUPABASE RLS POLICY SQL:
 * 
 * Enable Row-Level Security on profiles table, then add this policy:
 * 
 * create policy "Users can view and update own profile"
 * on profiles
 * for all
 * using (auth.uid() = id)
 * with check (auth.uid() = id);
 * 
 * This ensures users can only access their own profile data.
 * 
 * 
 * COMPLETE SUPABASE SETUP SQL SCRIPT:
 * 
 * -- Create profiles table
 * create table profiles (
 *   id uuid primary key references auth.users(id) on delete cascade,
 *   email text unique,
 *   role text check (role in ('client', 'practitioner')),
 *   created_at timestamp default now(),
 *   updated_at timestamp default now()
 * );
 * 
 * -- Enable RLS
 * alter table profiles enable row level security;
 * 
 * -- Create RLS policy
 * create policy "Users can view and update own profile"
 * on profiles
 * for all
 * using (auth.uid() = id)
 * with check (auth.uid() = id);
 * 
 * -- Create function for new user signup
 * create or replace function public.handle_new_user()
 * returns trigger
 * language plpgsql
 * security definer set search_path = public
 * as $$
 * begin
 *   insert into public.profiles (id, email)
 *   values (new.id, new.email);
 *   return new;
 * end;
 * $$;
 * 
 * -- Create trigger for new signups
 * create trigger on_auth_user_created
 *   after insert on auth.users
 *   for each row execute procedure public.handle_new_user();
 */

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    };
}

console.log('[Rooted Vitality] config.js ready');

// End of config.js — Rooted Vitality Supabase Configuration
