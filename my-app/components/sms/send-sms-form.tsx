'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Send, Loader2, CheckCircle } from 'lucide-react';
import { PhoneNumberInput } from './phone-number-input';
import { MessageComposer } from './message-composer';
import { api } from '@/lib/api';
import { SendSmsDto, PhoneValidationResult } from '@/types/sms';

const sendSmsSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
  message: z.string()
    .min(1, 'Message is required')
    .max(1600, 'Message must be less than 1600 characters'),
});

type SendSmsFormData = z.infer<typeof sendSmsSchema>;

interface SendSmsFormProps {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  className?: string;
  defaultPhoneNumber?: string;
  defaultMessage?: string;
}

export function SendSmsForm({
  onSuccess,
  onError,
  className,
  defaultPhoneNumber = '',
  defaultMessage = '',
}: SendSmsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [phoneValidation, setPhoneValidation] = useState<PhoneValidationResult | null>(null);
  const [lastSentMessage, setLastSentMessage] = useState<any>(null);

  const form = useForm<SendSmsFormData>({
    resolver: zodResolver(sendSmsSchema),
    defaultValues: {
      phoneNumber: defaultPhoneNumber,
      message: defaultMessage,
    },
  });

  const handlePhoneValidation = (isValid: boolean, result?: PhoneValidationResult) => {
    setIsPhoneValid(isValid);
    setPhoneValidation(result || null);
  };

  const onSubmit = async (data: SendSmsFormData) => {
    if (!isPhoneValid) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      const smsData: SendSmsDto = {
        phoneNumber: phoneValidation?.formattedNumber || data.phoneNumber,
        message: data.message,
      };

      const response = await api.sms.sendSms(smsData);
      
      if (response.success) {
        setLastSentMessage(response.data);
        toast.success('SMS sent successfully!');
        
        // Reset form
        form.reset({
          phoneNumber: '',
          message: '',
        });
        
        onSuccess?.(response.data);
      } else {
        throw new Error(response.message || 'Failed to send SMS');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send SMS';
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAnother = () => {
    setLastSentMessage(null);
    form.reset({
      phoneNumber: '',
      message: '',
    });
  };

  // Success state
  if (lastSentMessage) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            SMS Sent Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">To:</span> {lastSentMessage.phoneNumber || 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Status:</span> {lastSentMessage.status || 'Sent'}
              </div>
              {lastSentMessage.twilioSid && (
                <div>
                  <span className="font-medium">Message ID:</span> {lastSentMessage.twilioSid}
                </div>
              )}
              <div>
                <span className="font-medium">Sent at:</span> {new Date().toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSendAnother} className="flex-1">
              Send Another SMS
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/admin/sms/history'}>
              View History
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
          <Send className="h-5 w-5" />
          Send SMS Message
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Phone Number Field */}
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PhoneNumberInput
                      value={field.value}
                      onChange={field.onChange}
                      onValidationChange={handlePhoneValidation}
                      placeholder="+1 (555) 123-4567"
                      required
                      label="Recipient Phone Number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      placeholder="Type your message here..."
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

            {/* Phone validation info */}
            {phoneValidation && isPhoneValid && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <div className="font-medium">Phone Number Details:</div>
                  <div>Formatted: {phoneValidation.formattedNumber}</div>
                  {phoneValidation.country && (
                    <div>Country: {phoneValidation.country}</div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !isPhoneValid || !form.watch('message')}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending SMS...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send SMS Message
                </>
              )}
            </Button>

            {/* Form validation summary */}
            {(!isPhoneValid || !form.watch('message')) && (
              <div className="text-sm text-muted-foreground">
                {!isPhoneValid && !form.watch('message') && 
                  'Please enter a valid phone number and message to send SMS'
                }
                {!isPhoneValid && form.watch('message') && 
                  'Please enter a valid phone number'
                }
                {isPhoneValid && !form.watch('message') && 
                  'Please enter a message'
                }
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}