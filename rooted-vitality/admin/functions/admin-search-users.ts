/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  Edge Function: admin-search-users.ts                              ║
║  Purpose: Backend User Search for Admin Panel                      ║
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
 * Main handler for admin user search
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

    // Search practitioners by name, email, phone
    const { data: practitioners, error: practitionerError } = await supabase
      .from('practitioners')
      .select('id, name, email, phone, practitioner_serial, created_at')
      .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,practitioner_serial.ilike.%${searchQuery}%`)
      .limit(20);

    if (practitionerError && practitionerError.code !== 'PGRST116') {
      throw practitionerError;
    }

    // Search clients by name, email, phone, serial, uuid
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name, email, phone, client_serial, created_at')
      .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,client_serial.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%`)
      .limit(20);

    if (clientError && clientError.code !== 'PGRST116') {
      throw clientError;
    }

    // Combine and format results
    const results = [
      ...(practitioners || []).map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        serial: p.practitioner_serial,
        user_type: 'practitioner',
        created_at: p.created_at
      })),
      ...(clients || []).map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        serial: c.client_serial,
        user_type: 'client',
        created_at: c.created_at
      }))
    ].sort((a, b) => b.created_at.localeCompare(a.created_at));

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[Admin Search] Error:', error);
    
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
