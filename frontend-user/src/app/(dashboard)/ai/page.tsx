"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
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

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Great question about "${input}"! Let me help you understand this concept better.\n\nThis is a mock response demonstrating the AI mentor interface. In a production environment, this would connect to an AI service to provide accurate, helpful explanations aligned with your MBBS curriculum.\n\nWould you like me to explain any specific aspect in more detail?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
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
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered
        </Badge>
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
                  className={`flex gap-3 ${message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                    }`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-500 flex-shrink-0">
                      <AvatarFallback className="text-white text-xs">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`max-w-[75%] rounded-xl p-4 ${message.role === "user"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-900"
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-2 ${message.role === "user"
                        ? "text-blue-100"
                        : "text-gray-500"
                        }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 bg-blue-500 flex-shrink-0">
                      <AvatarFallback className="text-white text-xs font-semibold">
                        U
                      </AvatarFallback>
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
                      <div
                        className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      />
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