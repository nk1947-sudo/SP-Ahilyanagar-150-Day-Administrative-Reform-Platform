import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bot, Send, MessageSquare, Trash2, Plus, Clock, User, AlertCircle, Lightbulb } from "lucide-react";

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
  createdAt: string;
}

interface ChatConversation {
  id: number;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ChatResponse {
  response: string;
  conversationId: number;
  sources?: string[];
  metadata?: any;
}

export default function AIAssistant() {
  const { toast } = useToast();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading, refetch: refetchConversations } = useQuery({
    queryKey: ["/api/chat/conversations"],
    queryFn: () => fetch("/api/chat/conversations").then(res => res.json())
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ["/api/chat/conversations", selectedConversationId],
    queryFn: () => {
      if (!selectedConversationId) return [];
      return fetch(`/api/chat/conversations/${selectedConversationId}`).then(res => res.json());
    },
    enabled: !!selectedConversationId
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, conversationId }: { message: string; conversationId?: number }) => {
      const res = await apiRequest("POST", "/api/chat", { message, conversationId });
      return res.json() as Promise<ChatResponse>;
    },
    onSuccess: (data) => {
      setSelectedConversationId(data.conversationId);
      setMessage("");
      refetchMessages();
      refetchConversations();
    },
    onError: (error: Error) => {
      if (error.message.includes("API key required")) {
        toast({
          title: "AI Service Unavailable",
          description: "The AI assistant requires configuration. Please contact your administrator.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const res = await apiRequest("DELETE", `/api/chat/conversations/${conversationId}`);
      return res.json();
    },
    onSuccess: () => {
      setSelectedConversationId(null);
      refetchConversations();
      toast({
        title: "Success",
        description: "Conversation deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessageMutation.mutate({
      message: message.trim(),
      conversationId: selectedConversationId || undefined
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewConversation = () => {
    setSelectedConversationId(null);
    setMessage("");
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getExampleQuestions = () => [
    "What is the current status of the 150-day administrative reform program?",
    "How can I submit a daily report for my team?",
    "What are the budget allocation guidelines for Team Alpha?",
    "What documents are required for Vision 2047 compliance?",
    "How do I track task progress for my team members?",
    "What are the reporting schedules for daily updates?"
  ];

  return (
    <div className="container mx-auto p-6 h-screen flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            SP Ahilyanagar Administrative Reform Program Assistant
          </p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-80 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Conversations</CardTitle>
                <Button size="sm" onClick={startNewConversation}>
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full">
                {conversationsLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading conversations...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No conversations yet
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {conversations.map((conv: ChatConversation) => (
                      <div
                        key={conv.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversationId === conv.id
                            ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => setSelectedConversationId(conv.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{conv.title}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {new Date(conv.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          {selectedConversationId === conv.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversationMutation.mutate(conv.id);
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                AI Assistant - SP Ahilyanagar Administrative Reform
              </CardTitle>
              <CardDescription>
                Get help with program management, tasks, reports, and administrative procedures
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                {!selectedConversationId && messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                    <Bot className="h-16 w-16 text-blue-500 opacity-50" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Welcome to the AI Assistant
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
                        I'm here to help you with the 150-day administrative reform program. 
                        Ask me about tasks, reports, budgets, or any program-related questions.
                      </p>
                    </div>

                    <div className="w-full max-w-2xl">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Example Questions:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {getExampleQuestions().map((question, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-left justify-start h-auto p-3 text-wrap"
                            onClick={() => setMessage(question)}
                          >
                            {question}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-2xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-800 dark:text-blue-200">
                            Important Notice
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            This AI assistant has access to current program data and can provide 
                            specific guidance based on your role and team assignments. All conversations 
                            are logged for security and compliance purposes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messagesLoading ? (
                      <div className="text-center py-4">Loading messages...</div>
                    ) : (
                      messages.map((msg: ChatMessage) => (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              msg.role === 'user' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>
                            <div className={`rounded-lg p-3 ${
                              msg.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            }`}>
                              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                              <div className={`text-xs mt-1 opacity-70 ${
                                msg.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {formatMessageTime(msg.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              <Separator />

              {/* Input Area */}
              <div className="p-4">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about the administrative reform program..."
                    className="flex-1"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="px-4"
                  >
                    {sendMessageMutation.isPending ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <Badge variant="outline" className="text-xs">
                    Vision 2047 Program Assistant
                  </Badge>
                  <span>Press Enter to send, Shift+Enter for new line</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}