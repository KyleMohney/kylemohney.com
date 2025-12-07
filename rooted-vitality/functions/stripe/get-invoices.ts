/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  Edge Function: get-invoices                                       ║
║  Purpose: Fetch payment invoices from Stripe                       ║
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
    const { stripe_customer_id } = await req.json();

    if (!stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "Missing stripe_customer_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: stripe_customer_id,
      limit: 12,
      status: "paid",
    });

    // Transform invoices for UI display
    const formattedInvoices = invoices.data.map((invoice: any) => ({
      id: invoice.id,
      created: invoice.created,
      total: invoice.total,
      status: invoice.status,
      invoice_pdf: invoice.invoice_pdf,
      paid_at: invoice.paid_at,
    }));

    return new Response(
      JSON.stringify({ invoices: formattedInvoices }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
