-- Supabase Database Schema for Ctroom
-- Run this in your Supabase SQL Editor to create all necessary tables

-- ==================== USER PROFILES ====================
create table if not exists public.user_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null,
  email text not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_profiles enable row level security;

-- Policies for user_profiles
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = user_id);

-- ==================== TASKS ====================
create table if not exists public.tasks (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  status text not null check (status in ('todo', 'in-progress', 'done')),
  priority text not null check (priority in ('low', 'medium', 'high')),
  category text not null check (category in ('work', 'personal', 'habit')),
  date timestamp with time zone not null,
  due_time text,
  task_type text not null check (task_type in ('task', 'habit')),
  habit_frequency text check (habit_frequency in ('daily', 'weekly', 'weekdays', 'weekends', 'custom')),
  habit_duration integer,
  habit_streak integer,
  habit_custom_days jsonb,
  project_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.tasks enable row level security;

-- Policies for tasks
create policy "Users can view own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can create own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- ==================== IDEAS ====================
create table if not exists public.ideas (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  tags jsonb default '[]'::jsonb,
  date timestamp with time zone not null,
  category text not null check (category in ('feature', 'content', 'business', 'personal', 'random')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.ideas enable row level security;

-- Policies for ideas
create policy "Users can view own ideas"
  on public.ideas for select
  using (auth.uid() = user_id);

create policy "Users can create own ideas"
  on public.ideas for insert
  with check (auth.uid() = user_id);

create policy "Users can update own ideas"
  on public.ideas for update
  using (auth.uid() = user_id);

create policy "Users can delete own ideas"
  on public.ideas for delete
  using (auth.uid() = user_id);

-- ==================== CHAT MESSAGES ====================
create table if not exists public.chat_messages (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  timestamp timestamp with time zone not null,
  model text,
  context jsonb,
  thoughts jsonb,
  sources jsonb,
  attachments jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.chat_messages enable row level security;

-- Policies for chat_messages
create policy "Users can view own messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can create own messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own messages"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

-- ==================== TOKEN USAGE ====================
create table if not exists public.token_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null check (provider in ('OpenAI', 'Google', 'Anthropic', 'HuggingFace')),
  model text not null,
  tokens integer not null default 0,
  request_type text not null check (request_type in ('chat', 'search', 'code')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.token_usage enable row level security;

-- Policies for token_usage
create policy "Users can view own usage"
  on public.token_usage for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on public.token_usage for insert
  with check (auth.uid() = user_id);

-- ==================== USER SETTINGS ====================
create table if not exists public.user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  api_keys jsonb default '{}'::jsonb,
  preferences jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_settings enable row level security;

-- Policies for user_settings
create policy "Users can view own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

-- ==================== INDEXES ====================
-- Add indexes for better performance
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_date on public.tasks(date);
create index if not exists idx_ideas_user_id on public.ideas(user_id);
create index if not exists idx_ideas_date on public.ideas(date);
create index if not exists idx_chat_messages_user_id on public.chat_messages(user_id);
create index if not exists idx_chat_messages_timestamp on public.chat_messages(timestamp);
create index if not exists idx_token_usage_user_id on public.token_usage(user_id);
create index if not exists idx_token_usage_created_at on public.token_usage(created_at);

-- ==================== FUNCTIONS ====================
-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger handle_user_profiles_updated_at
  before update on public.user_profiles
  for each row
  execute function public.handle_updated_at();

create trigger handle_tasks_updated_at
  before update on public.tasks
  for each row
  execute function public.handle_updated_at();

create trigger handle_ideas_updated_at
  before update on public.ideas
  for each row
  execute function public.handle_updated_at();

create trigger handle_user_settings_updated_at
  before update on public.user_settings
  for each row
  execute function public.handle_updated_at();

-- ==================== NOTES ====================
/*
After running this script:

1. The tables will be created with Row Level Security (RLS) enabled
2. Users can only access their own data
3. All tables have proper indexes for performance
4. Updated_at timestamps auto-update on modifications

Next Steps:
1. Run this SQL in Supabase SQL Editor
2. Test the authentication flow
3. Verify RLS policies work correctly
4. The CtroomDashboard will automatically connect and load data

Database Structure:
- user_profiles: User information (name, email, avatar)
- tasks: All tasks and habits
- ideas: Notes and ideas
- chat_messages: AI chat history
*/
