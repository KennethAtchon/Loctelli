'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import { BulkSmsUpload } from '@/components/sms/bulk-sms-upload';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BulkSmsResult } from '@/types/sms';

export default function BulkSmsPage() {
  const router = useRouter();

  const handleSuccess = (data: BulkSmsResult) => {
    // Could redirect to campaign details
    console.log('Bulk SMS campaign created:', data);
  };

  const handleError = (error: string) => {
    console.error('Bulk SMS error:', error);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/sms">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold">Bulk SMS Upload</h1>
          <p className="text-muted-foreground">
            Upload a CSV file to send SMS messages to multiple recipients
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Upload Form */}
        <div className="lg:col-span-2">
          <BulkSmsUpload
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>

        {/* Sidebar with Instructions */}
        <div className="space-y-4">
          {/* CSV Format Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                CSV Format Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="font-medium mb-1">Required Column:</div>
                <div className="text-muted-foreground">
                  Your CSV must contain a phone number column with one of these names:
                </div>
                <ul className="list-disc list-inside text-muted-foreground mt-1">
                  <li>phoneNumber</li>
                  <li>phone</li>
                  <li>number</li>
                  <li>mobile</li>
                  <li>cell</li>
                </ul>
              </div>

              <div>
                <div className="font-medium mb-1">Phone Number Format:</div>
                <div className="text-muted-foreground">
                  Accepted formats:
                </div>
                <ul className="list-disc list-inside text-muted-foreground mt-1">
                  <li>+1 555 123 4567</li>
                  <li>(555) 123-4567</li>
                  <li>555-123-4567</li>
                  <li>5551234567</li>
                </ul>
              </div>

              <div>
                <div className="font-medium mb-1">File Requirements:</div>
                <ul className="list-disc list-inside text-muted-foreground">
                  <li>CSV format only</li>
                  <li>Maximum 10,000 rows</li>
                  <li>File size limit: 5MB</li>
                  <li>UTF-8 encoding recommended</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Sample CSV Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sample CSV Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded p-3 text-xs font-mono">
                <div className="border-b pb-1 mb-1 font-semibold">
                  phoneNumber,name,company
                </div>
                <div>+1 555 123 4567,John Doe,Acme Corp</div>
                <div>(555) 987-6543,Jane Smith,Tech Inc</div>
                <div>555-111-2222,Bob Johnson,StartupXYZ</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Additional columns are allowed but will be ignored
              </p>
            </CardContent>
          </Card>

          {/* Processing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Processing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Duplicate Detection:</span>
                <span className="text-green-600">✓ Automatic</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Phone Validation:</span>
                <span className="text-green-600">✓ Real-time</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rate Limiting:</span>
                <span className="text-green-600">✓ Built-in</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Error Handling:</span>
                <span className="text-green-600">✓ Automatic Retry</span>
              </div>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">📋 Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>• Test with a small batch first</div>
              <div>• Include opt-out instructions</div>
              <div>• Respect time zones</div>
              <div>• Keep messages under 160 characters</div>
              <div>• Verify phone numbers are opted-in</div>
              <div>• Monitor delivery rates</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}