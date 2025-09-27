import { useState } from "react";
import { FileText, Brain, BookOpen, Star, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  // Mock data - will be replaced with real data from Supabase
  const [notes] = useState([
    {
      id: 1,
      title: "Introduction to Machine Learning",
      filename: "ml_basics.pdf",
      uploadDate: "2024-01-15",
      pages: 45,
      status: "processed",
      summary: "Overview of supervised and unsupervised learning algorithms, neural networks, and practical applications in data science.",
      flashcardCount: 12,
      quizCount: 8
    },
    {
      id: 2,
      title: "React Component Patterns",
      filename: "react_patterns.docx",
      uploadDate: "2024-01-14",
      pages: 23,
      status: "processing",
      summary: "",
      flashcardCount: 0,
      quizCount: 0
    },
    {
      id: 3,
      title: "Database Design Principles",
      filename: "database_notes.txt",
      uploadDate: "2024-01-13",
      pages: 12,
      status: "processed",
      summary: "Key concepts in relational database design, normalization, indexing strategies, and query optimization techniques.",
      flashcardCount: 15,
      quizCount: 10
    }
  ]);

  const [flashcards] = useState([
    {
      id: 1,
      noteId: 1,
      front: "What is supervised learning?",
      back: "A type of machine learning where the algorithm learns from labeled training data to make predictions on new, unseen data.",
      difficulty: "beginner"
    },
    {
      id: 2,
      noteId: 1,
      front: "What is the difference between classification and regression?",
      back: "Classification predicts discrete categories or classes, while regression predicts continuous numerical values.",
      difficulty: "intermediate"
    },
    {
      id: 3,
      noteId: 3,
      front: "What is database normalization?",
      back: "The process of organizing data in a database to reduce redundancy and improve data integrity by dividing larger tables into smaller, related tables.",
      difficulty: "intermediate"
    }
  ]);

  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleNextCard = () => {
    setCurrentFlashcard((prev) => (prev + 1) % flashcards.length);
    setShowAnswer(false);
  };

  const handlePrevCard = () => {
    setCurrentFlashcard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setShowAnswer(false);
  };

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
                            <span>{note.filename}</span>
                            <span>•</span>
                            <span>{note.pages} pages</span>
                            <span>•</span>
                            <span>{note.uploadDate}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={note.status === "processed" ? "default" : "secondary"}
                          className={note.status === "processed" ? "bg-success text-success-foreground" : ""}
                        >
                          {note.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {note.status === "processed" && (
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2 flex items-center">
                            <Brain className="h-4 w-4 mr-2 text-primary" />
                            AI Summary
                          </h4>
                          <p className="text-sm text-muted-foreground">{note.summary}</p>
                        </div>
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
                          <Button size="sm" variant="outline">
                            View Summary
                          </Button>
                          <Button size="sm" variant="outline">
                            Study Flashcards
                          </Button>
                          <Button size="sm" variant="outline">
                            Take Quiz
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="flashcards" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <Card className="min-h-[400px] hover:shadow-ai transition-all duration-300">
                <CardHeader className="text-center">
                  <CardTitle>Flashcard Study Session</CardTitle>
                  <CardDescription>
                    Card {currentFlashcard + 1} of {flashcards.length}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-6 min-h-[300px]">
                  <div 
                    className="w-full max-w-md h-48 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border-2 border-dashed border-primary/20 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105"
                    onClick={() => setShowAnswer(!showAnswer)}
                  >
                    <div className="text-center p-6">
                      <p className="text-lg font-medium mb-2">
                        {showAnswer ? "Answer:" : "Question:"}
                      </p>
                      <p className="text-foreground">
                        {showAnswer ? flashcards[currentFlashcard].back : flashcards[currentFlashcard].front}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Button variant="outline" onClick={handlePrevCard}>
                      Previous
                    </Button>
                    <Button 
                      onClick={() => setShowAnswer(!showAnswer)}
                      className="gradient-primary text-white"
                    >
                      {showAnswer ? "Show Question" : "Show Answer"}
                    </Button>
                    <Button variant="outline" onClick={handleNextCard}>
                      Next
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {flashcards[currentFlashcard].difficulty}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 gradient-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-ai">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quiz Feature Coming Soon</h3>
              <p className="text-muted-foreground mb-6">
                AI-generated quizzes will be available once you connect to Supabase for backend functionality.
              </p>
              <Button className="gradient-primary text-white">
                Connect Supabase
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;