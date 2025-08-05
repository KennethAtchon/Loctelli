'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Play, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Database,
  Clock,
  TrendingUp
} from 'lucide-react';
import { ScrapingStats } from '@/types/scraping';

interface ScrapingStatsCardsProps {
  stats: ScrapingStats | null;
  loading: boolean;
}

export function ScrapingStatsCards({ stats, loading }: ScrapingStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-7 bg-muted rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const getSuccessRateColor = (rate: number): string => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const cards = [
    {
      title: 'Total Jobs',
      value: stats?.totalJobs || 0,
      icon: Globe,
      description: 'All scraping jobs',
      change: null,
      changeType: null as 'positive' | 'negative' | null,
    },
    {
      title: 'Active Jobs',
      value: stats?.activeJobs || 0,
      icon: Play,
      description: 'Currently running',
      change: null,
      changeType: null as 'positive' | 'negative' | null,
      badge: stats?.activeJobs ? (stats.activeJobs > 0 ? 'Running' : 'None') : 'None',
      badgeVariant: stats?.activeJobs && stats.activeJobs > 0 ? 'default' : 'secondary',
    },
    {
      title: 'Completed Jobs',
      value: stats?.completedJobs || 0,
      icon: CheckCircle,
      description: 'Successfully finished',
      change: null,
      changeType: null as 'positive' | 'negative' | null,
    },
    {
      title: 'Failed Jobs',
      value: stats?.failedJobs || 0,
      icon: XCircle,
      description: 'Jobs with errors',
      change: null,
      changeType: null as 'positive' | 'negative' | null,
    },
    {
      title: 'Pages Scraped',
      value: formatNumber(stats?.totalPagesScraped || 0),
      icon: FileText,
      description: 'Total pages processed',
      change: null,
      changeType: null as 'positive' | 'negative' | null,
    },
    {
      title: 'Items Extracted',
      value: formatNumber(stats?.totalItemsExtracted || 0),
      icon: Database,
      description: 'Data points collected',
      change: null,
      changeType: null as 'positive' | 'negative' | null,
    },
    {
      title: 'Avg Processing Time',
      value: formatTime(stats?.averageProcessingTime || 0),
      icon: Clock,
      description: 'Per job completion',
      change: null,
      changeType: null as 'positive' | 'negative' | null,
    },
    {
      title: 'Success Rate',
      value: `${stats?.successRate?.toFixed(1) || 0}%`,
      icon: TrendingUp,
      description: 'Jobs completed successfully',
      change: null,
      changeType: null as 'positive' | 'negative' | null,
      valueClassName: getSuccessRateColor(stats?.successRate || 0),
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`text-2xl font-bold ${card.valueClassName || ''}`}>
                {card.value}
              </div>
              {card.badge && (
                <Badge variant={card.badgeVariant as any} className="text-xs">
                  {card.badge}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
              {card.change && (
                <div className={`flex items-center text-xs ${
                  card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.changeType === 'positive' ? '↗' : '↘'} {card.change}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}