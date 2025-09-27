import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Note = Tables<'notes'>;
export type NoteInsert = TablesInsert<'notes'>;

export interface CreateNoteData {
  title: string;
  content: string;
  fileName?: string;
  fileType?: string;
  filePath?: string;
}

export class NotesService {
  static async createNote(data: CreateNoteData): Promise<{ success: boolean; note?: Note; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const noteData: NoteInsert = {
        user_id: user.id,
        title: data.title,
        content: data.content,
        file_name: data.fileName,
        file_type: data.fileType,
      };

      const { data: note, error } = await supabase
        .from('notes')
        .insert(noteData)
        .select()
        .single();

      if (error) {
        console.error('Create note error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, note };
    } catch (error) {
      console.error('Notes service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async getUserNotes(): Promise<{ success: boolean; notes?: Note[]; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get notes error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, notes: notes || [] };
    } catch (error) {
      console.error('Notes service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async getNote(id: string): Promise<{ success: boolean; note?: Note; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: note, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Get note error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, note };
    } catch (error) {
      console.error('Notes service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async updateNote(id: string, updates: Partial<CreateNoteData>): Promise<{ success: boolean; note?: Note; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: note, error } = await supabase
        .from('notes')
        .update({
          title: updates.title,
          content: updates.content,
          file_name: updates.fileName,
          file_type: updates.fileType,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Update note error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, note };
    } catch (error) {
      console.error('Notes service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async deleteNote(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Delete note error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Notes service error:', error);
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