// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export default async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse practitioner ID from request
    const url = new URL(req.url);
    const practitionerId = url.searchParams.get("id");

    if (!practitionerId) {
      return new Response(
        JSON.stringify({
          error: "Practitioner ID required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch main practitioner data
    const { data: practitioner, error: practError } = await supabase
      .from("practitioners")
      .select("*")
      .eq("id", practitionerId)
      .single();

    if (practError || !practitioner) {
      return new Response(
        JSON.stringify({
          error: "Practitioner not found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch practitioner profile
    const { data: profile } = await supabase
      .from("practitioner_profiles")
      .select("*")
      .eq("practitioner_serial", practitioner.serial_number)
      .single();

    // Fetch practitioner credentials
    const { data: credentials } = await supabase
      .from("practitioner_credentials")
      .select("*")
      .eq("practitioner_serial", practitioner.serial_number)
      .single();

    // Fetch practitioner blocks
    const { data: blocks } = await supabase
      .from("practitioner_blocks")
      .select("*")
      .eq("practitioner_serial", practitioner.serial_number);

    // Fetch practitioner selected services
    const { data: services } = await supabase
      .from("practitioner_selected_services")
      .select("*")
      .eq("practitioner_serial", practitioner.serial_number);

    // Fetch memberships
    const { data: memberships } = await supabase
      .from("memberships")
      .select("*")
      .eq("practitioner_serial", practitioner.serial_number);

    // Fetch notification settings
    const { data: notificationSettings } = await supabase
      .from("practitioner_notification_settings")
      .select("*")
      .eq("practitioner_serial", practitioner.serial_number)
      .single();

    // Fetch reviews (get count and sample)
    const { data: reviews, count: reviewCount } = await supabase
      .from("reviews")
      .select("*", { count: "exact" })
      .eq("practitioner_serial", practitioner.serial_number)
      .limit(5);

    // Fetch matches (get count)
    const { count: matchCount } = await supabase
      .from("project_practitioner_matches")
      .select("*", { count: "exact", head: true })
      .eq("practitioner_serial", practitioner.serial_number);

    // Compile comprehensive response
    const response = {
      practitioner,
      profile: profile || {},
      credentials: credentials || {},
      blocks: blocks || [],
      services: services || [],
      memberships: memberships || [],
      notificationSettings: notificationSettings || {},
      reviews: {
        data: reviews || [],
        totalCount: reviewCount || 0,
      },
      matchCount: matchCount || 0,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching practitioner:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};
