import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Summary = Tables<'summaries'>;
export type SummaryInsert = TablesInsert<'summaries'>;

export class SummariesService {
  static async createSummary(noteId: string, summaryText: string): Promise<{ success: boolean; summary?: Summary; error?: string }> {
    try {
      const { data: summary, error } = await supabase
        .from('summaries')
        .insert({
          note_id: noteId,
          summary_text: summaryText,
        })
        .select()
        .single();

      if (error) {
        console.error('Create summary error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, summary };
    } catch (error) {
      console.error('Summaries service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async getSummariesByNoteId(noteId: string): Promise<{ success: boolean; summaries?: Summary[]; error?: string }> {
    try {
      const { data: summaries, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get summaries error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, summaries: summaries || [] };
    } catch (error) {
      console.error('Summaries service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async deleteSummary(summaryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('summaries')
        .delete()
        .eq('id', summaryId);

      if (error) {
        console.error('Delete summary error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Summaries service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async deleteSummariesByNoteId(noteId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('summaries')
        .delete()
        .eq('note_id', noteId);

      if (error) {
        console.error('Delete summaries by note error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Summaries service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}