import { NextResponse } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

export async function GET() {
  try {
    const propertyId = process.env.GA_PROPERTY_ID;
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!propertyId || !credentialsJson) {
      return NextResponse.json({
        success: false,
        error: "Google Analytics not configured. Please set GA_PROPERTY_ID and GOOGLE_APPLICATION_CREDENTIALS_JSON.",
        data: null
      });
    }

    let credentials;
    try {
      credentials = JSON.parse(credentialsJson);
    } catch (e) {
      return NextResponse.json({
        success: false,
        error: "Invalid credentials JSON format",
        data: null
      });
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    });

    const propertyPath = `properties/${propertyId}`;

    // Run all reports in parallel for efficiency
    const [
      overviewResponse,
      dailyTrendResponse,
      trafficSourcesResponse,
      topPagesResponse,
      devicesResponse,
      countriesResponse,
      userTypeResponse,
    ] = await Promise.all([
      // 1. Overview metrics
      analyticsDataClient.runReport({
        property: propertyPath,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
          { name: "sessions" },
          { name: "newUsers" },
          { name: "totalUsers" },
          { name: "engagedSessions" },
        ],
      }),

      // 2. Daily visitor trend (last 30 days)
      analyticsDataClient.runReport({
        property: propertyPath,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
          { name: "screenPageViews" },
          { name: "sessions" },
        ],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),

      // 3. Traffic sources
      analyticsDataClient.runReport({
        property: propertyPath,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 10,
      }),

      // 4. Top pages
      analyticsDataClient.runReport({
        property: propertyPath,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
        ],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),

      // 5. Devices
      analyticsDataClient.runReport({
        property: propertyPath,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      }),

      // 6. Countries
      analyticsDataClient.runReport({
        property: propertyPath,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 10,
      }),

      // 7. New vs Returning users
      analyticsDataClient.runReport({
        property: propertyPath,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "newVsReturning" }],
        metrics: [{ name: "activeUsers" }],
      }),
    ]);

    // Parse overview metrics
    const overviewRow = overviewResponse[0].rows?.[0];
    const overviewMetrics = overviewRow?.metricValues || [];
    const overview = {
      activeUsers: parseInt(overviewMetrics[0]?.value || "0"),
      pageViews: parseInt(overviewMetrics[1]?.value || "0"),
      avgSessionDuration: formatDuration(parseFloat(overviewMetrics[2]?.value || "0")),
      bounceRate: parseFloat(overviewMetrics[3]?.value || "0").toFixed(1) + "%",
      sessions: parseInt(overviewMetrics[4]?.value || "0"),
      newUsers: parseInt(overviewMetrics[5]?.value || "0"),
      totalUsers: parseInt(overviewMetrics[6]?.value || "0"),
      engagedSessions: parseInt(overviewMetrics[7]?.value || "0"),
    };

    // Parse daily trend
    const dailyTrend = (dailyTrendResponse[0].rows || []).map(row => ({
      date: formatDate(row.dimensionValues?.[0]?.value || ""),
      visitors: parseInt(row.metricValues?.[0]?.value || "0"),
      pageViews: parseInt(row.metricValues?.[1]?.value || "0"),
      sessions: parseInt(row.metricValues?.[2]?.value || "0"),
    }));

    // Parse traffic sources
    const trafficSources = (trafficSourcesResponse[0].rows || []).map(row => ({
      source: row.dimensionValues?.[0]?.value || "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      users: parseInt(row.metricValues?.[1]?.value || "0"),
    }));

    // Parse top pages
    const topPages = (topPagesResponse[0].rows || []).map(row => ({
      page: row.dimensionValues?.[0]?.value || "/",
      views: parseInt(row.metricValues?.[0]?.value || "0"),
      avgDuration: formatDuration(parseFloat(row.metricValues?.[1]?.value || "0")),
    }));

    // Parse devices
    const devices = (devicesResponse[0].rows || []).map(row => ({
      device: capitalizeFirst(row.dimensionValues?.[0]?.value || "unknown"),
      users: parseInt(row.metricValues?.[0]?.value || "0"),
      sessions: parseInt(row.metricValues?.[1]?.value || "0"),
    }));

    // Parse countries
    const countries = (countriesResponse[0].rows || []).map(row => ({
      country: row.dimensionValues?.[0]?.value || "Unknown",
      users: parseInt(row.metricValues?.[0]?.value || "0"),
      sessions: parseInt(row.metricValues?.[1]?.value || "0"),
    }));

    // Parse user types
    const userTypes = (userTypeResponse[0].rows || []).map(row => ({
      type: row.dimensionValues?.[0]?.value === "new" ? "New Visitors" : "Returning Visitors",
      users: parseInt(row.metricValues?.[0]?.value || "0"),
    }));

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalVisitors: overview.activeUsers,
          pageViews: overview.pageViews,
          avgSessionDuration: overview.avgSessionDuration,
          bounceRate: overview.bounceRate,
          sessions: overview.sessions,
          newUsers: overview.newUsers,
          totalUsers: overview.totalUsers,
          engagedSessions: overview.engagedSessions,
          engagementRate: overview.sessions > 0 
            ? ((overview.engagedSessions / overview.sessions) * 100).toFixed(1) + "%"
            : "0%",
        },
        dailyTrend,
        trafficSources,
        topPages,
        devices,
        countries,
        userTypes,
        period: "Last 30 days",
      },
    });
  } catch (error: unknown) {
    console.error("Google Analytics API error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("403")) {
      return NextResponse.json({
        success: false,
        error: "Permission denied. Please ensure the service account has been added as a Viewer to your Google Analytics property.",
        data: null
      });
    }
    
    if (errorMessage.includes("NOT_FOUND") || errorMessage.includes("404")) {
      return NextResponse.json({
        success: false,
        error: "Property not found. Please verify your GA_PROPERTY_ID is correct.",
        data: null
      });
    }

    return NextResponse.json({
      success: false,
      error: `Failed to fetch analytics: ${errorMessage}`,
      data: null
    });
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function formatDate(dateStr: string): string {
  // Convert YYYYMMDD to readable format
  if (dateStr.length !== 8) return dateStr;
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${month}/${day}`;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
