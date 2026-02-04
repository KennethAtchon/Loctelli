"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export interface AnalyticsDashboardProps {
  formTemplateId: string;
}

interface FormAnalytics {
  totalViews: number;
  totalStarted: number;
  totalCompleted: number;
  completionRate: number;
  averageTime: number;
  dropOffAnalysis: Array<{
    cardIndex: number;
    cardId: string;
    cardLabel: string;
    views: number;
    dropOffRate: number;
    averageTime: number;
  }>;
  timePerCard: Record<string, number>;
  deviceBreakdown: {
    mobile: number;
    tablet: number;
    desktop: number;
    unknown: number;
  };
  profileResults?: Array<{
    result: string;
    count: number;
    percentage: number;
  }>;
}

export function AnalyticsDashboard({
  formTemplateId,
}: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<FormAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formTemplateId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.forms.getFormAnalytics(formTemplateId);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalStarted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.completionRate}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(analytics.averageTime)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drop-off Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Drop-off Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.dropOffAnalysis.map((card) => (
              <div key={card.cardId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Card {card.cardIndex + 1}: {card.cardLabel}
                  </span>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{card.views} views</span>
                    <span>{card.dropOffRate}% drop-off</span>
                    <span>{formatTime(card.averageTime)} avg</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress value={100 - card.dropOffRate} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {Math.round(100 - card.dropOffRate)}% continued
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Device Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Device Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Mobile</div>
              <div className="text-2xl font-bold">
                {analytics.deviceBreakdown.mobile}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Tablet</div>
              <div className="text-2xl font-bold">
                {analytics.deviceBreakdown.tablet}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Desktop</div>
              <div className="text-2xl font-bold">
                {analytics.deviceBreakdown.desktop}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Unknown</div>
              <div className="text-2xl font-bold">
                {analytics.deviceBreakdown.unknown}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Results Distribution */}
      {analytics.profileResults && analytics.profileResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Results Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.profileResults.map((result) => (
                <div key={result.result} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{result.result}</span>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{result.count} responses</span>
                      <span>{result.percentage}%</span>
                    </div>
                  </div>
                  <Progress value={result.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
