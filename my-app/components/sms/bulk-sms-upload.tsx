'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Download,
  Loader2,
  Send
} from 'lucide-react';
import { MessageComposer } from './message-composer';
import { api } from '@/lib/api';
import { CsvProcessingResult, BulkSmsResult } from '@/types/sms';
import { cn } from '@/lib/utils';

const bulkSmsSchema = z.object({
  message: z.string()
    .min(1, 'Message is required')
    .max(1600, 'Message must be less than 1600 characters'),
});

type BulkSmsFormData = z.infer<typeof bulkSmsSchema>;

interface BulkSmsUploadProps {
  onSuccess?: (data: BulkSmsResult) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface FileUploadState {
  file: File | null;
  isDragOver: boolean;
  isValidating: boolean;
  validationResult: CsvProcessingResult | null;
  validationError: string | null;
}

export function BulkSmsUpload({
  onSuccess,
  onError,
  className,
}: BulkSmsUploadProps) {
  const [fileState, setFileState] = useState<FileUploadState>({
    file: null,
    isDragOver: false,
    isValidating: false,
    validationResult: null,
    validationError: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<BulkSmsResult | null>(null);

  const form = useForm<BulkSmsFormData>({
    resolver: zodResolver(bulkSmsSchema),
    defaultValues: {
      message: '',
    },
  });

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setFileState(prev => ({ ...prev, isDragOver: false }));

    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => 
      file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')
    );

    if (csvFile) {
      handleFileSelect(csvFile);
    } else {
      toast.error('Please upload a CSV file');
    }
  }, []);

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setFileState(prev => ({
      ...prev,
      file,
      isValidating: true,
      validationResult: null,
      validationError: null,
    }));

    try {
      // Validate CSV structure first
      const structureResponse = await api.sms.validateCsv(file);
      
      if (!structureResponse.data.isValid) {
        throw new Error(structureResponse.data.error || 'Invalid CSV format');
      }

      if (!structureResponse.data.hasPhoneColumn) {
        throw new Error('CSV must contain a phone number column (phoneNumber, phone, number, mobile, etc.)');
      }

      // Process CSV to get phone numbers
      const processingResponse = await api.sms.processCsv(file);
      
      setFileState(prev => ({
        ...prev,
        isValidating: false,
        validationResult: processingResponse.data,
      }));

      if (processingResponse.data.validNumbers.length === 0) {
        toast.error('No valid phone numbers found in CSV');
      } else {
        toast.success(`Found ${processingResponse.data.validNumbers.length} valid phone numbers`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate CSV';
      setFileState(prev => ({
        ...prev,
        isValidating: false,
        validationError: errorMessage,
      }));
      toast.error(errorMessage);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setFileState({
      file: null,
      isDragOver: false,
      isValidating: false,
      validationResult: null,
      validationError: null,
    });
  };

  // Download CSV template
  const handleDownloadTemplate = async () => {
    try {
      const blob = await api.sms.getCsvTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sms-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template downloaded successfully');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  // Submit bulk SMS
  const onSubmit = async (data: BulkSmsFormData) => {
    if (!fileState.file || !fileState.validationResult) {
      toast.error('Please upload and validate a CSV file first');
      return;
    }

    if (fileState.validationResult.validNumbers.length === 0) {
      toast.error('No valid phone numbers found in the CSV file');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await api.sms.sendBulkSms(fileState.file, data.message);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        setResult(response.data);
        toast.success('Bulk SMS campaign created successfully!');
        onSuccess?.(response.data);
      } else {
        throw new Error(response.message || 'Failed to create bulk SMS campaign');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send bulk SMS';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Reset form
  const handleReset = () => {
    setResult(null);
    setFileState({
      file: null,
      isDragOver: false,
      isValidating: false,
      validationResult: null,
      validationError: null,
    });
    form.reset();
  };

  // Success state
  if (result) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Bulk SMS Campaign Created!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Campaign ID:</span> {result.campaignId}
              </div>
              <div>
                <span className="font-medium">Total Recipients:</span> {result.totalRecipients}
              </div>
              <div>
                <span className="font-medium">Invalid Numbers:</span> {result.invalidNumbers}
              </div>
              <div>
                <span className="font-medium">Duplicates Removed:</span> {result.duplicates}
              </div>
            </div>
            
            {result.errors.length > 0 && (
              <div className="mt-3">
                <span className="font-medium text-orange-600">Warnings:</span>
                <ul className="list-disc list-inside text-sm text-orange-600 mt-1">
                  {result.errors.slice(0, 3).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {result.errors.length > 3 && (
                    <li>... and {result.errors.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleReset} className="flex-1">
              Send Another Campaign
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = `/admin/sms/campaigns/${result.campaignId}`}
            >
              View Campaign
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk SMS Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* File Upload Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>CSV File Upload</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  fileState.isDragOver && "border-primary bg-primary/5",
                  fileState.file && "border-green-500 bg-green-50",
                  fileState.validationError && "border-red-500 bg-red-50"
                )}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setFileState(prev => ({ ...prev, isDragOver: true }));
                }}
                onDragLeave={() => {
                  setFileState(prev => ({ ...prev, isDragOver: false }));
                }}
              >
                {fileState.file ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-8 w-8 text-green-500" />
                      <div>
                        <div className="font-medium">{fileState.file.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {(fileState.file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {fileState.isValidating && (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Validating CSV...</span>
                      </div>
                    )}

                    {fileState.validationResult && (
                      <div className="space-y-2">
                        <div className="flex justify-center gap-2">
                          <Badge variant="default">
                            {fileState.validationResult.validNumbers.length} Valid
                          </Badge>
                          {fileState.validationResult.invalidNumbers.length > 0 && (
                            <Badge variant="destructive">
                              {fileState.validationResult.invalidNumbers.length} Invalid
                            </Badge>
                          )}
                          {fileState.validationResult.duplicates.length > 0 && (
                            <Badge variant="secondary">
                              {fileState.validationResult.duplicates.length} Duplicates
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {fileState.validationError && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{fileState.validationError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <div className="font-medium">Drop your CSV file here</div>
                      <div className="text-sm text-muted-foreground">
                        or click to browse files
                      </div>
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileInputChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                💡 CSV should contain a column with phone numbers (phoneNumber, phone, number, mobile, etc.)
              </div>
            </div>

            {/* Message Field */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <MessageComposer
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Type your bulk message here..."
                      required
                      label="Message Content"
                      maxLength={1600}
                      showCharacterCount
                      showSmsCount
                      showTemplates
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Progress Bar */}
            {isSubmitting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing bulk SMS...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={
                isSubmitting || 
                !fileState.file || 
                !fileState.validationResult || 
                fileState.validationResult.validNumbers.length === 0 ||
                !form.watch('message')
              }
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Bulk SMS ({fileState.validationResult?.validNumbers.length || 0} recipients)
                </>
              )}
            </Button>

            {/* Validation Summary */}
            {fileState.validationResult && (
              <div className="text-sm text-muted-foreground">
                Ready to send to {fileState.validationResult.validNumbers.length} valid phone numbers
                {fileState.validationResult.invalidNumbers.length > 0 && 
                  ` (${fileState.validationResult.invalidNumbers.length} invalid numbers will be skipped)`
                }
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}