-- Add missing UPDATE policy for habit_logs
create policy "Users can update their own habit logs."
  on habit_logs for update
  using ( auth.uid() = user_id );
