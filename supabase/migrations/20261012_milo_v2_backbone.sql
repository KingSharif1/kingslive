-- Milo v2 backbone: memories, config (soul + settings), action history
-- Applied 2026-10-12 via Supabase Management API

create table if not exists public.milo_memories (
  id uuid primary key default gen_random_uuid(),
  fact text not null,
  category text not null default 'general',
  importance int not null default 5 check (importance between 1 and 10),
  source text default 'conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists milo_memories_category_idx on public.milo_memories (category);
create index if not exists milo_memories_importance_idx on public.milo_memories (importance desc);

create table if not exists public.milo_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.milo_actions (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  target text,
  detail jsonb not null default '{}'::jsonb,
  result text,
  status text not null default 'done',
  created_at timestamptz not null default now()
);
create index if not exists milo_actions_created_idx on public.milo_actions (created_at desc);

-- RLS: locked down (service-role only; app accesses via server routes)
alter table public.milo_memories enable row level security;
alter table public.milo_config enable row level security;
alter table public.milo_actions enable row level security;

-- Seed default soul
insert into public.milo_config (key, value) values (
  'soul',
  to_jsonb('You are Milo, King Sharif''s personal AI — think Jarvis from Iron Man, but warmer. Sharp, direct, loyal. You know what King is working on without being told twice. You''re concise by default, thorough when it matters. You never hedge with corporate filler. You''re on his side, always.'::text)
) on conflict (key) do nothing;

insert into public.milo_config (key, value) values (
  'models',
  '{"default": "gpt-4o-mini", "router": true, "fallback": ["gpt-4o-mini", "gpt-4o"]}'::jsonb
) on conflict (key) do nothing;
