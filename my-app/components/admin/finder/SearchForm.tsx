'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Target, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { SearchBusinessDto, ApiSource } from '@/lib/api/endpoints/finder';

interface SearchFormProps {
  onSearch: (searchData: SearchBusinessDto) => Promise<void>;
  isSearching: boolean;
  availableSources: ApiSource[];
}

export function SearchForm({ onSearch, isSearching, availableSources }: SearchFormProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState([5]);
  const [category, setCategory] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [limit, setLimit] = useState(20);
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false);

  // Initialize with first available source
  useEffect(() => {
    if (availableSources.length > 0 && !selectedSource) {
      setSelectedSource(availableSources[0].id);
    }
  }, [availableSources, selectedSource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (!selectedSource) {
      toast.error('Please select a data source');
      return;
    }

    const searchData: SearchBusinessDto = {
      query: query.trim(),
      location: location.trim() || undefined,
      radius: radius[0],
      category: category === 'all' || !category.trim() ? undefined : category.trim(),
      sources: [selectedSource], // Single source in array format
      limit,
    };

    await onSearch(searchData);
  };


  const categories = [
    'restaurant',
    'retail',
    'healthcare',
    'automotive',
    'beauty',
    'fitness',
    'legal',
    'financial',
    'real estate',
    'education',
    'entertainment',
    'professional services',
  ];

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-indigo-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <Card className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-500/5 to-indigo-500/10 pointer-events-none"></div>
        <CardHeader className="relative border-b border-gray-100/50 dark:border-slate-700/50 pb-6 bg-gradient-to-r from-blue-50/50 via-white/50 to-indigo-50/50 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-gray-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                  Business Search
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Find businesses across multiple data sources with powerful filters
                </p>
              </div>
            </div>
            
            {/* Advanced Options Button */}
            <Dialog open={advancedModalOpen} onOpenChange={setAdvancedModalOpen}>
              <DialogTrigger asChild>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Button type="button" variant="outline" className="relative bg-gradient-to-r from-white via-violet-50/30 to-purple-50/30 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 border-gray-200/60 dark:border-slate-600/60 hover:border-violet-300 hover:from-violet-50 hover:to-purple-50 dark:hover:from-slate-600 dark:hover:to-slate-500 transition-all duration-200 shadow-lg hover:shadow-xl rounded-2xl px-4 py-2 font-semibold text-gray-700 dark:text-gray-200 hover:text-violet-700 dark:hover:text-violet-300">
                    <Settings className="h-4 w-4 mr-2 text-violet-600" />
                    Advanced Options
                  </Button>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    Advanced Search Options
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="category" className="text-base font-semibold text-gray-700 dark:text-gray-300">Category Filter</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="bg-gradient-to-r from-white via-violet-50/30 to-purple-50/30 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 border-gray-200/60 dark:border-slate-600/60 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="limit" className="text-base font-semibold text-gray-700 dark:text-gray-300">Results Limit</Label>
                      <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                        <SelectTrigger className="bg-gradient-to-r from-white via-violet-50/30 to-purple-50/30 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 border-gray-200/60 dark:border-slate-600/60 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 results</SelectItem>
                          <SelectItem value="20">20 results</SelectItem>
                          <SelectItem value="50">50 results</SelectItem>
                          <SelectItem value="100">100 results</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Search Radius: {radius[0]} km</Label>
                      <div className="px-4">
                        <Slider
                          value={radius}
                          onValueChange={setRadius}
                          max={50}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <span>1 km</span>
                          <span>25 km</span>
                          <span>50 km</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <Button type="button" variant="outline" onClick={() => setAdvancedModalOpen(false)} className="border-gray-200/60 hover:bg-gray-50 transition-colors">
                      Cancel
                    </Button>
                    <Button type="button" onClick={() => setAdvancedModalOpen(false)} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="relative pt-8 pb-8 px-8 bg-gradient-to-br from-white/80 via-blue-50/20 to-indigo-50/30 dark:from-slate-800/80 dark:via-slate-700/20 dark:to-slate-800/30">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Main search inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="query" className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                Business Name or Category *
              </Label>
              <div className="relative">
                <Input
                  id="query"
                  type="text"
                  placeholder="e.g., Italian restaurants, dental clinics, auto repair"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  required
                  className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/30 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 border-gray-200/60 dark:border-slate-600/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-3 font-medium shadow-inner transition-all duration-200"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl pointer-events-none"></div>
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="location" className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                Location
              </Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                <Input
                  id="location"
                  type="text"
                  placeholder="City, State or Address"
                  className="pl-12 pr-4 py-3 bg-gradient-to-r from-white via-emerald-50/30 to-teal-50/30 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 border-gray-200/60 dark:border-slate-600/60 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl font-medium shadow-inner transition-all duration-200"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-xl pointer-events-none"></div>
              </div>
            </div>
          </div>

          {/* Data source selection */}
          <div className="space-y-4">
            <Label className="text-base font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Settings className="h-4 w-4 text-amber-600" />
              Select Data Source
            </Label>
            <div className="space-y-2">
              {availableSources.map((source) => {
                const isSelected = selectedSource === source.id;
                return (
                  <div
                    key={source.id}
                    className={`group relative overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/25' 
                        : 'hover:shadow-lg hover:-translate-y-0.5'
                    }`}
                    onClick={() => {
                      // Allow deselection by clicking the same source again
                      if (isSelected) {
                        setSelectedSource('');
                      } else {
                        setSelectedSource(source.id);
                      }
                    }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${
                      isSelected
                        ? 'from-amber-500/10 via-orange-500/10 to-yellow-500/10 opacity-100'
                        : 'from-gray-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100'
                    }`}></div>
                    <div className={`relative flex items-center space-x-4 p-4 border rounded-2xl transition-all duration-300 ${
                      isSelected
                        ? 'border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700' 
                        : 'border-gray-200/60 dark:border-slate-600/60 bg-gradient-to-r from-white via-gray-50/30 to-amber-50/30 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 hover:border-amber-200'
                    }`}>
                      <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                        isSelected 
                          ? 'border-amber-500 bg-amber-500' 
                          : 'border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-500'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`font-bold text-lg transition-colors ${
                          isSelected
                            ? 'text-amber-900 dark:text-amber-100' 
                            : 'text-gray-900 dark:text-gray-100 group-hover:text-amber-700 dark:group-hover:text-amber-300'
                        }`}>
                          {source.name}
                        </div>
                        <p className={`text-sm mt-1 transition-colors ${
                          isSelected
                            ? 'text-amber-700 dark:text-amber-300' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {source.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {source.requiresApiKey && (
                            <Badge variant="outline" className="text-xs border-red-300 text-red-700 bg-gradient-to-r from-red-50 to-pink-50 font-semibold">
                              API Key Required
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200 font-semibold">
                            {source.freeQuota}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search button */}
          <div className="relative group pt-4">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-indigo-500/30 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Button 
              type="submit" 
              className="relative w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl py-6 text-lg transform hover:scale-[1.02] active:scale-[0.98]" 
              disabled={isSearching}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl pointer-events-none"></div>
              {isSearching ? (
                <>
                  <div className="relative mr-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-3 border-white/30 border-t-white"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Search className="h-3 w-3 text-white animate-pulse" />
                    </div>
                  </div>
                  <span className="text-white/90">Searching for Businesses...</span>
                </>
              ) : (
                <>
                  <Target className="h-6 w-6 mr-3 text-white drop-shadow-lg" />
                  <span className="drop-shadow-lg">Find Businesses</span>
                </>
              )}
            </Button>
          </div>
        </form>
        </CardContent>
      </Card>
    </div>
  );
}