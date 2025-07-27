'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Send, 
  Upload, 
  History, 
  Settings,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus
} from 'lucide-react';
import { SmsStatsCards } from '@/components/sms/sms-stats-cards';
import { api } from '@/lib/api';
import { SmsStats, CampaignStats, SmsCampaign, SmsMessage } from '@/types/sms';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SmsDashboardPage() {
  const [stats, setStats] = useState<SmsStats | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
  const [recentCampaigns, setRecentCampaigns] = useState<SmsCampaign[]>([]);
  const [recentMessages, setRecentMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceStatus, setServiceStatus] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dashboard data in parallel
      const [
        statsResponse,
        campaignStatsResponse,
        campaignsResponse,
        messagesResponse,
        statusResponse,
      ] = await Promise.all([
        api.sms.getStats().catch(() => null),
        api.sms.getCampaignStats().catch(() => null),
        api.sms.getCampaigns({ limit: 5 }).catch(() => null),
        api.sms.getMessages({ limit: 10 }).catch(() => null),
        api.sms.getServiceStatus().catch(() => null),
      ]);

      if (statsResponse?.success) {
        setStats(statsResponse.data || {
          totalSent: 0,
          totalDelivered: 0,
          totalFailed: 0,
          totalPending: 0,
          monthlyStats: {},
          recentMessages: []
        });
      }

      if (campaignStatsResponse?.success) {
        setCampaignStats(campaignStatsResponse.data || {
          totalCampaigns: 0,
          activeCampaigns: 0,
          completedCampaigns: 0,
          totalMessagesSent: 0,
          totalMessagesDelivered: 0,
          totalMessagesFailed: 0
        });
      }

      if (campaignsResponse?.success) {
        setRecentCampaigns(campaignsResponse.data.data || []);
      }

      if (messagesResponse?.success) {
        setRecentMessages(messagesResponse.data.data || []);
      }

      if (statusResponse?.success) {
        setServiceStatus(statusResponse.data || {
          configured: false,
          rateLimitPerMinute: 60,
          maxBatchSize: 100,
          retryAttempts: 3
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default">Sent</Badge>;
      case 'delivered':
        return <Badge variant="default" className="bg-green-500">Delivered</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'sending':
        return <Badge variant="secondary" className="bg-blue-500">Sending</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SMS Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor your SMS messaging campaigns
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/sms/send">
              <Send className="h-4 w-4 mr-2" />
              Send SMS
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/sms/bulk">
              <Upload className="h-4 w-4 mr-2" />
              Bulk SMS
            </Link>
          </Button>
        </div>
      </div>

      {/* Service Status Alert */}
      {serviceStatus && !serviceStatus.configured && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <div className="flex-1">
              <div className="font-medium text-orange-800">SMS Service Not Configured</div>
              <div className="text-sm text-orange-600">
                Please configure your Twilio credentials in settings to start sending SMS messages.
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/sms/settings">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <SmsStatsCards 
        stats={stats} 
        campaignStats={campaignStats} 
        loading={loading} 
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Recent Campaigns</TabsTrigger>
          <TabsTrigger value="messages">Recent Messages</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/admin/sms/send">
                    <Send className="h-4 w-4 mr-2" />
                    Send Single SMS
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/sms/bulk">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV for Bulk SMS
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/sms/campaigns/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href="/admin/sms/history">
                    <History className="h-4 w-4 mr-2" />
                    View Message History
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">SMS Service</span>
                  {serviceStatus?.configured ? (
                    <Badge variant="default" className="bg-green-500">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Not Configured</Badge>
                  )}
                </div>
                
                {serviceStatus && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rate Limit</span>
                      <span className="text-sm text-muted-foreground">
                        {serviceStatus?.rateLimitPerMinute || 60}/min
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Batch Size</span>
                      <span className="text-sm text-muted-foreground">
                        {serviceStatus?.maxBatchSize || 100}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Retry Attempts</span>
                      <span className="text-sm text-muted-foreground">
                        {serviceStatus?.retryAttempts || 3}
                      </span>
                    </div>
                  </>
                )}

                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/admin/sms/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recent Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Recent Campaigns</h3>
            <Button asChild size="sm">
              <Link href="/admin/sms/campaigns">
                View All Campaigns
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentCampaigns.length > 0 ? (
            <div className="space-y-3">
              {recentCampaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{campaign.name || 'Unnamed Campaign'}</h4>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {campaign.totalRecipients || 0} recipients • Created {formatDate(campaign.createdAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Sent: {campaign.sentCount || 0} • Failed: {campaign.failedCount || 0}
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/sms/campaigns/${campaign.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No campaigns yet</p>
                  <Button asChild size="sm" className="mt-2">
                    <Link href="/admin/sms/campaigns/create">
                      Create Your First Campaign
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recent Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Recent Messages</h3>
            <Button asChild size="sm">
              <Link href="/admin/sms/history">
                View All Messages
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentMessages.length > 0 ? (
            <div className="space-y-3">
              {recentMessages.map((message) => (
                <Card key={message.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{message.phoneNumber || 'Unknown'}</span>
                          {getStatusBadge(message.status)}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {message.message || 'No message content'}
                        </p>
                        {message.campaign && (
                          <div className="text-xs text-muted-foreground">
                            Campaign: {message.campaign.name || 'Unknown Campaign'}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No messages yet</p>
                  <Button asChild size="sm" className="mt-2">
                    <Link href="/admin/sms/send">
                      Send Your First SMS
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}