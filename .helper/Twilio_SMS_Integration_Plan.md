# Twilio SMS Integration Plan

## Overview
This document outlines the implementation plan for adding Twilio SMS messaging functionality to the Loctelli CRM system. The SMS service will be implemented as a shared service that allows users to send messages to individual phone numbers or bulk messages via CSV upload.

## System Architecture Integration

### Location: `project/src/shared/sms/`
The SMS functionality will be implemented as a shared service following the existing project patterns, making it available across all modules and subaccounts.

### Key Components
1. **SMS Service** - Core Twilio integration service
2. **SMS Controller** - API endpoints for SMS operations
3. **SMS Module** - NestJS module configuration
4. **DTOs** - Data transfer objects for validation
5. **Database Models** - SMS history and campaign tracking

## Database Schema Extensions

### New Prisma Models

```prisma
model SmsMessage {
  id           Int      @id @default(autoincrement())
  userId       Int
  subAccountId Int      // Required: SMS belongs to a SubAccount
  subAccount   SubAccount @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Message details
  phoneNumber  String   // Recipient phone number
  message      String   @db.Text // SMS content
  status       String   @default("pending") // pending, sent, delivered, failed
  
  // Twilio details
  twilioSid    String?  // Twilio message SID
  errorMessage String?  @db.Text // Error details if failed
  
  // Campaign tracking
  campaignId   Int?     // Optional: Link to SMS campaign
  campaign     SmsCampaign? @relation(fields: [campaignId], references: [id])
  
  // Timestamps
  sentAt       DateTime?
  deliveredAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model SmsCampaign {
  id           Int      @id @default(autoincrement())
  userId       Int
  subAccountId Int      // Required: Campaign belongs to a SubAccount
  subAccount   SubAccount @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Campaign details
  name         String   // Campaign name
  message      String   @db.Text // SMS template
  status       String   @default("draft") // draft, sending, completed, failed
  
  // Statistics
  totalRecipients Int   @default(0)
  sentCount      Int   @default(0)
  deliveredCount Int   @default(0)
  failedCount    Int   @default(0)
  
  // Timestamps
  scheduledAt  DateTime?
  startedAt    DateTime?
  completedAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relations
  messages     SmsMessage[]
}
```

### User Model Extension
```prisma
// Add to existing User model
model User {
  // ... existing fields
  smsMessages  SmsMessage[]
  smsCampaigns SmsCampaign[]
}

// Add to existing SubAccount model
model SubAccount {
  // ... existing fields
  smsMessages  SmsMessage[]
  smsCampaigns SmsCampaign[]
}
```

## Implementation Structure

### 1. Shared SMS Service (`project/src/shared/sms/`)

```
project/src/shared/sms/
├── dto/
│   ├── send-sms.dto.ts
│   ├── bulk-sms.dto.ts
│   ├── sms-campaign.dto.ts
│   └── index.ts
├── interfaces/
│   ├── sms.interface.ts
│   └── index.ts
├── sms.service.ts
├── sms.module.ts
└── index.ts
```

### 2. SMS Module (`project/src/main-app/modules/sms/`)

```
project/src/main-app/modules/sms/
├── dto/
│   ├── create-campaign.dto.ts
│   ├── send-message.dto.ts
│   └── index.ts
├── sms.controller.ts
├── sms.service.ts
├── sms.module.ts
└── sms.controller.spec.ts
```

## API Endpoints Design

### SMS Controller Endpoints

```typescript
// Single SMS
POST /sms/send
Body: {
  phoneNumber: string;
  message: string;
}

// Bulk SMS via CSV
POST /sms/bulk
Body: FormData with CSV file + message

// Create SMS Campaign
POST /sms/campaigns
Body: {
  name: string;
  message: string;
  recipients: string[]; // phone numbers
  scheduledAt?: Date;
}

// Get SMS History
GET /sms/messages
Query: ?page=1&limit=10&status=sent

// Get Campaign Details
GET /sms/campaigns/:id

// Get Campaign Messages
GET /sms/campaigns/:id/messages

// Get SMS Statistics
GET /sms/stats
Response: {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  monthlyStats: object;
}
```

## Core Service Implementation

### Twilio SMS Service Features

1. **Single Message Sending**
   - Phone number validation
   - Message length validation (160 chars for single SMS)
   - Twilio API integration
   - Status tracking

2. **Bulk Message Sending**
   - CSV file parsing and validation
   - Phone number deduplication
   - Batch processing with rate limiting
   - Progress tracking
   - Error handling and retry logic

3. **Campaign Management**
   - Campaign creation and scheduling
   - Recipient list management
   - Message templating
   - Campaign statistics

