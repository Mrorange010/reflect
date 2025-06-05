import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};

// === SECURITY NOTE ===
// In production, avoid logging sensitive data (payloads, secrets, signatures).
// Only log minimal info for debugging and remove verbose logs after launch.

// Enhanced HMAC verification with better debugging
async function verifyHMAC(body: string, signature: string, secret: string) {
  console.log("=== HMAC DEBUG INFO ===");
  console.log("Body length:", body.length);
  console.log("Raw signature from header:", signature);
  console.log("Secret exists:", !!secret);
  console.log("Secret length:", secret?.length || 0);
  
  if (!signature || !secret) {
    console.log("Missing signature or secret");
    return false;
  }
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  
  // Try different signature formats
  const formats = [
    signature, // original
    signature.replace(/^sha256=/, ''), // remove sha256= prefix
    signature.replace(/^v1=/, ''), // remove v1= prefix (some services use this)
  ];
  
  for (const format of formats) {
    console.log(`Trying signature format: "${format}"`);
    
    try {
      let sigBytes;
      
      // Try hex decoding
      if (format.match(/^[0-9a-fA-F]+$/)) {
        console.log("Treating as hex");
        sigBytes = new Uint8Array(format.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      } else {
        console.log("Treating as base64");
        sigBytes = Uint8Array.from(atob(format).split('').map(c => c.charCodeAt(0)));
      }
      
      const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(body));
      console.log(`Format "${format}" result:`, valid);
      
      if (valid) {
        console.log("✅ Found working signature format!");
        return true;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log(`Format "${format}" failed:`, error.message);
      } else {
        console.log(`Format "${format}" failed with unknown error:`, error);
      }
    }
  }
  
  console.log("❌ All signature formats failed");
  return false;
}

