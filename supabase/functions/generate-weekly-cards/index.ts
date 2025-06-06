import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://deno.land/x/openai@v4.52.7/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

/**
 * Build an AI prompt that includes:
 *  - This week’s reflection
 *  - Last week’s reflection
 *  - Daily logs
 * and asks for four cards:
 *   • advice1, advice2, advice3 (each exactly one sentence)
 *   • mood_energy (can be up to two sentences)
 */
function createAIPrompt(
  thisWeek: any,
  lastWeek: any | null,
  dailyLogs: any[]
): string {
  const thisWeekStr = JSON.stringify(thisWeek, null, 2);
  const lastWeekStr = lastWeek ? JSON.stringify(lastWeek, null, 2) : "null";

  const dailyLogsSummary = dailyLogs.map((log) => ({
    date: log.log_date,
    mood: log.mood_score,
    challenges: log.challenges,
    events: log.notable_events,
  }));
  const dailySummaryStr = JSON.stringify(dailyLogsSummary, null, 2);

  return `
You are an empathetic, actionable‐advice AI coach named Ava. 
Given:
  • This Week’s Reflection (JSON object)
  • Last Week’s Reflection (JSON object, or null if none)
  • Daily Logs (list of {date, mood 0–10, challenges, events})

Generate exactly FOUR cards, each with a “title” (5–7 words max) and “content”:
  1. advice1: one sentence of coaching based on this week’s data
  2. advice2: one sentence of coaching
  3. advice3: one sentence of coaching
  4. mood_energy: up to TWO sentences strictly about how this week’s mood & energy compare to last week’s, with actionable suggestion(s)

**This Week’s Reflection:**
${thisWeekStr}

**Last Week’s Reflection:**
${lastWeekStr}

**Daily Logs (past week) [date, mood 0–10, challenges, events]:**
${dailySummaryStr}

Instructions:
• For advice1/2/3: content must be exactly one sentence each (concise, empathetic).
  Use mood_score, energy_level, achievements, challenges, weekend_plans, emotional_tags, notable_events, reflection_quality, summary, coaching_prompts† from this week, plus daily logs for context.
• For mood_energy: content may be one or two sentences. Compare this week’s mood_score and energy_level to last week’s. If both dropped or one dropped, recommend a clear action (e.g. short walk or rest). If they stayed flat or improved, acknowledge that and suggest next step. If lastWeek is null, comment on this week’s levels only.
• title: short (5–7 words). content: respect the sentence counts above.
• Return one minified JSON object with keys: advice1, advice2, advice3, mood_energy. Do NOT include any extra text.

† Available fields in weekly_reflections: mood_score, energy_level, achievements, challenges, weekend_plans, emotional_tags, notable_events, reflection_quality, summary, coaching_prompts.

Example format:
{"advice1":{"title":"Take A Short Mental Break","content":"Several logs show stress—step away for 10 minutes today to breathe deeply and stretch."},"advice2":{"title":"Try A Quick Afternoon Walk","content":"Your mood dipped midweek; a 15-minute walk could help reset your energy."},"advice3":{"title":"Prioritize Rest After Travel","content":"You traveled this week—consider going to bed 30 minutes earlier tonight to aid recovery."},"mood_energy":{"title":"Energy Down, Mood Steady","content":"Your energy is slightly lower than last week while mood remains level; consider scheduling a relaxing hobby this evening to recharge. You’ve stayed consistent in mood, so building in small breaks may prevent a further dip in energy."}}
`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, weekStartDate } = await req.json();
    if (!userId || !weekStartDate) {
      return new Response(
        JSON.stringify({ error: "userId and weekStartDate are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Fetch this week’s reflection
    const { data: thisWeekReflection, error: thisWeekError } =
      await supabaseAdminClient
        .from("weekly_reflections")
        .select("*")
        .eq("user_id", userId)
        .eq("week_start_date", weekStartDate)
        .single();

    if (thisWeekError || !thisWeekReflection) {
      throw new Error(
        `Failed to fetch this week’s reflection: ${thisWeekError?.message || "Not found"}`
      );
    }

    // 2. Fetch last week’s reflection
    const { data: lastWeekArray } = await supabaseAdminClient
      .from("weekly_reflections")
      .select("*")
      .eq("user_id", userId)
      .lt("week_start_date", weekStartDate)
      .order("week_start_date", { ascending: false })
      .limit(1);

    const prevWeeklyReflection =
      lastWeekArray && lastWeekArray.length > 0 ? lastWeekArray[0] : null;

    // 3. Fetch daily logs for this week
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    const { data: dailyLogs, error: dailyLogError } =
      await supabaseAdminClient
        .from("daily_logs")
        .select("log_date, mood_score, notable_events, challenges")
        .eq("user_id", userId)
        .gte("log_date", weekStartDate)
        .lte("log_date", weekEndDate.toISOString().split("T")[0]);

    if (dailyLogError) {
      throw new Error(`Failed to fetch daily logs: ${dailyLogError.message}`);
    }

    // 4. Build and send AI prompt
    const prompt = createAIPrompt(
      thisWeekReflection,
      prevWeeklyReflection,
      dailyLogs || []
    );

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const aiResponse = chatCompletion.choices[0].message?.content;
    if (!aiResponse) {
      throw new Error("Failed to get a valid response from OpenAI.");
    }

    // 5. Parse the JSON response
    const cardsData = JSON.parse(aiResponse);
    // Expecting: { advice1: {title, content}, advice2: {...}, advice3: {...}, mood_energy: {title, content} }

    // 6. Upsert into weekly_cards
    const insertData: Record<string, any> = {
      user_id: userId,
      week_start_date: weekStartDate,
      // Advice1
      advice1_title: cardsData.advice1.title,
      advice1_content: cardsData.advice1.content,
      // Advice2
      advice2_title: cardsData.advice2.title,
      advice2_content: cardsData.advice2.content,
      // Advice3
      advice3_title: cardsData.advice3.title,
      advice3_content: cardsData.advice3.content,
      // Mood & Energy (now up to 2 sentences)
      mood_energy_title: cardsData.mood_energy.title,
      mood_energy_content: cardsData.mood_energy.content,
    };

    const { error: insertError } = await supabaseAdminClient
      .from("weekly_cards")
      .upsert(insertData, { onConflict: "user_id, week_start_date" });

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw new Error(`Database insertion failed: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Weekly coaching cards (including mood & energy with up to 2 sentences) generated successfully.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in Edge Function:", error);
    const errorMsg =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
