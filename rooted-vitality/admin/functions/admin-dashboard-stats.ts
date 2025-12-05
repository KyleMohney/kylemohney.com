/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  Edge Function: admin-dashboard-stats.ts                           ║
║  Purpose: Get complete dashboard statistics bypassing RLS          ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Main handler for admin dashboard statistics
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase admin client with SERVICE ROLE (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get counts for all entities (service role bypasses RLS)
    const [practCount, clientCount, projectCount, hiredCount] = await Promise.all([
      // Total practitioners
      supabase
        .from('practitioners')
        .select('*', { count: 'exact', head: true }),
      
      // Total clients
      supabase
        .from('clients')
        .select('*', { count: 'exact', head: true }),
      
      // Total projects
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true }),
      
      // Total hired projects (projects with hired_practitioner_serial not null)
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .not('hired_practitioner_serial', 'is', null),
    ]);

    return new Response(
      JSON.stringify({
        practitioners: practCount.count || 0,
        clients: clientCount.count || 0,
        projects: projectCount.count || 0,
        hired: hiredCount.count || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[admin-dashboard-stats] Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
