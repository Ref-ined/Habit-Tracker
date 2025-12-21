-- DROP TABLES (Order matters due to foreign keys)
drop table if exists habit_logs;
drop table if exists habits;
-- Notes: profiles are managed by Supabase Auth triggers usually, but we can ensure the table exists
-- drop table if exists profiles; -- Risky if we want to keep user data. Let's keep profiles or be careful.

-- RECREATE TABLES

-- 1. PROFILES (If not exists)
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  website text,
  constraint username_length check (char_length(full_name) >= 3)
);

-- RLS for Profiles
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);


-- 2. HABITS
create table habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  color text default '#6366f1',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Habits
alter table habits enable row level security;
create policy "Users can view their own habits." on habits for select using (auth.uid() = user_id);
create policy "Users can insert their own habits." on habits for insert with check (auth.uid() = user_id);
create policy "Users can update their own habits." on habits for update using (auth.uid() = user_id);
create policy "Users can delete their own habits." on habits for delete using (auth.uid() = user_id);


-- 3. HABIT LOGS
create table habit_logs (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  completed_at date not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(habit_id, completed_at)
);

-- RLS for Habit Logs
alter table habit_logs enable row level security;
create policy "Users can view their own habit logs." on habit_logs for select using (auth.uid() = user_id);
create policy "Users can insert their own habit logs." on habit_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete their own habit logs." on habit_logs for delete using (auth.uid() = user_id);
