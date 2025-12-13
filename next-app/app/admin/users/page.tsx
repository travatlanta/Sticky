"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ShoppingBag, Shield, Mail, Calendar, Search, UserCheck } from "lucide-react";

interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  createdAt: string;
  hasOrders?: boolean;
  orderCount?: number;
  totalSpent?: number;
}

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (activeTab) {
      case "purchasers":
        return user.hasOrders || (user.orderCount && user.orderCount > 0);
      case "admins":
        return user.isAdmin;
      case "subscribers":
        return !user.isAdmin && !(user.hasOrders || (user.orderCount && user.orderCount > 0));
      default:
        return true;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  const stats = {
    total: users.length,
    purchasers: users.filter(u => u.hasOrders || (u.orderCount && u.orderCount > 0)).length,
    admins: users.filter(u => u.isAdmin).length,
    subscribers: users.filter(u => !u.isAdmin && !(u.hasOrders || (u.orderCount && u.orderCount > 0))).length,
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 text-sm md:text-base">Manage customers and admin accounts</p>
        </div>

        {/* Help Guide */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-orange-600" />
            Quick Guide
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <UserCheck className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">All Users</span><br /><span className="text-gray-600">View everyone registered on the site</span></p>
            </div>
            <div className="flex items-start gap-2">
              <ShoppingBag className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Purchasers</span><br /><span className="text-gray-600">Users who have placed orders</span></p>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Admins</span><br /><span className="text-gray-600">Users with admin panel access</span></p>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm"><span className="font-semibold text-gray-800">Subscribers</span><br /><span className="text-gray-600">Registered but haven't purchased yet</span></p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.purchasers}</p>
                <p className="text-sm text-gray-600">Purchasers</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
                <p className="text-sm text-gray-600">Admins</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.subscribers}</p>
                <p className="text-sm text-gray-600">Subscribers</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            data-testid="input-search-users"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="all" data-testid="tab-all-users">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="purchasers" data-testid="tab-purchasers">Purchasers ({stats.purchasers})</TabsTrigger>
            <TabsTrigger value="admins" data-testid="tab-admins">Admins ({stats.admins})</TabsTrigger>
            <TabsTrigger value="subscribers" data-testid="tab-subscribers">Subscribers ({stats.subscribers})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No users found</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="p-4" data-testid={`card-user-${user.id}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                          {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user.email.split('@')[0]}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 ml-13 sm:ml-0">
                        {user.isAdmin && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {(user.hasOrders || (user.orderCount && user.orderCount > 0)) && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            <ShoppingBag className="h-3 w-3 mr-1" />
                            {user.orderCount || 0} orders
                          </Badge>
                        )}
                        {user.totalSpent && user.totalSpent > 0 && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            {formatPrice(user.totalSpent)} spent
                          </Badge>
                        )}
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
