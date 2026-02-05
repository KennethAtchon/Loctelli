# Shared UI — Field Rendering

> **Purpose**: Implementation guide for shared field rendering component used by both simple and card forms.  
> **Status**: Specification (implementation guide)  
> **Dependencies**: `01-design-principles.md`, `04-type-layer.md`, `05-domain-layer.md`

---

## Overview

**Decision**: One `FieldRenderer` component with `mode: 'simple' | 'card'` to avoid code drift between simple and card form field rendering.

**Benefits**:
- Single source of truth for field rendering logic
- Consistent behavior across form types
- Easier maintenance (fix bugs in one place)
- Shared features (piping, dynamic labels) work in both modes

---

## Component: `FieldRenderer.tsx`

**Purpose**: Renders form fields for both simple and card forms.

**Location**: `frontend/components/public/forms/shared/FieldRenderer.tsx`

**Props**:
- `field` - FormField to render
- `value` - Current field value
- `onChange` - Value change handler
- `mode` - 'simple' | 'card'
- `formData` - All form data (for piping/dynamic labels)
- `fields` - All fields (for piping)
- `uploading` - Upload in progress (file fields)
- `uploadedFile` - Uploaded file (file fields)
- `onFileUpload` - File upload handler
- `error` - Field-level error message
- `disabled` - Disable field

---

### Implementation

