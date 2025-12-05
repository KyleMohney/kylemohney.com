// @ts-nocheck
/**
 * Supabase Edge Function: CRM OAuth Callback
 * GET /functions/v1/crm-oauth-callback
 * 
 * Handles OAuth callback from all CRM providers
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

type CRMAPIModule = {
  handleCRMOAuthCallback: (req: any, res: any) => Promise<Response>;
};

// @ts-ignore - Dynamic import
const crmAPI = (await import("../crm-integration-api.js")) as CRMAPIModule;

serve(async (req: Request) => {
  try {
    if (req.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405 }
      );
    }

    const url = new URL(req.url);
    const query: any = {
      code: url.searchParams.get("code"),
      state: url.searchParams.get("state"),
      error: url.searchParams.get("error"),
      error_description: url.searchParams.get("error_description")
    };

    // Create mock res object for redirect
    const mockRes: any = {
      redirect(path: string) {
        return new Response(null, {
          status: 302,
          headers: { Location: path }
        });
      }
    };

    // Call the handler
    return await crmAPI.handleCRMOAuthCallback({ query }, mockRes);

  } catch (error) {
    console.error("[CRM OAuth Callback Edge Function] Error:", error);
    return new Response(
      null,
      {
        status: 302,
        headers: { 
          Location: `/rooted-vitality/dashboard/pro/pages/settings.html?section=integrations&error=callback_error` 
        }
      }
    );
  }
});
