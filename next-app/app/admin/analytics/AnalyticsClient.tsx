"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, Users, Eye, MousePointer, ExternalLink, TrendingUp, Clock, 
  Globe, RefreshCw, AlertTriangle, Smartphone, Monitor, Tablet, ArrowUpRight
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface OverviewData {
  totalVisitors: number;
  pageViews: number;
  avgSessionDuration: string;
  bounceRate: string;
  sessions: number;
  newUsers: number;
  totalUsers: number;
  engagedSessions: number;
  engagementRate: string;
}

interface DailyTrend {
  date: string;
  visitors: number;
  pageViews: number;
  sessions: number;
}

interface TrafficSource {
  source: string;
  sessions: number;
  users: number;
}

interface TopPage {
  page: string;
  views: number;
  avgDuration: string;
}

interface Device {
  device: string;
  users: number;
  sessions: number;
}

interface Country {
  country: string;
  users: number;
  sessions: number;
}

interface UserType {
  type: string;
  users: number;
}

interface AnalyticsData {
  overview: OverviewData;
  dailyTrend: DailyTrend[];
  trafficSources: TrafficSource[];
  topPages: TopPage[];
  devices: Device[];
  countries: Country[];
  userTypes: UserType[];
  period: string;
}

interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData | null;
  error?: string;
}

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1'];
const DEVICE_ICONS: Record<string, typeof Monitor> = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Tablet: Tablet,
};

