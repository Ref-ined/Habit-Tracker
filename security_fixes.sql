-- Security Fixes for Production
-- Run this script in your Supabase SQL Editor before deploying

-- 1. Fix profiles table RLS to hide friend_code from public
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;

-- Create more restrictive policies
-- Users can view their own full profile (including friend_code)
CREATE POLICY "Users can view their own full profile."
  ON profiles FOR SELECT
  USING ( auth.uid() = id );

-- Note: We don't create a public SELECT policy because we don't want
-- unauthenticated users to see ANY profile data.
-- The get_shared_habits RPC function will handle sharing via SECURITY DEFINER.

-- Alternative approach: Create a view for public profiles (optional)
-- This allows querying basic profile info without exposing friend_code
CREATE OR REPLACE VIEW public_profiles AS
  SELECT id, full_name, avatar_url
  FROM profiles;

-- Grant access to the view
GRANT SELECT ON public_profiles TO authenticated, anon;

-- 2. Verify all tables have RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Ensure SECURITY DEFINER functions have safe search_path
-- This prevents privilege escalation attacks
DO $$
BEGIN
    -- Handle get_shared_habits
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_shared_habits') THEN
        ALTER FUNCTION get_shared_habits(text) SET search_path = public;
    END IF;

    -- Handle handle_new_user
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
        ALTER FUNCTION handle_new_user() SET search_path = public;
    END IF;
END
$$;

-- 4. Add index on friend_code for performance
CREATE INDEX IF NOT EXISTS idx_profiles_friend_code ON profiles(friend_code) WHERE friend_code IS NOT NULL;

-- 5. Verify habit_logs RLS is correct
-- Users should only access their own logs
-- The get_shared_habits function bypasses this with SECURITY DEFINER
