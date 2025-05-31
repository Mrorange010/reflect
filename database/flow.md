+----------------+           +-------------------+
|                |           |                   |
|     USER       |<--------->|     MOBILE APP     |
|                |           |  (React Native)    |
+----------------+           +-------------------+
          |                             |
          | 1. Receives AI Call/Text    | 2. Sends user input (voice/text)
          v                             v
+----------------+           +-------------------+
| ElevenLabs AI  |           |     Text Chat UI   |
| (voice agent)  |           +-------------------+
+----------------+                     |
          | 3. Generates AI voice      |
          | 4. Captures transcript     |
          v                            |
+-------------------------------+      |
| OpenAI (GPT-4 or Whisper STT) |<-----+
| NLP Processing                |
| - Extract mood, goals, etc.  |
+-------------------------------+
          |
          | 5. Extracted JSON:
          |    {
          |      mood_score: 8,
          |      weekly_goals: "...",
          |      notable_events: "...",
          |      ...
          |    }
          v
+---------------------------------------------+
|     Supabase Edge Function (Webhook)        |
| - Verifies HMAC                             |
| - Computes week start                       |
| - UPSERTS into `weekly_reflections`         |
| - INSERTS into `weekly_interaction_log`     |
+---------------------------------------------+
          |
          | 6. Data Stored
          v
+-------------------+       +--------------------------+
| weekly_reflections|<----->|    daily_logs (optional) |
+-------------------+       +--------------------------+
          |
          v
+-------------------+
| weekly_interaction_log |
+-------------------+

         |
         v
+-------------------+
|   Dashboard View  |
|   - Goals shown   |
|   - Mood trends   |
|   - AI summaries  |
|   - Week progress |
+-------------------+
