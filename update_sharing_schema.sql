-- Add friend_code to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS friend_code TEXT UNIQUE;

-- Drop existing function if return type changed
DROP FUNCTION IF EXISTS get_shared_habits(text);

-- Create the secure RPC function for sharing
CREATE OR REPLACE FUNCTION get_shared_habits(code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
    result JSONB;
BEGIN
    -- Find the user with this friend code
    SELECT id INTO target_user_id FROM profiles WHERE friend_code = code;
    
    IF target_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Aggregate habits and logs
    SELECT jsonb_agg(h_data) INTO result
    FROM (
        SELECT 
            h.id, 
            h.title, 
            h.color,
            COALESCE((
                SELECT jsonb_agg(l_data)
                FROM (
                    SELECT completed_at, notes
                    FROM habit_logs
                    WHERE habit_id = h.id
                    ORDER BY completed_at DESC
                ) l_data
            ), '[]'::jsonb) as logs
        FROM habits h
        WHERE h.user_id = target_user_id
        ORDER BY h.created_at ASC
    ) h_data;

    RETURN result;
END;
$$;
