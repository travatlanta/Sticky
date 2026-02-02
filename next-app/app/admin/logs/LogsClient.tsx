"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  ShoppingBag,
  LogIn,
  FileWarning,
  Clock,
  Globe,
  Monitor,
  User,
} from "lucide-react";

interface ActivityLog {
  id: number;
  userEmail: string | null;
  userId: string | null;
  eventType: string;
  eventMessage: string;
  eventDetails: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestPath: string | null;
  statusCode: number | null;
  errorMessage: string | null;
  createdAt: string;
}

interface LogsResponse {
  logs: ActivityLog[];
  total: number;
  limit: number;
  offset: number;
  setupRequired?: boolean;
  message?: string;
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case 'login_success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'login_failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'order_lookup':
      return <ShoppingBag className="h-4 w-4 text-blue-500" />;
    case 'order_not_found':
      return <FileWarning className="h-4 w-4 text-yellow-500" />;
    case 'page_error':
    case 'api_error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'checkout_started':
    case 'checkout_completed':
      return <ShoppingBag className="h-4 w-4 text-green-500" />;
    case 'checkout_failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'session_started':
      return <LogIn className="h-4 w-4 text-blue-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
}

function getEventBadge(eventType: string) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    login_success: { label: "Login Success", variant: "default" },
    login_failed: { label: "Login Failed", variant: "destructive" },
    order_lookup: { label: "Order Lookup", variant: "secondary" },
    order_not_found: { label: "No Orders Found", variant: "outline" },
    page_error: { label: "Page Error", variant: "destructive" },
    api_error: { label: "API Error", variant: "destructive" },
    checkout_started: { label: "Checkout Started", variant: "secondary" },
    checkout_completed: { label: "Checkout Done", variant: "default" },
    checkout_failed: { label: "Checkout Failed", variant: "destructive" },
    session_started: { label: "Session", variant: "secondary" },
    general: { label: "General", variant: "outline" },
  };

  const { label, variant } = config[eventType] || { label: eventType, variant: "outline" as const };
  return <Badge variant={variant}>{label}</Badge>;
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getBrowserName(userAgent: string | null): string {
  if (!userAgent) return "Unknown";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  return "Other";
}

export default function LogsClient() {
  const [searchEmail, setSearchEmail] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [appliedEmail, setAppliedEmail] = useState("");
  const [appliedEventFilter, setAppliedEventFilter] = useState("all");

  const { data, isLoading, refetch, isFetching } = useQuery<LogsResponse>({
    queryKey: [`/api/admin/logs?email=${appliedEmail}&eventType=${appliedEventFilter}&limit=100`],
    refetchInterval: 30000,
  });

  const handleSearch = () => {
    setAppliedEmail(searchEmail);
    setAppliedEventFilter(eventFilter);
  };

  const handleClear = () => {
    setSearchEmail("");
    setEventFilter("all");
    setAppliedEmail("");
    setAppliedEventFilter("all");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Activity Logs</h1>
            <p className="text-gray-500">
              Search customer activity to troubleshoot issues. See login attempts, order lookups, and errors.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by customer email..."
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-10"
                      data-testid="input-search-email"
                    />
                  </div>
                </div>
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger className="w-full sm:w-48" data-testid="select-event-filter">
                    <SelectValue placeholder="Event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="login_success">Login Success</SelectItem>
                    <SelectItem value="login_failed">Login Failed</SelectItem>
                    <SelectItem value="order_lookup">Order Lookup</SelectItem>
                    <SelectItem value="order_not_found">Order Not Found</SelectItem>
                    <SelectItem value="api_error">API Error</SelectItem>
                    <SelectItem value="checkout_started">Checkout Started</SelectItem>
                    <SelectItem value="checkout_completed">Checkout Completed</SelectItem>
                    <SelectItem value="checkout_failed">Checkout Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} data-testid="button-search">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" onClick={handleClear} data-testid="button-clear">
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  data-testid="button-refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {appliedEmail && (
          <div className="text-sm text-gray-600">
            Showing results for: <strong>{appliedEmail}</strong>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-16 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data?.setupRequired ? (
          <Card className="p-8 text-center border-orange-200 bg-orange-50">
            <AlertCircle className="h-12 w-12 text-orange-400 mx-auto mb-3" />
            <p className="text-orange-800 font-medium mb-2">Database Setup Required</p>
            <p className="text-orange-600 text-sm">
              The activity logging table needs to be created. A database sync is needed to enable this feature.
            </p>
          </Card>
        ) : !data?.logs?.length ? (
          <Card className="p-8 text-center">
            <FileWarning className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {appliedEmail 
                ? `No activity found for "${appliedEmail}"`
                : "No activity logs yet. Customer activity will appear here."}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-gray-500 mb-2">
              Showing {data.logs.length} of {data.total} entries
            </div>
            {data.logs.map((log) => (
              <Card key={log.id} className="hover-elevate" data-testid={`log-entry-${log.id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0">
                        {getEventIcon(log.eventType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {getEventBadge(log.eventType)}
                          {log.statusCode && log.statusCode >= 400 && (
                            <Badge variant="destructive" className="text-xs">
                              HTTP {log.statusCode}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 truncate" data-testid={`log-message-${log.id}`}>
                          {log.eventMessage}
                        </p>
                        {log.errorMessage && (
                          <p className="text-sm text-red-600 mt-1">
                            Error: {log.errorMessage}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                          {log.userEmail && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.userEmail}
                            </span>
                          )}
                          {log.ipAddress && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {log.ipAddress}
                            </span>
                          )}
                          {log.userAgent && (
                            <span className="flex items-center gap-1">
                              <Monitor className="h-3 w-3" />
                              {getBrowserName(log.userAgent)}
                            </span>
                          )}
                          {log.requestPath && (
                            <span className="font-mono text-gray-400">
                              {log.requestPath}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </div>
                  </div>
                  {log.eventDetails && Object.keys(log.eventDetails).length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <details className="text-xs">
                        <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
                          View details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto text-gray-600">
                          {JSON.stringify(log.eventDetails, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
