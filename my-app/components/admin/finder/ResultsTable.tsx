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
  ArrowUpDown,
  Search,
  Tag,
  Building,
  Utensils,
  ShoppingBag,
  Heart,
  Car,
  Briefcase,
  Home,
  GraduationCap,
  Stethoscope,
  Globe
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
      let valueA: string | number;
      let valueB: string | number;

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

  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('restaurant') || lowerCategory.includes('food') || lowerCategory.includes('dining')) {
      return Utensils;
    } else if (lowerCategory.includes('retail') || lowerCategory.includes('shop') || lowerCategory.includes('store')) {
      return ShoppingBag;
    } else if (lowerCategory.includes('health') || lowerCategory.includes('medical') || lowerCategory.includes('clinic')) {
      return Stethoscope;
    } else if (lowerCategory.includes('auto') || lowerCategory.includes('car') || lowerCategory.includes('vehicle')) {
      return Car;
    } else if (lowerCategory.includes('beauty') || lowerCategory.includes('spa') || lowerCategory.includes('salon')) {
      return Heart;
    } else if (lowerCategory.includes('real estate') || lowerCategory.includes('home') || lowerCategory.includes('property')) {
      return Home;
    } else if (lowerCategory.includes('education') || lowerCategory.includes('school') || lowerCategory.includes('university')) {
      return GraduationCap;
    } else if (lowerCategory.includes('professional') || lowerCategory.includes('business') || lowerCategory.includes('service')) {
      return Briefcase;
    } else {
      return Building;
    }
  };

  const getCategoryColor = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('restaurant') || lowerCategory.includes('food') || lowerCategory.includes('dining')) {
      return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
    } else if (lowerCategory.includes('retail') || lowerCategory.includes('shop') || lowerCategory.includes('store')) {
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    } else if (lowerCategory.includes('health') || lowerCategory.includes('medical') || lowerCategory.includes('clinic')) {
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    } else if (lowerCategory.includes('auto') || lowerCategory.includes('car') || lowerCategory.includes('vehicle')) {
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    } else if (lowerCategory.includes('beauty') || lowerCategory.includes('spa') || lowerCategory.includes('salon')) {
      return 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800';
    } else if (lowerCategory.includes('real estate') || lowerCategory.includes('home') || lowerCategory.includes('property')) {
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    } else if (lowerCategory.includes('education') || lowerCategory.includes('school') || lowerCategory.includes('university')) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800';
    } else if (lowerCategory.includes('professional') || lowerCategory.includes('business') || lowerCategory.includes('service')) {
      return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
    } else {
      return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800';
    }
  };

  const getSourceStyling = (source: string) => {
    switch (source) {
      case 'google_places':
        return {
          className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
          icon: Globe
        };
      case 'yelp':
        return {
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
          icon: Star
        };
      case 'openstreetmap':
        return {
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
          icon: MapPin
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
          icon: Building
        };
    }
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
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="border-b border-gray-100 dark:border-slate-700 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            Search Results
            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
              {searchResponse.totalResults} results
            </Badge>
            {searchResponse.cached && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">Cached</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {searchResponse.responseTime}ms
            </span>
            <Button onClick={handleExportSelected} variant="outline" size="sm" className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors">
              <Download className="h-4 w-4 mr-1" />
              Export ({selectedResults.size > 0 ? selectedResults.size : filteredResults.length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-gray-200/60 dark:border-slate-600/60">
          <div className="flex-1">
            <Input
              placeholder="Filter results..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full border-gray-200/60 dark:border-slate-600/60 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[140px] border-gray-200/60 dark:border-slate-600/60">
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
            <SelectTrigger className="w-[120px] border-gray-200/60 dark:border-slate-600/60">
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
            className="bg-white/80 border-gray-200/60 hover:bg-gray-50 transition-colors"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>

        {/* Results table */}
        <div className="border border-gray-200/60 dark:border-slate-600/60 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-b border-gray-200/60 dark:border-slate-600/60">
                <TableHead className="w-12 font-semibold text-gray-700 dark:text-gray-300">
                  <Checkbox
                    checked={selectedResults.size === filteredResults.length && filteredResults.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-600" />
                  Business
                </TableHead>
                <TableHead className="font-bold text-gray-800 dark:text-gray-200">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    Contact
                  </div>
                </TableHead>
                <TableHead className="font-bold text-gray-800 dark:text-gray-200">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Rating
                  </div>
                </TableHead>
                <TableHead className="font-bold text-gray-800 dark:text-gray-200">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-purple-600" />
                    Categories
                  </div>
                </TableHead>
                <TableHead className="font-bold text-gray-800 dark:text-gray-200">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-indigo-600" />
                    Source
                  </div>
                </TableHead>
                <TableHead className="font-bold text-gray-800 dark:text-gray-200">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map((business) => (
                <TableRow 
                  key={business.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors duration-200 border-b border-gray-100/50 dark:border-slate-700/50"
                >
                  <TableCell className="py-4">
                    <Checkbox
                      checked={selectedResults.has(business.id)}
                      onCheckedChange={(checked) => 
                        handleSelectResult(business.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{business.name}</p>
                      {business.address && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {business.address}
                        </p>
                      )}
                      {business.priceLevel && (
                        <div className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                          {business.priceLevel}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="space-y-2">
                      {business.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Phone className="h-3 w-3 text-emerald-600" />
                          <span className="font-medium">{business.phone}</span>
                        </div>
                      )}
                      {business.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <ExternalLink className="h-3 w-3 text-blue-600" />
                          <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline transition-colors"
                          >
                            Website
                          </a>
                        </div>
                      )}
                      {!business.phone && !business.website && (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">No contact info</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    {business.rating ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md border border-yellow-200 dark:border-yellow-800">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-bold text-yellow-700 dark:text-yellow-400">{business.rating}</span>
                        </div>
                        {business.reviews && (
                          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            ({business.reviews.count})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500 italic">No rating</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-48">
                      {business.categories?.slice(0, 2).map((category, index) => {
                        const IconComponent = getCategoryIcon(category);
                        const colorClass = getCategoryColor(category);
                        return (
                          <div
                            key={index}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 hover:shadow-sm ${colorClass}`}
                          >
                            <IconComponent className="h-3 w-3" />
                            <span className="truncate max-w-20" title={category}>
                              {category}
                            </span>
                          </div>
                        );
                      })}
                      {business.categories && business.categories.length > 2 && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-700">
                          <Tag className="h-3 w-3" />
                          +{business.categories.length - 2}
                        </div>
                      )}
                      {(!business.categories || business.categories.length === 0) && (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">No categories</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    {(() => {
                      const sourceStyling = getSourceStyling(business.source);
                      const IconComponent = sourceStyling.icon;
                      return (
                        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 hover:shadow-md transform hover:scale-105 ${sourceStyling.className}`}>
                          <IconComponent className="h-4 w-4" />
                          <span>{formatSource(business.source)}</span>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="py-4">
                    <BusinessDetailsDialog business={business} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium">No results match your filters</p>
            <p className="text-sm">Try adjusting your search criteria or filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}