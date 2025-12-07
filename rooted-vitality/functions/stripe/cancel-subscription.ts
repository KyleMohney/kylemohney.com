/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  Edge Function: cancel-subscription                                ║
║  Purpose: Cancel practitioner membership subscription              ║
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

    // Get subscription ID from database
    const { data: membership, error: dbError } = await supabase
      .from("memberships")
      .select("stripe_subscription_id")
      .eq("practitioner_id", practitioner_id)
      .eq("status", "active")
      .single();

    if (dbError || !membership?.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ error: "No active subscription found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Cancel subscription in Stripe
    await stripe.subscriptions.del(membership.stripe_subscription_id);

    // Update database via SQL function
    const { error: updateError } = await supabase
      .rpc("cancel_subscription", { p_practitioner_id: practitioner_id });

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Subscription cancelled" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
