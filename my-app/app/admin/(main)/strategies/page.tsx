'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Eye, RefreshCw, Target } from 'lucide-react';
import Link from 'next/link';
import { Strategy } from '@/types';
import logger from '@/lib/logger';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubaccountFilter } from '@/contexts/subaccount-filter-context';

interface StrategyStats {
  totalStrategies: number;
  activeStrategies: number;
  highCreativity: number;
  lowCreativity: number;
}

export default function StrategiesPage() {
  const { getCurrentSubaccount } = useSubaccountFilter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [filteredStrategies, setFilteredStrategies] = useState<Strategy[]>([]);
  const [stats, setStats] = useState<StrategyStats>({
    totalStrategies: 0,
    activeStrategies: 0,
    highCreativity: 0,
    lowCreativity: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('all');

  const calculateStats = (strategiesData: Strategy[]) => {
    const stats = {
      totalStrategies: strategiesData.length,
      activeStrategies: strategiesData.filter(s => s.aiObjective === 'active').length,
      highCreativity: strategiesData.filter(s => (s.creativity ?? 0) >= 7).length,
      lowCreativity: strategiesData.filter(s => (s.creativity ?? 0) <= 3).length,
    };
    setStats(stats);
  };

  const loadStrategies = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const currentSubaccount = getCurrentSubaccount();
      const strategiesData = await api.strategies.getStrategies(
        currentSubaccount ? { subAccountId: currentSubaccount.id } : undefined
      );
      setStrategies(strategiesData);
      calculateStats(strategiesData);
    } catch (error) {
      logger.error('Failed to load strategies:', error);
      setError('Failed to load strategies');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getCurrentSubaccount]);

  const filterStrategies = useCallback(() => {
    let filtered = strategies;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(strategy =>
        strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        strategy.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        strategy.tone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        strategy.aiObjective?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply tag filter
    if (tagFilter !== 'all') {
      filtered = filtered.filter(strategy => strategy.tag === tagFilter);
    }

    setFilteredStrategies(filtered);
  }, [strategies, searchTerm, tagFilter]);

  useEffect(() => {
    loadStrategies();
  }, [loadStrategies]);

  useEffect(() => {
    filterStrategies();
  }, [filterStrategies]);

  // Cleanup success/error messages on unmount
  useEffect(() => {
    return () => {
      setSuccess(null);
      setError(null);
    };
  }, []);

  const deleteStrategy = async (strategyId: number) => {
    if (confirm('Are you sure you want to delete this strategy?')) {
      try {
        setError(null);
        await api.strategies.deleteStrategy(strategyId);
        setSuccess('Strategy deleted successfully');
        await loadStrategies(); // Reload the list
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        logger.error('Failed to delete strategy:', error);
        setError('Failed to delete strategy. Please try again.');
      }
    }
  };

  const getCreativityBadgeVariant = (creativity: number) => {
    if (creativity >= 8) return 'default';
    if (creativity >= 5) return 'secondary';
    return 'outline';
  };

  const getToneBadgeVariant = (tone: string) => {
    switch (tone?.toLowerCase()) {
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
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button 
              variant="link" 
              className="p-0 h-auto text-destructive underline ml-2"
              onClick={loadStrategies}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Strategies</h1>
          <p className="text-gray-600">Manage AI conversation strategies and automation rules.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadStrategies}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/admin/strategies/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Strategy
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.totalStrategies}</div>
            <div className="text-sm text-gray-600">Total Strategies</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{stats.activeStrategies}</div>
            <div className="text-sm text-gray-600">Active Strategies</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-600">{stats.highCreativity}</div>
            <div className="text-sm text-gray-600">High Creativity</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-600">{stats.lowCreativity}</div>
            <div className="text-sm text-gray-600">Low Creativity</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search strategies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={tagFilter}
              onValueChange={setTagFilter}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="follow-up">Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Strategies Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Strategies ({filteredStrategies.length})</CardTitle>
          <CardDescription>A list of all your AI conversation strategies.</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStrategies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Tone</TableHead>
                  <TableHead>Creativity</TableHead>
                  <TableHead>Objective</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStrategies.map((strategy) => (
                  <TableRow key={strategy.id}>
                    <TableCell className="font-medium">{strategy.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{strategy.tag}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getToneBadgeVariant(strategy.tone ?? '')}>
                        {strategy.tone}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getCreativityBadgeVariant(strategy.creativity ?? 0)}>
                        {strategy.creativity}/10
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {strategy.aiObjective}
                    </TableCell>
                    <TableCell>{formatDate(strategy.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Strategy Details</DialogTitle>
                              <DialogDescription>
                                Detailed view of the strategy configuration
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold">Name</h4>
                                <p>{strategy.name}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold">Tag</h4>
                                <Badge variant="outline">{strategy.tag}</Badge>
                              </div>
                              <div>
                                <h4 className="font-semibold">Tone</h4>
                                <Badge variant={getToneBadgeVariant(strategy.tone ?? '')}>
                                  {strategy.tone}
                                </Badge>
                              </div>
                              <div>
                                <h4 className="font-semibold">AI Instructions</h4>
                                <p className="text-sm bg-gray-50 p-3 rounded">{strategy.aiInstructions}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold">Objection Handling</h4>
                                <p className="text-sm bg-gray-50 p-3 rounded">{strategy.objectionHandling}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold">Disqualification Criteria</h4>
                                <p className="text-sm bg-gray-50 p-3 rounded">{strategy.disqualificationCriteria}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold">Creativity Level</h4>
                                  <Badge variant={getCreativityBadgeVariant(strategy.creativity ?? 0)}>
                                    {strategy.creativity}/10
                                  </Badge>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Delay Range</h4>
                                  <p>{strategy.delayMin}-{strategy.delayMax} minutes</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Link href={`/admin/strategies/${strategy.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteStrategy(strategy.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No strategies found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || tagFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first strategy.'
                }
              </p>
              {!searchTerm && tagFilter === 'all' && (
                <div className="mt-6">
                  <Link href="/admin/strategies/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Strategy
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 