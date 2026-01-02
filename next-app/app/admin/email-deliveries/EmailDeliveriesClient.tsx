"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type EmailDeliveryStatus = "pending" | "sent" | "failed";

type EmailDeliveryRow = {
  id: number;
  orderId: number;
  orderNumber: string | null;
  type: string;
  toEmail: string;
  status: EmailDeliveryStatus;
  attempts: number;
  lastError: string | null;
  lastAttemptAt: string | null;
  sentAt: string | null;
  createdAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function StatusBadge({ status }: { status: EmailDeliveryStatus }) {
  const className =
    status === "sent"
      ? "bg-green-600 text-white hover:bg-green-600"
      : status === "failed"
        ? "bg-red-600 text-white hover:bg-red-600"
        : "bg-yellow-500 text-black hover:bg-yellow-500";

  return <Badge className={className}>{status}</Badge>;
}

export default function EmailDeliveriesClient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<EmailDeliveryStatus | "all">("all");
  const [type, setType] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (type !== "all") params.set("type", type);
    // Keep the query stable/cachable; do client-side filtering for search.
    return `/api/admin/email-deliveries?${params.toString()}`;
  }, [status, type]);

  const { data, isLoading, error, refetch, isFetching } = useQuery<{
    deliveries: EmailDeliveryRow[];
    warning?: string;
  }>({
    queryKey: [url],
  });

  const deliveries = useMemo(() => {
    const rows = data?.deliveries ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const orderIdStr = String(r.orderId);
      const orderNumber = (r.orderNumber ?? "").toLowerCase();
      const toEmail = (r.toEmail ?? "").toLowerCase();
      const typeStr = (r.type ?? "").toLowerCase();
      return (
        orderIdStr.includes(q) ||
        orderNumber.includes(q) ||
        toEmail.includes(q) ||
        typeStr.includes(q)
      );
    });
  }, [data?.deliveries, search]);

  const retryMutation = useMutation({
    mutationFn: async (deliveryId: number) => {
      const res = await fetch(`/api/admin/email-deliveries/${deliveryId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || "Retry failed");
      }
      return body;
    },
    onSuccess: async () => {
      toast({ title: "Retry triggered" });
      await queryClient.invalidateQueries({ queryKey: [url] });
    },
    onError: (err: any) => {
      toast({
        title: "Retry failed",
        description: err?.message || "Unknown error",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Email Deliveries</CardTitle>
            {data?.warning ? (
              <p className="mt-1 text-sm text-muted-foreground">{data.warning}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="w-full sm:w-[160px]">
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as EmailDeliveryStatus | "all")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">pending</SelectItem>
                  <SelectItem value="failed">failed</SelectItem>
                  <SelectItem value="sent">sent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-[200px]">
              <Select value={type} onValueChange={(v) => setType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="order_confirmation">order_confirmation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              className="w-full sm:w-[260px]"
              placeholder="Search by order #, email, order id, type"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-8 text-sm text-muted-foreground">Loading…</div>
          ) : error ? (
            <div className="py-8 text-sm text-red-600">
              Failed to load email deliveries.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Last attempt</TableHead>
                    <TableHead>Sent at</TableHead>
                    <TableHead className="min-w-[260px]">Last error</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {deliveries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                        No deliveries found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    deliveries.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">
                          {d.orderNumber ? d.orderNumber : `#${d.orderId}`}
                        </TableCell>
                        <TableCell>{d.type}</TableCell>
                        <TableCell>{d.toEmail}</TableCell>
                        <TableCell>
                          <StatusBadge status={d.status} />
                        </TableCell>
                        <TableCell>{d.attempts}</TableCell>
                        <TableCell>{formatDate(d.lastAttemptAt)}</TableCell>
                        <TableCell>{formatDate(d.sentAt)}</TableCell>
                        <TableCell className="whitespace-pre-wrap">
                          {d.lastError ? d.lastError : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryMutation.mutate(d.id)}
                            disabled={
                              retryMutation.isPending || d.status === "sent"
                            }
                          >
                            Retry
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
