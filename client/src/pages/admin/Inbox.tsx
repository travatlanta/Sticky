import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Inbox, MessageCircle, Send, ChevronDown, ChevronUp, User, Clock, AlertCircle, Bot, Headphones, Loader2 } from "lucide-react";

interface EscalatedConversation {
  userId: string;
  userEmail: string;
  userName: string;
  lastMessage: string;
  lastMessageAt: string;
  escalatedAt: string;
  messageCount: number;
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
  } | null;
}

export default function AdminInbox() {
  const { toast } = useToast();
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: conversations, isLoading } = useQuery<EscalatedConversation[]>({
    queryKey: ["/api/admin/inbox"],
  });

  const { data: conversationDetail, isLoading: isLoadingDetail, error: detailError } = useQuery<ConversationDetail>({
    queryKey: ["/api/admin/inbox", expandedUserId],
    enabled: !!expandedUserId,
  });

  const replyMutation = useMutation({
    mutationFn: async (data: { userId: string; content: string }) => {
      return apiRequest("POST", "/api/admin/messages/reply", data);
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

  const handleSendReply = () => {
    if (!expandedUserId || !replyContent.trim()) return;
    replyMutation.mutate({ userId: expandedUserId, content: replyContent.trim() });
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

  const formatTime = (dateString: string) => {
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
                Conversations escalated from the AI chatbot
              </p>
            </div>
          </div>
        </div>

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
                When customers ask to speak with a human, their conversations will appear here.
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
                  className="overflow-visible"
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
                      <div className="border-t">
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
                            {/* Messages */}
                            <div className="p-4 max-h-96 overflow-y-auto space-y-3 bg-muted/30">
                              {conversationDetail.messages.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`flex ${msg.senderType === "admin" ? "justify-end" : "justify-start"}`}
                                >
                                  <div
                                    className={`max-w-[80%] rounded-lg p-3 ${
                                      msg.senderType === "admin"
                                        ? msg.isFromHuman
                                          ? "bg-green-500/20 dark:bg-green-900/40 border border-green-500/30"
                                          : "bg-orange-500/20 dark:bg-orange-900/40 border border-orange-500/30"
                                        : "bg-background border"
                                    }`}
                                    data-testid={`message-${msg.id}`}
                                  >
                                    {msg.senderType === "admin" && (
                                      <div className="flex items-center gap-1 mb-1">
                                        {msg.isFromHuman ? (
                                          <Headphones className="h-3 w-3 text-green-600 dark:text-green-400" />
                                        ) : (
                                          <Bot className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                                        )}
                                        <span className={`text-xs font-medium ${
                                          msg.isFromHuman 
                                            ? "text-green-600 dark:text-green-400" 
                                            : "text-orange-600 dark:text-orange-400"
                                        }`}>
                                          {msg.isFromHuman ? "Support Team" : "AI Bot"}
                                        </span>
                                      </div>
                                    )}
                                    {msg.senderType === "user" && (
                                      <div className="flex items-center gap-1 mb-1">
                                        <User className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-xs font-medium text-muted-foreground">Customer</span>
                                      </div>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap text-foreground">{msg.content}</p>
                                    <p className="text-xs mt-1 text-muted-foreground">
                                      {formatFullTime(msg.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Reply Box */}
                            <div className="p-4 border-t bg-background">
                              <div className="flex gap-2">
                                <Textarea
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder="Type your reply to the customer..."
                                  className="resize-none"
                                  rows={3}
                                  data-testid="input-reply-message"
                                />
                                <Button
                                  onClick={handleSendReply}
                                  disabled={!replyContent.trim() || replyMutation.isPending}
                                  data-testid="button-send-reply"
                                >
                                  {replyMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                Sending a reply will mark this conversation as handled and remove it from the inbox.
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
      </div>
    </AdminLayout>
  );
}
