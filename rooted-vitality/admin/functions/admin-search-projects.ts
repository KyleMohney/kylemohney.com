/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  Edge Function: admin-search-projects.ts                           ║
║  Purpose: Backend Project Search for Admin Panel                   ║
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
 * Main handler for admin project search
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const { query } = await req.json();

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize search query
    const searchQuery = query.trim().toLowerCase();

    // Search care requests (projects) by project_serial or id (UUID)
    const { data: projects, error: projectError } = await supabase
      .from('care_requests')
      .select('id, title, project_serial, status, client_id, created_at')
      .or(`project_serial.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%`)
      .limit(20);

    if (projectError && projectError.code !== 'PGRST116') {
      throw projectError;
    }

    // Get client names for display
    let results = projects || [];
    
    if (results.length > 0) {
      const clientIds = [...new Set(results.map(p => p.client_id))];
      
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, name')
          .in('id', clientIds);

        const clientMap = {};
        (clients || []).forEach(c => {
          clientMap[c.id] = c.name;
        });

        results = results.map(p => ({
          ...p,
          client_name: clientMap[p.client_id] || 'Unknown'
        }));
      }
    }

    // Format results
    const formattedResults = (results || []).map(p => ({
      id: p.id,
      title: p.title,
      serial: p.project_serial,
      client_name: p.client_name,
      status: p.status,
      created_at: p.created_at
    })).sort((a, b) => b.created_at.localeCompare(a.created_at));

    return new Response(
      JSON.stringify({ results: formattedResults }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[Admin Search Projects] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        results: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.status || 500
      }
    );
  }
});
