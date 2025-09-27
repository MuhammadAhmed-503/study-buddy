import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Flashcard = Tables<'flashcards'>;
export type FlashcardInsert = TablesInsert<'flashcards'>;

export class FlashcardsService {
  static async createFlashcards(noteId: string, flashcards: { question: string; answer: string }[]): Promise<{ success: boolean; flashcards?: Flashcard[]; error?: string }> {
    try {
      const flashcardData = flashcards.map(fc => ({
        note_id: noteId,
        question: fc.question,
        answer: fc.answer,
      }));

      const { data: createdFlashcards, error } = await supabase
        .from('flashcards')
        .insert(flashcardData)
        .select();

      if (error) {
        console.error('Create flashcards error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, flashcards: createdFlashcards };
    } catch (error) {
      console.error('Flashcards service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async getFlashcardsByNoteId(noteId: string): Promise<{ success: boolean; flashcards?: Flashcard[]; error?: string }> {
    try {
      const { data: flashcards, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Get flashcards error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, flashcards: flashcards || [] };
    } catch (error) {
      console.error('Flashcards service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async getUserFlashcards(): Promise<{ success: boolean; flashcards?: (Flashcard & { note_title: string })[]; error?: string }> {
    try {
      const { data: flashcards, error } = await supabase
        .from('flashcards')
        .select(`
          *,
          notes!inner(title, user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get user flashcards error:', error);
        return { success: false, error: error.message };
      }

      // Transform the data to include note title
      const transformedFlashcards = flashcards?.map(fc => ({
        ...fc,
        note_title: (fc as any).notes.title
      })) || [];

      return { success: true, flashcards: transformedFlashcards };
    } catch (error) {
      console.error('Flashcards service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}