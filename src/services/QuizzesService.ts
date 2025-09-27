import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Quiz = Tables<'quizzes'>;
export type QuizInsert = TablesInsert<'quizzes'>;

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent: number;
}

export class QuizzesService {
  static async createQuiz(noteId: string, questions: QuizQuestion[]): Promise<{ success: boolean; quizzes?: Quiz[]; error?: string }> {
    try {
      const quizData: QuizInsert[] = questions.map(q => ({
        note_id: noteId,
        question: q.question,
        options: q.options,
        correct_answer: q.options[q.correct], // Convert index to actual answer
        explanation: q.explanation,
      }));

      const { data: quizzes, error } = await supabase
        .from('quizzes')
        .insert(quizData)
        .select();

      if (error) {
        console.error('Create quiz error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, quizzes };
    } catch (error) {
      console.error('Quizzes service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async getQuizzesByNoteId(noteId: string): Promise<{ success: boolean; quizzes?: Quiz[]; error?: string }> {
    try {
      const { data: quizzes, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get quizzes error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, quizzes: quizzes || [] };
    } catch (error) {
      console.error('Quizzes service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async getUserQuizzes(): Promise<{ success: boolean; quizzes?: (Quiz & { note_title: string })[]; error?: string }> {
    try {
      const { data: quizzes, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          notes!inner(title, user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get user quizzes error:', error);
        return { success: false, error: error.message };
      }

      const formattedQuizzes = quizzes?.map(quiz => ({
        ...quiz,
        note_title: (quiz as any).notes.title
      })) || [];

      return { success: true, quizzes: formattedQuizzes };
    } catch (error) {
      console.error('Quizzes service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async deleteQuizzesByNoteId(noteId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('note_id', noteId);

      if (error) {
        console.error('Delete quizzes error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Quizzes service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static calculateScore(answers: Record<string, string>, quizzes: Quiz[]): QuizResult {
    const totalQuestions = quizzes.length;
    let correctAnswers = 0;

    quizzes.forEach(quiz => {
      if (answers[quiz.id] === quiz.correct_answer) {
        correctAnswers++;
      }
    });

    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    return {
      totalQuestions,
      correctAnswers,
      score,
      timeSpent: 0 // Can be implemented with a timer
    };
  }
}