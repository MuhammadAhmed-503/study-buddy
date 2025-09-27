import { useState } from "react";
import { Upload, FileText, Brain, Sparkles, BookOpen, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Home = () => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // For now, just show a toast - actual upload will need Supabase backend
    toast({
      title: "Upload Ready",
      description: "Connect to Supabase to enable file processing and AI features.",
    });
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent mb-6">
              Your AI-Powered
              <br />
              Study Companion
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
              Upload your notes and let AI create summaries, flashcards, and quizzes. 
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
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Upload Your Study Material</h3>
                <p className="text-muted-foreground mb-6">
                  Drag and drop your PDF, DOC, or TXT files here, or click to browse
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="gradient-primary text-white shadow-ai hover:shadow-lg transition-all"
                    onClick={() => document.getElementById('file-input')?.click()}
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
                  />
                  <Button variant="outline" size="lg">
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