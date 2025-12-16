import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle,
  X,
  Send,
  User,
  Headphones,
  Loader2,
  Bot,
  LogIn,
} from "lucide-react";
import { Link } from "wouter";
import type { Message } from "@shared/schema";

interface ChatWidgetProps {
  isAuthenticated: boolean;
}

export function ChatWidget({ isAuthenticated }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    enabled: isOpen && isAuthenticated,
    refetchInterval: isOpen ? 3000 : false,
    retry: false,
    queryFn: async () => {
      const res = await fetch("/api/messages", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          return [];
        }
        throw new Error("Failed to fetch messages");
      }
      return res.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessageText("");
      // Refetch after a short delay to get the AI response
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      }, 2000);
    },
    onError: (error: Error) => {
      console.error("Failed to send message:", error);
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && !sendMutation.isPending) {
      sendMutation.mutate(messageText.trim());
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-40">
      {isOpen ? (
        <div className="w-80 sm:w-96 h-[28rem] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-orange-200 dark:border-orange-800 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <span className="font-heading font-bold block">Support Chat</span>
                <span className="text-xs text-orange-100">AI-powered assistant</span>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20 h-8 w-8"
              onClick={() => setIsOpen(false)}
              data-testid="button-close-chat"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Show login prompt for unauthenticated users */}
          {!isAuthenticated ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800">
              <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
                <LogIn className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="font-heading font-bold text-lg text-gray-800 dark:text-gray-100 mb-2 text-center">
                Sign in to Chat
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                Log in to ask questions about our products, shipping, or get help with your orders.
              </p>
              <Link href="/auth">
                <Button 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  data-testid="button-login-to-chat"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-orange-500" />
                </div>
                <p className="font-medium text-gray-700 mb-1">Hi there!</p>
                <p className="text-sm text-gray-500">
                  Ask me anything about our products, pricing, shipping, or your orders!
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isHumanSupport = msg.senderType === "admin" && msg.isFromHuman;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                          msg.senderType === "user"
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-br-sm"
                            : isHumanSupport
                              ? "bg-gradient-to-r from-green-50 to-emerald-50 text-gray-800 border border-green-200 rounded-bl-sm shadow-sm"
                              : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          {msg.senderType === "admin" ? (
                            isHumanSupport ? (
                              <Headphones className="w-3 h-3 text-green-600" />
                            ) : (
                              <Bot className="w-3 h-3 text-orange-500" />
                            )
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          <span className={`text-xs font-medium ${
                            msg.senderType === "user" 
                              ? "text-orange-100" 
                              : isHumanSupport 
                                ? "text-green-600" 
                                : "text-orange-500"
                          }`}>
                            {msg.senderType === "admin" 
                              ? isHumanSupport 
                                ? "Support Team" 
                                : "Support Bot" 
                              : "You"}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        <p className={`text-xs mt-1.5 ${msg.senderType === "user" ? "text-orange-200" : "text-gray-400"}`}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                disabled={sendMutation.isPending}
                className="bg-gray-50 border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                data-testid="input-chat-message"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!messageText.trim() || sendMutation.isPending}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md"
                data-testid="button-send-message"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
            </>
          )}
        </div>
      ) : (
        <button
          className="group relative w-16 h-16 rounded-full shadow-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-2 border-white flex items-center justify-center transition-transform hover:scale-105"
          onClick={() => setIsOpen(true)}
          data-testid="button-open-chat"
        >
          <Headphones className="w-7 h-7 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}
    </div>
  );
}
