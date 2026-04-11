-- Daily Logs table
-- Stores work log entries and daily reflections per day
-- Run this in your Supabase SQL editor

create table if not exists daily_logs (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade,
  date            date not null,
  content         text not null,
  type            text not null check (type in ('log', 'reflection')),
  project_id      uuid references missions(id) on delete set null,
  time_spent_minutes integer,
  created_at      timestamptz default now()
);

-- Index for fast per-day queries
create index if not exists daily_logs_date_idx on daily_logs(user_id, date);

-- RLS
alter table daily_logs enable row level security;

create policy "Users can manage their own logs"
  on daily_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
