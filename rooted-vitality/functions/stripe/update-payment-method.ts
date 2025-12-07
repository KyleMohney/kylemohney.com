/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  Edge Function: update-payment-method                              ║
║  Purpose: Create Stripe billing portal session for payment updates ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import Stripe from "https://esm.sh/stripe@12.16.0?target=deno";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  // @ts-ignore
  Deno.env.get("SUPABASE_URL") || "",
  // @ts-ignore
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { practitioner_id } = await req.json();

    if (!practitioner_id) {
      return new Response(
        JSON.stringify({ error: "Missing practitioner_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get Stripe customer ID from database
    const { data: membership, error: dbError } = await supabase
      .from("memberships")
      .select("stripe_customer_id")
      .eq("practitioner_id", practitioner_id)
      .eq("status", "active")
      .single();

    if (dbError || !membership?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "No active membership found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: membership.stripe_customer_id,
      return_url: `${// @ts-ignore
Deno.env.get("SUPABASE_URL")}/dashboard/pro/pages/settings.html?tab=memberships`,
    });

    return new Response(
      JSON.stringify({ portal_url: session.url }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
