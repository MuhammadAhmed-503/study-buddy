-- Ensure chat_messages table has proper RLS policies for delete operations
-- This migration ensures users can delete their own chat messages

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can delete their own chat messages" ON public.chat_messages;

-- Recreate the delete policy with proper permissions
CREATE POLICY "Users can delete their own chat messages" 
ON public.chat_messages FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Ensure RLS is enabled on the table
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT DELETE ON public.chat_messages TO authenticated;