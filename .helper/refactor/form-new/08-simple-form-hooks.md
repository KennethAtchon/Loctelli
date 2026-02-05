# Simple Form Hooks — State Management

> **Purpose**: Implementation guide for simple form hooks (single-page form).  
> **Status**: Specification (implementation guide)  
> **Dependencies**: `01-design-principles.md`, `04-type-layer.md`, `05-domain-layer.md`, `06-service-layer.md`

---

## Overview

Simple forms are single-page forms without navigation or session management. They share validation logic with card forms but have a simpler state structure.

**Key Differences from Card Form**:
- No navigation (all fields visible at once)
- No session management
- No profile calculation (optional, can be added)
- Simpler state (no reducer needed)

---

## Hook: `useSimpleFormState.ts`

**Purpose**: Manages simple form state (data, validation, submission).

**Location**: `frontend/components/public/forms/simple-form/useSimpleFormState.ts`

**State**: `formData`, `uploadedFiles`, `uploadingFiles`, `isSubmitting`, `formError`

**Effects**: None (or one for analytics if needed)

**Dependencies**: Domain (`getInitialFormData`, `validateForm`), Service (`formsApi`)

---

### Implementation

```ts
import { useState, useCallback } from 'react';
import type { FormField, FormTemplate } from '@/lib/forms/types';
import { getInitialFormData, validateForm } from '@/lib/forms/form-validation';
import { formsApi } from '@/lib/api/endpoints/forms';

export function useSimpleFormState(
  schema: FormField[],
  slug: string,
  options: {
    initialData?: Record<string, unknown>;
    onSubmitSuccess?: (result: unknown) => void;
    onSubmitError?: (error: Error) => void;
  } = {}
): {
  formData: Record<string, unknown>;
  uploadedFiles: Record<string, File[]>;
  uploadingFiles: Record<string, boolean>;
  isSubmitting: boolean;
  formError: string | null;
  handleInputChange: (fieldId: string, value: unknown) => void;
  handleCheckboxChange: (fieldId: string, value: string, checked: boolean) => void;
  handleFileUpload: (fieldId: string, file: File) => Promise<void>;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
} {
  // Initialize form data
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial = getInitialFormData(schema);
    if (options.initialData) {
      return { ...initial, ...options.initialData };
    }
    return initial;
  });
  
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const handleInputChange = useCallback((fieldId: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    // Clear error when user starts typing
    setFormError(null);
  }, []);
  
  const handleCheckboxChange = useCallback((
    fieldId: string,
    value: string,
    checked: boolean
  ) => {
    setFormData(prev => {
      const current = (prev[fieldId] as string[]) || [];
      if (checked) {
        return { ...prev, [fieldId]: [...current, value] };
      } else {
        return { ...prev, [fieldId]: current.filter(v => v !== value) };
      }
    });
    setFormError(null);
  }, []);
  
  const handleFileUpload = useCallback(async (
    fieldId: string,
    file: File
  ) => {
    setUploadingFiles(prev => ({ ...prev, [fieldId]: true }));
    setFormError(null);
    
    try {
      const result = await formsApi.uploadFormFile(slug, fieldId, file);
      setUploadedFiles(prev => ({
        ...prev,
        [fieldId]: [...(prev[fieldId] || []), file]
      }));
      setFormData(prev => ({
        ...prev,
        [fieldId]: [...((prev[fieldId] as File[]) || []), file]
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'File upload failed';
      setFormError(errorMessage);
      throw error;
    } finally {
      setUploadingFiles(prev => ({ ...prev, [fieldId]: false }));
    }
  }, [slug]);
  
  const handleSubmit = useCallback(async () => {
    // Validate form
    if (!validateForm(schema, formData)) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      const result = await formsApi.submitForm(slug, formData);
      
      if (options.onSubmitSuccess) {
        options.onSubmitSuccess(result);
      }
      
      // Reset form on success (optional)
      // resetForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Submission failed';
      setFormError(errorMessage);
      
      if (options.onSubmitError) {
        options.onSubmitError(error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [schema, formData, slug, options]);
  
  const resetForm = useCallback(() => {
    setFormData(getInitialFormData(schema));
    setUploadedFiles({});
    setFormError(null);
  }, [schema]);
  
  return {
    formData,
    uploadedFiles,
    uploadingFiles,
    isSubmitting,
    formError,
    handleInputChange,
    handleCheckboxChange,
    handleFileUpload,
    handleSubmit,
    resetForm
  };
}
```

**Key Points**:
- Simple state management (no reducer needed)
- Shared validation with card form
- No navigation or session logic
- Error handling for validation and submission

---

## Component: `SimpleFormView.tsx`

**Purpose**: Presentational component for simple forms.

**Location**: `frontend/components/public/forms/simple-form/SimpleFormView.tsx`

**Dependencies**: Hook (`useSimpleFormState`), Shared UI (`FieldRenderer`)

---

### Implementation

