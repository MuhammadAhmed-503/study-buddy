import { useState } from "react";
import { Send, Bot, User, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: number;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: "ai",
      content: "Hello! I'm your AI Study Buddy. I can help explain concepts from your uploaded notes, answer questions, and break down complex topics into simple terms. What would you like to learn about today?",
      timestamp: new Date()
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI response - will be replaced with actual Hugging Face API call
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        type: "ai",
        content: "I'd be happy to help explain that concept! However, to provide accurate answers based on your study material, you'll need to connect to Supabase first. This will enable me to access your uploaded notes and provide personalized explanations using the Hugging Face AI models.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "Explain machine learning in simple terms",
    "What are the key principles of database design?",
    "How do React components work?",
    "What's the difference between supervised and unsupervised learning?"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-muted/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Study Chat</h1>
          <p className="text-muted-foreground">Ask questions about your study material and get AI-powered explanations</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Suggested Questions Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-primary" />
                  Quick Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full text-left text-sm h-auto py-3 px-3 justify-start"
                    onClick={() => setInputMessage(question)}
                  >
                    {question}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[700px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center">
                  <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center mr-3">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  AI Study Assistant
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-4 py-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-3 ${
                          message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
                        }`}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className={
                            message.type === "ai" 
                              ? "gradient-primary text-white" 
                              : "bg-secondary text-secondary-foreground"
                          }>
                            {message.type === "ai" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`max-w-[80%] ${message.type === "user" ? "text-right" : ""}`}>
                          <div
                            className={`rounded-lg px-4 py-3 ${
                              message.type === "user"
                                ? "bg-primary text-primary-foreground ml-auto"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="gradient-primary text-white">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-lg px-4 py-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t border-card-border p-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Ask a question about your study material..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isTyping}
                      className="gradient-primary text-white shadow-ai hover:shadow-lg transition-all"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Connect to Supabase to enable AI-powered responses based on your study material
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;