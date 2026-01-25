"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, MessageSquare, Package, Loader2, Mail, Clock } from "lucide-react";
import { format } from "date-fns";

interface ArtworkNote {
  id: number;
  orderId: number;
  orderItemId: number | null;
  userId: string | null;
  senderType: 'admin' | 'user';
  content: string;
  isRead: boolean;
  createdAt: string;
  senderName: string;
}

interface Order {
  id: number;
  status: string;
  createdAt: string;
}

function MessagesPageContent() {
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    if (orderIdParam) {
      setSelectedOrderId(parseInt(orderIdParam));
    }
  }, [searchParams]);

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/account/orders'],
    queryFn: async () => {
      const res = await fetch('/api/account/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    enabled: sessionStatus === 'authenticated',
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<{ notes: ArtworkNote[] }>({
    queryKey: ['/api/orders', selectedOrderId, 'artwork-notes'],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${selectedOrderId}/artwork-notes`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!selectedOrderId && sessionStatus === 'authenticated',
    refetchInterval: 10000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/orders/${selectedOrderId}/artwork-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders', selectedOrderId, 'artwork-notes'] });
      setNewMessage("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to view your messages.</p>
          <Link href="/api/auth/signin">
            <Button className="bg-orange-500 hover:bg-orange-600">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  const ordersWithMessages = orders?.filter(order => {
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/account">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-orange-500" />
            <h1 className="text-xl font-bold">Messages</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card className="p-4">
              <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Your Orders
              </h2>
              
              {ordersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : ordersWithMessages.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No orders found</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {ordersWithMessages.map(order => (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedOrderId === order.id
                          ? 'bg-orange-100 border-2 border-orange-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                      data-testid={`order-message-${order.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Order #{order.id}</span>
                        <Badge variant="outline" className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(order.createdAt)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="flex flex-col h-[70vh]">
              {!selectedOrderId ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>Select an order to view messages</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Order #{selectedOrderId}</h3>
                      <Link href={`/orders/${selectedOrderId}`}>
                        <Button variant="outline" size="sm">
                          View Order
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                      </div>
                    ) : messages?.notes && messages.notes.length > 0 ? (
                      <>
                        {messages.notes.map((note) => (
                          <div
                            key={note.id}
                            className={`flex ${note.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                note.senderType === 'user'
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium opacity-80">
                                  {note.senderType === 'admin' ? 'Sticky Banditos Support' : 'You'}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                              <div className={`flex items-center gap-1 mt-2 text-xs ${
                                note.senderType === 'user' ? 'text-orange-100' : 'text-gray-500'
                              }`}>
                                <Clock className="h-3 w-3" />
                                {formatDate(note.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No messages yet</p>
                        <p className="text-sm mt-1">Send a message below to start a conversation</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t bg-white">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (newMessage.trim()) {
                          sendMessageMutation.mutate(newMessage.trim());
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        disabled={sendMessageMutation.isPending}
                        data-testid="input-customer-message"
                      />
                      <Button
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-600"
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        data-testid="button-send-message"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Messages are typically responded to within 24 business hours
                    </p>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  );
}
