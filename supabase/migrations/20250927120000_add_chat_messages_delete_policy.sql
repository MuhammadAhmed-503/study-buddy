-- Add missing DELETE policy for chat_messages table
CREATE POLICY "Users can delete their own chat messages" 
ON public.chat_messages FOR DELETE 
USING (auth.uid() = user_id);