export default function AnalyticsClient() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics/data");
      const data: AnalyticsResponse = await res.json();
      
      if (data.success && data.data) {
        setAnalytics(data.data);
      } else {
        setError(data.error || "Failed to fetch analytics");
      }
    } catch (err) {
      setError("Failed to connect to analytics service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
  };

  const totalDeviceUsers = analytics?.devices.reduce((sum, d) => sum + d.users, 0) || 0;

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 bg-gray-50 dark:bg-background min-h-screen">
        <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-foreground">Analytics Dashboard</h1>
            <p className="text-gray-600 dark:text-muted-foreground text-sm md:text-base">
              Track your website performance and visitor insights
              {analytics && <span className="ml-2 text-primary font-medium">({analytics.period})</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchAnalytics}
              disabled={loading}
              data-testid="button-refresh-analytics"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" data-testid="link-google-analytics">
              <Button className="bg-blue-600">
                <ExternalLink className="h-4 w-4 mr-2" />
                Google Analytics
              </Button>
            </a>
          </div>
        </div>

        {error && (
          <Card className="bg-yellow-50 border-yellow-200 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Unable to Load Analytics Data</h3>
                  <p className="text-sm text-yellow-800 mt-1">{error}</p>
                  <p className="text-sm text-yellow-700 mt-2">
                    Make sure the service account has been added as a Viewer to your Google Analytics property.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <Card data-testid="card-total-visitors">
              <CardContent className="pt-6">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  </div>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
                  ) : analytics ? (
                    <p className="text-2xl font-bold text-gray-900 dark:text-foreground" data-testid="text-total-visitors">
                      {formatNumber(analytics.overview.totalVisitors)}
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-gray-400">--</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">Active Users</p>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-page-views">
              <CardContent className="pt-6">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <Eye className="h-5 w-5 text-green-600" />
                  </div>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
                  ) : analytics ? (
                    <p className="text-2xl font-bold text-gray-900 dark:text-foreground" data-testid="text-page-views">
                      {formatNumber(analytics.overview.pageViews)}
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-gray-400">--</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">Page Views</p>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-sessions">
              <CardContent className="pt-6">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <MousePointer className="h-5 w-5 text-purple-600" />
                  </div>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
                  ) : analytics ? (
                    <p className="text-2xl font-bold text-gray-900 dark:text-foreground" data-testid="text-sessions">
                      {formatNumber(analytics.overview.sessions)}
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-gray-400">--</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">Sessions</p>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-avg-session">
              <CardContent className="pt-6">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
                  ) : analytics ? (
                    <p className="text-2xl font-bold text-gray-900 dark:text-foreground" data-testid="text-avg-session">
                      {analytics.overview.avgSessionDuration}
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-gray-400">--</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">Avg. Session</p>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-bounce-rate">
              <CardContent className="pt-6">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-red-600" />
                  </div>
                  {loading ? (
                    <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
                  ) : analytics ? (
                    <p className="text-2xl font-bold text-gray-900 dark:text-foreground" data-testid="text-bounce-rate">
                      {analytics.overview.bounceRate}
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-gray-400">--</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">Bounce Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visitor Trend Chart */}
          {analytics && analytics.dailyTrend.length > 0 && (
            <Card data-testid="card-visitor-trend">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Visitor Trend (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }} 
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="visitors" 
                        name="Visitors"
                        stroke="#f97316" 
                        strokeWidth={2}
                        dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pageViews" 
                        name="Page Views"
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Two Column Layout for Charts */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Traffic Sources */}
              <Card data-testid="card-traffic-sources">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Traffic Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.trafficSources.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.trafficSources} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis 
                            dataKey="source" 
                            type="category" 
                            tick={{ fontSize: 11 }} 
                            width={100}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="sessions" name="Sessions" fill="#f97316" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No traffic source data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Device Breakdown */}
              <Card data-testid="card-device-breakdown">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-purple-600" />
                    Device Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.devices.length > 0 ? (
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="h-48 w-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.devices as unknown as Record<string, unknown>[]}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="users"
                              nameKey="device"
                            >
                              {analytics.devices.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-3">
                        {analytics.devices.map((device, index) => {
                          const Icon = DEVICE_ICONS[device.device] || Monitor;
                          const percentage = totalDeviceUsers > 0 
                            ? ((device.users / totalDeviceUsers) * 100).toFixed(1) 
                            : "0";
                          return (
                            <div key={device.device} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <Icon className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{device.device}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-semibold">{formatNumber(device.users)}</span>
                                <span className="text-xs text-gray-500 ml-2">({percentage}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No device data available</p>
                  )}
                </CardContent>
              </Card>

              {/* New vs Returning Users */}
              <Card data-testid="card-user-types">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    New vs Returning Visitors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.userTypes.length > 0 ? (
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="h-48 w-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.userTypes as unknown as Record<string, unknown>[]}
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              dataKey="users"
                              nameKey="type"
                              label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              <Cell fill="#22c55e" />
                              <Cell fill="#3b82f6" />
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-4">
                        {analytics.userTypes.map((ut, index) => (
                          <div key={ut.type} className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: index === 0 ? '#22c55e' : '#3b82f6' }}
                            />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-foreground">{ut.type}</p>
                              <p className="text-2xl font-bold">{formatNumber(ut.users)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No user type data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Countries */}
              <Card data-testid="card-top-countries">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-teal-600" />
                    Top Countries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.countries.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.countries.slice(0, 8).map((country, index) => {
                        const maxUsers = analytics.countries[0]?.users || 1;
                        const percentage = (country.users / maxUsers) * 100;
                        return (
                          <div key={country.country} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-700 dark:text-gray-300">
                                {index + 1}. {country.country}
                              </span>
                              <span className="font-medium">{formatNumber(country.users)} users</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No country data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Pages Table */}
          {analytics && analytics.topPages.length > 0 && (
            <Card data-testid="card-top-pages">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-orange-600" />
                  Top Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-top-pages">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Page</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Views</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Avg. Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.topPages.map((page, index) => (
                        <tr key={page.page} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs">{index + 1}</span>
                              <span className="font-medium text-gray-900 dark:text-foreground truncate max-w-xs">
                                {page.page}
                              </span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 font-semibold text-primary">
                            {formatNumber(page.views)}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-500">
                            {page.avgDuration}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading state for charts */}
          {loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
