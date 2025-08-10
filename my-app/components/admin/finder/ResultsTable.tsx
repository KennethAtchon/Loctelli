'use client';

import React, { useState } from 'react';
import { 
  ExternalLink, 
  Phone, 
  MapPin, 
  Star, 
  Clock, 
  Camera,
  Download,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BusinessSearchResultDto, SearchResponseDto } from '@/lib/api/endpoints/finder';

interface ResultsTableProps {
  searchResponse: SearchResponseDto | null;
  onExport: (results: BusinessSearchResultDto[]) => void;
}

export function ResultsTable({ searchResponse, onExport }: ResultsTableProps) {
  const [filteredResults, setFilteredResults] = useState<BusinessSearchResultDto[]>([]);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Update filtered results when search response or filters change
  React.useEffect(() => {
    if (!searchResponse) {
      setFilteredResults([]);
      return;
    }

    let results = [...searchResponse.results];

    // Apply search filter
    if (searchFilter) {
      results = results.filter(result =>
        result.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        result.address?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        result.categories?.some(cat => cat.toLowerCase().includes(searchFilter.toLowerCase()))
      );
    }

    // Apply source filter
    if (sourceFilter !== 'all') {
      results = results.filter(result => result.source === sourceFilter);
    }

    // Apply sorting
    results.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortBy) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'rating':
          valueA = a.rating || 0;
          valueB = b.rating || 0;
          break;
        case 'source':
          valueA = a.source;
          valueB = b.source;
          break;
        default:
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredResults(results);
  }, [searchResponse, searchFilter, sourceFilter, sortBy, sortOrder]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedResults(new Set(filteredResults.map(r => r.id)));
    } else {
      setSelectedResults(new Set());
    }
  };

  const handleSelectResult = (resultId: string, checked: boolean) => {
    const newSelected = new Set(selectedResults);
    if (checked) {
      newSelected.add(resultId);
    } else {
      newSelected.delete(resultId);
    }
    setSelectedResults(newSelected);
  };

  const handleExportSelected = () => {
    const selectedData = filteredResults.filter(r => selectedResults.has(r.id));
    if (selectedData.length === 0) {
      // If none selected, export all filtered results
      onExport(filteredResults);
    } else {
      onExport(selectedData);
    }
  };

  const formatSource = (source: string) => {
    const sourceMap: Record<string, string> = {
      google_places: 'Google',
      yelp: 'Yelp',
      openstreetmap: 'OSM'
    };
    return sourceMap[source] || source;
  };

  const BusinessDetailsDialog = ({ business }: { business: BusinessSearchResultDto }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{business.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {business.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">{business.address}</p>
                  </div>
                </div>
              )}
              
              {business.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{business.phone}</p>
                  </div>
                </div>
              )}
              
              {business.rating && (
                <div className="flex items-start gap-2">
                  <Star className="h-4 w-4 mt-0.5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Rating</p>
                    <p className="text-sm text-muted-foreground">
                      {business.rating}/5 
                      {business.reviews && ` (${business.reviews.count} reviews)`}
                    </p>
                  </div>
                </div>
              )}
              
              {business.priceLevel && (
                <div className="flex items-start gap-2">
                  <div className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Price Level</p>
                    <p className="text-sm text-muted-foreground">{business.priceLevel}</p>
                  </div>
                </div>
              )}
            </div>

            {business.categories && business.categories.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Categories</p>
                <div className="flex flex-wrap gap-1">
                  {business.categories.map((category, index) => (
                    <Badge key={index} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {business.businessHours && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Business Hours
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(business.businessHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between">
                      <span className="font-medium">{day}:</span>
                      <span className="text-muted-foreground">{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {business.photos && business.photos.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Camera className="h-4 w-4" />
                  Photos ({business.photos.length})
                </p>
                <div className="text-sm text-muted-foreground">
                  Photos available from {formatSource(business.source)}
                </div>
              </div>
            )}

            <Separator />
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Source: {formatSource(business.source)}</span>
              <span>ID: {business.sourceId}</span>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );

  if (!searchResponse) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Search Results
            <Badge variant="outline">
              {searchResponse.totalResults} results
            </Badge>
            {searchResponse.cached && (
              <Badge variant="secondary">Cached</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {searchResponse.responseTime}ms
            </span>
            <Button onClick={handleExportSelected} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export ({selectedResults.size > 0 ? selectedResults.size : filteredResults.length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Filter results..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {Array.from(new Set(searchResponse.results.map(r => r.source))).map(source => (
                <SelectItem key={source} value={source}>
                  {formatSource(source)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="source">Source</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>

        {/* Results table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedResults.size === filteredResults.length && filteredResults.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map((business) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedResults.has(business.id)}
                      onCheckedChange={(checked) => 
                        handleSelectResult(business.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{business.name}</p>
                      {business.address && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {business.address}
                        </p>
                      )}
                      {business.priceLevel && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {business.priceLevel}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {business.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {business.phone}
                        </div>
                      )}
                      {business.website && (
                        <div className="flex items-center gap-1 text-sm">
                          <ExternalLink className="h-3 w-3" />
                          <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Website
                          </a>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {business.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-medium">{business.rating}</span>
                        {business.reviews && (
                          <span className="text-sm text-muted-foreground">
                            ({business.reviews.count})
                          </span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {business.categories?.slice(0, 2).map((category, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                      {business.categories && business.categories.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{business.categories.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={business.source === 'google_places' ? 'default' : 'secondary'}>
                      {formatSource(business.source)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <BusinessDetailsDialog business={business} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No results match your filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
}