serve(async (req) => {
  console.log("=== WEBHOOK CALLED ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("User-Agent:", req.headers.get("user-agent"));
  console.log("Content-Type:", req.headers.get("content-type"));
  console.log("Content-Length:", req.headers.get("content-length"));
  
  // Log ALL headers for debugging
  console.log("=== ALL HEADERS ===");
  for (const [key, value] of req.headers.entries()) {
    console.log(`${key}: ${value}`);
  }

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight");
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Simple ping endpoint for testing
  if (req.url.includes('/ping')) {
    console.log("Ping endpoint called");
    return new Response(JSON.stringify({ 
      message: "Webhook is alive!", 
      timestamp: new Date().toISOString() 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  if (req.method !== "POST") {
    console.log("Method not allowed:", req.method);
    return new Response("Method Not Allowed", { 
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  try {
    // Read raw body for signature verification
    const body = await req.text();
    console.log("Request body length:", body.length);
    console.log("Request body preview:", body.substring(0, 1000));
    
    // Check all possible signature header names
    const signature =
      req.headers.get("x-elevenlabs-signature") ||
      req.headers.get("ElevenLabs-Signature") ||
      req.headers.get("elevenlabs-signature");
    const secret = Deno.env.get("WEBHOOK_SECRET");
    
    console.log("Signature header:", signature);
    console.log("Has webhook secret:", !!secret);

    // Check if signature verification should be skipped
    const skipVerification = Deno.env.get("SKIP_WEBHOOK_VERIFICATION") === "true";
    
    if (skipVerification) {
      console.log("⚠️ SKIPPING signature verification (SKIP_WEBHOOK_VERIFICATION=true)");
    } else if (!signature || !secret) {
      console.log("⚠️ SKIPPING signature verification (missing signature or secret)");
    } else {
      console.log("🔒 Attempting signature verification");
      const isValid = await verifyHMAC(body, signature, secret);
      if (!isValid) {
        console.log("❌ Invalid signature - returning 401");
        return new Response(JSON.stringify({ 
          error: "Invalid signature",
          debug: {
            hasSignature: !!signature,
            hasSecret: !!secret,
            signaturePreview: signature?.substring(0, 20) + "...",
            bodyPreview: body.substring(0, 100),
            bodyLength: body.length
          }
        }), { 
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      console.log("✅ Signature verified successfully");
    }

    // Parse the JSON after verifying signature
    let payload;
    try {
      payload = JSON.parse(body);
      console.log("=== FULL PAYLOAD STRUCTURE ===");
      console.log(JSON.stringify(payload, null, 2));
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), { 
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Extract user_id from the correct location
    let user_id = null;
    if (payload.data?.dynamic_variables?.user_id) {
      user_id = payload.data.dynamic_variables.user_id;
      console.log("✅ Found user_id in dynamic_variables:", user_id);
    } else if (payload.data?.metadata?.user_id) {
      user_id = payload.data.metadata.user_id;
      console.log("✅ Found user_id in metadata:", user_id);
    } else if (payload.dynamic_variables?.user_id) {
      user_id = payload.dynamic_variables.user_id;
      console.log("✅ Found user_id in root dynamic_variables:", user_id);
    } else {
      console.error("❌ user_id not found in expected locations");
      console.log("Available data keys:", Object.keys(payload.data || {}));
      console.log("Dynamic variables:", payload.data?.dynamic_variables);
      console.log("Metadata:", payload.data?.metadata);
      return new Response(JSON.stringify({ 
        error: "user_id not found in webhook payload",
        available_keys: Object.keys(payload.data || {}),
        dynamic_variables: payload.data?.dynamic_variables,
        metadata: payload.data?.metadata
      }), { 
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Extract reflection data from analysis results (handle missing fields gracefully)
    const reflectionData = payload.data?.analysis?.data_collection_results || {};
    const week_start_date = reflectionData?.week_start_date?.value || null;
    const mood_score = reflectionData?.mood_score?.value || null;
    const energy_level = reflectionData?.energy_level?.value || null;
    const weekly_goals = reflectionData?.weekly_goals?.value || null;
    const challenges = reflectionData?.challenges?.value || null;
    const achievements = reflectionData?.achievements?.value || null;
    const weekend_plans = reflectionData?.weekend_plans?.value || null;
    const sentiment_summary = reflectionData?.sentiment_summary?.value || null;
    const notable_events = reflectionData?.notable_events?.value || null;
    const mood_score_reason = reflectionData?.mood_score_reason?.value || null;
    const energy_level_reason = reflectionData?.energy_level_reason?.value || null;
    const challenges_reason = reflectionData?.challenges_reason?.value || null;
    const weekly_goals_reason = reflectionData?.weekly_goals_reason?.value || null;
    const weekend_plans_reason = reflectionData?.weekend_plans_reason?.value || null;
    const sentiment_summary_reason = reflectionData?.sentiment_summary_reason?.value || null;
    const source_last_updated = reflectionData?.source_last_updated?.value || null;

    console.log("=== EXTRACTED VALUES ===");
    console.log({
      user_id,
      week_start_date,
      mood_score,
      energy_level,
      weekly_goals: weekly_goals || "missing",
      challenges: challenges || "missing",
      achievements: achievements || "missing"
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase credentials");
      return new Response(JSON.stringify({ error: "Server configuration error" }), { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Prepare insert data
    const insertData = {
      user_id,
      week_start_date,
      mood_score,
      energy_level,
      weekly_goals,
      challenges,
      achievements,
      weekend_plans,
      sentiment_summary,
      notable_events,
      mood_score_reason,
      energy_level_reason,
      challenges_reason,
      weekly_goals_reason,
      weekend_plans_reason,
      sentiment_summary_reason,
      source_last_updated,
      created_at: new Date().toISOString(),
    };
    
    console.log("=== DATA TO INSERT ===");
    console.log(JSON.stringify(insertData, null, 2));
    
    // Insert into database
    const { data, error } = await supabase
      .from("weekly_reflections")
      .insert([insertData])
      .select();

    if (error) {
      console.error("❌ Database error:", error);
      return new Response(JSON.stringify({ 
        error: "Database insertion failed",
        details: error.message,
        hint: error.hint 
      }), { 
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    console.log("✅ Successfully inserted data:", data);
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Weekly reflection saved successfully",
      data: data 
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    let errorMessage = "Internal server error";
    let errorStack = undefined;
    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack;
    }
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      message: errorMessage,
      stack: errorStack 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});