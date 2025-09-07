'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Target, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Strategy } from '@/types';
import logger from '@/lib/logger';

export default function StrategyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  
  // Early return if params are not available yet
  if (!params || !params.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>
    );
  }
  
  const strategyId = parseInt(params.id as string);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<Strategy | null>(null);

  // Load strategy data
  useEffect(() => {
    const loadStrategy = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const strategyData = await api.strategies.getStrategy(strategyId);
        setStrategy(strategyData);
      } catch (error) {
        logger.error('Failed to load strategy:', error);
        setError('Failed to load strategy');
      } finally {
        setIsLoading(false);
      }
    };

    if (strategyId && !isNaN(strategyId)) {
      loadStrategy();
    } else {
      setError('Invalid strategy ID');
      setIsLoading(false);
    }
  }, [strategyId]);

  const handleDelete = async () => {
    if (!strategy || !confirm('Are you sure you want to delete this strategy? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await api.strategies.deleteStrategy(strategy.id);
      router.push('/admin/strategies');
    } catch (error) {
      logger.error('Failed to delete strategy:', error);
      setError('Failed to delete strategy. Please try again.');
      setIsDeleting(false);
    }
  };

  const getCreativityBadgeVariant = (creativity?: number) => {
    if (!creativity && creativity !== 0) return 'outline';
    if (creativity >= 8) return 'default';
    if (creativity >= 5) return 'secondary';
    return 'outline';
  };

  const getToneBadgeVariant = (tone?: string) => {
    if (!tone) return 'secondary';
    switch (tone.toLowerCase()) {
      case 'professional':
        return 'default';
      case 'friendly':
        return 'secondary';
      case 'casual':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateInput: string | Date) => {
    if (!dateInput) return 'N/A';
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !strategy) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/strategies">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Strategies
            </Button>
          </Link>
        </div>
        
        <Alert variant="destructive">
          <AlertDescription>
            {error || 'Strategy not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Link href="/admin/strategies">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Strategies
              </Button>
            </Link>
          </div>
          
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-gray-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
            Strategy Details
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            View and manage strategy configuration
          </p>
        </div>
        
        <div className="flex gap-3 justify-start lg:justify-end">
          <Link href={`/admin/strategies/${strategy.id}/edit`}>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Strategy
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Strategy Overview */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-lg">
        <CardHeader className="border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                <Target className="h-6 w-6 text-blue-600" />
                {strategy.name}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                Created on {formatDate(strategy.createdAt)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{strategy.tag || 'No tag'}</Badge>
              <Badge variant={getToneBadgeVariant(strategy.tone)}>
                {strategy.tone || 'No tone'}
              </Badge>
              <Badge variant={getCreativityBadgeVariant(strategy.creativity)}>
                Creativity: {strategy.creativity ?? 0}/10
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Objective</p>
                    <p className="text-gray-900 dark:text-gray-100">{strategy.aiObjective || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Qualification Priority</p>
                    <p className="text-gray-900 dark:text-gray-100 capitalize">{strategy.qualificationPriority || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Response Delay</p>
                    <p className="text-gray-900 dark:text-gray-100">
                      {strategy.delayMin ?? 0} - {strategy.delayMax ?? 0} seconds
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">User ID</p>
                    <p className="text-gray-900 dark:text-gray-100">{strategy.regularUserId ?? 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sub Account ID</p>
                    <p className="text-gray-900 dark:text-gray-100">{strategy.subAccountId ?? 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Prompt Template ID</p>
                    <p className="text-gray-900 dark:text-gray-100">{strategy.promptTemplateId ?? 'None'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Instructions */}
      {strategy.aiInstructions && (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-lg">
          <CardHeader className="border-b border-gray-100 dark:border-slate-700">
            <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-200">AI Instructions</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{strategy.aiInstructions}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Objection Handling */}
      {strategy.objectionHandling && (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-lg">
          <CardHeader className="border-b border-gray-100 dark:border-slate-700">
            <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-200">Objection Handling</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{strategy.objectionHandling}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disqualification Criteria */}
      {strategy.disqualificationCriteria && (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-lg">
          <CardHeader className="border-b border-gray-100 dark:border-slate-700">
            <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-200">Disqualification Criteria</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{strategy.disqualificationCriteria}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Example Conversation */}
      {strategy.exampleConversation && (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-lg">
          <CardHeader className="border-b border-gray-100 dark:border-slate-700">
            <CardTitle className="text-lg font-bold text-gray-800 dark:text-gray-200">Example Conversation</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{strategy.exampleConversation}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}