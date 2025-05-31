create table public.weekly_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,

  week_start_date date not null, -- always a Monday
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now()),

  -- Data collected via voice or text AI
  mood_score float,
  energy_level float,
  weekly_goals text,
  challenges text,
  achievements text,
  weekend_plans text,
  sentiment_summary text,
  notable_events text,

  -- Internal tracking
  source_last_updated text, -- e.g. 'start_call', 'end_call', 'text_update'

  -- Ensure one entry per user per week
  unique(user_id, week_start_date)
);


-- Enable RLS
alter table public.weekly_reflections enable row level security;

-- Policy: users can only access their own reflections
create policy "Users can read their reflections"
  on public.weekly_reflections
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their reflections"
  on public.weekly_reflections
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their reflections"
  on public.weekly_reflections
  for update
  using (auth.uid() = user_id);


create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  log_date date not null,
  content text not null,
  source text default 'text', -- or 'call', 'manual', etc.
  associated_week_start date, -- link to weekly_reflections.week_start_date
  created_at timestamp with time zone default timezone('utc', now()),

  unique(user_id, log_date)
);

alter table public.daily_logs enable row level security;

create policy "Users can read their own logs"
  on public.daily_logs
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own logs"
  on public.daily_logs
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own logs"
  on public.daily_logs
  for update
  using (auth.uid() = user_id);


create table public.weekly_interaction_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  week_start_date date not null,
  input_type text, -- 'text' | 'call' | 'system'
  raw_input text, -- what user said
  extracted_json jsonb, -- full GPT output
  created_at timestamp with time zone default timezone('utc', now())
);


alter table public.weekly_interaction_log enable row level security;

create policy "Users can read their logs"
  on public.weekly_interaction_log
  for select
  using (auth.uid() = user_id);

create policy "Users can insert logs"
  on public.weekly_interaction_log
  for insert
  with check (auth.uid() = user_id);


alter table public.weekly_reflections
  add column mood_score_reason text,
  add column energy_level_reason text,
  add column challenges_reason text,
  add column weekly_goals_reason text,
  add column weekend_plans_reason text,
  add column sentiment_summary_reason text;
