import { useState } from "react";
import { Upload, FileText, Brain, Sparkles, BookOpen, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { FileUploadService } from "@/services/FileUploadService";
import { TextExtractionService } from "@/services/TextExtractionService";
import { NotesService } from "@/services/NotesService";
import { AIService } from "@/services/AIService";
import { SummariesService } from "@/services/SummariesService";
import { FlashcardsService } from "@/services/FlashcardsService";
import { QuizzesService } from "@/services/QuizzesService";

const Home = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    
    setIsUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        await processFile(file);
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Upload Failed",
        description: "An error occurred while uploading your files.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const processFile = async (file: File) => {
    try {
      // Step 1: Extract text from file
      setUploadProgress(25);
      toast({
        title: "Processing file",
        description: `Extracting text from ${file.name}...`,
      });

      const extractionResult = await TextExtractionService.extractText(file);
      if (!extractionResult.success) {
        throw new Error(extractionResult.error);
      }

      // Step 2: Upload file to Supabase storage
      setUploadProgress(50);
      const uploadResult = await FileUploadService.uploadFile(file, user!.id);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Step 3: Save note to database
      setUploadProgress(60);
      const title = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
      const cleanText = TextExtractionService.cleanText(extractionResult.text || "");
      
      const noteResult = await NotesService.createNote({
        title,
        content: cleanText,
        fileName: file.name,
        fileType: file.type,
        filePath: uploadResult.filePath,
      });

      if (!noteResult.success || !noteResult.note) {
        throw new Error(noteResult.error);
      }

      // Calculate optimal count based on document length
      const wordCount = cleanText.split(/\s+/).length;
      const flashcardCount = Math.max(5, Math.min(20, Math.floor(wordCount / 100))); // 1 flashcard per 100 words, min 5, max 20
      const quizCount = Math.max(3, Math.min(15, Math.floor(wordCount / 150))); // 1 quiz question per 150 words, min 3, max 15
      
      console.log(`Document processing: ${wordCount} words, generating ${flashcardCount} flashcards and ${quizCount} quiz questions`);

      // Step 4: Generate AI content
      setUploadProgress(75);
      toast({
        title: "Generating AI content",
        description: `Creating summary, ${flashcardCount} flashcards, and ${quizCount} quiz questions...`,
      });

      // Generate summary
      const summaryResult = await AIService.generateSummary(cleanText);
      if (summaryResult.success && summaryResult.result) {
        await SummariesService.createSummary(noteResult.note.id, summaryResult.result);
      }

      // Generate flashcards
      const flashcardsResult = await AIService.generateFlashcards(cleanText, flashcardCount);
      if (flashcardsResult.success && flashcardsResult.flashcards) {
        const createFlashcardsResult = await FlashcardsService.createFlashcards(noteResult.note.id, flashcardsResult.flashcards);
        if (!createFlashcardsResult.success) {
          console.error('Failed to create flashcards:', createFlashcardsResult.error);
        } else {
          console.log(`Successfully created ${flashcardsResult.flashcards.length} flashcards`);
        }
      } else {
        console.error('Failed to generate flashcards:', flashcardsResult.error);
      }

      // Generate quiz questions
      const quizResult = await AIService.generateQuiz(cleanText, quizCount);
      if (quizResult.success && quizResult.questions) {
        const createQuizResult = await QuizzesService.createQuiz(noteResult.note.id, quizResult.questions);
        if (!createQuizResult.success) {
          console.error('Failed to create quiz:', createQuizResult.error);
        } else {
          console.log(`Successfully created ${quizResult.questions.length} quiz questions`);
        }
      } else {
        console.error('Failed to generate quiz questions:', quizResult.error);
      }

      setUploadProgress(100);
      toast({
        title: "Upload Complete!",
        description: `${file.name} processed with ${flashcardCount} flashcards and ${quizCount} quiz questions.`,
      });

    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: "Processing Failed",
        description: `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const features = [
    {
      icon: Brain,
      title: "AI Summaries",
      description: "Get concise summaries of your notes powered by advanced AI",
      color: "from-primary to-primary-dark"
    },
    {
      icon: Sparkles,
      title: "Smart Flashcards",
      description: "Automatically generated flashcards from your study material",
      color: "from-accent to-accent-light"
    },
    {
      icon: BookOpen,
      title: "Custom Quizzes",
      description: "Practice with AI-generated quizzes tailored to your content",
      color: "from-success to-emerald-400"
    },
    {
      icon: MessageCircle,
      title: "Study Chat",
      description: "Ask questions and get explanations in simple terms",
      color: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent mb-10">
              Your AI-Powered
              <br />
              Study Companion
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
              Upload your notes and let AI create summaries, flashcards and quizzes. 
              Chat with your study material to understand complex topics effortlessly.
            </p>

            {/* File Upload Area */}
            <Card 
              className={`max-w-2xl mx-auto mb-16 transition-all duration-300 ${
                isDragging 
                  ? "border-primary shadow-ai scale-105" 
                  : "border-dashed border-2 border-muted-foreground/30 hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-ai">
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8 text-white" />
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {isUploading ? "Processing Files..." : "Upload Your Study Material"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {isUploading 
                    ? "Please wait while we extract text and save your files"
                    : "Drag and drop your PDF, DOC, or TXT files here, or click to browse"
                  }
                </p>
                
                {isUploading && (
                  <div className="mb-6">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground mt-2">{uploadProgress}% complete</p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="gradient-primary text-white shadow-ai hover:shadow-lg transition-all"
                    onClick={() => document.getElementById('file-input')?.click()}
                    disabled={isUploading}
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    Choose Files
                  </Button>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                    disabled={isUploading}
                  />
                  <Button variant="outline" size="lg" disabled={isUploading}>
                    Try Demo Files
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Supports PDF, DOC, DOCX, and TXT files up to 20MB
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Supercharge Your Learning</h2>
          <p className="text-xl text-muted-foreground">
            Discover how AI can transform your study experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="group hover:shadow-ai transition-all duration-300 hover:-translate-y-2 border-card-border/50"
              >
                <CardHeader className="text-center">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;