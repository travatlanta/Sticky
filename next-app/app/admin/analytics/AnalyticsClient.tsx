"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Eye, MousePointer, ExternalLink, TrendingUp, Clock, Globe, RefreshCw, AlertTriangle } from "lucide-react";

interface AnalyticsData {
  totalVisitors: number;
  pageViews: number;
  avgSessionDuration: string;
  bounceRate: string;
  sessions: number;
  newUsers: number;
  period: string;
}

interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData | null;
  error?: string;
}

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

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 text-sm md:text-base">Track your website performance and visitor insights</p>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchAnalytics}
            disabled={loading}
            data-testid="button-refresh-analytics"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <BarChart3 className="h-5 w-5" />
                Google Analytics Connected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-800 mb-4">
                Your site is connected to Google Analytics (G-EXT24JDCC7). 
                {analytics && ` Showing data for: ${analytics.period}`}
              </p>
              <a 
                href="https://analytics.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Open Google Analytics
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>

          {error && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900">Unable to Load Analytics Data</h3>
                    <p className="text-sm text-yellow-800 mt-1">{error}</p>
                    <p className="text-sm text-yellow-700 mt-2">
                      Make sure the service account (analytics-reader@sticky-banditos-analytics.iam.gserviceaccount.com) 
                      has been added as a Viewer to your Google Analytics property.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card data-testid="card-total-visitors">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Visitors</p>
                    {loading ? (
                      <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
                    ) : analytics ? (
                      <p className="text-2xl font-bold text-gray-900" data-testid="text-total-visitors">
                        {formatNumber(analytics.totalVisitors)}
                      </p>
                    ) : (
                      <p className="text-lg text-gray-400">--</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-page-views">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Page Views</p>
                    {loading ? (
                      <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
                    ) : analytics ? (
                      <p className="text-2xl font-bold text-gray-900" data-testid="text-page-views">
                        {formatNumber(analytics.pageViews)}
                      </p>
                    ) : (
                      <p className="text-lg text-gray-400">--</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-avg-session">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg. Session</p>
                    {loading ? (
                      <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
                    ) : analytics ? (
                      <p className="text-2xl font-bold text-gray-900" data-testid="text-avg-session">
                        {analytics.avgSessionDuration}
                      </p>
                    ) : (
                      <p className="text-lg text-gray-400">--</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-bounce-rate">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bounce Rate</p>
                    {loading ? (
                      <div className="h-8 w-20 bg-gray-200 animate-pulse rounded" />
                    ) : analytics ? (
                      <p className="text-2xl font-bold text-gray-900" data-testid="text-bounce-rate">
                        {analytics.bounceRate}
                      </p>
                    ) : (
                      <p className="text-lg text-gray-400">--</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">New Users</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="text-new-users">
                        {formatNumber(analytics.newUsers)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
                      <MousePointer className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Sessions</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid="text-sessions">
                        {formatNumber(analytics.sessions)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                What You Can Track in Google Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Visitor Insights</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      Total visitors and new vs returning users
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      Geographic location of your visitors
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      Device types (mobile, desktop, tablet)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      Traffic sources (direct, search, social)
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Behavior Tracking</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Most popular pages on your site
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Time spent on each page
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      User flow through your site
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Conversion tracking (purchases, signups)
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <MousePointer className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Quick Tip</h3>
                  <p className="text-sm text-yellow-800 mt-1">
                    It may take 24-48 hours for Google Analytics to start showing data after initial setup. 
                    Check the Realtime section in Google Analytics to see active visitors immediately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
