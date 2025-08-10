'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Target, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
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
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      category: category.trim() || undefined,
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Business Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main search inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="query">Business Name or Category *</Label>
              <Input
                id="query"
                type="text"
                placeholder="e.g., Italian restaurants, dental clinics, auto repair"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="location"
                  type="text"
                  placeholder="City, State or Address"
                  className="pl-10"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Data source selection */}
          <div>
            <Label>Select Data Source</Label>
            <RadioGroup 
              value={selectedSource} 
              onValueChange={setSelectedSource}
              className="mt-2"
            >
              <div className="grid grid-cols-1 gap-4">
                {availableSources.map((source) => (
                  <div
                    key={source.id}
                    className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
                      selectedSource === source.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={source.id} id={source.id} />
                    <div className="flex-1">
                      <Label htmlFor={source.id} className="font-medium cursor-pointer">
                        {source.name}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {source.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {source.requiresApiKey && (
                          <Badge variant="outline" className="text-xs">
                            API Key Required
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {source.freeQuota}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Advanced options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" type="button" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category Filter</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="limit">Results Limit</Label>
                  <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                    <SelectTrigger>
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
              
              {location && (
                <div>
                  <Label>Search Radius: {radius[0]} km</Label>
                  <div className="mt-2">
                    <Slider
                      value={radius}
                      onValueChange={setRadius}
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>1 km</span>
                      <span>50 km</span>
                    </div>
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Search button */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Find Businesses
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}