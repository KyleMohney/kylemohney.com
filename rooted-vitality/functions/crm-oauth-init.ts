// @ts-nocheck
/**
 * Supabase Edge Function: CRM OAuth Initialization
 * POST /functions/v1/crm-oauth-init
 * 
 * Initializes OAuth flow for any CRM provider
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Dynamic import
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

type CRMAPIModule = {
  handleCRMOAuthInit: (req: any, res: any) => Promise<void>;
};

// @ts-ignore - Dynamic import
const crmAPI = (await import("../crm-integration-api.js")) as CRMAPIModule;

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: corsHeaders }
      );
    }

    const data = await req.json();
    
    // Create mock req/res objects for the API handler
    const mockRes: any = {
      statusCode: 200,
      body: null,
      json(data: any) {
        this.body = data;
        return this;
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      }
    };

    // Call the handler
    await crmAPI.handleCRMOAuthInit({ body: data }, mockRes);

    return new Response(JSON.stringify(mockRes.body), {
      status: mockRes.statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[CRM OAuth Init Edge Function] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});
