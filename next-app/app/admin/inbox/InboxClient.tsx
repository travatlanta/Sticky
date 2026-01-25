"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Inbox, MessageCircle, Send, ChevronDown, ChevronUp, User, Clock, 
  AlertCircle, Bot, Headphones, Loader2, Mail, Phone, ExternalLink,
  Package, ShoppingCart, DollarSign
} from "lucide-react";
import Link from "next/link";

interface EscalatedConversation {
  userId: string;
  userEmail: string;
  userName: string;
  lastMessage: string;
  lastMessageAt: string;
  escalatedAt: string;
  messageCount: number;
}

interface OrderConversation {
  orderId: number;
  orderNumber: string;
  orderStatus: string;
  orderTotal: number;
  orderDate: string;
  userId: string;
  customerEmail: string;
  customerName: string;
  messageCount: number;
  unreadCount: number;
  lastMessage: string;
  lastSender: string;
  lastMessageAt: string;
}

interface Message {
  id: number;
  userId: string;
  senderType: "user" | "admin";
  content: string;
  createdAt: string;
  isFromHuman?: boolean;
}

interface ConversationDetail {
  messages: Message[];
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  } | null;
}

interface OrderNote {
  id: number;
  orderId: number;
  orderItemId: number | null;
  userId: string;
  senderType: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  senderName: string;
}

