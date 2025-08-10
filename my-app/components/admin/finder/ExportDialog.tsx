'use client';

import React, { useState, useEffect } from 'react';
import { Download, FileText, Database, FileSpreadsheet, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BusinessSearchResultDto, ExportResultsDto, finderApi } from '@/lib/api/endpoints/finder';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  searchId: string | null;
  results: BusinessSearchResultDto[];
}

const exportFormats = [
  {
    id: 'csv' as const,
    name: 'CSV (Spreadsheet)',
    description: 'Comma-separated values file for Excel/Sheets',
    icon: FileSpreadsheet,
    extension: '.csv',
  },
  {
    id: 'json' as const,
    name: 'JSON (Structured Data)',
    description: 'Machine-readable structured data format',
    icon: Database,
    extension: '.json',
  },
  {
    id: 'txt' as const,
    name: 'Text (Human Readable)',
    description: 'Plain text format for easy reading',
    icon: FileText,
    extension: '.txt',
  },
  {
    id: 'pdf' as const,
    name: 'PDF (Report)',
    description: 'Formatted report for printing/sharing',
    icon: File,
    extension: '.pdf',
  },
];

export function ExportDialog({ isOpen, onClose, searchId, results }: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'json' | 'txt' | 'pdf'>('csv');
  const [filename, setFilename] = useState('business_search_results');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Load available fields and initialize defaults
  useEffect(() => {
    const loadFields = async () => {
      try {
        const response = await finderApi.getAvailableFields();
        setAvailableFields(response.fields);
        
        // Select common fields by default
        const defaultFields = ['name', 'address', 'phone', 'website', 'rating', 'categories', 'source'];
        const availableDefaults = defaultFields.filter(field => response.fields.includes(field));
        setSelectedFields(availableDefaults);
      } catch (error) {
        console.error('Failed to load available fields:', error);
      }
    };

    if (isOpen) {
      loadFields();
      
      // Initialize sources from results
      const sources = Array.from(new Set(results.map(r => r.source)));
      setSelectedSources(sources);
      
      // Generate default filename with timestamp
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 10); // YYYY-MM-DD
      setFilename(`business_search_${timestamp}`);
    }
  }, [isOpen, results]);

  const handleFieldToggle = (field: string, checked: boolean) => {
    if (checked) {
      setSelectedFields(prev => [...prev, field]);
    } else {
      setSelectedFields(prev => prev.filter(f => f !== field));
    }
  };

  const handleSourceToggle = (source: string, checked: boolean) => {
    if (checked) {
      setSelectedSources(prev => [...prev, source]);
    } else {
      setSelectedSources(prev => prev.filter(s => s !== source));
    }
  };

  const handleSelectAllFields = () => {
    if (selectedFields.length === availableFields.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields([...availableFields]);
    }
  };

  const handleExport = async () => {
    if (!searchId) {
      toast.error('No search ID available');
      return;
    }

    if (selectedFields.length === 0) {
      toast.error('Please select at least one field to export');
      return;
    }

    if (selectedSources.length === 0) {
      toast.error('Please select at least one data source');
      return;
    }

    setIsExporting(true);
    
    try {
      const exportData: ExportResultsDto = {
        searchId,
        format,
        fields: selectedFields,
        filename: filename.trim(),
        sources: selectedSources,
      };

      const blob = await finderApi.exportResults(exportData);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const selectedFormat = exportFormats.find(f => f.id === format);
      link.download = `${filename.trim()}${selectedFormat?.extension || ''}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Export completed successfully!`);
      onClose();
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(error.response?.data?.message || 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatFieldName = (field: string) => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/Id$/, 'ID');
  };

  const formatSourceName = (source: string) => {
    const sourceMap: Record<string, string> = {
      google_places: 'Google Places',
      yelp: 'Yelp',
      openstreetmap: 'OpenStreetMap'
    };
    return sourceMap[source] || source;
  };

  const filteredResultsCount = results.filter(r => selectedSources.includes(r.source)).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Search Results
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <Label className="text-base font-medium">Export Format</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {exportFormats.map((fmt) => (
                <Card
                  key={fmt.id}
                  className={`cursor-pointer transition-all ${
                    format === fmt.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setFormat(fmt.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <fmt.icon className="h-4 w-4" />
                      <CardTitle className="text-sm">{fmt.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs">
                      {fmt.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Filename */}
          <div>
            <Label htmlFor="filename">Filename</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Enter filename"
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {exportFormats.find(f => f.id === format)?.extension}
              </span>
            </div>
          </div>

          {/* Data Sources */}
          <div>
            <Label className="text-base font-medium">Data Sources</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {Array.from(new Set(results.map(r => r.source))).map(source => {
                const count = results.filter(r => r.source === source).length;
                return (
                  <div key={source} className="flex items-center space-x-2">
                    <Checkbox
                      id={`source-${source}`}
                      checked={selectedSources.includes(source)}
                      onCheckedChange={(checked) => 
                        handleSourceToggle(source, checked as boolean)
                      }
                    />
                    <Label htmlFor={`source-${source}`} className="flex-1">
                      {formatSourceName(source)}
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Field Selection */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Fields to Export</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllFields}
              >
                {selectedFields.length === availableFields.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
              {availableFields.map(field => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={`field-${field}`}
                    checked={selectedFields.includes(field)}
                    onCheckedChange={(checked) => 
                      handleFieldToggle(field, checked as boolean)
                    }
                  />
                  <Label htmlFor={`field-${field}`} className="text-sm">
                    {formatFieldName(field)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="space-y-1">
                  <p>
                    <span className="font-medium">Results to export:</span>{' '}
                    {filteredResultsCount} of {results.length}
                  </p>
                  <p>
                    <span className="font-medium">Fields:</span>{' '}
                    {selectedFields.length} selected
                  </p>
                  <p>
                    <span className="font-medium">Format:</span>{' '}
                    {exportFormats.find(f => f.id === format)?.name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting || selectedFields.length === 0 || selectedSources.length === 0}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export ({filteredResultsCount} results)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}