'use client';

import React, { useState, useEffect } from 'react';
import { Download, FileText, Database, FileSpreadsheet, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      <DialogContent className="max-w-2xl max-h-[85vh] bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60 shadow-2xl rounded-3xl overflow-hidden">
        <DialogHeader className="sticky top-0 bg-gradient-to-r from-white/95 via-emerald-50/50 to-teal-50/50 dark:from-slate-800/95 dark:via-slate-700/95 dark:to-slate-800/95 z-10 pb-6 border-b border-gray-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 dark:from-gray-100 dark:via-emerald-200 dark:to-teal-200 bg-clip-text text-transparent">
                Export Search Results
              </DialogTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Configure your export settings and download your data</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8 overflow-y-auto pr-2 max-h-[calc(85vh-10rem)]">
          {/* Format Selection */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-green-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <Label className="text-lg font-bold bg-gradient-to-r from-gray-800 to-emerald-700 dark:from-gray-200 dark:to-emerald-300 bg-clip-text text-transparent mb-4 block">Export Format</Label>
              <div className="grid grid-cols-2 gap-4 mt-4">
              {exportFormats.map((fmt) => (
                <Card
                  key={fmt.id}
                  className={`cursor-pointer transition-all duration-300 group/card ${
                    format === fmt.id 
                      ? 'ring-2 ring-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-700 dark:to-slate-600 shadow-xl transform scale-105' 
                      : 'bg-gradient-to-br from-white via-gray-50 to-white dark:from-slate-800 dark:to-slate-700 hover:shadow-xl hover:-translate-y-1 border-gray-200/60 dark:border-slate-600/60 hover:border-emerald-200 dark:hover:border-slate-500'
                  }`}
                  onClick={() => setFormat(fmt.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl transition-all duration-200 ${
                        format === fmt.id 
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg' 
                          : 'bg-gray-100 dark:bg-slate-600 group-hover/card:bg-emerald-100 dark:group-hover/card:bg-slate-500'
                      }`}>
                        <fmt.icon className={`h-5 w-5 ${format === fmt.id ? 'text-white' : 'text-gray-600 dark:text-gray-400 group-hover/card:text-emerald-600 dark:group-hover/card:text-emerald-400'}`} />
                      </div>
                      <div>
                        <CardTitle className={`text-sm font-bold ${format === fmt.id ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-gray-100 group-hover/card:text-emerald-700 dark:group-hover/card:text-emerald-300'}`}>{fmt.name}</CardTitle>
                        <CardDescription className={`text-xs mt-1 ${format === fmt.id ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-gray-400'}`}>
                          {fmt.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
              </div>
            </div>
          </div>

          {/* Filename */}
          <div>
            <Label htmlFor="filename" className="text-base font-semibold text-gray-700 dark:text-gray-300">Filename</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Enter filename"
                className="flex-1 border-gray-200/60 dark:border-slate-600/60 focus:border-blue-500 focus:ring-blue-500/20"
              />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-md">
                {exportFormats.find(f => f.id === format)?.extension}
              </span>
            </div>
          </div>

          {/* Data Sources */}
          <div>
            <Label className="text-base font-semibold text-gray-700 dark:text-gray-300">Data Sources</Label>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {Array.from(new Set(results.map(r => r.source))).map(source => {
                const count = results.filter(r => r.source === source).length;
                const isSelected = selectedSources.includes(source);
                return (
                  <div key={source} className={`flex items-center space-x-3 p-3 rounded-xl border transition-all duration-200 ${
                    isSelected 
                      ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600' 
                      : 'border-gray-200/60 dark:border-slate-600/60 hover:border-blue-200 hover:bg-blue-50/30 dark:hover:bg-slate-700/50'
                  }`}>
                    <Checkbox
                      id={`source-${source}`}
                      checked={selectedSources.includes(source)}
                      onCheckedChange={(checked) => 
                        handleSourceToggle(source, checked as boolean)
                      }
                    />
                    <Label htmlFor={`source-${source}`} className={`flex-1 font-medium cursor-pointer ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                      {formatSourceName(source)}
                    </Label>
                    <Badge variant="secondary" className={`text-xs ${isSelected ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
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
              <Label className="text-base font-semibold text-gray-700 dark:text-gray-300">Fields to Export</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllFields}
                className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors"
              >
                {selectedFields.length === availableFields.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 max-h-48 overflow-y-auto p-3 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-gray-200/60 dark:border-slate-600/60">
              {availableFields.map(field => {
                const isSelected = selectedFields.includes(field);
                return (
                  <div key={field} className={`group/field flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                    isSelected ? 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:bg-slate-600 shadow-md' : 'hover:bg-white/80 dark:hover:bg-slate-700/50 hover:shadow-sm'
                  }`}>
                    <Checkbox
                      id={`field-${field}`}
                      checked={selectedFields.includes(field)}
                      onCheckedChange={(checked) => 
                        handleFieldToggle(field, checked as boolean)
                      }
                    />
                    <Label htmlFor={`field-${field}`} className={`text-sm font-semibold cursor-pointer transition-colors ${
                      isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300 group-hover/field:text-blue-700 dark:group-hover/field:text-blue-300'
                    }`}>
                      {formatFieldName(field)}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <Card className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-emerald-200/60 dark:border-slate-600/60 shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Results to export:</span>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{filteredResultsCount} of {results.length}</Badge>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Fields:</span>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">{selectedFields.length} selected</Badge>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Format:</span>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">{exportFormats.find(f => f.id === format)?.name}</Badge>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Actions - Sticky footer */}
        <div className="sticky bottom-0 bg-white/95 dark:bg-slate-800/95 pt-4 mt-4 border-t border-gray-200/60 dark:border-slate-700/60">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} className="border-gray-200/60 hover:bg-gray-50 transition-colors">
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting || selectedFields.length === 0 || selectedSources.length === 0}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isExporting ? (
                <>
                  <div className="relative mr-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Download className="h-2 w-2 text-white" />
                    </div>
                  </div>
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