export default function AdminInbox() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("orders");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [orderReplyContent, setOrderReplyContent] = useState("");

  // AI Chat escalations
  const { data: conversations, isLoading } = useQuery<EscalatedConversation[]>({
    queryKey: ["/api/admin/inbox"],
  });

  // Order messages
  const { data: orderMessagesData, isLoading: isLoadingOrders } = useQuery<{ conversations: OrderConversation[] }>({
    queryKey: ["/api/admin/inbox/order-messages"],
  });

  const orderConversations = orderMessagesData?.conversations || [];

  const { data: conversationDetail, isLoading: isLoadingDetail, error: detailError } = useQuery<ConversationDetail>({
    queryKey: ["/api/admin/inbox/" + expandedUserId],
    enabled: !!expandedUserId,
  });

  const { data: orderNotesData, isLoading: isLoadingOrderNotes } = useQuery<{ notes: OrderNote[] }>({
    queryKey: [`/api/orders/${expandedOrderId}/artwork-notes`],
    enabled: !!expandedOrderId,
  });

  const orderNotes = orderNotesData?.notes || [];

  const replyMutation = useMutation({
    mutationFn: async (data: { userId: string; content: string }) => {
      const res = await fetch("/api/admin/messages/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to send reply");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Reply sent", description: "Your message has been sent to the customer." });
      setReplyContent("");
      setExpandedUserId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inbox"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send reply", variant: "destructive" });
    },
  });

  const orderReplyMutation = useMutation({
    mutationFn: async (data: { orderId: number; content: string }) => {
      const res = await fetch(`/api/orders/${data.orderId}/artwork-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: data.content }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Message sent", description: "Your message has been sent and the customer will be notified by email." });
      setOrderReplyContent("");
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${expandedOrderId}/artwork-notes`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inbox/order-messages"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    },
  });

  const handleSendReply = () => {
    if (!expandedUserId || !replyContent.trim()) return;
    replyMutation.mutate({ userId: expandedUserId, content: replyContent.trim() });
  };

  const handleSendOrderReply = () => {
    if (!expandedOrderId || !orderReplyContent.trim()) return;
    orderReplyMutation.mutate({ orderId: expandedOrderId, content: orderReplyContent.trim() });
  };

  const toggleExpand = (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setReplyContent("");
    } else {
      setExpandedUserId(userId);
      setReplyContent("");
    }
  };

  const toggleOrderExpand = (orderId: number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setOrderReplyContent("");
    } else {
      setExpandedOrderId(orderId);
      setOrderReplyContent("");
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const formatFullTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const totalUnread = orderConversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Inbox className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Support Inbox</h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Order messages and customer conversations
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="orders" className="flex items-center gap-2" data-testid="tab-order-messages">
              <Package className="h-4 w-4" />
              Order Messages
              {totalUnread > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 text-xs">
                  {totalUnread}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2" data-testid="tab-chat-escalations">
              <MessageCircle className="h-4 w-4" />
              Chat Escalations
              {conversations && conversations.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                  {conversations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Order Messages Tab */}
          <TabsContent value="orders">
            {isLoadingOrders ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : orderConversations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No order messages</h3>
                  <p className="text-muted-foreground">
                    Messages about orders will appear here when customers or admins send them.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orderConversations.map((conv) => {
                  const isExpanded = expandedOrderId === conv.orderId;
                  
                  return (
                    <Card
                      key={conv.orderId}
                      className={`overflow-visible transition-all duration-200 ${
                        isExpanded 
                          ? "ring-2 ring-orange-400/50 dark:ring-orange-500/30 border-orange-300 dark:border-orange-800" 
                          : ""
                      }`}
                      data-testid={`card-order-conversation-${conv.orderId}`}
                    >
                      <CardContent className="p-0">
                        {/* Order Conversation Header */}
                        <div
                          className="p-4 cursor-pointer hover-elevate active-elevate-2 rounded-t-lg"
                          onClick={() => toggleOrderExpand(conv.orderId)}
                          data-testid={`button-toggle-order-${conv.orderId}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-foreground">
                                    Order #{conv.orderNumber}
                                  </p>
                                  <Badge className={getStatusColor(conv.orderStatus)}>
                                    {conv.orderStatus}
                                  </Badge>
                                  {conv.unreadCount > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {conv.unreadCount} new
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{conv.customerName} • {conv.customerEmail}</p>
                                {!isExpanded && conv.lastMessage && (
                                  <p className="text-sm text-foreground mt-1 line-clamp-2">
                                    <span className="text-muted-foreground">
                                      {conv.lastSender === 'admin' ? 'You: ' : ''}
                                    </span>
                                    {conv.lastMessage}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-start gap-2 flex-shrink-0">
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(conv.lastMessageAt)}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <DollarSign className="h-3 w-3" />
                                  ${conv.orderTotal.toFixed(2)}
                                </div>
                                <Badge variant="secondary" className="mt-2">
                                  {conv.messageCount} messages
                                </Badge>
                              </div>
                              <Button variant="ghost" size="icon" className="ml-2">
                                {isExpanded ? (
                                  <ChevronUp className="h-5 w-5" />
                                ) : (
                                  <ChevronDown className="h-5 w-5" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Order Conversation */}
                        {isExpanded && (
                          <div className="border-t border-orange-200 dark:border-orange-900/50">
                            {/* Order Quick Info */}
                            <div className="p-4 bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-950/20 border-b border-orange-200 dark:border-orange-800">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-3">
                                  <Link 
                                    href={`/admin/orders?orderId=${conv.orderId}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 border border-orange-200 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors"
                                    data-testid="link-view-order"
                                  >
                                    <Package className="h-3.5 w-3.5 text-orange-500" />
                                    View Full Order
                                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                  </Link>
                                  <a 
                                    href={`mailto:${conv.customerEmail}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 border border-orange-200 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors"
                                    data-testid="link-email-order-customer"
                                  >
                                    <Mail className="h-3.5 w-3.5 text-orange-500" />
                                    {conv.customerEmail}
                                  </a>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Ordered: {new Date(conv.orderDate).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            {/* Messages */}
                            {isLoadingOrderNotes ? (
                              <div className="p-8 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-muted-foreground">Loading messages...</span>
                              </div>
                            ) : (
                              <>
                                <div className="p-4 max-h-96 overflow-y-auto space-y-4 bg-gradient-to-b from-orange-50/50 via-white to-orange-50/30 dark:from-orange-950/20 dark:via-background dark:to-orange-950/10">
                                  {orderNotes.map((note) => (
                                    <div
                                      key={note.id}
                                      className={`flex ${note.senderType === "admin" ? "justify-end" : "justify-start"}`}
                                    >
                                      <div
                                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                                          note.senderType === "admin"
                                            ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-t-2 border-emerald-400"
                                            : "bg-orange-50 dark:bg-orange-100 border-2 border-orange-300 dark:border-orange-400 text-zinc-900"
                                        }`}
                                        data-testid={`order-message-${note.id}`}
                                      >
                                        <div className="flex items-center gap-1.5 mb-2">
                                          {note.senderType === "admin" ? (
                                            <Headphones className="h-3.5 w-3.5 text-white/90" />
                                          ) : (
                                            <User className="h-3.5 w-3.5 text-orange-600" />
                                          )}
                                          <span className={`text-xs font-semibold uppercase tracking-wide ${
                                            note.senderType === "admin" ? "text-white/90" : "text-orange-700"
                                          }`}>
                                            {note.senderName}
                                          </span>
                                        </div>
                                        <p className={`text-sm whitespace-pre-wrap ${
                                          note.senderType === "admin" ? "text-white" : "text-zinc-800"
                                        }`}>{note.content}</p>
                                        <p className={`text-xs mt-2 ${
                                          note.senderType === "admin" ? "text-white/70" : "text-zinc-500"
                                        }`}>
                                          {formatFullTime(note.createdAt)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Reply Box */}
                                <div className="p-4 border-t border-orange-100 dark:border-orange-900/30 bg-gradient-to-r from-orange-50/50 to-white dark:from-orange-950/20 dark:to-background">
                                  <div className="flex gap-3">
                                    <Textarea
                                      value={orderReplyContent}
                                      onChange={(e) => setOrderReplyContent(e.target.value)}
                                      placeholder="Type your message to the customer..."
                                      className="resize-none flex-1 border-orange-200 dark:border-orange-900/50 focus:border-orange-400 focus:ring-orange-400/20"
                                      rows={3}
                                      data-testid="input-order-reply-message"
                                    />
                                    <Button
                                      onClick={handleSendOrderReply}
                                      disabled={!orderReplyContent.trim() || orderReplyMutation.isPending}
                                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white self-end"
                                      data-testid="button-send-order-reply"
                                    >
                                      {orderReplyMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Send className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    Customer will receive an email notification with your message.
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Chat Escalations Tab */}
          <TabsContent value="chat">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !conversations || conversations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No escalated conversations</h3>
                  <p className="text-muted-foreground">
                    When customers ask to speak with a human via the chat widget, their conversations will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {conversations.map((conv) => {
                  const isExpanded = expandedUserId === conv.userId;
                  
                  return (
                    <Card
                      key={conv.userId}
                      className={`overflow-visible transition-all duration-200 ${
                        isExpanded 
                          ? "ring-2 ring-orange-400/50 dark:ring-orange-500/30 border-orange-300 dark:border-orange-800" 
                          : ""
                      }`}
                      data-testid={`card-conversation-${conv.userId}`}
                    >
                      <CardContent className="p-0">
                        {/* Conversation Header - Clickable */}
                        <div
                          className="p-4 cursor-pointer hover-elevate active-elevate-2 rounded-t-lg"
                          onClick={() => toggleExpand(conv.userId)}
                          data-testid={`button-toggle-${conv.userId}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-foreground">
                                    {conv.userName !== 'Unknown' ? conv.userName : conv.userEmail}
                                  </p>
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Needs Reply
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{conv.userEmail}</p>
                                {!isExpanded && (
                                  <p className="text-sm text-foreground mt-1 line-clamp-2">{conv.lastMessage}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-start gap-2 flex-shrink-0">
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(conv.escalatedAt)}
                                </div>
                                <Badge variant="secondary" className="mt-2">
                                  {conv.messageCount} messages
                                </Badge>
                              </div>
                              <Button variant="ghost" size="icon" className="ml-2">
                                {isExpanded ? (
                                  <ChevronUp className="h-5 w-5" />
                                ) : (
                                  <ChevronDown className="h-5 w-5" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Conversation Detail */}
                        {isExpanded && (
                          <div className="border-t border-orange-200 dark:border-orange-900/50">
                            {isLoadingDetail ? (
                              <div className="p-8 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-muted-foreground">Loading conversation...</span>
                              </div>
                            ) : detailError ? (
                              <div className="p-8 text-center text-destructive">
                                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                                <p>Error loading conversation. Please try again.</p>
                              </div>
                            ) : conversationDetail && conversationDetail.messages ? (
                              <>
                                {/* Customer Contact Info Panel */}
                                {conversationDetail.user && (
                                  <div className="p-4 bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-950/20 border-b border-orange-200 dark:border-orange-800">
                                    <div className="flex flex-wrap items-center gap-3">
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                          {conversationDetail.user.firstName || conversationDetail.user.lastName 
                                            ? `${conversationDetail.user.firstName || ''} ${conversationDetail.user.lastName || ''}`.trim()
                                            : 'Customer'}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <a 
                                          href={`mailto:${conversationDetail.user.email}`}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 border border-orange-200 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors"
                                          data-testid="link-email-customer"
                                        >
                                          <Mail className="h-3.5 w-3.5 text-orange-500" />
                                          {conversationDetail.user.email}
                                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                        </a>
                                        {conversationDetail.user.phone && (
                                          <a 
                                            href={`tel:${conversationDetail.user.phone}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 border border-orange-200 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors"
                                            data-testid="link-phone-customer"
                                          >
                                            <Phone className="h-3.5 w-3.5 text-emerald-500" />
                                            {conversationDetail.user.phone}
                                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Messages */}
                                <div className="p-4 max-h-96 overflow-y-auto space-y-4 bg-gradient-to-b from-orange-50/50 via-white to-orange-50/30 dark:from-orange-950/20 dark:via-background dark:to-orange-950/10">
                                  {conversationDetail.messages.map((msg) => (
                                    <div
                                      key={msg.id}
                                      className={`flex ${msg.senderType === "admin" ? "justify-end" : "justify-start"}`}
                                    >
                                      <div
                                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                                          msg.senderType === "admin"
                                            ? msg.isFromHuman
                                              ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-t-2 border-emerald-400"
                                              : "bg-gradient-to-br from-orange-400 to-orange-500 text-white border-t-2 border-orange-300"
                                            : "bg-orange-50 dark:bg-orange-100 border-2 border-orange-300 dark:border-orange-400 text-zinc-900"
                                        }`}
                                        data-testid={`message-${msg.id}`}
                                      >
                                        {msg.senderType === "admin" && (
                                          <div className="flex items-center gap-1.5 mb-2">
                                            {msg.isFromHuman ? (
                                              <Headphones className="h-3.5 w-3.5 text-white/90" />
                                            ) : (
                                              <Bot className="h-3.5 w-3.5 text-white/90" />
                                            )}
                                            <span className="text-xs font-semibold uppercase tracking-wide text-white/90">
                                              {msg.isFromHuman ? "Support Team" : "AI Assistant"}
                                            </span>
                                          </div>
                                        )}
                                        {msg.senderType === "user" && (
                                          <div className="flex items-center gap-1.5 mb-2">
                                            <User className="h-3.5 w-3.5 text-orange-600" />
                                            <span className="text-xs font-semibold uppercase tracking-wide text-orange-700">Customer</span>
                                          </div>
                                        )}
                                        <p className={`text-sm whitespace-pre-wrap ${
                                          msg.senderType === "admin" ? "text-white" : "text-zinc-800"
                                        }`}>{msg.content}</p>
                                        <p className={`text-xs mt-2 ${
                                          msg.senderType === "admin" ? "text-white/70" : "text-zinc-500"
                                        }`}>
                                          {formatFullTime(msg.createdAt)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Reply Box */}
                                <div className="p-4 border-t border-orange-100 dark:border-orange-900/30 bg-gradient-to-r from-orange-50/50 to-white dark:from-orange-950/20 dark:to-background">
                                  <div className="flex gap-3">
                                    <Textarea
                                      value={replyContent}
                                      onChange={(e) => setReplyContent(e.target.value)}
                                      placeholder="Type your reply to the customer..."
                                      className="resize-none flex-1 border-orange-200 dark:border-orange-900/50 focus:border-orange-400 focus:ring-orange-400/20"
                                      rows={3}
                                      data-testid="input-reply-message"
                                    />
                                    <Button
                                      onClick={handleSendReply}
                                      disabled={!replyContent.trim() || replyMutation.isPending}
                                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white self-end"
                                      data-testid="button-send-reply"
                                    >
                                      {replyMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Send className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                    Sending a reply will mark this conversation as handled. The conversation history is preserved.
                                  </p>
                                </div>
                              </>
                            ) : (
                              <div className="p-8 text-center text-muted-foreground">
                                Failed to load conversation
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
