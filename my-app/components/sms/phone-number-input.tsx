'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { PhoneValidationResult } from '@/types/sms';
import { cn } from '@/lib/utils';

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, result?: PhoneValidationResult) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  label?: string;
  autoValidate?: boolean;
}

export function PhoneNumberInput({
  value,
  onChange,
  onValidationChange,
  placeholder = "+1 (555) 123-4567",
  disabled = false,
  required = false,
  className,
  label = "Phone Number",
  autoValidate = true,
}: PhoneNumberInputProps) {
  const [validationResult, setValidationResult] = useState<PhoneValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Validate phone number with debouncing
  const validatePhoneNumber = async (phoneNumber: string) => {
    if (!phoneNumber.trim() || !autoValidate) {
      setValidationResult(null);
      onValidationChange?.(false);
      return;
    }

    setIsValidating(true);
    try {
      const response = await api.sms.validatePhone(phoneNumber);
      const result = response.data;
      setValidationResult(result);
      onValidationChange?.(result.isValid, result);
    } catch (error) {
      const errorResult: PhoneValidationResult = {
        isValid: false,
        error: 'Failed to validate phone number',
      };
      setValidationResult(errorResult);
      onValidationChange?.(false, errorResult);
    } finally {
      setIsValidating(false);
    }
  };

  // Handle input change with debounced validation
  const handleInputChange = (newValue: string) => {
    onChange(newValue);

    // Clear existing timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    // Set new timeout for validation
    if (autoValidate && newValue.trim()) {
      const timeout = setTimeout(() => {
        validatePhoneNumber(newValue);
      }, 500); // 500ms debounce
      setValidationTimeout(timeout);
    } else {
      setValidationResult(null);
      onValidationChange?.(false);
    }
  };

  // Manual validation trigger
  const handleValidateClick = () => {
    if (value.trim()) {
      validatePhoneNumber(value);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  // Format phone number as user types (basic formatting)
  const formatPhoneNumber = (input: string) => {
    // Remove all non-digit characters except +
    const cleaned = input.replace(/[^\d+]/g, '');
    
    // Don't format if it starts with + (international)
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    // Basic US formatting for 10-digit numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return input;
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    
    if (validationResult?.isValid) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    
    if (validationResult && !validationResult.isValid) {
      return <X className="h-4 w-4 text-red-500" />;
    }
    
    return null;
  };

  const getValidationMessage = () => {
    if (!validationResult) return null;
    
    if (validationResult.isValid) {
      return (
        <p className="text-sm text-green-600">
          Valid phone number
          {validationResult.country && ` (${validationResult.country})`}
          {validationResult.formattedNumber && 
            ` - ${validationResult.formattedNumber}`
          }
        </p>
      );
    }
    
    return (
      <p className="text-sm text-red-600">
        {validationResult.error || 'Invalid phone number'}
      </p>
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor="phone-input">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          id="phone-input"
          type="tel"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            "pr-10",
            validationResult?.isValid && "border-green-500 focus:border-green-500",
            validationResult && !validationResult.isValid && "border-red-500 focus:border-red-500"
          )}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {getValidationIcon()}
        </div>
      </div>
      
      {getValidationMessage()}
      
      {!autoValidate && value.trim() && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleValidateClick}
          disabled={isValidating}
          className="mt-2"
        >
          {isValidating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Validating...
            </>
          ) : (
            'Validate Phone Number'
          )}
        </Button>
      )}
    </div>
  );
}