```ts
import React from 'react';
import type { FormField } from '@/lib/forms/types';
import { getDynamicLabel, applyPiping } from '@/lib/forms/conditional-logic';

interface FieldRendererProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  mode: 'simple' | 'card';
  formData?: Record<string, unknown>;
  fields?: FormField[];
  uploading?: boolean;
  uploadedFile?: File;
  onFileUpload?: (file: File) => void;
  error?: string;
  disabled?: boolean;
}

export function FieldRenderer({
  field,
  value,
  onChange,
  mode,
  formData = {},
  fields = [],
  uploading = false,
  uploadedFile,
  onFileUpload,
  error,
  disabled = false
}: FieldRendererProps) {
  // Get dynamic label if conditions are met
  const label = mode === 'card' && formData && fields.length > 0
    ? getDynamicLabel(field, formData)
    : field.label;
  
  // Apply piping to label and placeholder
  const processedLabel = mode === 'card' && formData && fields.length > 0
    ? applyPiping(label, formData, fields)
    : label;
  
  const processedPlaceholder = mode === 'card' && field.placeholder && formData && fields.length > 0
    ? applyPiping(field.placeholder, formData, fields)
    : field.placeholder;
  
  // Render media (card mode only)
  const renderMedia = () => {
    if (mode !== 'card' || !field.media) return null;
    
    const { media } = field;
    
    if (media.type === 'image' && media.url) {
      return (
        <div className={`form-field-media form-field-media-${media.position}`}>
          <img src={media.url} alt={media.altText || field.label} />
        </div>
      );
    }
    
    if (media.type === 'video' && media.videoId) {
      if (media.videoType === 'youtube') {
        return (
          <div className={`form-field-media form-field-media-${media.position}`}>
            <iframe
              src={`https://www.youtube.com/embed/${media.videoId}`}
              title={media.altText || field.label}
              allowFullScreen
            />
          </div>
        );
      }
      // Add other video types as needed
    }
    
    return null;
  };
  
  // Render field input based on type
  const renderInput = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            id={field.id}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={processedPlaceholder}
            required={field.required}
            disabled={disabled}
            className={error ? 'error' : ''}
            aria-invalid={!!error}
            aria-describedby={error ? `${field.id}-error` : undefined}
          />
        );
        
      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={processedPlaceholder}
            required={field.required}
            disabled={disabled}
            className={error ? 'error' : ''}
            aria-invalid={!!error}
            aria-describedby={error ? `${field.id}-error` : undefined}
          />
        );
        
      case 'select':
        return (
          <select
            id={field.id}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            disabled={disabled}
            className={error ? 'error' : ''}
            aria-invalid={!!error}
            aria-describedby={error ? `${field.id}-error` : undefined}
          >
            <option value="">{processedPlaceholder || 'Select...'}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
        
      case 'radio':
        return (
          <div className="radio-group">
            {field.options?.map(option => (
              <label key={option} className="radio-option">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={() => onChange(option)}
                  required={field.required}
                  disabled={disabled}
                  aria-invalid={!!error}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
        
      case 'checkbox':
        if (field.options && field.options.length > 0) {
          // Multiple checkboxes
          const checkedValues = (value as string[]) || [];
          return (
            <div className="checkbox-group">
              {field.options.map(option => (
                <label key={option} className="checkbox-option">
                  <input
                    type="checkbox"
                    value={option}
                    checked={checkedValues.includes(option)}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...checkedValues, option]
                        : checkedValues.filter(v => v !== option);
                      onChange(newValues);
                    }}
                    disabled={disabled}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          );
        } else {
          // Single checkbox
          return (
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
              />
              <span>{field.label}</span>
            </label>
          );
        }
        
      case 'file':
      case 'image':
        return (
          <div className="file-upload">
            <input
              type="file"
              id={field.id}
              accept={field.type === 'image' ? 'image/*' : undefined}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onFileUpload) {
                  onFileUpload(file);
                }
              }}
              disabled={disabled || uploading}
              className={error ? 'error' : ''}
              aria-invalid={!!error}
              aria-describedby={error ? `${field.id}-error` : undefined}
            />
            {uploading && <div className="upload-progress">Uploading...</div>}
            {uploadedFile && (
              <div className="uploaded-file">
                {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>
        );
        
      case 'statement':
        return (
          <div className="statement-field">
            <p>{processedLabel}</p>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Render based on mode
  if (mode === 'card') {
    return (
      <div className={`form-field form-field-${field.type} form-field-card`}>
        {/* Media above */}
        {field.media?.position === 'above' && renderMedia()}
        
        {/* Media left */}
        {field.media?.position === 'left' && (
          <div className="form-field-with-media-left">
            {renderMedia()}
            <div className="form-field-content">
              <label htmlFor={field.id} className="form-field-label">
                {processedLabel}
                {field.required && <span className="required">*</span>}
              </label>
              {renderInput()}
              {error && (
                <div id={`${field.id}-error`} className="field-error" role="alert">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Default layout (no left media) */}
        {field.media?.position !== 'left' && (
          <>
            <label htmlFor={field.id} className="form-field-label">
              {processedLabel}
              {field.required && <span className="required">*</span>}
            </label>
            {renderInput()}
            {error && (
              <div id={`${field.id}-error`} className="field-error" role="alert">
                {error}
              </div>
            )}
          </>
        )}
        
        {/* Media below */}
        {field.media?.position === 'below' && renderMedia()}
        
        {/* Media background */}
        {field.media?.position === 'background' && (
          <div className="form-field-background-media">
            {renderMedia()}
          </div>
        )}
      </div>
    );
  } else {
    // Simple mode
    return (
      <div className={`form-field form-field-${field.type} form-field-simple`}>
        <label htmlFor={field.id} className="form-field-label">
          {processedLabel}
          {field.required && <span className="required">*</span>}
        </label>
        {renderInput()}
        {error && (
          <div id={`${field.id}-error`} className="field-error" role="alert">
            {error}
          </div>
        )}
      </div>
    );
  }
}
```

---

## Card Form Integration

**In `CardFormView.tsx`**:

```ts
import { FieldRenderer } from '../shared/FieldRenderer';

// In render:
<FieldRenderer
  field={currentField}
  value={formData[currentField.id]}
  onChange={(value) => handleInputChange(currentField.id, value)}
  mode="card"
  formData={formData}
  fields={schema}
  uploading={uploadingFiles[currentField.id]}
  uploadedFile={uploadedFiles[currentField.id]?.[0]}
  onFileUpload={(file) => handleFileUpload(currentField.id, file)}
  disabled={isSubmitting}
/>
```

---

## Simple Form Integration

**In `SimpleFormView.tsx`**:

```ts
import { FieldRenderer } from '../shared/FieldRenderer';

// In render:
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
    error={fieldErrors[field.id]}
  />
))}
```

---

## Migration Steps

### Step 1: Create FieldRenderer

1. Create `components/public/forms/shared/FieldRenderer.tsx`
2. Implement both modes (simple and card)
3. Support all field types
4. Add piping and dynamic label support

---

### Step 2: Update Card Form

1. Replace `CardFieldRenderer` usage with `FieldRenderer` (mode="card")
2. Test card form rendering
3. Verify media, piping, and dynamic labels work

---

### Step 3: Update Simple Form

1. Replace inline field rendering with `FieldRenderer` (mode="simple")
2. Test simple form rendering
3. Verify validation errors display

---

### Step 4: Remove Legacy Components

1. Remove `CardFieldRenderer` (if exists)
2. Remove inline simple field renderer
3. Verify no regressions

---

## Styling Considerations

**CSS Classes**:
- `.form-field` - Base field container
- `.form-field-simple` - Simple mode
- `.form-field-card` - Card mode
- `.form-field-{type}` - Field type (e.g., `.form-field-text`)
- `.form-field-media` - Media container
- `.form-field-media-{position}` - Media position (above, below, etc.)
- `.form-field-label` - Label
- `.field-error` - Error message
- `.required` - Required indicator

**Example CSS**:

```css
.form-field-card {
  /* Card-specific styles */
}

.form-field-simple {
  /* Simple-specific styles */
}

.form-field-media-above {
  margin-bottom: 1rem;
}

.form-field-media-below {
  margin-top: 1rem;
}

.field-error {
  color: red;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
```

---

## Accessibility

**ARIA Attributes**:
- `aria-invalid` - Set when field has error
- `aria-describedby` - Points to error message ID
- `role="alert"` - On error message div

**Keyboard Navigation**:
- All inputs should be keyboard accessible
- File inputs should have clear labels
- Radio/checkbox groups should be navigable

---

## Implementation Checklist

- [ ] Create `FieldRenderer.tsx` with both modes
- [ ] Support all field types (text, email, phone, textarea, select, radio, checkbox, file, image, statement)
- [ ] Add piping support (card mode)
- [ ] Add dynamic label support (card mode)
- [ ] Add media rendering (card mode)
- [ ] Add error display
- [ ] Add accessibility attributes
- [ ] Update card form to use `FieldRenderer`
- [ ] Update simple form to use `FieldRenderer`
- [ ] Remove legacy field renderers
- [ ] Test both modes
- [ ] Add styling

---

## Summary

**FieldRenderer Features**:
- ✅ Single component for both form types
- ✅ Mode: 'simple' | 'card'
- ✅ Supports all field types
- ✅ Piping and dynamic labels (card mode)
- ✅ Media rendering (card mode)
- ✅ Error display
- ✅ Accessibility support

**Benefits**:
- No code drift between form types
- Consistent behavior
- Easier maintenance
- Shared features work in both modes

---

## Next Steps

1. Implement `FieldRenderer.tsx`
2. Update card form to use it
3. Update simple form to use it
4. Remove legacy components
5. Test both modes
6. Proceed to `10-file-structure.md` for file organization
