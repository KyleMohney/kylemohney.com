/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  Edge Function: stripe-webhook                                     ║
║  Purpose: Webhook endpoint for Stripe events                       ║
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

// @ts-ignore
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature || "", webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response("Webhook Error: Invalid signature", { status: 400 });
    }

    // Extract subscription and invoice data
    let stripeCustomerId = "";
    let stripeSubscriptionId = "";
    let currentPeriodEnd: string | null = null;
    let eventType = event.type;

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        stripeCustomerId = (event.data.object as Stripe.Subscription).customer as string;
        stripeSubscriptionId = (event.data.object as Stripe.Subscription).id;
        if ((event.data.object as Stripe.Subscription).current_period_end) {
          currentPeriodEnd = new Date((event.data.object as Stripe.Subscription).current_period_end! * 1000).toISOString();
        }
        break;

      case "invoice.payment_succeeded":
      case "invoice.payment_failed":
        stripeCustomerId = (event.data.object as Stripe.Invoice).customer as string;
        if ((event.data.object as Stripe.Invoice).subscription) {
          stripeSubscriptionId = (event.data.object as Stripe.Invoice).subscription as string;
        }
        if ((event.data.object as Stripe.Invoice).period_end) {
          currentPeriodEnd = new Date((event.data.object as Stripe.Invoice).period_end! * 1000).toISOString();
        }
        break;

      case "customer.subscription.deleted":
        stripeCustomerId = (event.data.object as Stripe.Subscription).customer as string;
        stripeSubscriptionId = (event.data.object as Stripe.Subscription).id;
        break;

      default:
        return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Call database function to handle webhook
    if (stripeCustomerId) {
      const { error: rpcError } = await supabase.rpc("handle_stripe_webhook", {
        p_event_type: eventType,
        p_stripe_customer_id: stripeCustomerId,
        p_stripe_subscription_id: stripeSubscriptionId || null,
        p_current_period_end: currentPeriodEnd,
      });

      if (rpcError) {
        console.error("RPC error calling handle_stripe_webhook:", rpcError);
        // Still return 200 so Stripe doesn't retry
      } else {
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
