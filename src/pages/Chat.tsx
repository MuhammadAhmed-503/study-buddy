import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Bot, User, BookOpen, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { AIService } from "@/services/AIService";
import { ChatService, ChatMessage } from "@/services/ChatService";
import { NotesService, Note } from "@/services/NotesService";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userNotes, setUserNotes] = useState<Note[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Scroll to bottom when new message is added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load chat history
      const chatResult = await ChatService.getChatHistory();
      console.log('Chat history result:', chatResult);
      
      if (chatResult.success && chatResult.messages && chatResult.messages.length > 0) {
        const formattedMessages: Message[] = [];
        
        chatResult.messages.forEach((msg) => {
          // Add user message
          formattedMessages.push({
            id: msg.id + "-user",
            type: "user",
            content: msg.message,
            timestamp: new Date(msg.created_at)
          });
          
          // Add AI response if exists
          if (msg.response) {
            formattedMessages.push({
              id: msg.id + "-ai",
              type: "ai",
              content: msg.response,
              timestamp: new Date(msg.created_at)
            });
          }
        });
        
        console.log('Setting formatted messages:', formattedMessages.length);
        setMessages(formattedMessages);
      } else {
        // No chat history found or error occurred - show welcome message
        console.log('No chat history found, showing welcome message');
        const welcomeMessage: Message = {
          id: "welcome",
          type: "ai",
          content: "Hello! I'm your AI assistant. I can help you with any questions, provide explanations on various topics, assist with problem-solving, engage in conversations, and much more. What can I help you with today?",
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }

      // Load user notes for context
      const notesResult = await NotesService.getUserNotes();
      if (notesResult.success && notesResult.notes) {
        setUserNotes(notesResult.notes);
      }

    } catch (error) {
      console.error('Chat data loading error:', error);
      
      // Show welcome message on error
      const welcomeMessage: Message = {
        id: "welcome-error",
        type: "ai",
        content: "Hello! I'm your AI assistant. I can help you with any questions, provide explanations on various topics, assist with problem-solving, engage in conversations, and much more. What can I help you with today?",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      
      toast({
        title: "Loading Error",
        description: "Failed to load chat history. Starting fresh.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadChatData();
  }, [loadChatData]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage("");
    setIsTyping(true);

    try {
      // Generate AI response without document context (universal chatbot)
      const aiResult = await AIService.generateChatResponse(currentMessage);
      
      const aiMessageId = (Date.now() + 1).toString();
      const aiResponse: Message = {
        id: aiMessageId,
        type: "ai",
        content: aiResult.success && aiResult.result
          ? aiResult.result
          : "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);

      // Save to database
      await ChatService.saveChatMessage({
        message: currentMessage,
        response: aiResponse.content,
        isUser: true
      });

    } catch (error) {
      console.error('Chat message error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: "ai",
        content: "I encountered an error while processing your message. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Chat Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = async () => {
    try {
      console.log('Attempting to clear chat history...');
      const result = await ChatService.clearChatHistory();
      
      if (result.success) {
        // Reset messages to welcome state
        setMessages([{
          id: "welcome-new",
          type: "ai",
          content: "Chat history cleared! How can I help you with your studies today?",
          timestamp: new Date()
        }]);
        
        toast({
          title: "Chat Cleared",
          description: "Chat history has been cleared successfully.",
        });
        
        console.log('Chat history cleared successfully');
      } else {
        console.error('Failed to clear chat history:', result.error);
        
        // Always clear local state, but show appropriate message
        setMessages([{
          id: "welcome-cleared",
          type: "ai",
          content: "Chat history cleared! How can I help you with your studies today?",
          timestamp: new Date()
        }]);
        
        if (result.error?.includes('permission') || result.error?.includes('policy') || result.error?.includes('Database permissions')) {
          toast({
            title: "Cleared Locally",
            description: "Chat cleared for this session. Database permissions may cause messages to reappear.",
            variant: "default",
          });
        } else {
          toast({
            title: "Cleared with Warning", 
            description: `Chat cleared locally. Database error: ${result.error}`,
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error('Clear chat error:', error);
      
      // Still clear local state even on error
      setMessages([{
        id: "welcome-error-cleared",
        type: "ai", 
        content: "Chat history cleared! How can I help you with your studies today?",
        timestamp: new Date()
      }]);
      
      toast({
        title: "Cleared Locally",
        description: "Chat cleared for this session only due to an error.",
        variant: "default",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "Explain quantum physics in simple terms",
    "Help me write a professional email",
    "What's the latest in AI technology?",
    "Solve this math problem for me",
    "Tell me a fun fact about space",
    "How do I improve my productivity?",
    "Explain blockchain technology",
    "What are the benefits of meditation?"
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-muted/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Chat</h1>
          <p className="text-muted-foreground">Chat with AI about anything - ask questions, get explanations, or have a conversation</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Suggested Questions Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-primary" />
                  Suggested Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full text-left text-sm h-auto py-3 px-3 justify-start whitespace-normal"
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
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center mr-3">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    AI Assistant
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearChat}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
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
                      placeholder="Ask me anything or start a conversation..."
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
                    Powered by advanced AI - ask about any topic, get help with tasks, or have a conversation
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