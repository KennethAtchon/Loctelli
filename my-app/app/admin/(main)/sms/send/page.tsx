'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SendSmsForm } from '@/components/sms/send-sms-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SendSmsPage() {
  const router = useRouter();

  const handleSuccess = (data: any) => {
    // Could redirect to message details or history
    console.log('SMS sent successfully:', data);
  };

  const handleError = (error: string) => {
    console.error('SMS send error:', error);
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
          <h1 className="text-3xl font-bold">Send SMS Message</h1>
          <p className="text-muted-foreground">
            Send a single SMS message to a phone number
          </p>
        </div>
      </div>

      {/* Send SMS Form */}
      <div className="max-w-2xl">
        <SendSmsForm
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>

      {/* Help Section */}
      <div className="max-w-2xl">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 SMS Best Practices</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Keep messages concise and clear</li>
            <li>• Include a clear call-to-action</li>
            <li>• Always provide opt-out instructions for marketing messages</li>
            <li>• Verify phone numbers before sending</li>
            <li>• Consider time zones when sending messages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}