4. **Message History**
   - Complete message audit trail
   - Delivery status tracking
   - Error logging
   - Search and filtering

## Configuration Requirements

### Environment Variables
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# SMS Settings
SMS_RATE_LIMIT_PER_MINUTE=60
SMS_MAX_BATCH_SIZE=100
SMS_RETRY_ATTEMPTS=3
```

### Configuration Service Integration
```typescript
// Add to existing configuration.ts
export default () => ({
  // ... existing config
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  sms: {
    rateLimitPerMinute: parseInt(process.env.SMS_RATE_LIMIT_PER_MINUTE) || 60,
    maxBatchSize: parseInt(process.env.SMS_MAX_BATCH_SIZE) || 100,
    retryAttempts: parseInt(process.env.SMS_RETRY_ATTEMPTS) || 3,
  },
});
```

## Security & Authorization

### Access Control
- **User Level**: Users can only send SMS within their SubAccount
- **Admin Level**: Admins can manage SMS settings for their SubAccounts
- **Rate Limiting**: Implement SMS-specific rate limiting
- **Phone Number Validation**: Validate and sanitize phone numbers
- **Message Content**: Validate message content and length

### Audit Trail
- Log all SMS activities
- Track message delivery status
- Monitor failed attempts
- Generate usage reports

## Integration Points

### 1. Frontend Integration (my-app Admin Panel)

#### New Admin Panel Pages/Components
```
my-app/app/(admin)/sms/
├── page.tsx                    # SMS Dashboard
├── send/
│   └── page.tsx               # Single SMS sending
├── bulk/
│   └── page.tsx               # Bulk SMS via CSV
├── campaigns/
│   ├── page.tsx               # Campaign list
│   ├── create/
│   │   └── page.tsx           # Create campaign
│   └── [id]/
│       └── page.tsx           # Campaign details
├── history/
│   └── page.tsx               # SMS message history
└── settings/
    └── page.tsx               # SMS configuration
