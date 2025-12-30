"use client";

import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, Eye, MousePointer, ExternalLink, TrendingUp, Clock, Globe } from "lucide-react";

export default function AnalyticsClient() {
  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 text-sm md:text-base">Track your website performance and visitor insights</p>
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
                Your site is connected to Google Analytics (G-EXT24JDCC7). View detailed analytics data directly in your Google Analytics dashboard.
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Visitors</p>
                    <p className="text-2xl font-bold text-gray-900">View in GA</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Page Views</p>
                    <p className="text-2xl font-bold text-gray-900">View in GA</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg. Session</p>
                    <p className="text-2xl font-bold text-gray-900">View in GA</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bounce Rate</p>
                    <p className="text-2xl font-bold text-gray-900">View in GA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
