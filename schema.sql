-- Create a table for public profiles using Supabase Auth
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(full_name) >= 3)
);

-- Set up Row Level Security!
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Handle new user signup with a trigger
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- HABITS TABLE
create table habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  color text default '#6366f1', -- indigo-500
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table habits enable row level security;

create policy "Users can view their own habits."
  on habits for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own habits."
  on habits for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own habits."
  on habits for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own habits."
  on habits for delete
  using ( auth.uid() = user_id );


-- HABIT LOGS (Attendance)
create table habit_logs (
  id uuid default gen_random_uuid() primary key,
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references auth.users not null, -- denormalized for easier RLS
  completed_at date not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(habit_id, completed_at)
);

alter table habit_logs enable row level security;

create policy "Users can view their own habit logs."
  on habit_logs for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own habit logs."
  on habit_logs for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own habit logs."
  on habit_logs for delete
  using ( auth.uid() = user_id );
