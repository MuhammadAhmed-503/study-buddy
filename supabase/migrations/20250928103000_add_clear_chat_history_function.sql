-- RPC function to force delete all chat messages for current user via security definer
CREATE OR REPLACE FUNCTION public.clear_chat_history()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.chat_messages WHERE user_id = auth.uid();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Ensure only authenticated users can execute
REVOKE ALL ON FUNCTION public.clear_chat_history() FROM public;
GRANT EXECUTE ON FUNCTION public.clear_chat_history() TO authenticated;