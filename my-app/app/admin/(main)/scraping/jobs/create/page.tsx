'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  Plus, 
  Trash2, 
  TestTube, 
  Save, 
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Settings,
  Code,
  Filter
} from 'lucide-react';
import { api } from '@/lib/api';
import { CreateScrapingJobDto, ScrapingSelector, ScrapingFilter, UrlValidationResult } from '@/types/scraping';
import { toast } from 'sonner';

export default function CreateScrapingJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [urlValidation, setUrlValidation] = useState<UrlValidationResult | null>(null);
  const [urlValidating, setUrlValidating] = useState(false);
  
  const [formData, setFormData] = useState<CreateScrapingJobDto>({
    name: '',
    description: '',
    targetUrl: '',
    maxPages: 10,
    maxDepth: 2,
    selectors: {},
    filters: {},
    userAgent: '',
    delayMin: 1000,
    delayMax: 3000,
    timeout: 30000,
  });

  const [selectors, setSelectors] = useState<ScrapingSelector[]>([
    { name: 'title', selector: 'h1', attribute: 'text', required: true, multiple: false }
  ]);

  const [filters, setFilters] = useState<ScrapingFilter[]>([]);

  // Validate URL when it changes
  useEffect(() => {
    const validateUrl = async () => {
      if (!formData.targetUrl || formData.targetUrl.length < 10) {
        setUrlValidation(null);
        return;
      }

      try {
        setUrlValidating(true);
        const response = await api.scraping.testUrl(formData.targetUrl);
        if (response.success) {
          setUrlValidation(response.data);
        }
      } catch (error) {
        setUrlValidation({
          isValid: false,
          isAccessible: false,
          error: 'Failed to validate URL'
        });
      } finally {
        setUrlValidating(false);
      }
    };

    const debounceTimer = setTimeout(validateUrl, 1000);
    return () => clearTimeout(debounceTimer);
  }, [formData.targetUrl]);

  const handleInputChange = (field: keyof CreateScrapingJobDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSelector = () => {
    setSelectors(prev => [...prev, {
      name: '',
      selector: '',
      attribute: 'text',
      required: false,
      multiple: false
    }]);
  };

  const updateSelector = (index: number, field: keyof ScrapingSelector, value: any) => {
    setSelectors(prev => prev.map((selector, i) => 
      i === index ? { ...selector, [field]: value } : selector
    ));
  };

  const removeSelector = (index: number) => {
    if (selectors.length > 1) {
      setSelectors(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addFilter = () => {
    setFilters(prev => [...prev, {
      field: '',
      operator: 'contains',
      value: '',
      caseSensitive: false
    }]);
  };

  const updateFilter = (index: number, field: keyof ScrapingFilter, value: any) => {
    setFilters(prev => prev.map((filter, i) => 
      i === index ? { ...filter, [field]: value } : filter
    ));
  };

  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };

  const testSelectors = async () => {
    if (!formData.targetUrl || selectors.length === 0) {
      toast.error('Please enter a URL and add at least one selector');
      return;
    }

    try {
      setLoading(true);
      const selectorsMap = selectors.reduce((acc, selector) => {
        if (selector.name && selector.selector) {
          acc[selector.name] = selector.selector;
        }
        return acc;
      }, {} as Record<string, string>);

      const response = await api.scraping.validateSelectors(formData.targetUrl, selectorsMap);
      if (response.success) {
        toast.success(`Selectors validated! Found elements: ${response.data.map(r => `${r.selector}: ${r.foundElements}`).join(', ')}`);
      }
    } catch (error) {
      toast.error('Failed to validate selectors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.targetUrl || selectors.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!urlValidation?.isAccessible) {
      toast.error('Please enter a valid and accessible URL');
      return;
    }

    try {
      setLoading(true);

      // Convert selectors and filters to the expected format
      const selectorsMap = selectors.reduce((acc, selector) => {
        if (selector.name && selector.selector) {
          acc[selector.name] = selector.selector;
        }
        return acc;
      }, {} as Record<string, string>);

      const filtersObj = filters.reduce((acc, filter, index) => {
        if (filter.field && filter.operator) {
          acc[`filter_${index}`] = filter;
        }
        return acc;
      }, {} as Record<string, any>);

      const jobData: CreateScrapingJobDto = {
        ...formData,
        selectors: selectorsMap,
        filters: Object.keys(filtersObj).length > 0 ? filtersObj : undefined,
      };

      const response = await api.scraping.createJob(jobData);
      if (response.success) {
        toast.success('Scraping job created successfully!');
        router.push(`/admin/scraping/jobs/${response.data.id}`);
      }
    } catch (error) {
      toast.error('Failed to create scraping job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold">Create Scraping Job</h1>
          <p className="text-muted-foreground">
            Set up a new web scraping job to extract data from websites
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="selectors">Data Extraction</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Job Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Job Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="My Website Scraper"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="targetUrl">Target URL *</Label>
                    <div className="relative">
                      <Input
                        id="targetUrl"
                        type="url"
                        value={formData.targetUrl}
                        onChange={(e) => handleInputChange('targetUrl', e.target.value)}
                        placeholder="https://example.com"
                        required
                      />
                      {urlValidating && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>
                    
                    {urlValidation && (
                      <div className="flex items-center gap-2 text-sm">
                        {urlValidation.isAccessible ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">URL is accessible</span>
                            {urlValidation.title && (
                              <Badge variant="outline">{urlValidation.title}</Badge>
                            )}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="text-red-600">
                              {urlValidation.error || 'URL is not accessible'}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what this scraping job will do..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxPages">Max Pages to Scrape</Label>
                    <Input
                      id="maxPages"
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.maxPages}
                      onChange={(e) => handleInputChange('maxPages', parseInt(e.target.value) || 10)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxDepth">Max Crawl Depth</Label>
                    <Input
                      id="maxDepth"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.maxDepth}
                      onChange={(e) => handleInputChange('maxDepth', parseInt(e.target.value) || 2)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Extraction Tab */}
          <TabsContent value="selectors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  CSS Selectors
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={testSelectors}
                    disabled={loading || !formData.targetUrl}
                    className="ml-auto"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Selectors
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Use CSS selectors to specify which elements to extract from each page. 
                    For example: 'h1' for headings, '.price' for price elements, '#description' for descriptions.
                  </AlertDescription>
                </Alert>

                {selectors.map((selector, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Selector {index + 1}</h4>
                      {selectors.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSelector(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Field Name</Label>
                        <Input
                          value={selector.name}
                          onChange={(e) => updateSelector(index, 'name', e.target.value)}
                          placeholder="title, price, description"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>CSS Selector</Label>
                        <Input
                          value={selector.selector}
                          onChange={(e) => updateSelector(index, 'selector', e.target.value)}
                          placeholder="h1, .price, #description"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Attribute</Label>
                        <select
                          value={selector.attribute}
                          onChange={(e) => updateSelector(index, 'attribute', e.target.value)}
                          className="w-full px-3 py-2 border border-input rounded-md"
                        >
                          <option value="text">Text Content</option>
                          <option value="href">Link (href)</option>
                          <option value="src">Image Source (src)</option>
                          <option value="alt">Alt Text</option>
                          <option value="title">Title Attribute</option>
                          <option value="data-value">Data Value</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selector.required}
                          onChange={(e) => updateSelector(index, 'required', e.target.checked)}
                        />
                        <span className="text-sm">Required field</span>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selector.multiple}
                          onChange={(e) => updateSelector(index, 'multiple', e.target.checked)}
                        />
                        <span className="text-sm">Extract multiple elements</span>
                      </label>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addSelector}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Selector
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Filters Tab */}
          <TabsContent value="filters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Data Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Add filters to exclude or include specific content based on the extracted data.
                  </AlertDescription>
                </Alert>

                {filters.length > 0 ? (
                  filters.map((filter, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Filter {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFilter(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-2">
                          <Label>Field</Label>
                          <Input
                            value={filter.field}
                            onChange={(e) => updateFilter(index, 'field', e.target.value)}
                            placeholder="title, price"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Operator</Label>
                          <select
                            value={filter.operator}
                            onChange={(e) => updateFilter(index, 'operator', e.target.value as any)}
                            className="w-full px-3 py-2 border border-input rounded-md"
                          >
                            <option value="contains">Contains</option>
                            <option value="equals">Equals</option>
                            <option value="startsWith">Starts With</option>
                            <option value="endsWith">Ends With</option>
                            <option value="regex">Regex</option>
                            <option value="exists">Exists</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Value</Label>
                          <Input
                            value={filter.value}
                            onChange={(e) => updateFilter(index, 'value', e.target.value)}
                            placeholder="search term"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Options</Label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={filter.caseSensitive}
                              onChange={(e) => updateFilter(index, 'caseSensitive', e.target.checked)}
                            />
                            <span className="text-sm">Case sensitive</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No filters added. Data will be extracted without filtering.
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addFilter}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Filter
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Settings Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Advanced Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userAgent">User Agent</Label>
                    <Input
                      id="userAgent"
                      value={formData.userAgent}
                      onChange={(e) => handleInputChange('userAgent', e.target.value)}
                      placeholder="Leave empty for default"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timeout">Request Timeout (ms)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      min="5000"
                      max="120000"
                      value={formData.timeout}
                      onChange={(e) => handleInputChange('timeout', parseInt(e.target.value) || 30000)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Request Delays</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="delayMin">Minimum Delay (ms)</Label>
                      <Input
                        id="delayMin"
                        type="number"
                        min="500"
                        max="10000"
                        value={formData.delayMin}
                        onChange={(e) => handleInputChange('delayMin', parseInt(e.target.value) || 1000)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="delayMax">Maximum Delay (ms)</Label>
                      <Input
                        id="delayMax"
                        type="number"
                        min="1000"
                        max="30000"
                        value={formData.delayMax}
                        onChange={(e) => handleInputChange('delayMax', parseInt(e.target.value) || 3000)}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Random delays between requests help avoid being blocked by websites.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={loading || !urlValidation?.isAccessible}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Job'}
          </Button>
        </div>
      </form>
    </div>
  );
}