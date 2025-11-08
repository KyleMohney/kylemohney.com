/*
╔════════════════════════════════════════════════════════════════════╗
║  ROOTED VITALITY, INC.                                             ║
║  Supabase Edge Function: Send Error Report Email                   ║
║  Purpose: Handle user error report form submissions and send email  ║
║  Holistic Wellness · Modern Connection Platform                    ║
║  rootedvitality.com | 2025                                         ║
╚════════════════════════════════════════════════════════════════════╝
*/

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    const {
      ticketId,
      category,
      title,
      description,
      email,
      section,
      priority,
      device,
      userEmail,
      timestamp,
      userId,
      url,
      userAgent,
      referrer
    } = body;

    // Validate required fields
    if (!ticketId || !title || !description || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client (for potential logging)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || ""
    );

    // Prepare email content
    const emailContent = `
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #2e2b28; line-height: 1.6;">
    
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="background: linear-gradient(135deg, #5c9a72 0%, #4a8b62 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🚨 User Concern Report Received</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Ticket #${ticketId}</p>
      </div>

      <div style="background: white; padding: 30px; border: 1px solid #e8e6e3; border-top: none; border-radius: 0 0 12px 12px;">
        
        <div style="margin-bottom: 25px;">
          <p><strong>Category:</strong> ${getCategoryLabel(category)}</p>
          <p><strong>Priority Level:</strong> <span style="background: ${getPriorityColor(priority)}; color: white; padding: 4px 12px; border-radius: 4px; font-weight: 600;">${priority.toUpperCase()}</span></p>
        </div>

        <div style="border-left: 4px solid #5c9a72; padding-left: 15px; margin-bottom: 25px;">
          <h3 style="margin: 0 0 10px 0; color: #2e2b28;">Issue Title</h3>
          <p style="margin: 0; font-size: 16px; font-weight: 500;">${escapeHtml(title)}</p>
        </div>

        <div style="border-left: 4px solid #5c9a72; padding-left: 15px; margin-bottom: 25px;">
          <h3 style="margin: 0 0 10px 0; color: #2e2b28;">Description</h3>
          <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(description)}</p>
        </div>

        <div style="background: #fafaf9; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="margin: 0 0 15px 0; color: #2e2b28; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Report Details</h3>
          
          <div style="margin-bottom: 10px;">
            <p style="margin: 0; font-size: 13px;"><strong>User Email:</strong> ${escapeHtml(email)}</p>
          </div>
          
          <div style="margin-bottom: 10px;">
            <p style="margin: 0; font-size: 13px;"><strong>Page/Section:</strong> ${escapeHtml(section)}</p>
          </div>
          
          <div style="margin-bottom: 10px;">
            <p style="margin: 0; font-size: 13px;"><strong>Device/Browser:</strong> ${escapeHtml(device || 'Not provided')}</p>
          </div>
          
          <div style="margin-bottom: 10px;">
            <p style="margin: 0; font-size: 13px;"><strong>User ID:</strong> ${escapeHtml(userId)}</p>
          </div>
          
          <div style="margin-bottom: 10px;">
            <p style="margin: 0; font-size: 13px;"><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</p>
          </div>
          
          <div style="margin-bottom: 0;">
            <p style="margin: 0; font-size: 13px;"><strong>URL:</strong> <code style="background: white; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 12px; overflow-wrap: break-word;">${escapeHtml(url)}</code></p>
          </div>
        </div>

        <div style="border-top: 1px solid #e8e6e3; padding-top: 20px; font-size: 12px; color: #a8a39f;">
          <p style="margin: 0;">This is an automated report from the Rooted Vitality platform. Please investigate and follow up with the user if necessary. Check the CONCERNS_AND_ISSUES_LOG.md in the docs folder for tracking.</p>
        </div>

      </div>

    </div>

  </body>
</html>
    `;

    // For production, you would use a real email service like SendGrid, Resend, etc.
    // This example uses a placeholder - implement with your preferred email service
    
    // Example with Resend (popular for Supabase):
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (RESEND_API_KEY) {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "error-reports@rooted-vitality.com",
          to: "kylejmohney@gmail.com",
          subject: `USER ERROR REPORT [${ticketId}] - ${title}`,
          html: emailContent,
          reply_to: email,
        }),
      });

      if (!resendResponse.ok) {
        const error = await resendResponse.text();
        console.error("Resend API error:", error);
        throw new Error("Failed to send email");
      }
    } else {
      // Fallback: log to console (useful for development)
      console.log(`Email would be sent to: kylejmohney@gmail.com`);
      console.log(`Ticket: ${ticketId}`);
      console.log(`Title: ${title}`);
      console.log(`Reply-To: ${email}`);
    }

    // Log the report to Supabase for record keeping
    try {
      const { error: insertError } = await supabaseClient
        .from("error_reports")
        .insert({
          ticket_id: ticketId,
          category: category,
          title: title,
          description: description,
          email: email,
          section: section,
          priority: priority,
          device: device,
          id: userId,
          url: url,
          timestamp: timestamp,
          user_agent: userAgent,
          referrer: referrer,
          resolved: false,
        });

      if (insertError) {
        console.warn("Could not log report to database:", insertError);
      }
    } catch (dbError) {
      console.warn("Database logging failed (non-critical):", dbError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticketId: ticketId,
        message: "Error report submitted successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getPriorityColor(priority) {
  switch (priority.toLowerCase()) {
    case "critical":
      return "#c84c5c";
    case "high":
      return "#d4a574";
    case "medium":
      return "#5c9a72";
    case "low":
      return "#a8a39f";
    default:
      return "#5c9a72";
  }
}

function getCategoryLabel(category) {
  const labels = {
    "technical-issue": "🐛 Technical Issue / Bug",
    "malfunction": "⚙️ Feature Malfunction",
    "performance": "⚡ Performance Issue",
    "ui-problem": "🎨 UI/UX Problem",
    "content-issue": "📝 Content Error",
    "security-concern": "🔒 Security Concern",
    "other": "📌 Other"
  };
  return labels[category] || category;
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
