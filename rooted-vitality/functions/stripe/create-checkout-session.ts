/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  Edge Function: create-checkout-session                            ║
║  Purpose: Create Stripe checkout session for membership activation ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import Stripe from "https://esm.sh/stripe@12.16.0?target=deno";

// @ts-ignore
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

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

    // First month free ($0), then $222/month recurring
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: "", // Will be populated by frontend if needed
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Rooted Vitality Professional Membership",
              description: "First month free, then $222/month",
            },
            recurring: {
              interval: "month",
              interval_count: 1,
            },
            unit_amount: 22200, // $222.00 in cents
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          practitioner_id: practitioner_id,
        },
      },
      success_url: `${// @ts-ignore
Deno.env.get("SUPABASE_URL")}/dashboard/pro/pages/settings.html?tab=memberships&checkout=success`,
      cancel_url: `${// @ts-ignore
Deno.env.get("SUPABASE_URL")}/dashboard/pro/pages/settings.html?tab=memberships&checkout=cancelled`,
      metadata: {
        practitioner_id: practitioner_id,
      },
    });

    return new Response(
      JSON.stringify({ checkout_url: session.url }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
