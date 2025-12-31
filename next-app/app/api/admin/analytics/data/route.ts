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

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      metrics: [
        { name: "activeUsers" },
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
        { name: "sessions" },
        { name: "newUsers" },
      ],
    });

    const row = response.rows?.[0];
    const metricValues = row?.metricValues || [];

    const data = {
      activeUsers: parseInt(metricValues[0]?.value || "0"),
      pageViews: parseInt(metricValues[1]?.value || "0"),
      avgSessionDuration: parseFloat(metricValues[2]?.value || "0"),
      bounceRate: parseFloat(metricValues[3]?.value || "0"),
      sessions: parseInt(metricValues[4]?.value || "0"),
      newUsers: parseInt(metricValues[5]?.value || "0"),
    };

    const formattedDuration = formatDuration(data.avgSessionDuration);
    const formattedBounceRate = data.bounceRate.toFixed(1) + "%";

    return NextResponse.json({
      success: true,
      data: {
        totalVisitors: data.activeUsers,
        pageViews: data.pageViews,
        avgSessionDuration: formattedDuration,
        bounceRate: formattedBounceRate,
        sessions: data.sessions,
        newUsers: data.newUsers,
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
