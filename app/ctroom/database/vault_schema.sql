-- ==================== VAULT SCHEMA (Teller Edition) ====================
-- Run this in your Supabase SQL Editor after the main schema.sql
-- Replaces the old Plaid-based schema.

-- ==================== TELLER ENROLLMENTS (Bank Connections) ====================
create table if not exists public.teller_enrollments (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references auth.users(id) on delete cascade not null,
  enrollment_id    text not null unique,
  access_token     text not null,
  institution_name text not null,
  institution_type text,
  last_synced      timestamp with time zone,
  created_at       timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.teller_enrollments enable row level security;

create policy "Users can view own enrollments"
  on public.teller_enrollments for select using (auth.uid() = user_id);
create policy "Users can insert own enrollments"
  on public.teller_enrollments for insert with check (auth.uid() = user_id);
create policy "Users can update own enrollments"
  on public.teller_enrollments for update using (auth.uid() = user_id);
create policy "Users can delete own enrollments"
  on public.teller_enrollments for delete using (auth.uid() = user_id);

-- ==================== VAULT ACCOUNTS ====================
create table if not exists public.vault_accounts (
  id                 uuid default gen_random_uuid() primary key,
  user_id            uuid references auth.users(id) on delete cascade not null,
  -- Teller link fields
  teller_account_id  text unique,
  enrollment_id      text references public.teller_enrollments(enrollment_id) on delete cascade,
  -- Account details
  name               text not null,
  official_name      text,
  type               text not null check (type in ('checking', 'savings', 'credit', 'loan', 'investment', 'cash')),
  balance            numeric(12, 2) not null default 0,
  available_balance  numeric(12, 2),
  mask               text,
  institution        text,
  currency           text default 'USD',
  is_teller_linked   boolean default false,
  color              text default '#3b82f6',
  created_at         timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at         timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vault_accounts enable row level security;

create policy "Users can view own accounts"
  on public.vault_accounts for select using (auth.uid() = user_id);
create policy "Users can insert own accounts"
  on public.vault_accounts for insert with check (auth.uid() = user_id);
create policy "Users can update own accounts"
  on public.vault_accounts for update using (auth.uid() = user_id);
create policy "Users can delete own accounts"
  on public.vault_accounts for delete using (auth.uid() = user_id);

-- ==================== VAULT TRANSACTIONS ====================
create table if not exists public.vault_transactions (
  id                     uuid default gen_random_uuid() primary key,
  user_id                uuid references auth.users(id) on delete cascade not null,
  account_id             uuid references public.vault_accounts(id) on delete set null,
  teller_account_id      text,
  teller_transaction_id  text unique,
  amount                 numeric(12, 2) not null,
  type                   text not null check (type in ('income', 'expense', 'transfer')),
  category               text not null default 'Other',
  subcategory            text,
  description            text not null,
  merchant               text,
  date                   date not null,
  is_pending             boolean default false,
  notes                  text,
  created_at             timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vault_transactions enable row level security;

create policy "Users can view own transactions"
  on public.vault_transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions"
  on public.vault_transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions"
  on public.vault_transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions"
  on public.vault_transactions for delete using (auth.uid() = user_id);

-- ==================== BUDGET CATEGORIES ====================
create table if not exists public.budget_categories (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  name          text not null,
  emoji         text default '💰',
  monthly_limit numeric(12, 2) not null default 0,
  color         text default '#6b7280',
  created_at    timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at    timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.budget_categories enable row level security;

create policy "Users can view own budget categories"
  on public.budget_categories for select using (auth.uid() = user_id);
create policy "Users can insert own budget categories"
  on public.budget_categories for insert with check (auth.uid() = user_id);
create policy "Users can update own budget categories"
  on public.budget_categories for update using (auth.uid() = user_id);
create policy "Users can delete own budget categories"
  on public.budget_categories for delete using (auth.uid() = user_id);

-- ==================== DEBT ENTRIES ====================
create table if not exists public.vault_debts (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade not null,
  name            text not null,
  balance         numeric(12, 2) not null default 0,
  original_balance numeric(12, 2) not null default 0,
  interest_rate   numeric(5, 2) not null default 0,
  minimum_payment numeric(12, 2) not null default 0,
  target_date     date,
  type            text not null check (type in ('credit_card', 'student_loan', 'personal_loan', 'medical', 'other')),
  color           text default '#ef4444',
  created_at      timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at      timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vault_debts enable row level security;

create policy "Users can view own debts"
  on public.vault_debts for select using (auth.uid() = user_id);
create policy "Users can insert own debts"
  on public.vault_debts for insert with check (auth.uid() = user_id);
create policy "Users can update own debts"
  on public.vault_debts for update using (auth.uid() = user_id);
create policy "Users can delete own debts"
  on public.vault_debts for delete using (auth.uid() = user_id);

-- ==================== SAVINGS GOALS ====================
create table if not exists public.savings_goals (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid references auth.users(id) on delete cascade not null,
  name           text not null,
  emoji          text default '🎯',
  target_amount  numeric(12, 2) not null default 0,
  current_amount numeric(12, 2) not null default 0,
  deadline       date,
  color          text default '#10b981',
  created_at     timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at     timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.savings_goals enable row level security;

create policy "Users can view own savings goals"
  on public.savings_goals for select using (auth.uid() = user_id);
create policy "Users can insert own savings goals"
  on public.savings_goals for insert with check (auth.uid() = user_id);
create policy "Users can update own savings goals"
  on public.savings_goals for update using (auth.uid() = user_id);
create policy "Users can delete own savings goals"
  on public.savings_goals for delete using (auth.uid() = user_id);

-- ==================== INDEXES ====================
create index if not exists idx_vault_accounts_user_id        on public.vault_accounts(user_id);
create index if not exists idx_vault_accounts_teller_id      on public.vault_accounts(teller_account_id);
create index if not exists idx_vault_transactions_user_id    on public.vault_transactions(user_id);
create index if not exists idx_vault_transactions_date       on public.vault_transactions(date);
create index if not exists idx_vault_transactions_account_id on public.vault_transactions(account_id);
create index if not exists idx_budget_categories_user_id     on public.budget_categories(user_id);
create index if not exists idx_vault_debts_user_id           on public.vault_debts(user_id);
create index if not exists idx_savings_goals_user_id         on public.savings_goals(user_id);
create index if not exists idx_teller_enrollments_user_id    on public.teller_enrollments(user_id);

-- ==================== HELPER FUNCTION ====================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- ==================== TRIGGERS ====================
create trigger handle_vault_accounts_updated_at
  before update on public.vault_accounts
  for each row execute function public.handle_updated_at();

create trigger handle_budget_categories_updated_at
  before update on public.budget_categories
  for each row execute function public.handle_updated_at();

create trigger handle_vault_debts_updated_at
  before update on public.vault_debts
  for each row execute function public.handle_updated_at();

create trigger handle_savings_goals_updated_at
  before update on public.savings_goals
  for each row execute function public.handle_updated_at();

-- ==================== MIGRATION NOTES ====================
-- If migrating from old Plaid schema, run these first:
-- DROP TABLE IF EXISTS public.plaid_items CASCADE;
-- ALTER TABLE public.vault_accounts DROP COLUMN IF EXISTS plaid_account_id;
-- ALTER TABLE public.vault_accounts DROP COLUMN IF EXISTS plaid_item_id;
-- ALTER TABLE public.vault_accounts DROP COLUMN IF EXISTS is_plaid_linked;
-- ALTER TABLE public.vault_transactions DROP COLUMN IF EXISTS plaid_transaction_id;
-- ALTER TABLE public.vault_transactions DROP COLUMN IF EXISTS plaid_account_id;
