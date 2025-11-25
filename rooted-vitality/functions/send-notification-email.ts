// Supabase Edge Function: send-notification-email
// Deploy to: supabase edge functions
// Path: supabase/functions/send-notification-email/index.ts

// @ts-ignore - Deno global type
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
// @ts-ignore - Remote module import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  type?: string;
}

interface ResendResponse {
  id: string;
  [key: string]: unknown;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-id, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, html, type } = (await req.json()) as EmailRequest;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[Email] Sending ${type || 'notification'} email to: ${to}`);

    // Get RESEND_API_KEY from environment variables
    // Set this in Supabase project settings
    // @ts-ignore - Deno global
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.error("[Email] RESEND_API_KEY not configured in environment");
      return new Response(
        JSON.stringify({
          error: "Email service not configured",
          message: "Set RESEND_API_KEY in Supabase project settings",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send email via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Rooted Vitality <support@rootedvitality.health>",
        to: to,
        subject: subject,
        html: html,
        reply_to: "support@rootedvitality.health",
      }),
    });

    const resendData = (await resendResponse.json()) as ResendResponse;

    if (!resendResponse.ok) {
      console.error(
        `[Email] Resend API error for ${to}:`,
        resendData
      );
      return new Response(JSON.stringify(resendData), {
        status: resendResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Email] Successfully sent to ${to}, message ID: ${resendData.id}`);

    // Log email to database for audit trail
    // @ts-ignore - Deno global and Supabase env vars
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get("SUPABASE_URL") || "",
      // @ts-ignore
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    try {
      await supabaseClient.from("email_logs").insert({
        recipient: to,
        subject: subject,
        type: type || "notification",
        status: "sent",
        resend_id: resendData.id,
        sent_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.warn("[Email] Could not log email to database:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        resend_id: resendData.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Email] Exception:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
