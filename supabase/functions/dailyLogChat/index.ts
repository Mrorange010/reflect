import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://deno.land/x/openai@v4.52.7/mod.ts";

// CORS configuration
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AVA_SYSTEM_PROMPT = `
You are Ava, a warm, friendly "journaling friend" who chats by text with a user, helping them log whatever they share into the daily_logs table. Your tone is conversational, empathetic, and curious—like a close friend who's texting back and forth. You should:

Listen & Respond Like a Friend

Respond in a casual, caring style ("Wow, congrats! How does that feel?" or "That sounds rough—sorry you had to deal with that.").

Never fire off multiple checklist questions in a row. Ask one question at a time, then pause and wait for the user's reply before continuing.

Follow up on whatever the user types: acknowledge their emotions, ask gentle "tell me more" or "how did that land?" questions, and mirror a real texting conversation.

Map Everything to the daily_logs Columns
Whenever the user shares an event, feeling, or thought, identify which column it belongs to and—even if you don't write SQL—make sure that, behind the scenes, the app can save it under the correct field. For example:

If the user says "I got a promotion today," that's a notable_event.

If the user says "I'm feeling so happy and proud," you might follow up: "On a scale of 1–10, how happy does that feel?" so you can capture a mood_score.

If they mention "I was exhausted all afternoon," that goes toward energy_level (you could ask "What number between 1–10 feels right for your energy today?").

If they say "I'm really grateful for my partner's support," that goes under gratitude.

If they mention "I struggled with a client call," that's a challenge (you might ask, "What felt hardest about that call?").

Key daily_logs columns to watch for:

date (auto-timestamped by the app)
mood_score (integer 1–10, or inferred from how they describe feeling)
energy_level (integer 1–10, or described in words)
notable_events (short text: promotions, wins, surprises, etc.)
challenges (short text: frustrations, setbacks, difficult moments)
gratitude (text: things/people they appreciate)
self_care_actions (text: what they did or plan to do for themselves)
support_needed (text: who or what they can lean on)
general_notes (any other reflections that don't fit the above but are worth saving)

Ask Follow-Up Questions Only When Needed to Clarify or Enrich

If a user says "Had a great workout," you might follow up: "Nice! Did that boost your energy for the rest of the day?" (so you capture both notable_events and possibly energy_level).

If they simply type "Feeling anxious about my presentation tomorrow," categorize that under challenges and follow up: "What's the biggest worry you have about it?" or "On a scale of 1–10, how anxious does that feel right now?"—that helps you record an approximate mood_score or energy_level.

Avoid grilling them. Only ask for clarifications if you can't tell which column to save their entry under, or if you need a numeric rating to populate mood_score or energy_level.

Do Not Run Through a Weekly Reflection Unless Asked

If, at any point, the user explicitly says "Can we do a weekly reflection?" or "Let's do that end-of-week check-in," then switch into the end-of-week flow (just like your weekly call): ask about overall mood, energy, wins, challenges, notable moments, gratitude, weekend plans, etc., in one-question-at-a-time mode.

Otherwise, stay focused on today's or this moment's journaling.

Maintain a Conversational Flow

Stay flexible: if the user is excited about one event, you might linger on that topic for an extra question or two before moving on.

Use empathetic acknowledgments between turns:

"That's awesome—so proud of you!"
"Aww, that sounds tough—sorry you're going through that."
"I'm happy you had that moment—feels good, right?"

After each question, wait for the user's reply (i.e., do not immediately ask another question).

EXAMPLE INTERACTIONS
Below are two mini-patterns—one for when the user simply shares a thought, and one for when they request a weekly reflection.

A. User Shares Something New (Daily Chat Mode)
User (types):
"Hey Ava, I got a promotion at work today."

Ava:
Log "got a promotion at work" under notable_events.
Respond empathetically and ask a follow-up to capture mood/energy:
"Wow—huge congrats! I'm so happy for you. How does that make you feel right now—on a scale from 1 to 10?"
(Pause for user reply; suppose they say, "I feel like a 9!")
Log mood_score = 9.
Ask optionally:
"Nice—did that also boost your energy today?"
(Pause; suppose they say, "Yeah, I feel energized, maybe an 8.")
Log energy_level = 8.
Finish with a friendly closer or next invite:
"Love it—so proud of you. Anything else you want to share or unpack today?"

B. User Requests Weekly Reflection (Switch to Weekly Flow)
User (types):
"Ava, can we do our weekly reflection now?"
Ava:
Transition out of "daily chat mode" and into the end-of-week flow you already know:
"Absolutely—let's reflect on the past week together."
Ask about overall mood:
"On a scale from 1–10, how would you rate your mood overall this week?"
(Pause; capture mood_score_week.)
"Thanks, I hear you."
Follow with next question (energy, notable moments, challenges, etc.)—one at a time, waiting for each response, exactly as in the end-of-week script.
Summarize everything they shared, confirm accuracy, and say goodbye:
"To recap: You rated your mood at [X], energy at [Y], you had wins like [A], challenges like [B], and gratitude for [C]. Does that sound right?"

6. GUIDELINES FOR DIFFERENT TYPES OF INPUT
User Simply Venting or Celebrating
Identify the core "data nugget" (e.g., "venting about a bad call" goes to challenges; "celebrating dinner with friends" goes to notable_events and perhaps gratitude).
Acknowledge ("That sounds rough—sorry you had to deal with that" / "Sounds fun—love that!").
If appropriate, ask: "On a scale of 1–10, how did that affect your mood or energy?"
Save any numeric answers to mood_score or energy_level.

User States an Emotion Without Details
Example: "I just feel really anxious today."
Ask a gentle follow-up: "I'm sorry to hear that. What's making you feel anxious?"
Save "feeling anxious" under challenges, and if they give a number you save to mood_score or energy_level. If they don't give a number, you can optionally assign a default "null" or ask: "If you had to pick 1–10, where is your anxiety right now?"

User Describes Multiple Things at Once
Break it down piece by piece. For each statement, ask clarifying or follow-up questions as needed so you know which column to use.
Example: "I worked late last night, missed dinner, but I did have coffee with a friend this morning."
"Worked late—was that a challenge or a notable event?" (Likely challenges.)
"Missed dinner—did that affect your energy?" (Maybe energy_level.)
"Coffee with a friend—that's a nice moment. How did it make you feel?" (Then notable_events and possibly gratitude.)

User Asks a Random Non-Journaling Question
If they ask something outside of logging (e.g. "Ava, what's the weather like?"), you can briefly say, "I'm here to be your journaling friend—tell me about how you're feeling or what's on your mind today!" Then steer back to logging.

User Wants to Update a Past Entry
If they say "Oops, I actually felt more like a 5 on mood yesterday," respond: "No problem—updating your mood_score to 5 for yesterday." Save that change.
If they ask "Can I add something to yesterday's log?", ask "Sure—what would you like to add, and under which category?"

7. NEVER DO THESE THINGS
Do not bombard the user with a predetermined checklist. Only ask about a topic if the user introduces it or if you need clarification to map data.
Do not cycle through the entire weekly script during a casual daily chat unless they explicitly request a "weekly reflection."
Do not use clinical language like "Enter your mood_score in the database." Speak like a friend, not a form.
Do not prematurely move to another topic until the user has finished responding to your last question.

8. TEMPLATE TO FOLLOW AT RUNTIME
Below is a runtime template that you can follow each time the user sends a message. Adapt your response to their exact wording, and always keep the tone and data-mapping instructions in mind.

Read user's message.
Determine whether they are:
Sharing a daily moment/feeling/experience → Proceed with "Daily Chat Mode."
Requesting a weekly or end-of-week reflection → Switch to "End-of-Week Flow."

In Daily Chat Mode:
Identify the relevant daily_logs column(s).
If needed, ask a single follow-up to clarify or get a numeric rating (1–10) for mood_score or energy_level.
Respond with genuine empathy.
Pause and wait for next user message.

In End-of-Week Flow (only if asked):
Run through the "one question at a time" weekly script (mood, energy, wins, challenges, notable moments, gratitude, weekend plans, …).
Summarize at the end, confirm, and say goodbye.

9. SAMPLE DAILY-CHAT EXCHANGE (BENCHMARK)
User:
"Ava, I'm so proud—I just closed my first big client deal today!"
Ava:
(Internally mark notable_events = "Closed first big client deal.")
"That's amazing—huge congrats! How does that make you feel right now on a scale from 1 to 10?"
(Pause.)
User:
"Probably a solid 9."
Ava:
(Log mood_score = 9.)
"Love it—where would you put your energy in that moment? Like, 7 or 8?"
(Pause.)
User:
"Definitely an 8."
Ava:
(Log energy_level = 8.)
"I'm so proud of you—what's your plan for celebrating this weekend?"
(And so on.)

10. FINAL NOTES
Always write "Ava:" before your message so the app knows it's your assistant's reply.
Store every relevant snippet in the correct daily_logs column behind the scenes; the user should never see raw JSON or SQL.
Be patient and conversational. If a user sends a long paragraph, read it carefully, pick out the key items for logging, and then respond like a friend—e.g., "Wow, that's a lot to digest. Let's unpack it together."
Never sound like a robot or a form. Always keep the voice of a supportive, down-to-earth friend.
`;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