```

#### New Components
```
my-app/components/sms/
├── sms-dashboard.tsx          # Main SMS dashboard
├── send-sms-form.tsx          # Single SMS form
├── bulk-sms-upload.tsx        # CSV upload component
├── campaign-form.tsx          # Campaign creation form
├── campaign-list.tsx          # Campaign management
├── sms-history-table.tsx      # Message history table
├── sms-stats-cards.tsx        # Statistics cards
├── phone-number-input.tsx     # Phone validation input
└── message-composer.tsx       # Message composition
```

#### Admin Navigation Updates
```typescript
// Add to admin navigation in my-app
{
  title: "SMS",
  icon: MessageSquare,
  items: [
    {
      title: "Dashboard",
      href: "/admin/sms",
      icon: BarChart3,
    },
    {
      title: "Send SMS",
      href: "/admin/sms/send",
      icon: Send,
    },
    {
      title: "Bulk SMS",
      href: "/admin/sms/bulk",
      icon: Upload,
    },
    {
      title: "Campaigns",
      href: "/admin/sms/campaigns",
      icon: Megaphone,
    },
    {
      title: "History",
      href: "/admin/sms/history",
      icon: History,
    },
    {
      title: "Settings",
      href: "/admin/sms/settings",
      icon: Settings,
    },
  ],
}
```

#### API Client Integration
```typescript
// Add to my-app/lib/api-client.ts
export const smsApi = {
  // Single SMS
  sendSms: (data: SendSmsDto) => 
    apiClient.post('/sms/send', data),
  
  // Bulk SMS
  sendBulkSms: (file: File, message: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('message', message);
    return apiClient.post('/sms/bulk', formData);
  },
  
  // Campaigns
  createCampaign: (data: CreateCampaignDto) =>
    apiClient.post('/sms/campaigns', data),
  getCampaigns: (params?: PaginationParams) =>
    apiClient.get('/sms/campaigns', { params }),
  getCampaign: (id: number) =>
    apiClient.get(`/sms/campaigns/${id}`),
  
  // History
  getMessages: (params?: MessageHistoryParams) =>
    apiClient.get('/sms/messages', { params }),
  
  // Statistics
  getStats: () =>
    apiClient.get('/sms/stats'),
};
```

#### Frontend TypeScript Types
```typescript
// Add to my-app/types/sms.ts
export interface SmsMessage {
  id: number;
  phoneNumber: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  twilioSid?: string;
  errorMessage?: string;
  campaignId?: number;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmsCampaign {
  id: number;
  name: string;
  message: string;
  status: 'draft' | 'sending' | 'completed' | 'failed';
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmsStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  monthlyStats: {
    [key: string]: {
      sent: number;
      delivered: number;
      failed: number;
    };
  };
}

export interface SendSmsDto {
  phoneNumber: string;
  message: string;
}

export interface CreateCampaignDto {
  name: string;
  message: string;
  recipients: string[];
  scheduledAt?: Date;
}
```

#### Key UI Features
- **Dashboard**: SMS statistics cards, recent activity, quick actions
- **Send SMS**: Single message form with phone validation and character counter
- **Bulk SMS**: CSV upload with drag-and-drop, preview, and validation
- **Campaigns**: Create, schedule, monitor, and manage SMS campaigns
- **History**: Searchable table with filters, status indicators, and export
- **Settings**: Twilio configuration, rate limits, and notification preferences

### 2. Lead Integration
- Send SMS to leads directly from lead profile
- SMS history in lead timeline
- Automated SMS triggers based on lead status

### 3. Strategy Integration
- SMS templates linked to strategies
- Automated follow-up SMS sequences
- SMS as part of lead nurturing workflows

## Implementation Phases

### Phase 1: Core SMS Service (Week 1)
- [ ] Implement shared SMS service
- [ ] Add Twilio integration
- [ ] Create database models
- [ ] Basic single SMS sending

### Phase 2: Bulk SMS & Campaigns (Week 2)
- [ ] CSV upload and parsing
- [ ] Bulk SMS processing
- [ ] Campaign management
- [ ] Rate limiting and queuing

### Phase 3: API & Frontend (Week 3)
- [ ] SMS controller and endpoints
- [ ] Admin panel SMS pages
- [ ] SMS components and forms
- [ ] Campaign dashboard
- [ ] Message history views
- [ ] Navigation integration

### Phase 4: Advanced Features (Week 4)
- [ ] SMS templates
- [ ] Scheduled campaigns
- [ ] Analytics and reporting
- [ ] Lead integration

## Testing Strategy

### Unit Tests
- SMS service methods
- Phone number validation
- Message formatting
- Error handling

### Integration Tests
- Twilio API integration
- Database operations
- File upload processing
- Campaign workflows

### E2E Tests
- Complete SMS sending flow
- Bulk SMS campaigns
- Error scenarios
- Rate limiting

## Monitoring & Analytics

### Key Metrics
- Messages sent per day/month
- Delivery rates
- Failed message analysis
- Campaign performance
- Cost tracking

### Logging
- All SMS operations
- Twilio API responses
- Error details
- Performance metrics

## Cost Considerations

### Twilio Pricing
- SMS costs vary by destination
- Implement cost tracking
- Set spending limits
- Monitor usage patterns

### Optimization
- Message length optimization
- Batch processing efficiency
- Retry logic optimization
- Rate limit compliance

## Error Handling

### Common Scenarios
- Invalid phone numbers
- Twilio API errors
- Network timeouts
- Rate limit exceeded
- Insufficient balance

### Recovery Strategies
- Automatic retry with exponential backoff
- Dead letter queue for failed messages
- Manual retry options
- Error notification system

## Documentation Requirements

### API Documentation
- OpenAPI/Swagger specs
- Endpoint descriptions
- Request/response examples
- Error codes

### User Documentation
- SMS sending guide
- CSV format requirements
- Campaign setup instructions
- Troubleshooting guide

## Dependencies

### New Package Dependencies
```json
{
  "twilio": "^4.19.0",
  "@types/multer": "^1.4.7",
  "csv-parser": "^3.0.0",
  "libphonenumber-js": "^1.10.44"
}
```

### Existing Dependencies (Already Available)
- `@nestjs/common` - NestJS framework
- `@prisma/client` - Database ORM
- `class-validator` - DTO validation
- `@nestjs/config` - Configuration management

## Success Criteria

### Functional Requirements
- ✅ Send single SMS messages
- ✅ Process bulk SMS via CSV upload
- ✅ Create and manage SMS campaigns
- ✅ Track message delivery status
- ✅ Provide SMS analytics

### Non-Functional Requirements
- ✅ Handle 1000+ messages per campaign
- ✅ 99.9% message delivery reliability
- ✅ Sub-second response times for API calls
- ✅ Secure phone number handling
- ✅ Comprehensive audit logging

## Future Enhancements

### Potential Features
- SMS templates with variables
- Two-way SMS conversations
- SMS automation triggers
- Integration with other messaging platforms
- Advanced analytics and reporting
- SMS scheduling and recurring campaigns

This plan provides a comprehensive roadmap for implementing Twilio SMS messaging functionality that integrates seamlessly with the existing Loctelli CRM architecture while maintaining security, scalability, and user experience standards.