CREATE TABLE weekly_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    praise_title TEXT,
    praise_content TEXT,
    reminder_title TEXT,
    reminder_content TEXT,
    advice_title TEXT,
    advice_content TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure only one set of cards per user per week
    UNIQUE (user_id, week_start_date)
);

-- Enable Row Level Security
ALTER TABLE weekly_cards ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own cards
CREATE POLICY "Users can select their own weekly cards"
ON weekly_cards
FOR SELECT
USING (auth.uid() = user_id);

-- Optional: Add an index for faster lookups
CREATE INDEX idx_weekly_cards_user_week ON weekly_cards(user_id, week_start_date);

