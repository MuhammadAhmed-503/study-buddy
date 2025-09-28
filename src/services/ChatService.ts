import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type ChatMessage = Tables<'chat_messages'>;
export type ChatMessageInsert = TablesInsert<'chat_messages'>;

export class ChatService {
  static async saveChatMessage(data: {
    message: string;
    response?: string;
    noteId?: string;
    isUser: boolean;
  }): Promise<{ success: boolean; chatMessage?: ChatMessage; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: chatMessage, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          message: data.message,
          response: data.response,
          note_id: data.noteId,
          is_user: data.isUser,
        })
        .select()
        .single();

      if (error) {
        console.error('Save chat message error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, chatMessage };
    } catch (error) {
      console.error('Chat service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async getChatHistory(): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Get chat history error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messages: messages || [] };
    } catch (error) {
      console.error('Chat service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async clearChatHistory(): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('Clear chat history: User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      console.log('Clearing chat history for user:', user.id);

      // First, check if there are any messages to delete
      const { data: existingMessages, error: selectError } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('user_id', user.id);

      if (selectError) {
        console.error('Error checking existing messages:', selectError);
        return { success: false, error: `Check failed: ${selectError.message}` };
      }

      console.log(`Found ${existingMessages?.length || 0} messages to delete`);
      if (existingMessages && existingMessages.length > 0) {
        // Diagnostic: fetch first few records fully to inspect user_id consistency
        const { data: sampleRows } = await supabase
          .from('chat_messages')
          .select('id,user_id,created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(3);
        console.log('Auth UID for deletion:', user.id);
        console.log('Sample rows for diagnostic (first 3):', sampleRows?.map(r => ({ id: r.id, user_id: r.user_id })));        
      }

      if (!existingMessages || existingMessages.length === 0) {
        console.log('No messages found to delete');
        return { success: true }; // Nothing to delete is still success
      }

      // Attempt bulk delete first
      const { data, error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id)
        .select(); // requires PostgREST >= v10; if empty may mean no returning

      if (error) {
        console.error('Clear chat history error:', error);
        console.error('Error code:', error.code);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        
        // Check for various permission-related errors
        if (
          error.code === 'PGRST116' || 
          error.code === '42501' || // Permission denied
          error.message.includes('permission denied') || 
          error.message.includes('policy') ||
          error.message.includes('RLS') ||
          error.message.includes('row-level security')
        ) {
          return { 
            success: false, 
            error: `Database permissions error: ${error.message}` 
          };
        }
        
        return { success: false, error: `Delete failed: ${error.message}` };
      }

      let deletedCount = data?.length ?? 0;
      if (deletedCount === 0 && existingMessages.length > 0) {
        // Some PostgREST setups may not return rows on delete. Verify by re-selecting.
        const { data: verifyAfterDelete, error: verifyError } = await supabase
          .from('chat_messages')
          .select('id')
          .eq('user_id', user.id);
        if (verifyError) {
          console.warn('Verification select after delete failed:', verifyError.message);
        } else if ((verifyAfterDelete?.length || 0) > 0) {
          console.warn('Bulk delete may not have executed, attempting per-row fallback...');
          // Fallback: delete each id individually (last resort)
          let perRowDeleted = 0;
          for (const row of existingMessages) {
            console.log('Attempting per-row delete for id:', row.id);
            const { error: rowDelError } = await supabase
              .from('chat_messages')
              .delete()
              .eq('id', row.id)
              .eq('user_id', user.id);
            if (!rowDelError) {
              perRowDeleted++;
            } else {
              console.warn('Per-row delete failed for id', row.id, rowDelError.message);
            }
          }
          deletedCount = perRowDeleted;
          // Re-verify after per-row pass
          const { data: finalCheck, error: finalCheckError } = await supabase
            .from('chat_messages')
            .select('id')
            .eq('user_id', user.id);
          if (finalCheckError) {
            console.warn('Final verification after per-row deletes failed:', finalCheckError.message);
          } else {
            console.log('Final remaining messages after per-row deletes:', finalCheck?.length || 0);
            if ((finalCheck?.length || 0) > 0) {
              console.warn('Per-row fallback still shows remaining messages. Attempting ID-based IN clause delete as last resort.');
              const remainingIds = finalCheck?.map(r => r.id) || [];
              console.log('Remaining IDs:', remainingIds);
              // Attempt one more delete using an IN filter
              const { error: inDeleteError } = await supabase
                .from('chat_messages')
                .delete()
                .in('id', remainingIds);
              if (inDeleteError) {
                console.warn('IN clause delete attempt failed:', inDeleteError.message);
              } else {
                const { data: afterInDelete } = await supabase
                  .from('chat_messages')
                  .select('id')
                  .in('id', remainingIds);
                console.log('Remaining after IN clause delete:', afterInDelete?.length || 0);
                if ((afterInDelete?.length || 0) > 0) {
                  console.warn('Rows still remain after IN clause delete. Invoking RPC fallback clear_chat_history()');
                  // Cast to any because generated types may not include rpc function mapping yet despite types.ts update
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const { data: rpcResult, error: rpcError } = await (supabase as any)
                    .rpc('clear_chat_history');
                  if (rpcError) {
                    console.error('RPC clear_chat_history error:', rpcError.message);
                  } else {
                    console.log('RPC clear_chat_history deleted rows:', rpcResult);
                    const { data: postRpcCheck } = await supabase
                      .from('chat_messages')
                      .select('id')
                      .eq('user_id', user.id);
                    console.log('Remaining after RPC:', postRpcCheck?.length || 0);
                  }
                }
              }
            }
          }
        } else {
          // Delete succeeded but returning is disabled
          deletedCount = existingMessages.length;
        }
      }

      console.log(`Successfully cleared ${deletedCount} chat messages`);
      if (deletedCount !== existingMessages.length) {
        console.warn(`Expected to delete ${existingMessages.length} messages, but deleted ${deletedCount}`);
        // Provide additional guidance if nothing was deleted
        if (deletedCount === 0) {
          console.warn('No deletions occurred. This suggests a policy or auth mismatch.');
          console.warn('Verify: (1) Auth session user id, (2) RLS DELETE policy presence, (3) GRANT DELETE to authenticated, (4) Row user_id matches auth uid.');
        }
      }
      // Final authoritative verification before reporting success
      const { data: finalVerify, error: finalVerifyError } = await supabase
        .from('chat_messages')
        .select('id,user_id')
        .eq('user_id', user.id);
      if (finalVerifyError) {
        console.warn('Final verification query failed:', finalVerifyError.message);
      }
      if ((finalVerify?.length || 0) > 0) {
        const sample = finalVerify.slice(0, 5).map(r => ({ id: r.id, user_id: r.user_id }));
        console.error('Chat deletion incomplete. Remaining count:', finalVerify.length, 'Sample:', sample);
        return { success: false, error: `Chat deletion incomplete. ${finalVerify.length} messages still present.` };
      }
      return { success: true };
    } catch (error) {
      console.error('Chat service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
}