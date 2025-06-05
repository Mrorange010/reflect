# ReflectAI Development Roadmap

This document organizes the next-phase tasks from the product To-Do list into actionable, step-by-step phases for development. Each phase contains detailed steps and checklists to guide implementation.

---

## **Phase 1: Data Flow & Core Integrations**

### 1. **Capture and Sync Data Points**
- [ ] Pass captured user data points (e.g., challenges, notable events, reasoning) from ElevenLabs to Supabase
    - [ ] Set up ElevenLabs webhook to trigger on relevant events
    - [ ] Create Supabase Edge Function to receive and process webhook data
    - [ ] Map incoming data to the `weekly_reflections` table fields
    - [ ] Test end-to-end data flow
- [ ] Pass user's name from Supabase to ElevenLabs for personalized agent calls
    - [ ] Retrieve user name from Supabase during onboarding
    - [ ] Update ElevenLabs agent session to include user name in prompts
    - [ ] Test agent greeting with user's name

### 2. **OpenAI Chat Integration**
- [ ] Hook up OpenAI API to chat screen for user interaction
    - [ ] Integrate OpenAI API in chat screen
    - [ ] Design prompt to extract similar data points as ElevenLabs
    - [ ] Pass captured data points from OpenAI chat to Supabase
    - [ ] Test chat-to-database flow

---

## **Phase 2: Scheduling, Personalization & Agents**

### 1. **User Call Time Preferences**
- [ ] Let users pick specific call times (not just morning/afternoon/evening)
    - [ ] Update onboarding UI to allow time selection for Monday (start) and Friday (end)
    - [ ] Save preferences in `user_settings` as `call_start` and `call_end`
    - [ ] Detect and store user timezone
    - [ ] Allow user to set week start day (Monday or Sunday)
- [ ] Schedule AI calls at chosen times
    - [ ] Load call times from Supabase
    - [ ] Store locally for offline access
    - [ ] Trigger Call Screen at scheduled times

### 2. **Multiple Call Agents**
- [ ] Set up two call agents (start and end of week)
    - [ ] Configure ElevenLabs with two distinct agents
    - [ ] Assign start-of-week and end-of-week logic/prompts
    - [ ] Test agent switching and context

---

## **Phase 3: Contextual Awareness & Data Sharing**

- [ ] Pass captured data from start-of-week agent to end-of-week agent
    - [ ] Store relevant context in Supabase
    - [ ] Retrieve and inject context into end-of-week agent session
- [ ] Pass captured weekend data from end-of-week agent to start-of-week agent
    - [ ] Store weekend plans/events in Supabase
    - [ ] Retrieve and inject into start-of-week agent session

---

## **Phase 4: Dashboard & Log Visualization**

- [ ] Create detail view of logs with captured data
    - [ ] Design UI for daily log detail
    - [ ] Fetch and display data from Supabase
- [ ] Create dashboard view with actual data from calls
    - [ ] Design dashboard UI (mood trends, goals vs. outcomes, highlights, summaries)
    - [ ] Implement data aggregation and visualization

---

## **Phase 5: Settings & Account Management**

- [ ] Add log out button to settings screen
- [ ] Add change email to settings screen
- [ ] Add change password to settings screen
- [ ] Add change AI contacting times in settings screen
- [ ] Add delete account in settings screen
    - [ ] Add warning popup for data deletion
    - [ ] Ensure all user data is erased from database upon confirmation

---

## **Ongoing/Supporting Tasks**

- [ ] Ensure all data flows are secure and privacy-compliant
- [ ] Add error handling and user feedback for all integrations
- [ ] Write tests for critical flows (data sync, scheduling, chat, etc.)
- [ ] Update documentation as features are completed

# Dashboard Improvement TODO

## High Priority
- [ ] **Investigate & Fix `Average Rating` & `Entries`:**
  - Verify `daily_logs` data in Supabase (recent entries, valid `mood_score`, `log_date`).
  - Debug calculation logic in `DashboardScreen.tsx` if data is present but display is incorrect.
- [ ] **Make "Weekly Mood Pattern" Insight Dynamic/Conditional:**
  - Hide or provide a generic message if `moodData` is empty.
  - If data exists, attempt a simple dynamic insight (e.g., based on count of positive/negative days).
  - Remove the hardcoded "+12%" trend indicator or make it dynamic.
- [ ] **Connect `RecentReflections` ("Recent Logs") to `daily_logs`:**
  - Modify `components/dashboard/recent-reflections.tsx` to accept `logs` prop.
  - Pass the latest 3-5 `dailyLogs` from `DashboardScreen.tsx`.
  - Display date, a short summary/mood description, and sentiment.

## Medium Priority
- [ ] **Connect `EmotionalTagCloud` to live `emotionTags`:**
  - **Phase 1 (Simple):** Modify `components/dashboard/emotion-tags.tsx` to accept `string[]` for tags. Pass `emotionTags` from `DashboardScreen.tsx`.
  - **Phase 2 (Advanced):** Process `emotionTags` in `DashboardScreen.tsx` to include frequency/sentiment/color to match the component's richer design.
- [ ] **Enhance `WeeklyInsights` with Live Data:**
  - Modify `components/dashboard/weekly-insights.tsx` to accept data (e.g., `lastThreeWeeks` summaries).
  - Display actual summaries from `weekly_reflections`.
  - Consider making the "insight" text itself more dynamic based on the passed data (simple rules, not AI for now).
- [ ] **Review and Refine Day Streak Logic:**
    - Ensure client-side calculation is robust or consider if server-side update is needed for reliability.

## Low Priority / Future Enhancements
- [ ] **Implement Streak Counter in `users` Table (Supabase):**
  - Add `current_streak`, `longest_streak`, `last_logged_date` columns to `users` table via migration.
  - Modify daily log creation to update these fields.
  - Fetch streak from `users` table in `DashboardScreen.tsx`.
- [ ] **AI-Powered Weekly Insights:**
  - Integrate OpenAI or similar to generate dynamic insights from user data.
- [ ] **Dynamic Trend Indicator for Weekly Mood Pattern:**
  - Calculate actual trend percentage based on `moodData` compared to a previous period. 