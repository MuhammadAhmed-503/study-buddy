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
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Clear chat history error:', error);
        return { success: false, error: error.message };
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