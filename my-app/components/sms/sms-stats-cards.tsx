'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { SmsStats, CampaignStats } from '@/types/sms';
import { cn } from '@/lib/utils';

interface SmsStatsCardsProps {
  stats: SmsStats | null;
  campaignStats?: CampaignStats | null;
  loading?: boolean;
  className?: string;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  className?: string;
}

function StatCard({ 
  title, 
  value, 
  icon, 
  description, 
  trend, 
  badge,
  className 
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.value === 0) {
      return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
    
    return trend.isPositive ? (
      <TrendingUp className="h-3 w-3 text-green-500" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-500" />
    );
  };

  const getTrendText = () => {
    if (!trend) return null;
    
    const color = trend.value === 0 
      ? 'text-muted-foreground' 
      : trend.isPositive 
        ? 'text-green-500' 
        : 'text-red-500';
    
    return (
      <span className={cn("text-xs", color)}>
        {trend.value > 0 && '+'}
        {trend.value}%
      </span>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {badge && (
            <Badge variant={badge.variant} className="text-xs">
              {badge.text}
            </Badge>
          )}
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {(description || trend) && (
          <div className="flex items-center justify-between mt-1">
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                {getTrendText()}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SmsStatsCards({ 
  stats, 
  campaignStats, 
  loading = false, 
  className 
}: SmsStatsCardsProps) {
  if (loading) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No SMS data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate delivery rate
  const totalMessages = stats.totalSent + stats.totalFailed + stats.totalPending;
  const deliveryRate = stats.totalSent > 0 
    ? Math.round((stats.totalDelivered / stats.totalSent) * 100) 
    : 0;

  // Calculate success rate
  const successRate = totalMessages > 0 
    ? Math.round((stats.totalSent / totalMessages) * 100) 
    : 0;

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {/* Total Messages Sent */}
      <StatCard
        title="Messages Sent"
        value={stats.totalSent}
        icon={<Send className="h-4 w-4 text-blue-500" />}
        description="Successfully sent"
        badge={
          successRate >= 95 
            ? { text: 'Excellent', variant: 'default' }
            : successRate >= 85 
              ? { text: 'Good', variant: 'secondary' }
              : { text: 'Needs Attention', variant: 'destructive' }
        }
      />

      {/* Messages Delivered */}
      <StatCard
        title="Messages Delivered"
        value={stats.totalDelivered}
        icon={<CheckCircle className="h-4 w-4 text-green-500" />}
        description={`${deliveryRate}% delivery rate`}
        badge={
          deliveryRate >= 95 
            ? { text: 'Excellent', variant: 'default' }
            : deliveryRate >= 85 
              ? { text: 'Good', variant: 'secondary' }
              : { text: 'Poor', variant: 'destructive' }
        }
      />

      {/* Failed Messages */}
      <StatCard
        title="Failed Messages"
        value={stats.totalFailed}
        icon={<XCircle className="h-4 w-4 text-red-500" />}
        description={
          totalMessages > 0 
            ? `${Math.round((stats.totalFailed / totalMessages) * 100)}% failure rate`
            : 'No failures'
        }
        badge={
          stats.totalFailed === 0 
            ? { text: 'Perfect', variant: 'default' }
            : stats.totalFailed < totalMessages * 0.05 
              ? { text: 'Low', variant: 'secondary' }
              : { text: 'High', variant: 'destructive' }
        }
      />

      {/* Pending Messages */}
      <StatCard
        title="Pending Messages"
        value={stats.totalPending}
        icon={<Clock className="h-4 w-4 text-orange-500" />}
        description="In queue"
        badge={
          stats.totalPending === 0 
            ? { text: 'Clear', variant: 'default' }
            : stats.totalPending < 100 
              ? { text: 'Normal', variant: 'secondary' }
              : { text: 'Backlog', variant: 'destructive' }
        }
      />

      {/* Campaign Stats (if available) */}
      {campaignStats && (
        <>
          <StatCard
            title="Total Campaigns"
            value={campaignStats.totalCampaigns}
            icon={<MessageSquare className="h-4 w-4 text-purple-500" />}
            description="All time"
          />

          <StatCard
            title="Active Campaigns"
            value={campaignStats.activeCampaigns}
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            description="Currently running"
            badge={
              campaignStats.activeCampaigns === 0 
                ? { text: 'None', variant: 'secondary' }
                : campaignStats.activeCampaigns < 5 
                  ? { text: 'Normal', variant: 'default' }
                  : { text: 'High Load', variant: 'destructive' }
            }
          />

          <StatCard
            title="Completed Campaigns"
            value={campaignStats.completedCampaigns}
            icon={<CheckCircle className="h-4 w-4 text-green-500" />}
            description="Successfully finished"
          />

          <StatCard
            title="Campaign Success Rate"
            value={`${campaignStats.totalCampaigns > 0 
              ? Math.round((campaignStats.completedCampaigns / campaignStats.totalCampaigns) * 100)
              : 0}%`}
            icon={<TrendingUp className="h-4 w-4 text-green-500" />}
            description="Completion rate"
            badge={
              campaignStats.totalCampaigns === 0 
                ? { text: 'No Data', variant: 'secondary' }
                : (campaignStats.completedCampaigns / campaignStats.totalCampaigns) >= 0.9 
                  ? { text: 'Excellent', variant: 'default' }
                  : { text: 'Good', variant: 'secondary' }
            }
          />
        </>
      )}
    </div>
  );
}