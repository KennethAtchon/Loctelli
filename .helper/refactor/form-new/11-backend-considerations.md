# Backend Considerations

> **Purpose**: Guidelines for ensuring backend alignment with frontend refactoring.  
> **Status**: Specification (implementation guide)  
> **Dependencies**: `04-type-layer.md`, `06-service-layer.md`

---

## Overview

The backend structure remains unchanged, but we must ensure DTOs align with frontend types and API contracts remain consistent.

---

## Backend Structure (Unchanged)

```
backend-api/src/main-app/modules/forms/
├── forms.controller.ts          # API endpoints
├── forms.service.ts              # Business logic
├── services/
│   ├── form-analytics.service.ts
│   └── profile-estimation-ai.service.ts
└── dto/                          # Data transfer objects
    ├── create-form-session.dto.ts
    ├── update-form-session.dto.ts
    └── ...
```

**Prisma Schema**: Unchanged

---

## DTO Alignment

### Frontend Types → Backend DTOs

Ensure backend DTOs match frontend types:

**Frontend** (`lib/forms/types.ts`):
```ts
export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  media?: CardMedia;
  conditionalLogic?: ConditionalLogic;
  enablePiping?: boolean;
}
```

**Backend DTO** (should match):
```ts
export class FormFieldDto {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  media?: CardMediaDto;
  conditionalLogic?: ConditionalLogicDto;
  enablePiping?: boolean;
}
```

---

## API Endpoints (Verify)

### Get Form Template

**Endpoint**: `GET /api/forms/:slug`

**Response**: Should match `FormTemplate` type:

```ts
{
  id: string;
  slug: string;
  name: string;
  formType: "simple" | "card";
  schema?: FormField[];
  cardSettings?: {
    flowchartGraph?: FlowchartGraph;
  };
  profileEstimation?: ProfileEstimation;
}
```

---

### Create Form Session

**Endpoint**: `POST /api/forms/:slug/sessions`

**Request Body**:
```ts
{
  initialData?: Record<string, unknown>;
}
```

**Response**:
```ts
{
  sessionToken: string;
  currentCardIndex: number;
  partialData: Record<string, unknown>;
}
```

---

### Get Form Session

**Endpoint**: `GET /api/forms/sessions/:token`

**Response**:
```ts
{
  sessionToken: string;
  currentCardIndex: number;
  partialData: Record<string, unknown>;
}
```

**Status**: 404 if not found

---

### Update Form Session

**Endpoint**: `PATCH /api/forms/sessions/:token`

**Request Body**:
```ts
{
  currentCardIndex: number;
  partialData: Record<string, unknown>;
}
```

**Response**: 200 OK (no body)

---

### Complete Form Session

**Endpoint**: `POST /api/forms/sessions/:token/complete`

**Response**: 200 OK (no body)

---

### Submit Form

**Endpoint**: `POST /api/forms/:slug/submit`

**Request Body**:
```ts
{
  formData: Record<string, unknown>;
  sessionToken?: string;
}
```

**Response**:
```ts
{
  success: boolean;
  submissionId?: string;
  error?: string;
}
```

---

### Upload File

**Endpoint**: `POST /api/forms/:slug/upload`

**Request**: `FormData` with:
- `file` - File
- `fieldId` - Field ID
- `sessionToken` (optional) - Session token

**Response**:
```ts
{
  url: string;
  fileName: string;
  fileSize: number;
}
```

---

### Calculate Profile

**Endpoint**: `POST /api/forms/:slug/profile`

**Request Body**:
```ts
{
  formData: Record<string, unknown>;
  sessionToken?: string;
}
```

**Response**:
```ts
{
  type: string;
  result: Record<string, unknown>;
}
```

---

### Track Card Time

**Endpoint**: `POST /api/forms/analytics/card-time`

**Request Body**:
```ts
{
  sessionToken: string;
  fieldId: string;
  durationMs: number;
}
```

**Response**: 200 OK (no body)

---

## Transformation Layer (If Needed)

If backend DTOs don't match frontend types exactly, add transformation in API client:

**Example**:

```ts
// lib/api/endpoints/forms.ts
export async function getFormTemplate(slug: string): Promise<FormTemplate> {
  const response = await fetch(`/api/forms/${slug}`);
  const dto = await response.json();
  
  // Transform if needed
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    formType: dto.formType,
    schema: dto.fields?.map(transformField) ?? dto.schema,
    cardSettings: dto.cardSettings,
    profileEstimation: dto.profileEstimation
  };
}

function transformField(dto: FormFieldDto): FormField {
  return {
    id: dto.id,
    type: dto.type,
    label: dto.label,
    // ... map all fields
  };
}
```

---

## Validation

**Backend Validation**: Should match frontend validation rules:

- Required fields
- Email format
- Phone format
- Select/radio options
- File types and sizes

**Frontend Validation** (`form-validation.ts`):
- Validates before submission
- Shows errors to user
- Prevents invalid submissions

**Backend Validation**:
- Validates on submission
- Returns errors if validation fails
- Ensures data integrity

---

## Error Handling

**Backend Errors**: Should return consistent error format:

```ts
{
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}
```

**Frontend Handling**: API client should throw errors with messages:

```ts
export async function submitForm(...) {
  const response = await fetch(...);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Submission failed');
  }
  return response.json();
}
```

---

## Session Storage

**Frontend**: Uses `sessionStorage` to persist session token:

```ts
sessionStorage.setItem(`form-session-${slug}`, sessionToken);
```

**Backend**: Stores session in database (Prisma):

- Session token (unique)
- Form template slug
- Current card index
- Partial form data (JSON)
- Created/updated timestamps

---

## Analytics

**Backend**: Tracks:
- Card time (per field)
- Form completion rate
- Drop-off points
- Submission success/failure

**Frontend**: Sends:
- Card time on navigation
- Card time on unmount
- Form submission events

---

## Profile Estimation

**Backend**: Handles:
- Rule-based calculation (can be done on frontend)
- AI-based calculation (requires backend)
- Result caching (optional)

**Frontend**: 
- Calculates rule-based profile (domain layer)
- Calls API for AI-based profile (service layer)
- Falls back to rule-based if AI fails

---

## Migration Checklist

- [ ] Verify backend DTOs match frontend types
- [ ] Add transformation layer if needed (in API client)
- [ ] Verify API endpoints match expected contracts
- [ ] Test form template endpoint
- [ ] Test session endpoints
- [ ] Test submission endpoint
- [ ] Test file upload endpoint
- [ ] Test profile calculation endpoint
- [ ] Test analytics endpoint
- [ ] Verify error handling
- [ ] Verify validation alignment

---

## Testing Backend Alignment

**Manual Testing**:
1. Fetch form template - verify structure matches `FormTemplate`
2. Create session - verify response matches expected shape
3. Submit form - verify success/error handling
4. Upload file - verify file handling
5. Calculate profile - verify result structure

**Automated Testing**:
- Type check API client functions
- Test transformation functions (if any)
- Mock API responses in tests

---

## Summary

**Backend Changes**: None required (structure unchanged)

**Frontend Changes**:
- Ensure API client matches backend contracts
- Add transformation layer if DTOs don't match
- Handle errors consistently

**Key Points**:
- Backend DTOs should align with frontend types
- API contracts should remain consistent
- Transformation can be added in API client if needed
- Error handling should be consistent

---

## Next Steps

1. Review backend DTOs
2. Verify API contracts
3. Add transformation layer if needed
4. Test API integration
5. Proceed to `12-implementation-order.md` for step-by-step guide
