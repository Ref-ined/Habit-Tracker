-- 1. Add friend_code column to profiles
alter table profiles 
add column if not exists friend_code text unique;

-- 2. Function to generate a random 6-character code
create or replace function generate_friend_code()
returns trigger as $$
begin
  if new.friend_code is null then
    new.friend_code := substring(md5(random()::text) from 1 for 6);
  end if;
  return new;
end;
$$ language plpgsql;

-- 3. Trigger to auto-generate code on new profile creation
drop trigger if exists on_auth_user_created_friend_code on profiles;
create trigger on_auth_user_created_friend_code
before insert on profiles
for each row execute procedure generate_friend_code();

-- 4. Backfill existing profiles (Wait, simple update won't trigger 'before insert'. We update manually)
update profiles 
set friend_code = substring(md5(random()::text) from 1 for 6) 
where friend_code is null;

-- 5. Enable Realtime for tables (Important for Sync!)
alter publication supabase_realtime add table habit_logs;
alter publication supabase_realtime add table habits;

-- 6. RLS Policies for Sharing
-- We need to allow anyone to READ habits/logs IF they know the friend_code of the user who owns them.

-- But tables `habits` and `habit_logs` link to `user_id`, not `friend_code`.
-- We can join with profiles, but complex RLS can be slow or tricky.
-- Strategy: Public Read Access is allowed if the user_id matches a profile with the given friend_code?
-- No, the client will likely query by `friend_code`.
-- Let's create a Helper View or Function for safe public access?
-- Or simpler: Add RLS policy that allows SELECT if the user_id's profile has a friend_code that is "known"?
-- Actually, simpler approach for "Public Read Only Page":
-- The page will be `/share/[code]`. 
-- Server Component fetches the profile by code -> gets `user_id`.
-- Then fetches habits/logs by `user_id` using a "Service Role" client (admin) or a specific RPC function designated `security definer`.
-- Using `security definer` function is the safest way to expose this without opening RLS to "public".

create or replace function get_shared_habits(code text)
returns table (
  id uuid,
  title text,
  color text,
  logs jsonb
) 
language plpgsql
security definer -- Runs with admin privileges
as $$
declare
  target_user_id uuid;
begin
  -- Get User ID from code
  select id into target_user_id from profiles where friend_code = code;
  
  if target_user_id is null then
    return; -- Return empty if code invalid
  end if;

  return query
  select 
    h.id,
    h.title,
    h.color,
    coalesce(
      (
        select jsonb_agg(jsonb_build_object('completed_at', hl.completed_at, 'notes', hl.notes))
        from habit_logs hl
        where hl.habit_id = h.id
      ),
      '[]'::jsonb
    ) as logs
  from habits h
  where h.user_id = target_user_id;
end;
$$;
