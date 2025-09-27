import { useState, useEffect } from "react";
import { FileText, Brain, BookOpen, Star, Download, Trash2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { NotesService, Note } from "@/services/NotesService";
import { FlashcardsService, Flashcard } from "@/services/FlashcardsService";
import { SummariesService, Summary } from "@/services/SummariesService";
import { QuizzesService } from "@/services/QuizzesService";
import { FileUploadService } from "@/services/FileUploadService";
import { TextExtractionService } from "@/services/TextExtractionService";

interface NoteWithCounts extends Note {
  summaryText?: string;
  flashcardCount: number;
  quizCount: number;
}

const Dashboard = () => {
  const [notes, setNotes] = useState<NoteWithCounts[]>([]);
  const [flashcards, setFlashcards] = useState<(Flashcard & { note_title: string })[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Quiz state
  const [currentQuiz, setCurrentQuiz] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);

  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string>('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load notes
      const notesResult = await NotesService.getUserNotes();
      if (notesResult.success && notesResult.notes) {
        const notesWithCounts = await Promise.all(
          notesResult.notes.map(async (note) => {
            // Get summaries count
            const summariesResult = await SummariesService.getSummariesByNoteId(note.id);
            const summaryText = summariesResult.success && summariesResult.summaries && summariesResult.summaries.length > 0
              ? summariesResult.summaries[0].summary_text
              : undefined;

            // Get flashcards count
            const flashcardsResult = await FlashcardsService.getFlashcardsByNoteId(note.id);
            const flashcardCount = flashcardsResult.success && flashcardsResult.flashcards 
              ? flashcardsResult.flashcards.length 
              : 0;

            // Get quiz count
            const quizzesResult = await QuizzesService.getQuizzesByNoteId(note.id);
            const quizCount = quizzesResult.success && quizzesResult.quizzes 
              ? quizzesResult.quizzes.length 
              : 0;

            return {
              ...note,
              summaryText,
              flashcardCount,
              quizCount
            };
          })
        );
        setNotes(notesWithCounts);
      }

      // Load flashcards
      const flashcardsResult = await FlashcardsService.getUserFlashcards();
      if (flashcardsResult.success && flashcardsResult.flashcards) {
        setFlashcards(flashcardsResult.flashcards);
      }

      // Load quizzes
      const quizzesResult = await QuizzesService.getUserQuizzes();
      if (quizzesResult.success && quizzesResult.quizzes) {
        setQuizzes(quizzesResult.quizzes);
      }
    } catch (error) {
      console.error('Dashboard data loading error:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load dashboard data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const result = await NotesService.deleteNote(noteId);
      if (result.success) {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        toast({
          title: "Note Deleted",
          description: "Note has been successfully deleted.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the note. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get filtered flashcards based on selected document
  const getFilteredFlashcards = () => {
    if (selectedDocument === 'all') {
      return flashcards;
    }
    return flashcards.filter(fc => fc.note_title === selectedDocument);
  };

  const filteredFlashcards = getFilteredFlashcards();

  const handleNextCard = () => {
    setCurrentFlashcard((prev) => (prev + 1) % filteredFlashcards.length);
    setShowAnswer(false);
  };

  const handlePrevCard = () => {
    setCurrentFlashcard((prev) => (prev - 1 + filteredFlashcards.length) % filteredFlashcards.length);
    setShowAnswer(false);
  };

  const handleDocumentChange = (documentTitle: string) => {
    setSelectedDocument(documentTitle);
    setCurrentFlashcard(0);
    setShowAnswer(false);
  };

  // Quiz functions
  const startQuiz = (noteId: string) => {
    const noteQuizzes = quizzes.filter(q => q.note_id === noteId);
    if (noteQuizzes.length > 0) {
      setCurrentQuiz(noteQuizzes);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setQuizCompleted(false);
      setQuizResults(null);
      setQuizStartTime(Date.now());
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < currentQuiz.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeQuiz();
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const completeQuiz = () => {
    const timeSpent = Math.round((Date.now() - quizStartTime) / 1000);
    const results = QuizzesService.calculateScore(selectedAnswers, currentQuiz);
    setQuizResults({ ...results, timeSpent });
    setQuizCompleted(true);
  };

  const resetQuiz = () => {
    setCurrentQuiz([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizCompleted(false);
    setQuizResults(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your study dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Study Dashboard</h1>
          <p className="text-muted-foreground">Manage your notes and track your learning progress</p>
        </div>

        <Tabs defaultValue="notes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-400">
            <TabsTrigger value="notes">My Notes</TabsTrigger>
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-6">
            {notes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-ai">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Notes Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Upload your first study material to get started with AI-powered learning.
                </p>
                <Button className="gradient-primary text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Notes
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {notes.map((note) => (
                  <Card key={note.id} className="hover:shadow-ai transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center shadow-ai">
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{note.title}</CardTitle>
                            <CardDescription className="flex items-center space-x-4 mt-1">
                              <span>{note.file_name || 'Unknown file'}</span>
                              <span>•</span>
                              <span>{new Date(note.created_at).toLocaleDateString()}</span>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-success text-success-foreground">
                            Processed
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {note.summaryText && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <Brain className="h-4 w-4 mr-2 text-primary" />
                              AI Summary
                            </h4>
                            <p className="text-sm text-muted-foreground">{note.summaryText}</p>
                          </div>
                        )}
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-accent rounded-full"></div>
                            <span>{note.flashcardCount} Flashcards</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-success rounded-full"></div>
                            <span>{note.quizCount} Quiz Questions</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {note.summaryText && (
                            <Button size="sm" variant="outline">
                              View Full Summary
                            </Button>
                          )}
                          {note.flashcardCount > 0 && (
                            <Button size="sm" variant="outline">
                              Study Flashcards
                            </Button>
                          )}
                          {note.quizCount > 0 ? (
                            <Button size="sm" variant="outline">
                              Take Quiz ({note.quizCount} questions)
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled>
                              No Quiz Available
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="flashcards" className="space-y-6">
            {flashcards.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 gradient-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-ai">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Flashcards Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Upload study materials to automatically generate flashcards with AI.
                </p>
                <Button className="gradient-primary text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Notes
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Document Selection */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Study Flashcards</h3>
                    <p className="text-muted-foreground">
                      Review AI-generated flashcards from your uploaded documents
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Document:</label>
                    <select 
                      value={selectedDocument} 
                      onChange={(e) => handleDocumentChange(e.target.value)}
                      className="px-3 py-2 rounded-md border border-input bg-background text-sm min-w-[200px]"
                    >
                      <option value="all">All Documents ({flashcards.length} cards)</option>
                      {Array.from(new Set(flashcards.map(fc => fc.note_title))).map(noteTitle => {
                        const count = flashcards.filter(fc => fc.note_title === noteTitle).length;
                        return (
                          <option key={noteTitle} value={noteTitle}>
                            {noteTitle} ({count} cards)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {filteredFlashcards.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No flashcards available for the selected document.</p>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto">
                    <Card className="min-h-[400px] hover:shadow-ai transition-all duration-300">
                      <CardHeader className="text-center">
                        <CardTitle>Flashcard Study Session</CardTitle>
                        <CardDescription>
                          Card {currentFlashcard + 1} of {filteredFlashcards.length}
                          {selectedDocument !== 'all' && (
                            <>
                              <br />
                              <span className="text-xs">Document: {selectedDocument}</span>
                            </>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center justify-center space-y-6 min-h-[300px]">
                        <div 
                          className="w-full max-w-md min-h-48 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border-2 border-dashed border-primary/20 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 p-6"
                          onClick={() => setShowAnswer(!showAnswer)}
                        >
                          <div className="text-center">
                            <p className="text-lg font-medium mb-4 text-primary">
                              {showAnswer ? "💡 Answer:" : "❓ Question:"}
                            </p>
                            <p className="text-foreground leading-relaxed">
                              {showAnswer 
                                ? filteredFlashcards[currentFlashcard]?.answer || "No answer available"
                                : filteredFlashcards[currentFlashcard]?.question || "No question available"
                              }
                            </p>
                            <p className="text-xs text-muted-foreground mt-4">
                              Click to {showAnswer ? "show question" : "reveal answer"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <Button variant="outline" onClick={handlePrevCard} disabled={filteredFlashcards.length <= 1}>
                            ← Previous
                          </Button>
                          <Button 
                            onClick={() => setShowAnswer(!showAnswer)}
                            className="gradient-primary text-white"
                          >
                            {showAnswer ? "Show Question" : "Show Answer"}
                          </Button>
                          <Button variant="outline" onClick={handleNextCard} disabled={filteredFlashcards.length <= 1}>
                            Next →
                          </Button>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            AI Generated
                          </Badge>
                          {selectedDocument !== 'all' && (
                            <Badge variant="secondary">
                              {selectedDocument}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-6">
            {currentQuiz.length === 0 ? (
              // Quiz Selection View
              <div>
                {quizzes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 gradient-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-ai">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Quizzes Available</h3>
                    <p className="text-muted-foreground mb-6">
                      Upload study materials to automatically generate quiz questions with AI.
                    </p>
                    <Button className="gradient-primary text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Notes
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold mb-2">Available Quizzes</h3>
                      <p className="text-muted-foreground">
                        Test your knowledge with AI-generated quiz questions
                      </p>
                    </div>
                    <div className="grid gap-4">
                      {notes.filter(note => note.quizCount > 0).map((note) => (
                        <Card key={note.id} className="hover:shadow-ai transition-all duration-300">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg">{note.title}</CardTitle>
                                <CardDescription>
                                  {note.quizCount} questions • {note.file_name}
                                </CardDescription>
                              </div>
                              <Button 
                                onClick={() => startQuiz(note.id)}
                                className="gradient-primary text-white"
                              >
                                Start Quiz
                              </Button>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Quiz Taking View
              <div className="max-w-2xl mx-auto">
                {!quizCompleted ? (
                  <Card className="min-h-[500px] hover:shadow-ai transition-all duration-300">
                    <CardHeader className="text-center">
                      <CardTitle>Quiz in Progress</CardTitle>
                      <CardDescription>
                        Question {currentQuestionIndex + 1} of {currentQuiz.length}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="gradient-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${((currentQuestionIndex + 1) / currentQuiz.length) * 100}%` }}
                        ></div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          {currentQuiz[currentQuestionIndex]?.question}
                        </h3>

                        <div className="space-y-3">
                          {currentQuiz[currentQuestionIndex]?.options?.map((option: string, index: number) => (
                            <div
                              key={index}
                              className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                                selectedAnswers[currentQuiz[currentQuestionIndex].id] === option
                                  ? 'border-primary bg-primary/5'
                                  : 'border-muted'
                              }`}
                              onClick={() => handleAnswerSelect(currentQuiz[currentQuestionIndex].id, option)}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-4 h-4 rounded-full border-2 ${
                                  selectedAnswers[currentQuiz[currentQuestionIndex].id] === option
                                    ? 'border-primary bg-primary'
                                    : 'border-muted-foreground'
                                }`}>
                                  {selectedAnswers[currentQuiz[currentQuestionIndex].id] === option && (
                                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                                  )}
                                </div>
                                <span>{option}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button 
                          variant="outline" 
                          onClick={prevQuestion}
                          disabled={currentQuestionIndex === 0}
                        >
                          Previous
                        </Button>
                        <Button 
                          onClick={nextQuestion}
                          disabled={!selectedAnswers[currentQuiz[currentQuestionIndex]?.id]}
                          className="gradient-primary text-white"
                        >
                          {currentQuestionIndex === currentQuiz.length - 1 ? 'Finish Quiz' : 'Next Question'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // Quiz Results View
                  <Card className="text-center shadow-ai">
                    <CardHeader>
                      <CardTitle className="text-2xl">Quiz Complete! 🎉</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-primary">{quizResults?.score}%</div>
                          <div className="text-sm text-muted-foreground">Score</div>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">{quizResults?.correctAnswers}/{quizResults?.totalQuestions}</div>
                          <div className="text-sm text-muted-foreground">Correct</div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-muted-foreground mb-4">
                          Time spent: {Math.floor((quizResults?.timeSpent || 0) / 60)}m {((quizResults?.timeSpent || 0) % 60)}s
                        </p>
                        <Button onClick={resetQuiz} className="gradient-primary text-white">
                          Take Another Quiz
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;