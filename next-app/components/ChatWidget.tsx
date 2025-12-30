"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Bot, User, LogIn } from "lucide-react";
import Link from "next/link";

interface Message {
  id: number;
  userId: string;
  senderType: "user" | "admin";
  content: string;
  isFromHuman: boolean;
  createdAt: string;
}

export default function ChatWidget() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    queryFn: async () => {
      const res = await fetch("/api/messages", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!session?.user && isOpen,
    refetchInterval: isOpen ? 5000 : false,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessage("");
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate(message.trim());
  };

  const isLoggedIn = !!session?.user;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-[9999] h-14 w-14 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg flex items-center justify-center text-white"
          data-testid="button-open-chat"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 md:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border flex flex-col max-h-[500px]">
          <div className="flex items-center justify-between p-4 border-b bg-orange-500 text-white rounded-t-xl">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">Sticky Support</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-orange-600"
              data-testid="button-close-chat"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {!isLoggedIn ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center min-h-[250px]">
              <Bot className="h-12 w-12 mb-4 text-orange-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Need Help?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Sign in to chat with our AI support assistant and get instant help with your orders.
              </p>
              <Link href="/login">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In to Chat
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px] max-h-[300px]">
                {messages.length === 0 && !isLoading && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    <Bot className="h-12 w-12 mx-auto mb-3 text-orange-400" />
                    <p>Hi there! How can we help you today?</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        msg.senderType === "user"
                          ? "bg-orange-500 text-white"
                          : msg.isFromHuman
                          ? "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      }`}
                      data-testid={`message-${msg.id}`}
                    >
                      {msg.senderType !== "user" && (
                        <div className="flex items-center gap-1 mb-1 text-xs opacity-70">
                          {msg.isFromHuman ? (
                            <>
                              <User className="h-3 w-3" />
                              <span>Support Team</span>
                            </>
                          ) : (
                            <>
                              <Bot className="h-3 w-3" />
                              <span>AI Assistant</span>
                            </>
                          )}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-800 dark:border-gray-700"
                  disabled={sendMutation.isPending}
                  data-testid="input-chat-message"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={sendMutation.isPending || !message.trim()}
                  className="bg-orange-500 hover:bg-orange-600"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
