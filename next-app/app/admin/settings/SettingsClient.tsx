"use client";


import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Shield, UserPlus, UserMinus, Mail, Loader2, Database, Code, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export default function AdminSettings() {
  const [inviteEmail, setInviteEmail] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: admins, isLoading: adminsLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/admins"],
  });

  const inviteAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/admin/admins/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to invite admin");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({ title: "Admin invited successfully" });
      setInviteEmail("");
    },
    onError: (error: Error) => {
      toast({ title: error.message || "Failed to invite admin", variant: "destructive" });
    },
  });

  const revokeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch("/api/admin/admins/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to revoke admin");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({ title: "Admin access revoked" });
    },
    onError: (error: Error) => {
      toast({ title: error.message || "Failed to revoke admin", variant: "destructive" });
    },
  });

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 text-sm md:text-base">Manage site-wide configuration</p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Link href="/admin/settings/emails">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email Templates</h3>
                    <p className="text-sm text-gray-600">Customize all system-generated emails</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Link>
        </div>

        {/* Help Guide */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-100 border border-gray-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-base">
            <SettingsIcon className="h-5 w-5 text-gray-600" />
            Quick Guide
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Database className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Site Settings</span><br /><span className="text-gray-600">Store shipping rates, tax info, etc.</span></p>
            </div>
            <div className="flex items-start gap-2">
              <UserPlus className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Invite Admins</span><br /><span className="text-gray-600">Add new admins by email address</span></p>
            </div>
            <div className="flex items-start gap-2">
              <UserMinus className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Revoke Access</span><br /><span className="text-gray-600">Remove admin privileges anytime</span></p>
            </div>
            <div className="flex items-start gap-2">
              <Code className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">JSON Values</span><br /><span className="text-gray-600">Use arrays or objects for complex data</span></p>
            </div>
          </div>
        </div>

        <div className="mt-2 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-orange-500" />
            Admin Management
          </h2>
          <p className="text-gray-600">Manage who has admin access to this site</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-500" />
            Invite New Admin
          </h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg"
                  placeholder="admin@example.com"
                  data-testid="input-invite-email"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => inviteAdminMutation.mutate(inviteEmail)}
                disabled={!inviteEmail.trim() || inviteAdminMutation.isPending}
                className="bg-green-500 hover:bg-green-600"
                data-testid="button-invite-admin"
              >
                {inviteAdminMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Invite Admin
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            The user must have an existing account or create one with this email to receive admin access.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              Current Admins
            </h3>
          </div>
          {adminsLoading ? (
            <div className="p-4 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="flex justify-between items-center py-3">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-8 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </div>
          ) : admins && admins.length > 0 ? (
            <div className="divide-y">
              {admins.map((admin) => (
                <div key={admin.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900" data-testid={`text-admin-name-${admin.id}`}>
                      {admin.firstName && admin.lastName
                        ? `${admin.firstName} ${admin.lastName}`
                        : admin.email}
                    </p>
                    <p className="text-sm text-gray-500" data-testid={`text-admin-email-${admin.id}`}>
                      {admin.email}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => revokeAdminMutation.mutate(admin.id)}
                    disabled={revokeAdminMutation.isPending}
                    data-testid={`button-revoke-admin-${admin.id}`}
                  >
                    {revokeAdminMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <UserMinus className="h-4 w-4 mr-1" />
                    )}
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Shield className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No admins found</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
