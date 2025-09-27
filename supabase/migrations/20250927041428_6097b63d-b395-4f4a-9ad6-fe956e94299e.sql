-- Create storage bucket for uploaded documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Create notes table to store extracted text from uploaded files
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create summaries table for AI-generated summaries
CREATE TABLE public.summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flashcards table for AI-generated flashcards
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quizzes table for AI-generated quizzes
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat messages table for study chat functionality
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT,
  is_user BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notes
CREATE POLICY "Users can view their own notes" 
ON public.notes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
ON public.notes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
ON public.notes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.notes FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for summaries
CREATE POLICY "Users can view summaries of their notes" 
ON public.summaries FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = summaries.note_id AND notes.user_id = auth.uid()));

CREATE POLICY "Users can create summaries for their notes" 
ON public.summaries FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = summaries.note_id AND notes.user_id = auth.uid()));

-- Create RLS policies for flashcards
CREATE POLICY "Users can view flashcards of their notes" 
ON public.flashcards FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = flashcards.note_id AND notes.user_id = auth.uid()));

CREATE POLICY "Users can create flashcards for their notes" 
ON public.flashcards FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = flashcards.note_id AND notes.user_id = auth.uid()));

-- Create RLS policies for quizzes
CREATE POLICY "Users can view quizzes of their notes" 
ON public.quizzes FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = quizzes.note_id AND notes.user_id = auth.uid()));

CREATE POLICY "Users can create quizzes for their notes" 
ON public.quizzes FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.notes WHERE notes.id = quizzes.note_id AND notes.user_id = auth.uid()));

-- Create RLS policies for chat messages
CREATE POLICY "Users can view their own chat messages" 
ON public.chat_messages FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages" 
ON public.chat_messages FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create storage policies for documents
CREATE POLICY "Users can upload their own documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on notes
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();