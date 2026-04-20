"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import ReactMarkdown from "react-markdown";
import Mermaid from "@/components/common/Mermaid";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: any[];
}
const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hi! I'm your AI medical tutor. I'm here to help you with any questions about your MBBS curriculum. Ask me anything about anatomy, physiology, pharmacology, or any other subject!",
    timestamp: new Date(),
  },
];

const sampleQuestions = [
  "Explain the cardiac cycle",
  "What are the types of hypersensitivity reactions?",
  "Describe the mechanism of action of penicillin",
  "What is the difference between apoptosis and necrosis?",
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await apiClient.get("/llm/history");
      const historyData = res.data?.data || [];
      
      if (historyData.length > 0) {
        const historyMessages: Message[] = historyData.flatMap((chat: any) => [
          {
            id: `${chat.id}-user`,
            role: "user",
            content: chat.question,
            timestamp: new Date(chat.createdAt),
          },
          {
            id: `${chat.id}-assistant`,
            role: "assistant",
            content: chat.response,
            timestamp: new Date(chat.createdAt),
          }
        ]);
        
        setMessages([...initialMessages, ...historyMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())]);
      }
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear your chat history? This cannot be undone.")) return;
    try {
      await apiClient.delete("/llm/history");
      setMessages(initialMessages);
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await apiClient.post("/llm/chat", { question: input });
      const result = res.data?.data;
      const answer = result?.answer || "Sorry, I couldn't generate a response right now.";
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: answer,
        timestamp: new Date(),
        sources: result?.sources,
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error: any) {
      console.error("AI Error:", error);
      const errResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error connecting to AI: ${error.response?.data?.message || "Internal server error"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg">
          <Bot className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
          <p className="text-gray-600 mt-1">
            Your AI medical mentor, available 24/7
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleClearHistory} className="text-gray-500 hover:text-red-600">
            Clear History
          </Button>
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered
          </Badge>
        </div>
      </div>

      {/* Chat Container */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chat */}
        <Card className="lg:col-span-2 shadow-sm border-gray-200 rounded-2xl overflow-hidden flex flex-col h-[600px]">
          <CardContent className="p-0 flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-500 flex-shrink-0">
                      <AvatarFallback className="text-white text-xs">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-sm ${
                      message.role === "user" 
                        ? "bg-blue-600 text-white rounded-tr-none" 
                        : "bg-white border border-gray-100 text-gray-900 rounded-tl-none"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:text-gray-700 prose-headings:text-blue-900 prose-headings:font-bold prose-ul:my-2 prose-li:my-0 mt-1">
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || "");
                              if (!inline && match && match[1] === "mermaid") {
                                return <Mermaid chart={String(children).replace(/\n$/, "")} />;
                              }
                              return (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    )}
                    
                    {message.sources && message.sources.length > 0 && (
                      <div className={`mt-4 pt-4 border-t ${message.role === "user" ? "border-white/20" : "border-gray-100"}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
                          Sources from your notes:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {message.sources.map((source, idx) => (
                            <Badge key={idx} variant="secondary" className={`text-[10px] border-none ${message.role === "user" ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"}`}>
                              {source.metadata?.title || "Untitled Note"}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className={`text-[10px] mt-2 ${message.role === "user" ? "text-blue-100" : "text-gray-400"}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 bg-blue-500 flex-shrink-0">
                      <AvatarFallback className="text-white text-xs font-semibold">U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-500 flex-shrink-0">
                    <AvatarFallback className="text-white text-xs">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 rounded-xl p-4">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" style={{ animationDelay: "0.1s" }} />
                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask a medical question..."
                  className="flex-1 rounded-full border-gray-300 focus:ring-2 focus:ring-blue-500"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="rounded-full bg-blue-600 hover:bg-blue-700 px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Questions */}
          <Card className="shadow-sm border-gray-200 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                💡 Suggested Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sampleQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-3 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200 rounded-lg"
                  onClick={() => handleQuickQuestion(question)}
                >
                  <span className="text-sm line-clamp-2">{question}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="shadow-sm border-gray-200 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                ✨ What I Can Help With
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span className="text-gray-700">Explain complex medical concepts</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span className="text-gray-700">Provide NMC-aligned learning resources</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span className="text-gray-700">Answer doubts from any subject</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span className="text-gray-700">Generate practice questions</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span className="text-gray-700">Create study plans and tips</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}