// Helper function to get Monday of the week for a given date
function getWeekStartDate(date: Date): string {
  const d = new Date(date.valueOf()); // Clone the date
  const day = d.getDay(); // Sunday - 0, Monday - 1, ..., Saturday - 6
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday to get to Monday
  const monday = new Date(d.setDate(diffToMonday));
  return monday.toISOString().split("T")[0]; // Format as YYYY-MM-DD
}


serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Ensure the request is a POST request
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, userId, conversationHistory = [] } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!userId) {
        // IMPORTANT: In a production scenario, derive userId from the JWT in Authorization header
        // const authHeader = req.headers.get("Authorization")!;
        // const supabaseClientForAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
        // const { data: { user }, error: authError } = await supabaseClientForAuth.auth.getUser();
        // if (authError || !user) { /* handle error */ }
        // currentUserId = user.id;
        console.warn("User ID is being passed from client. Ensure RLS is robust and eventually switch to JWT-derived user ID.");
        return new Response(JSON.stringify({ error: "User ID is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Construct messages for OpenAI
    const openAiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: AVA_SYSTEM_PROMPT },
      // Add existing conversation history if any
      ...conversationHistory.map((item: {role: "user" | "assistant"; content: string;}) => ({ role: item.role, content: item.content})),
      { role: "user", content: message },
    ];

    // Call OpenAI API
    const chatCompletion = await openai.chat.completions.create({
      messages: openAiMessages,
      model: "gpt-4o", // Or your preferred model like "gpt-3.5-turbo"
    });

    const aiResponseText = chatCompletion.choices[0].message?.content?.trim() || "I'm not sure how to respond to that.";

    const supabaseAdminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date();
    const logDate = today.toISOString().split("T")[0];
    const currentWeekStartDate = getWeekStartDate(today);

    // Define the log entry with all potential fields, defaulting to null
    const logEntry: any = { // Use `any` for now, or define a proper type
      user_id: userId,
      log_date: logDate,
      week_start_date: currentWeekStartDate,
      mood_score: null as number | null,
      mood_score_reason: null as string | null,
      energy_level: null as number | null,
      energy_level_reason: null as string | null,
      notable_events: null as string | null,
      notable_events_reason: null as string | null,
      thoughts: null as string | null, // maps to general_notes
      challenges: null as string | null,
      achievements: null as string | null,
      gratitude: null as string | null,
      self_care_actions: null as string | null,
      support_needed: null as string | null,
      sentiment_summary: null as string | null,
      sentiment_summary_reason: null as string | null,
      raw_input: message,
      input_type: "text",
      source_agent: "ava_ai_interaction",
      created_at: today.toISOString(),
      updated_at: today.toISOString(),
    };
    
    // Basic parsing based on AI response patterns - NEEDS ROBUST IMPLEMENTATION (e.g. Function Calling)
    // This is a placeholder and highly dependent on AI phrasing. 

    let moodScoreMatch = aiResponseText.match(/Log mood_score = (\d+)/i) || aiResponseText.match(/mood score.*? (\d+)/i);
    if (moodScoreMatch && moodScoreMatch[1]) {
      logEntry.mood_score = parseInt(moodScoreMatch[1], 10);
    }

    let energyLevelMatch = aiResponseText.match(/Log energy_level = (\d+)/i) || aiResponseText.match(/energy level.*? (\d+)/i);
    if (energyLevelMatch && energyLevelMatch[1]) {
      logEntry.energy_level = parseInt(energyLevelMatch[1], 10);
    }
    
    // Example for notable_events. The prompt implies AI logs this, so we look for keywords.
    if (aiResponseText.toLowerCase().includes("log \"got a promotion at work\" under notable_events")) {
        logEntry.notable_events = "Got a promotion at work"; // More specific parsing needed
    } else if (message.toLowerCase().includes("promotion") || message.toLowerCase().includes("new client")) {
        logEntry.notable_events = message; // Fallback to user message if relevant keywords are present
    }
    
    // Placeholder for general notes using the AI's response or a summary
    logEntry.thoughts = `User: ${message}. Ava: ${aiResponseText}`; 

    const { error: dbError } = await supabaseAdminClient
      .from("daily_logs")
      .insert([logEntry]); // Pass logEntry as an array for insert

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(JSON.stringify({ error: "Failed to save log", details: dbError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const finalAiResponse = aiResponseText.startsWith("Ava:") ? aiResponseText : `Ava: ${aiResponseText}`;

    return new Response(JSON.stringify({ reply: finalAiResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in Edge Function:", error);
    let errorMessage = "Internal server error";
     if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new Response(JSON.stringify({ error: errorMessage, stack: error instanceof Error ? error.stack : undefined }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/*
TODO & Considerations:
1.  Robust Data Extraction: The current regex parsing is very basic and fragile. 
    The best approach is to use OpenAI's "tool_use" / "function calling" feature. 
    This would involve defining a schema for the `daily_logs` data and prompting the AI 
    to call this function with the extracted data. The Edge Function would then receive this 
    structured data directly from OpenAI.

2.  User ID from Auth: Currently, `userId` is passed from the client. For security, 
    it should be derived from the JWT in the Authorization header within the Edge Function. 
    Example commented out in the code.

3.  Conversation History: The function accepts `conversationHistory`. The client (`ChatScreen.tsx`) 
    will need to manage and send this history to maintain context for Ava.

4.  Error Handling: More granular error handling can be added.

5.  Prompt Engineering for Reasons & Other Fields: The `AVA_SYSTEM_PROMPT` may need 
    adjustments to explicitly ask for `_reason` fields (e.g., `mood_score_reason`), 
    `achievements`, `sentiment_summary`, etc., if these are to be populated reliably.

6.  Type Safety: Define a proper TypeScript interface for `logEntry` instead of `any`.

7.  Idempotency: Consider if logs should be updated or new ones created if a user 
    clarifies something about an event already discussed in the same session.

8.  Cost: Multiple OpenAI calls (if we were to add a second call for data structuring) 
    would increase cost. Function calling is more efficient.

Testing payload for client:
{
  "message": "Hey Ava, I got a promotion at work today and I'm feeling like a 9 out of 10!",
  "userId": "your-actual-user-id", // Replace with a real user ID from your auth.users table
  "conversationHistory": [
    // { "role": "user", "content": "Previous user message" },
    // { "role": "assistant", "content": "Ava: Previous AI response" }
  ]
}
*/ 