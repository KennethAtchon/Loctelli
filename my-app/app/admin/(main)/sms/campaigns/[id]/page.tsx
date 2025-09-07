'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Calendar,
  BarChart3,
  History
} from 'lucide-react';
import { api } from '@/lib/api';
import { SmsCampaign, SmsMessage, CampaignStatus } from '@/types/sms';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';

export default function SmsCampaignDetailsPage() {
  const params = useParams();
  const campaignId = parseInt(params.id as string);
  
  const [campaign, setCampaign] = useState<SmsCampaign | null>(null);
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
      loadMessages();
    }
  }, [campaignId, currentPage]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const response = await api.sms.getCampaign(campaignId);
      
      if (response?.success) {
        setCampaign(response.data);
      } else {
        toast.error('Failed to load campaign');
      }
    } catch (error) {
      console.error('Failed to load campaign:', error);
      toast.error('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      setMessagesLoading(true);
      const response = await api.sms.getCampaignMessages(campaignId, {
        page: currentPage,
        limit: 20,
      });
      
      if (response?.success) {
        setMessages(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load campaign messages:', error);
      toast.error('Failed to load campaign messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: CampaignStatus) => {
    try {
      const response = await api.sms.updateCampaign(campaignId, { status: newStatus });
      if (response?.success) {
        toast.success('Campaign status updated');
        loadCampaign();
      }
    } catch (error) {
      console.error('Failed to update campaign status:', error);
      toast.error('Failed to update campaign status');
    }
  };

  const handleDeleteCampaign = async () => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.sms.deleteCampaign(campaignId);
      if (response?.success) {
        toast.success('Campaign deleted successfully');
        window.location.href = '/admin/sms/campaigns';
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'sending':
        return <Badge variant="secondary" className="bg-blue-500">Sending</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'sending':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getMessageStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default">Sent</Badge>;
      case 'delivered':
        return <Badge variant="default" className="bg-green-500">Delivered</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Campaign not found</h3>
        <p className="text-muted-foreground mb-4">
          The campaign you're looking for doesn't exist or has been deleted.
        </p>
        <Link href="/admin/sms/campaigns">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/sms/campaigns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusIcon(campaign.status)}
              {getStatusBadge(campaign.status)}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {campaign.status === 'draft' && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange('sending')}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Campaign
            </Button>
          )}
          {campaign.status === 'sending' && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange('draft')}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause Campaign
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDeleteCampaign}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.totalRecipients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.sentCount}</div>
            <p className="text-xs text-muted-foreground">
              {campaign.totalRecipients > 0 
                ? `${Math.round((campaign.sentCount / campaign.totalRecipients) * 100)}%`
                : '0%'
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.deliveredCount}</div>
            <p className="text-xs text-muted-foreground">
              {campaign.sentCount > 0 
                ? `${Math.round((campaign.deliveredCount / campaign.sentCount) * 100)}%`
                : '0%'
              }
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.failedCount}</div>
            <p className="text-xs text-muted-foreground">
              {campaign.totalRecipients > 0 
                ? `${Math.round((campaign.failedCount / campaign.totalRecipients) * 100)}%`
                : '0%'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Campaign Name</Label>
                  <p className="text-sm text-muted-foreground">{campaign.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Message</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {campaign.message}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(campaign.status)}
                    {getStatusBadge(campaign.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(campaign.createdAt)}
                  </p>
                </div>
                {campaign.scheduledAt && (
                  <div>
                    <Label className="text-sm font-medium">Scheduled For</Label>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(campaign.scheduledAt)}
                    </p>
                  </div>
                )}
                {campaign.startedAt && (
                  <div>
                    <Label className="text-sm font-medium">Started</Label>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(campaign.startedAt)}
                    </p>
                  </div>
                )}
                {campaign.completedAt && (
                  <div>
                    <Label className="text-sm font-medium">Completed</Label>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(campaign.completedAt)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Recipients</span>
                    <span className="font-medium">{campaign.totalRecipients}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(campaign.sentCount / campaign.totalRecipients) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sent</span>
                    <span className="font-medium">{campaign.sentCount}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(campaign.deliveredCount / campaign.sentCount) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Delivered</span>
                    <span className="font-medium">{campaign.deliveredCount}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Failed</span>
                    <span className="font-medium text-destructive">{campaign.failedCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No messages found</h3>
                  <p className="text-muted-foreground">
                    Messages will appear here once the campaign starts sending.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getMessageStatusBadge(message.status)}
                        </div>
                        <div>
                          <p className="font-medium">{message.phoneNumber}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {message.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                            <span>Sent: {message.sentAt ? formatDate(message.sentAt) : 'Pending'}</span>
                            {message.deliveredAt && (
                              <span>Delivered: {formatDate(message.deliveredAt)}</span>
                            )}
                            {message.errorMessage && (
                              <span className="text-destructive">Error: {message.errorMessage}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Detailed analytics and reporting features will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 