```ts
import React from 'react';
import type { FormTemplate } from '@/lib/forms/types';
import { useSimpleFormState } from './useSimpleFormState';
import { FieldRenderer } from '../shared/FieldRenderer';

interface SimpleFormViewProps {
  template: FormTemplate;
  slug: string;
  onSubmitSuccess?: (result: unknown) => void;
  onSubmitError?: (error: Error) => void;
}

export function SimpleFormView({
  template,
  slug,
  onSubmitSuccess,
  onSubmitError
}: SimpleFormViewProps) {
  const schema = (template.schema ?? []) as FormField[];
  
  const {
    formData,
    uploadedFiles,
    uploadingFiles,
    isSubmitting,
    formError,
    handleInputChange,
    handleCheckboxChange,
    handleFileUpload,
    handleSubmit
  } = useSimpleFormState(schema, slug, {
    onSubmitSuccess,
    onSubmitError
  });
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="simple-form">
      {formError && (
        <div className="form-error" role="alert">
          {formError}
        </div>
      )}
      
      <div className="form-fields">
        {schema.map(field => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={formData[field.id]}
            onChange={(value) => handleInputChange(field.id, value)}
            mode="simple"
            formData={formData}
            fields={schema}
            uploading={uploadingFiles[field.id]}
            uploadedFile={uploadedFiles[field.id]?.[0]}
            onFileUpload={(file) => handleFileUpload(field.id, file)}
            disabled={isSubmitting}
          />
        ))}
      </div>
      
      <div className="form-actions">
        <button
          type="submit"
          disabled={isSubmitting}
          className="submit-button"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </form>
  );
}
```

**Key Points**:
- Presentational only
- Uses shared `FieldRenderer` with `mode="simple"`
- Handles form submission
- Shows errors and loading states

---

## Page Integration

**Location**: `frontend/app/(main)/forms/[slug]/page.tsx`

**Usage**:

```ts
import { SimpleFormView } from '@/components/public/forms/simple-form/SimpleFormView';
import { formsApi } from '@/lib/api/endpoints/forms';

export default async function FormPage({ params }: { params: { slug: string } }) {
  const template = await formsApi.getFormTemplate(params.slug);
  
  if (template.formType === 'card') {
    // Redirect to card form or render card form
    redirect(`/forms/card/${params.slug}`);
  }
  
  return (
    <SimpleFormView
      template={template}
      slug={params.slug}
      onSubmitSuccess={(result) => {
        // Handle success (e.g., redirect, show message)
      }}
      onSubmitError={(error) => {
        // Handle error (already shown in form)
      }}
    />
  );
}
```

---

## Optional: Profile Estimation for Simple Forms

If simple forms need profile estimation, add it to the hook:

```ts
// In useSimpleFormState.ts
import { useCardFormProfile } from '../card-form/useCardFormProfile';

// Add to hook return
const { profileResult, computeProfile } = useCardFormProfile(template, schema);

// In handleSubmit, before submitForm:
if (template.profileEstimation?.enabled) {
  await computeProfile(formData, slug);
}
```

---

## Validation Display

For better UX, show field-level validation errors:

```ts
// In useSimpleFormState.ts
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

const validateField = useCallback((fieldId: string) => {
  const field = schema.find(f => f.id === fieldId);
  if (!field) return true;
  
  const value = formData[fieldId];
  const isValid = validateField(field, value);
  
  if (!isValid && field.required) {
    setFieldErrors(prev => ({ ...prev, [fieldId]: `${field.label} is required` }));
    return false;
  } else {
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    return true;
  }
}, [schema, formData]);

// Return fieldErrors in hook
```

Then in `SimpleFormView`:

```ts
<FieldRenderer
  // ... other props
  error={fieldErrors[field.id]}
/>
```

---

## Implementation Checklist

- [ ] Create `useSimpleFormState.ts` with form data and handlers
- [ ] Create `SimpleFormView.tsx` presentational component
- [ ] Use shared `FieldRenderer` with `mode="simple"`
- [ ] Update page to use `SimpleFormView` for simple forms
- [ ] Add field-level validation (optional)
- [ ] Add profile estimation support (optional)
- [ ] Test form submission flow
- [ ] Test validation
- [ ] Test file uploads

---

## Summary

**Simple Form Characteristics**:
- ✅ Single-page form (all fields visible)
- ✅ No navigation
- ✅ No session management
- ✅ Shared validation with card form
- ✅ Simple state (no reducer)
- ✅ Uses shared `FieldRenderer`

**Files**:
1. `useSimpleFormState.ts` - Form state and handlers
2. `SimpleFormView.tsx` - Presentational component

**Differences from Card Form**:
- Simpler state structure
- No navigation logic
- No session persistence
- No profile calculation (by default)

---

## Next Steps

1. Implement `useSimpleFormState.ts`
2. Implement `SimpleFormView.tsx`
3. Update page to use simple form
4. Test form functionality
5. Proceed to `09-shared-ui.md` for shared components
